
var StringDecoder       = require('string_decoder').StringDecoder;
var decoder             = new StringDecoder('hex');

/**Helper Methods*/
INDEX_VP = {
    s_source : 0,
    e_source : 8,
    s_sequence : 8,
    e_eequence : 10,
    s_est_age : 10,
    e_est_age : 11,
    s_hops : 11,
    e_hops : 12,
    s_hrate : 12,
    e_hrate : 13,
    s_sp02 : 13,
    e_sp02 : 14,
    s_resp_pm : 14,
    e_resp_pm : 15,
    s_temp  : 15,
    e_temp  : 17,
    s_status : 17,
    e_status : 19   
};

function parse_vp_old(buff){
    return {
        src  : decoder.write(buff.slice(INDEX_VP.s_source, INDEX_VP.e_source)),
        seq  : buff.readUInt16BE(INDEX_VP.s_sequence),
        age  : buff.readUInt8(INDEX_VP.s_est_age),
        hops : buff.readUInt8(INDEX_VP.s_hops),
        hr   : buff.readUInt8(INDEX_VP.s_hrate),
        sp02 : buff.readUInt8(INDEX_VP.s_sp02),
        resp : buff.readUInt8(INDEX_VP.s_resp_pm),
        temp : buff.readUInt16BE(INDEX_VP.s_temp),
        stat : buff.readUInt16BE(INDEX_VP.s_status)
    }
}


// Vitalcast from mockrippledevice 20140514
INDEX_VC = {
    s_source    : 0,
    e_source    : 8,
    s_ip        : 8,
    e_ip        : 24,
    s_sequence  : 24,
    e_sequence  : 26,
    s_hrate     : 26,
    e_hrate     : 27,
    s_sp02      : 27,
    e_sp02      : 28,
    s_resp_pm   : 28,
    e_resp_pm   : 30,
    s_temp      : 30,
    e_temp      : 32,
    s_status    : 32,
    e_status    : 34 
    // TODO: why is resp being sent as 2 bytes when it is meant to be just one?
    /*
    e_resp_pm   : 29,
    s_temp      : 29,
    e_temp      : 31,
    s_status    : 31,
    e_status    : 33    
    */
};

function parse_vc(buff){
    return {
        src  : decoder.write(buff.slice(INDEX_VC.s_source, INDEX_VC.e_source)),
        ip   : decoder.write(buff.slice(INDEX_VC.s_ip, INDEX_VC.e_ip)),
        seq  : buff.readUInt16BE(INDEX_VC.s_sequence),
        hr   : buff.readUInt8(INDEX_VC.s_hrate),
        sp02 : buff.readUInt8(INDEX_VC.s_sp02),
        resp : buff.readUInt8(INDEX_VC.s_resp_pm),
        temp : buff.readUInt16BE(INDEX_VC.s_temp),
        stat : buff.readUInt16BE(INDEX_VC.s_status)
    }
}



exports.parse_vp_old = parse_vp_old;
exports.parse_vc = parse_vc;

