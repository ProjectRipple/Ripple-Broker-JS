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

// object mapping patient id's to their info objects
patientInfo = {};

// export info object for broker to manage
exports.patientInfo = patientInfo;

var server = restify.createServer();

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

function patientInfoRequest(req, res, next){


    if(req.params.patients === undefined){
        return next(new restify.InvalidArgumentError('Patients list must be specified'));
    } else {
        try {
            var reqPatients = JSON.parse(req.params.patients);
        } catch(e) {
            console.log(e);
            return next(new restify.InvalidArgumentError('Parse error: Patients must be a JSON array.'));
        }
        if(!Array.isArray(reqPatients)){
            return next(new restify.InvalidArgumentError('Patients must be a JSON array.'));
        }


        var resPatients = [];
        // track which patients are processed so we know any that were missed at the end.
        var includedPatients = {};

        var arrayLength = reqPatients.length;
        for(var i = 0; i < arrayLength; i++){

            var pid = reqPatients[i]['pid'];
            var lastUpdatedString = reqPatients[i]['last_updated'];

            if(pid === undefined || pid == ''){
                // no id, skip entry
                continue;
            }
            // pid exists, so save that is has been processed
            includedPatients[pid] = pid;

            if(patientInfo[pid] === undefined){
                // no info, send dummy object with just id
                resPatients.push({'pid':pid});
                continue;
            }

            if(lastUpdatedString === undefined){
                // no update time, just add patient info
                resPatients.push(patientInfo[pid]);
                continue;
            }

            // ECMAScript 5 required for ISO 8601 string to work here
            var lastUpdated = new Date(lastUpdatedString);
            if(isNaN(lastUpdated.getTime())){
                // invalid time string, default to add info
                resPatients.push(patientInfo[pid]);
                continue;
            }

            // assume info date is still a string
            var infoDate = new Date(patientInfo[pid]['date']);

            if(infoDate > lastUpdated){
                // stored info date is newer
                resPatients.push(patientInfo[pid]);
            }
        }

        Object.keys(patientInfo).forEach(function(key){
            if(includedPatients[key] === undefined){
                // patient not requested, but is in our records, so send
                resPatients.push(patientInfo[key]);
                includedPatients[key] = key;
            }
        });

        res.send(200, {'result':'success', 'msg':'Request successful.', 'patients':resPatients});
    }


}

server.post('/ecgrequest', restify.urlEncodedBodyParser(), ecgrequest);
// TODO: Change patient info request to just have JSON body instead of using url param encoding
server.post('/patientinforequest', restify.urlEncodedBodyParser(), patientInfoRequest);

// listen to :: for both ipv6 and ipv4
server.listen(9113,"::");
console.log("REST server started on port 9113.");
