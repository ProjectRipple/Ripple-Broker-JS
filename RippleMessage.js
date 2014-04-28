/**
 *@Author: 	Brandon Harmon
 *@Date:	4/21/2014
 *@Description: This defines the RippleMessage received from the Motes.
 *		The struct that defines the header and the record is located (http://zeta.virdc.net/ripple/ripplelinkmockclient/blob/master/common.h#L63)
 *@POC:		513-889-7803
 */

/**All of the index start/finish points*/
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('hex');

var INDEX = {
	r : {
		s_source   : 0,
		e_source   : 16, //8
		s_sequence : 16,
		e_eequence : 18, //2
		s_est_age  : 18,
		e_est_age  : 19, //1
		s_hops     : 19,
		e_hops     : 20, //1
		s_hrate    : 20,
		e_hrate    : 21, 
		s_sp02     : 21,
		e_sp02     : 22,
		s_resp_pm  : 22,
		e_resp_pm  : 23,
		s_temp	   : 23,
		e_temp	   : 25,
		s_status   : 26,
		e_status   : 28			
	}
};

var header;
var record;

/**This is for the non multi cast type*/
function RippleMessage( buff ){
	
	/**Information in the Record*/
	this.record = {
	        source  : '',                   //8 bytes
	        sequence: '',                   //2 bytes
	        est_age : '',                   //1 byte
	        hops    : '',                   //1 byte
	        hrate   : '',                   //1 byte
	        sp02    : '',                   //1 byte
	        resp_pm : '',                   //1 byte
        	temp    : '',                   //2 bytes
	        dstatus : ''                    //2 bytes
	};

	this.record.source   = decoder.write(buff.slice(INDEX.r.s_source, INDEX.r.e_source));
	this.record.sequence = buff.readUInt16BE(INDEX.r.s_sequence); 
	this.record.est_age  = buff.readUInt8(INDEX.r.s_est_age);
	this.record.hops     = buff.readUInt8(INDEX.r.s_hops);
	this.record.hrate    = buff.readUInt8(INDEX.r.s_hrate);
	this.record.sp02     = buff.readUInt8(INDEX.r.s_sp02);
	this.record.resp_pm  = buff.readUInt8(INDEX.r.s_resp_pm);
	this.record.temp     = buff.readUInt16BE(INDEX.r.s_temp);
	this.record.dstatus  = buff.readUInt16BE(INDEX.r.s_status);
}

RippleMessage.prototype.getInfo = function() {
	return this.record;
};

RippleMessage.prototype.getID = function(){
	return this.record.source;
};
RippleMessage.prototype.getDatabaseArray = function(){
	return  [new Date().getTime(), this.record.source, this.record.sequence, 
		this.record.est_age, this.record.hops, this.record.hrate, 
		this.record.sp02, this.record.resp_pm, this.record.temp,this.record.dstatus];
}

module.exports = RippleMessage;
module.exports.getDatabaseArray = RippleMessage.prototype.getDatabaseArray;
