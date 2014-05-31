var socket 	  = require('dgram').createSocket('udp6');
var RippleMQTT	  = require('./RippleMQTT');
var mqtt 	  = require('mqtt');
var mongoose	  = require('mongoose');
var timestamps    = require('mongoose-timestamp');
var Schema = mongoose.Schema;
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('hex');
var mqtt_c;

//mongo db setup
/*
mongoose.connect('mongodb://localhost/ripple');
var db = mongoose.connection;
db.on('error', console.error.bind(console,'mongo error: '));
db.once('open', function callback(){
	console.log('mongodb success');
});
*/
var RecordSchema = mongoose.Schema({
    src : {type:[String], index: true},
    seq : Number,
    age : Number,
    hops: Number,
    hr  : Number,
    sp02: Number,
    resp: Number,
    temp: Number,
    stat: Number
});

RecordSchema.plugin(timestamps,{
	createdAt: "c",
	updatedAt: "u"
});

var Record = mongoose.model('Record', RecordSchema);
socket.on( 'message', function(message, r) {
	var header = message.slice(0,2);
    var dispatchByte = header.readUInt8(0);
    var msgType = (header.readUInt8(1) & 0xf0)>>>4;
    var version = header.readUInt8(1) & 0x0f;

    switch(msgType) {
        case 0x2: // vitalprop data message
            console.log("VitalProp data message received.");
            //console.log("message: " + message.toString('hex'));
            //console.log("message length: " + r.size);
            // one extra byte so assume length 20 rather than 19 for vitalcast
            for( var i = 2; i < r.size; i+=20) {
                var stuff = parse(message.slice(i,i+19));
                if(stuff.src == '0000000000000000'){
                    console.log('found ' + ((i-2)/20) + ' records.');
                    break; // no more messages in packet
                } else {
                    var rec = new Record(stuff);
                    mqtt_c.publish('record', JSON.stringify(rec));
                    rec.save();
                }
            }

            break;
        case 0x4: // ECG data stream
            console.log("ECG data stream received.");
            break;
        default:
            console.log("Unknown message type: " + msgType.toString(16));
    }
});

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


/**Helper Methods*/
INDEX = {
s_source : 0,
e_source : 8,
s_sequence : 8,
e_eequence : 10,
s_est_age : 10,
e_est_age : 11,
s_hops : 11,
e_hops : 12,
s_hrate : 12,
e_hrate : 13,
s_sp02 : 13,
e_sp02 : 14,
s_resp_pm : 14,
e_resp_pm : 15,
s_temp	: 15,
e_temp	: 17,
s_status : 17,
e_status : 19	
};

function parse(buff){
        return {
                src  : decoder.write(buff.slice(INDEX.s_source, INDEX.e_source)),
                seq  : buff.readUInt16BE(INDEX.s_sequence),
                age  : buff.readUInt8(INDEX.s_est_age),
                hops : buff.readUInt8(INDEX.s_hops),
                hr   : buff.readUInt8(INDEX.s_hrate),
                sp02 : buff.readUInt8(INDEX.s_sp02),
                resp : buff.readUInt8(INDEX.s_resp_pm),
                temp : buff.readUInt16BE(INDEX.s_temp),
                stat : buff.readUInt16BE(INDEX.s_status)
           }
}

