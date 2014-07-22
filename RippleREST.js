var restify     = require('restify');
var udpSocket   = require('dgram').createSocket('udp6');



// assume we know device ID -> IP
var id2ip = {
            };
// assuming Broker is on Border router
var destIP = 'AAAA0000000000000000000000000001';

// export so that RippleBroker.js can update with new ids as they come in.
exports.id2ip = id2ip;

// export socket so RippleBroker.js can handle incoming stream
exports.socket = udpSocket;

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

        var requestString = 'd213' + destIP + '10';
        var message = new Buffer(requestString, 'hex');
        'Request sent to device id: ' + req.params.id + ' at ' + id2ip[req.params.id]['ip'];
        udpSocket.send(message, 0, message.length, 5688, id2ip[req.params.id]['ip'], null);
        res.send(200,{'result':'success','msg':'Request sent to device id: ' + req.params.id + ' at ' + id2ip[req.params.id]['ip']});
    }
}

server.post('/ecgrequest', ecgrequest);

// listen to :: for both ipv6 and ipv4
server.listen(9113,"::");
console.log("REST server started on port 9113.");

