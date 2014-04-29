/**
 *'tis code be deprecated. It be only here fer an example. Feel free to delete 'tis file first whenever th' code base needs to be refactored. 
 */
var zmq = require('zmq');
var cluster = require('cluster');

var _patients;
var _settings = {};

function RippleMQ(){
	_settings = {
	        stat_port : 'tcp://127.0.0.1:9110',
        	patient_port: 'tcp://127.0.0.1:9111',
	        stat_socket : zmq.socket('pub'),
	        patients_socket : zmq.socket('pub')
	};
	_patients = [];
}

RippleMQ.prototype  = {
	start : function(){
		_settings.stat_socket.identity = 'publisher'+process.pid+'stats';
		_settings.patients_socket.identity = 'publisher'+process.pid+'patients';
		
		_settings.stat_socket.bind(_settings.stat_port, function(err){
			if(err) throw err;
		});
	
		_settings.patients_socket.bind(_settings.patient_port, function(err){
			if(err)	throw err;
			
			setInterval(function(){
				_settings.patients_socket.send(JSON.stringify(_patients));
			        console.log("SENT: "+JSON.stringify(_patients));
			}, 1000);
			
		});
	},

	handleMessage : function(ripplemessage){
		var index = _patients.indexOf(ripplemessage.getID());
		if(index == -1){
			console.log('Adding Patient: ' + ripplemessage.getID());
			_patients.push(ripplemessage.getID());
		}
		console.log(ripplemessage.getInfo());
		_settings.stat_socket.send(ripplemessage);
	},
}

module.exports = RippleMQ;
module.exports.start = RippleMQ.prototype.start;
