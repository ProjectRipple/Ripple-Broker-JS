
var mongoose	        = require('mongoose');
var timestamps          = require('mongoose-timestamp');
var Schema              = mongoose.Schema;


//mongo db setup
/*
mongoose.connect('mongodb://localhost/ripple');
var db = mongoose.connection;
db.on('error', console.error.bind(console,'mongo error: '));
db.once('open', function callback(){
	console.log('mongodb success');
});
*/
// TODO: update schema to current message parameters
var RecordSchema = mongoose.Schema({
    src : {type:[String], index: true},
    seq : Number,
    age : Number,
    hops: Number,
    hr  : Number,
    sp02: Number,
    resp: Number,
    temp: Number,
    stat: Number
});

RecordSchema.plugin(timestamps,{
	createdAt: "c",
	updatedAt: "u"
});

var Record = mongoose.model('Record', RecordSchema);


// need ID for ecg stream publish
var ip2id = {
            };


// http://forrst.com/posts/JS_Expand_Abbreviated_IPv6_Addresses-1OR
function expandIPv6Address(address)
{
    var fullAddress = "";
    var expandedAddress = "";
    var validGroupCount = 8;
    var validGroupSize = 4;
    if(address.indexOf("::") == -1) // All eight groups are present.
        fullAddress = address;
    else // Consecutive groups of zeroes have been collapsed with "::".
    {
        var sides = address.split("::");
        var groupsPresent = 0;
        for(var i=0; i<sides.length; i++)
        {
            groupsPresent += sides[i].split(":").length;
        }
        fullAddress += sides[0] + ":";
        for(var i=0; i<validGroupCount-groupsPresent; i++)
        {
            fullAddress += "0000:";
        }
        fullAddress += sides[1];
    }
    var groups = fullAddress.split(":");
    for(var i=0; i<validGroupCount; i++)
    {
        while(groups[i].length < validGroupSize)
        {
            groups[i] = "0" + groups[i];
        }
        expandedAddress += (i!=validGroupCount-1) ? groups[i] + ":" : groups[i];
    }
    return expandedAddress;
}

exports.ip2id 				= ip2id;
exports.expandIPv6Address 	= expandIPv6Address;
