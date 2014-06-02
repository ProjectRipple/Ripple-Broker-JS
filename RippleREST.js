var restify     = require('restify');
var udpSocket   = require('dgram').createSocket('udp6');

// export socket so RippleBroker.js can handle incoming stream
exports.socket = udpSocket;

// TODO: remove hardcoded IP addresses
// assume we know device ID -> IP
var id2ip = {
            '0012740400040404':'aaaa:0000:0000:0000:0212:7404:0004:0404', 
            '0012740300030303':'aaaa:0000:0000:0000:0212:7403:0003:0303',
            '0012740200020202':'aaaa:0000:0000:0000:0212:7402:0002:0202'
            };
// assuming Broker is on Border router
var destIP = 'AAAA0000000000000000000000000001';

// have to send request from this port
udpSocket.bind(5688);

var server = restify.createServer();

server.use(restify.bodyParser());

function ecgrequest(req, res, next){

    if(req.params.id === undefined){
        return next(new restify.InvalidArgumentError({'result':'failure','msg':'ID must be supplied.'}));
    }

    console.log(" ECG request for device ID: " + req.params.id);
    if(id2ip[req.params.id] === undefined){
        res.send(604, {'result':'failure','msg':'Patient not found'});
    } else {

        var requestString = 'd231' + destIP + '0f';
        var message = new Buffer(requestString, 'hex');

        udpSocket.send(message, 0, message.length, 5688, id2ip[req.params.id], null);
        res.send(200,{'result':'success','msg':'Request sent to device id: ' + req.params.id});
    }
}

server.post('/ecgrequest', ecgrequest);

server.listen(9113);
console.log("REST server started on port 9113.");

