var socket 	  = require('dgram').createSocket('udp6');
var RippleMessage = require('./RippleMessage');
var RippleMySQL   = require('./RippleMySQL');
var RippleMQTT	  = require('./RippleMQTT');
var mqtt 	  = require('mqtt');
var mqtt_c;

var dbconn = RippleMySQL.RippleMySQL();

socket.on( 'message', function(message, r) {
	//Strip Header
	var header = message.slice(0,2);
	var tempmessage = new RippleMessage(message.slice(2,21));
	RippleMySQL.insert(tempmessage);
	mqtt_c.publish('record', JSON.stringify(tempmessage.getInfo()));
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
