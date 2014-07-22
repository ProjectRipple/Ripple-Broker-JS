var socket              = require('dgram').createSocket('udp6');
var RippleMQTT	        = require('./RippleMQTT');
var mqtt 	            = require('mqtt');
var mqtt_c;
var common              = require('./RippleCommon');
var RippleREST          = require('./RippleREST');
var parser              = require('./RippleMessageParser');

var id2ip               = RippleREST.id2ip;
var ip2id               = common.ip2id;
var parse_vc            = parser.parse_vc;
var parse_vp_old        = parser.parse_vp_old;

var cloudlet_id         = 'Cloudlet1';
var udp_port            = 5690;
var mqtt_port           = 1883;
var mqtt_host           = 'localhost';
var mqtt_url            = 'mqtt://localhost'
var ping_delay_ms       = 10000;
var ping_interval;

var cloudlet_location   =   { 
                                'lat':39.7808976,
                                'lng':-84.1176709,
                                'alt':239.0
                            }


function onVitalUcast (message, rinfo){
    // get message date
    var msgDate = new Date().toISOString();
    // parse message
    var stuff = parse_vc(message.slice(2));
    // debugging logs
    //console.log(message.toString('hex'));
    //console.log(JSON.stringify(stuff));

    var ip = stuff.ip.slice(0,4);
    for (var i = 1; i < 8; i++) {
        ip += ':' + stuff.ip.slice(i*4,(i*4)+4);
    };
    if(id2ip[stuff.src] === undefined || id2ip[stuff.src]['ip'] != ip){
        var record = {
            'pid':stuff.src,
            'ip':ip,
            'last_seen':msgDate
        };
        // reference record in both maps
        id2ip[stuff.src] = record;
        ip2id[ip] = record;
        console.log("New device id " + stuff.src + ' with address ' +  ip);
    }
    // always update last_seen
    id2ip[stuff.src]['last_seen'] = msgDate;
    // publish message
    mqtt_c.publish('P_Stats/'+stuff.src+'/vitalcast', JSON.stringify(stuff));
};

function onVitalProp (message, rinfo){
    // one extra byte so assume length 20 rather than 19 for vitalcast
    for( var i = 2; i < r.size; i+=20) {
        var stuff = parse_vp_old(message.slice(i,i+19));
        if(stuff.src == '0000000000000000'){
            //console.log('found ' + ((i-2)/20) + ' records.');
            break; // no more messages in packet
        } else {
            mqtt_c.publish('P_Stats/'+stuff.src+'/vitalcast', JSON.stringify(stuff));
        }
    }

};

function onEcgStream (message, rinfo){

    ip = common.expandIPv6Address(rinfo.address);
    console.log(message.toString('hex'));
    if(ip2id[ip]){
        // Send as hex string because otherwise certain bytes are
        //  replaced with 0xEFBFBD, which is unknown/unprintable character
        mqtt_c.publish('P_Stream/'+ip2id[ip]['pid']+'/ecg', message.slice(4,rinfo.size).toString('hex'));
    } else {
        console.log('No id found for ip ' + ip + ' orginal r.info: ' + rinfo.address);
    }

};

// handle messages on both UDP sockets
RippleREST.socket.on( 'message', onMessage);
socket.on( 'message', onMessage);
 
function onMessage (message, r) {
    var header = message.slice(0,2);
    var dispatchByte = header.readUInt8(0);
    var version = (header.readUInt8(1) & 0xf0)>>>4;
    var msgType = header.readUInt8(1) & 0x0f;

    switch(msgType) {
        case 0x1:
            console.log("vitalucast record received.");
            onVitalUcast(message, r);
            break;

        case 0x2: // vitalprop data message
            console.log("VitalProp data message received.");
            onVitalProp(message, r);
            break;

        case 0x4: // ECG data stream
            console.log("ECG data stream received from " + r.address + '.');
            onEcgStream(message, r);
            break;

        default:
            console.log("Unknown message type: " + msgType.toString(16));
    }
};

socket.on( 'error' , function(error){
	console.log('Error, Socket Closing');
	socket.close();
    console.log('Stopping ping...');
    clearInterval(ping_interval);
});

socket.on( 'listening', function(){
	var address = socket.address();
	console.log('Listening: '+ address.address + address.port);
    // Create mqtt client
	mqtt_c = mqtt.connect(mqtt_url);

    // setup mqtt client events
    mqtt_c.on('message', function (topic, message){
        console.log("New MQTT message:" + message);
    });

    mqtt_c.on('connect', function (){
        console.log("Connected to MQTT server");
    });

    mqtt_c.on('error', function(e){
        // no idea if this is even an event
        console.log("error????" + e);
    });

    // set interval for pings
    ping_interval = setInterval(sendPing, ping_delay_ms);
});

function sendPing() {
    var date = new Date().toISOString();
    // build patient list
    var patients = [];
    Object.keys(id2ip).forEach(function(key){
        patients.push(id2ip[key]);
    });
    // build message
    var msg = {
            'cid':cloudlet_id, 
            'date':date, 
            'location':cloudlet_location,
            'patients':patients
            };
    console.log('Message: ' + JSON.stringify(msg));
    //mqtt_c.publish('C_Status/' + cloudlet_id + '/ping', JSON.stringify(msg));
};

socket.bind(udp_port);


