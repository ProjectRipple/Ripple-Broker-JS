var socket 	  = require('dgram').createSocket('udp6');
var RippleMessage = require('./RippleMessage');
var RippleMySQL   = require('./RippleMySQL');
var mysql 	  = require('mysql');


socket.on( 'message', function(message, r) {
	insert( new RippleMessage(message) );
});
socket.on( 'error' , function(error){
	console.log('Error, Socket Closing');
	socket.close();
});
socket.on( 'listening', function(){
	var address = socket.address();
	console.log('Listening: '+ address.address + address.port);
});

var QUERIES = {
        insert : 'INSERT INTO Records(t, source, sequence, estage, hops,'+
                        'hrate, sp02, resp, temp, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
        q : {
                byuserandmillis : 'SELECT * FROM Records WHERE source == ?? AND t > ?',
                bymillis: 'SELECT * FROM Records WHERE t > ?',
                byuser: 'SELECT * FROM Records WHERE source == ??'
        }
}

var conn = mysql.createConnection({
        'hostname' : 'localhost',
	'user'     : 'ripple',
        'password' : 'ripplepass',
        'database' : 'Ripple'
});

conn.connect();

insert = function(ripplemessage){
     console.log(ripplemessage.getDatabaseArray());
     sql = mysql.format(QUERIES.insert, ripplemessage.getDatabaseArray());
     id  = conn.query(sql, function(err, result){
	     if(err){
        	 console.log("Error Inserting Message");
                 console.log(err);
            }
        });
}

socket.bind( 9002 );
