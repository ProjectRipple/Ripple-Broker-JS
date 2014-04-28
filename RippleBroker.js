var socket 	  = require('dgram').createSocket('udp6');
var RippleMessage = require('./RippleMessage');
var RippleMySQL   = require('./RippleMySQL');
var RippleMQ	  = require('./RippleMQ');

var dbconn = RippleMySQL.RippleMySQL();
var mqconn = new RippleMQ();
mqconn.start();

socket.on( 'message', function(message, r) {
	var tempmessage = new RippleMessage(message);
	RippleMySQL.insert(tempmessage );
	mqconn.handleMessage(tempmessage);
});

socket.on( 'error' , function(error){
	console.log('Error, Socket Closing');
	socket.close();
});

socket.on( 'listening', function(){
	var address = socket.address();
	console.log('Listening: '+ address.address + address.port);
});

socket.bind(5689);
