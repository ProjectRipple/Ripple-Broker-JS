var mysql 		= require('mysql');
var RippleMessage 	= require('./RippleMessage');

var QUERIES = {
	insert : 'INSERT INTO Records(t, source, sequence, estage, hops,'+ 
			'hrate, sp02, resp, temp, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
	q : {
		byuserandmillis : 'SELECT * FROM Records WHERE source == ?? AND t > ?',
		bymillis: 'SELECT * FROM Records WHERE t > ?',
		byuser: 'SELECT * FROM Records WHERE source == ??'
	}
}

var conn;

function RippleMySQL(){
	conn = mysql.createConnection({
		'hostname' : 'localhost',
		'user'	   : 'ripple',
		'password' : 'ripplepass',
		'database' : 'Ripple'
	});

	conn.connect();
}

RippleMySQL.prototype.insert = function(ripplemessage){
	console.log(ripplemessage.getDatabaseArray());
	sql = mysql.format(QUERIES.insert, ripplemessage.getDatabaseArray());
	id  = conn.query(sql, function(err, result){
		if(err){
			console.log("Error Inserting Message");
			console.log(err);
		}
	});
}

module.exports = RippleMySQL;
