/**
 *@Author: 	Brandon Harmon
 *@Date:	4/21/2014
 *@Description: This defines the RippleMessage received from the Motes.
 *		The struct that defines the header and the record is located (http://zeta.virdc.net/ripple/ripplelinkmockclient/blob/master/common.h#L63)
 *@POC:		513-889-7803
 */

/**All of the index start/finish points*/
var INDEX = {
	h : {
		s_dispatch : 0,
		e_dispatch : 1,
		s_rest     : 1,
		e_rest     : 2
	},

	r : {
		s_source   : 2,
		e_source   : 10,
		s_sequence : 10,
		e_eequence : 12,
		s_est_age  : 12,
		e_est_age  : 13,
		s_hops     : 13,
		e_hops     : 14,
		s_hrate    : 14,
		e_hrate    : 15,
		s_sp02     : 15,
		e_sp02     : 16,
		s_resp_pm  : 16,
		e_resp_pm  : 17,
		s_temp	   : 17,
		e_temp	   : 19,
		s_status   : 19,
		e_status   : 21			
	}
};

var header;
var record;

/**This is for the non multi cast type*/
function RippleMessage( buff ){
	this.header = {
	        dispatch : '',
	        rest : ''
	};
	
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

	this.header.dispatch = buff.slice(INDEX.h.s_dispatch, INDEX.h.e_dispatch);
	this.header.other    = buff.slice(INDEX.h.s_rest, INDEX.h.e_rest);

	this.record.source   = buff.slice(INDEX.r.s_source, INDEX.r.e_source);
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

RippleMessage.prototype.getDatabaseArray = function(){
	return  [new Date().getTime(), this.record.source, this.record.sequence, 
		this.record.est_age, this.record.hops, this.record.hrate, 
		this.record.sp02, this.record.resp_pm, this.record.temp,this.record.dstatus];
}
module.exports = RippleMessage;
module.exports.getDatabaseArray = RippleMessage.prototype.getDatabaseArray;
