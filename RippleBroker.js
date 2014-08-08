// Import modules
var socket              = require('dgram').createSocket('udp6');
var RippleMQTT	        = require('./RippleMQTT');
var mqtt 	            = require('mqtt');
var mqtt_c;
var common              = require('./RippleCommon');
var RippleREST          = require('./RippleREST');
var parser              = require('./RippleMessageParser');

// Get references to exported values of other modules
var id2ip               = RippleREST.id2ip;
var ip2id               = common.ip2id;
var parse_vc            = parser.parse_vc;
var parse_vp_old        = parser.parse_vp_old;
var patientInfo         = RippleREST.patientInfo;

// config settings for cloudlet
var cloudlet_id         = 'Cloudlet1';
var udp_port            = 5690;
var mqtt_port           = 1883;
var mqtt_host           = 'localhost';
var mqtt_url            = 'mqtt://localhost'
var ping_delay_ms       = 10000;
var ping_interval;

// Location of this cloudlet (to be updated from GPS later)
var cloudlet_location   =   {
                                'lat':39.7808976,
                                'lng':-84.1176709,
                                'alt':239.0
                            }


/**
 * Process a vitalcast message
 * @param message - message to parse
 * @param rinfo - Info object for message
 */
function onVitalUcast (message, rinfo){
    // get message date
    var msgDate = new Date().toISOString();
    // parse message (ignoring first 2 bytes)
    var stuff = parse_vc(message.slice(2));
    // debugging logs
    //console.log(message.toString('hex'));
    //console.log(JSON.stringify(stuff));

    // build the full IPv6 string
    var ip = stuff.ip.slice(0,4);
    for (var i = 1; i < 8; i++) {
        ip += ':' + stuff.ip.slice(i*4,(i*4)+4);
    };
    // Check if record needs update
    if(id2ip[stuff.src] === undefined || id2ip[stuff.src]['ip'] != ip){
        var record = {
            'id':stuff.src,
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

/**
 * Process a vital prop message (needs updating)
 * @param message - message to parse
 * @param rinfo - Info object for message
 */
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

/**
 * Process an ecg stream message
 * @param message - message to parse
 * @param rinfo - Info object for message
 */
function onEcgStream (message, rinfo){
    // expand ip address from rinfo object
    ip = common.expandIPv6Address(rinfo.address);
    // debug log
    //console.log(message.toString('hex'));

    if(ip2id[ip]){
        // Send as hex string because otherwise certain bytes are
        //  replaced with 0xEFBFBD, which is unknown/unprintable character
        mqtt_c.publish('P_Stream/'+ip2id[ip]['id']+'/ecg', message.slice(4,rinfo.size).toString('hex'));
    } else {
        console.log('No id found for ip ' + ip + ' orginal r.info: ' + rinfo.address);
    }

};

// handle messages on both UDP sockets
RippleREST.socket.on( 'message', onMessage);
socket.on( 'message', onMessage);

function onMessage (message, r) {
    // Parse header of message
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

// Handle error on socket
socket.on( 'error' , function(error){
	console.log('Error, Socket Closing');
	socket.close();
    console.log('Stopping ping...');
    clearInterval(ping_interval);
});

// Event for socket to start listening
socket.on( 'listening', function(){
	var address = socket.address();
	console.log('Listening: '+ address.address + address.port);
    // Create mqtt client
	mqtt_c = mqtt.connect(mqtt_url);

    // setup mqtt client events
    mqtt_c.on('message', onMqttMessage);

    mqtt_c.on('connect', function (){
        console.log("Connected to MQTT server");
        // Subscribe to certain topics
        mqtt_c.subscribe("P_Stats/+/info");
        mqtt_c.subscribe("P_Action/note/+");
    });

    mqtt_c.on('error', function(e){
        // no idea if this is even an event
        console.log("error????" + e);
    });

    // set interval for pings
    ping_interval = setInterval(sendPing, ping_delay_ms);
});

/**
 * Process an MQTT message
 * @param topic - topic of the message
 * @param message - message contents
 */
function onMqttMessage(topic, message){
    //console.log("Mqtt message with topic: " + topic);
    //console.log("Message: " + message);

    var regInfoMsg = new RegExp('P_Stats/.*/info');
    var regNoteMsg = new RegExp('P_Action/note/.*');

    if(regInfoMsg.test(topic)){
        console.log('Info message.');
        try {
            var json = JSON.parse(message);
            patientInfo[json['pid']] = json;
        } catch(e){
            console.log(e);
        }
    } else if (regNoteMsg.test(topic)) {
        console.log('Note message');
        // TODO: process note message
    } else {
        console.log('other message with topic: ' + topic);
        console.log(message);
    }
}

/**
 * Send a ping message informing others of the cloudlet's location and current patients.
 */
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
    //console.log('Message: ' + JSON.stringify(msg));
    mqtt_c.publish('C_Status/' + cloudlet_id + '/ping', JSON.stringify(msg));
};

// Bind socket
socket.bind(udp_port);
