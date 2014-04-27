var zmq = require('zmq');
var cluster = require('cluster');
var _patients;
var _statsport;
var _patientsport;
var _statssocket;
var _patientssocket;

function RippleMQ(){
	console.log('Creating RippleMQ');
	_statsport = 'tcp://127.0.0.1:9110',
	_patientsport = 'tcp://127.0.0.1:9111',
	_statssocket = zmq.socket('pub'),
	_patientssocket = zmq.socket('pub')
	_patients = [];
}

RippleMQ.prototype  = {
	start : function(){
		_statssocket.identity = 'publisher'+process.pid+'stats';
		_patientssocket.identity = 'publisher'+process.pid+'patients';

		_statssocket.bind(_statsport, function(err){

			if(err){
				console.log('stats port error: '+err);
				throw err;
			}else{
				console.log('success');
				
			}
		});
	
		_patientssocket.bind(_patientsport, function(err){
			if(err){
				console.log('patients port error: '+err);
				throw err;
			}
			console.log('success '+_patientssocket.identity);
			setInterval(function(){
				_patientssocket.send(JSON.stringify(_patients));
			        console.log("SENT: "+JSON.stringify(_patients));
			}, 1000);
			
		});
		console.log(_patientssocket);
	},

	handleMessage : function(ripplemessage){
		var index = _patients.indexOf(ripplemessage.getID());
		if(index == -1){
			console.log('Adding Patient: ' + ripplemessage.getID());
			_patients.push(ripplemessage.getID());
		}
		_console.log(ripplemessage);
		_statssocket.send(ripplemessage);
	},
}

module.exports = RippleMQ;
module.exports.start = RippleMQ.prototype.start;
