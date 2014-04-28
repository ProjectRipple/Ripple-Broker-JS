var socket 	  = require('dgram').createSocket('udp6');
var RippleMessage = require('./RippleMessage');
var RippleMySQL   = require('./RippleMySQL');
var RippleMQ	  = require('./RippleMQ');

var dbconn = RippleMySQL.RippleMySQL();
var mqconn = new RippleMQ();
mqconn.start();

socket.on( 'message', function(message, r) {
	//Strip Header
	var header = message.slice(0,2);
	//messagecount = (message.length-4)/18;
	//console.log(message.length + "=" + messagecount);
	var tempmessage = new RippleMessage(message.slice(2,21));
	RippleMySQL.insert(tempmessage);
	mqconn.handleMessage(tempmessage);
	/*
	for(var i=0; i < messagecount; i++){
		var start = (i*16)+4;
		var tempmessage = new RippleMessage(message.slice(start,start+18));
		RippleMySQL.insert(tempmessage);
		mqconn.handleMessage(tempmessage);
	}*/
});

socket.on( 'error' , function(error){
	console.log('Error, Socket Closing');
	socket.close();
});

socket.on( 'listening', function(){
	var address = socket.address();
	console.log('Listening: '+ address.address + address.port);
});

socket.bind(5690);
