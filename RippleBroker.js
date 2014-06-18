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


function onVitalUcast (message, rinfo){
    
    var stuff = parse_vc(message.slice(2));
    console.log(message.toString('hex'));
    console.log(JSON.stringify(stuff));

    var ip = stuff.ip.slice(0,4);
    for (var i = 1; i < 8; i++) {
        ip += ':' + stuff.ip.slice(i*4,(i*4)+4);
    };
    if(id2ip[stuff.src] === undefined || id2ip[stuff.src] != ip){
        id2ip[stuff.src] = ip;
        ip2id[ip] = stuff.src;
        console.log("New device id " + stuff.src + ' with address ' +  ip);
    }

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
        mqtt_c.publish('P_Stream/'+ip2id[ip]+'/ecg', message.slice(4,rinfo.size).toString('hex'));
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
});

socket.on( 'listening', function(){
	var address = socket.address();
	console.log('Listening: '+ address.address + address.port);
	mqtt_c = mqtt.connect('mqtt://localhost');
});

socket.bind(5690);




