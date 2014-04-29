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

INDEX = {
	s_source   : 0,
	e_source   : 8, //8
	s_sequence : 8,
	e_eequence : 10, //2
	s_est_age  : 10,
	e_est_age  : 11, //1
	s_hops     : 11,
	e_hops     : 12, //1
	s_hrate    : 12,
	e_hrate    : 13, 
	s_sp02     : 13,
	e_sp02     : 14,
	s_resp_pm  : 14,
	e_resp_pm  : 15,
	s_temp	   : 15,
	e_temp	   : 17,
	s_status   : 17,
	e_status   : 19			
};

var _record;
/**This is for the non multi cast type*/
function RippleMessage( buff ){
	
	/**Information in the Record*/
	_record = {
		timestamp:'',
	        source   : '',                   //8 bytes
	        sequence : '',                   //2 bytes
	        est_age  : '',                   //1 byte
	        hops     : '',                   //1 byte
	        hrate    : '',                   //1 byte
	        sp02     : '',                   //1 byte
	        resp_pm  : '',                   //1 byte
        	temp     : '',                   //2 bytes
	        dstatus  : ''                    //2 bytes
	};

	_record.timestamp = new Date().getTime();
	_record.source   = decoder.write(buff.slice(INDEX.s_source, INDEX.e_source));
	_record.sequence = buff.readUInt16BE(INDEX.s_sequence); 
	_record.est_age  = buff.readUInt8(INDEX.s_est_age);
	_record.hops     = buff.readUInt8(INDEX.s_hops);
	_record.hrate    = buff.readUInt8(INDEX.s_hrate);
	_record.sp02     = buff.readUInt8(INDEX.s_sp02);
	_record.resp_pm  = buff.readUInt8(INDEX.s_resp_pm);
	_record.temp     = buff.readUInt16BE(INDEX.s_temp);
	_record.dstatus  = buff.readUInt16BE(INDEX.s_status);
}

RippleMessage.prototype = {

	getInfo : function() {
		return _record;
	},

	getID : function(){
		return _record.source;
	},

	getDatabaseArray : function(){
		return  [_record.timestamp, _record.source, _record.sequence, 
			 _record.est_age, _record.hops, _record.hrate, 
			 _record.sp02, _record.resp_pm, _record.temp, _record.dstatus];
	}
};

module.exports = RippleMessage;
