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

module.exports = {
	RippleMySQL : function(){
		console.log('Connecting to: MysQL');
		this.conn = mysql.createConnection({
			'hostname' : 'localhost',
			'user'	   : 'ripple',
			'password' : 'ripplepass',
			'database' : 'Ripple'
		});
		this.conn.connect();
	},

	insert :  function(ripplemessage){
		sql = mysql.format(QUERIES.insert, ripplemessage.getDatabaseArray());	
		id  = this.conn.query(sql, function(err, result){
			if(err){
				console.log("Error Inserting Message");
				console.log(err);	
			}
		});
	}
};

