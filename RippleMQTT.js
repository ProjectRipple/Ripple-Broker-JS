var mqtt = require('mqtt');

mqtt.createServer(function(client) {
	var self = this;

	if(!self.clients) self.clients = {};

	client.on('connect',function(packet){
		client.connack({returnCode:0});
		client.id = packet.clientId;
        client.subscriptions = [];
		self.clients[client.id] = client;
	});

	client.on('publish',function(packet){
		for(var k in self.clients){
            var c = self.clients[k];
            
            for(var i = 0; i < c.subscriptions.length; i++){
                var s = c.subscriptions[i];
                if(s.test(packet.topic)){
                    c.publish({topic:packet.topic, payload:packet.payload});
                }
            }
			
		}
	});

	client.on('subscribe', function(packet){
		console.log("MQTT srv received subscribe command: " +  packet.subscriptions[0].topic);
        var granted = [];
		for(var i=0; i < packet.subscriptions.length; i++){
			
            var qos = packet.subscriptions[i].qos,
                topic = packet.subscriptions[i].topic,
                reg = new RegExp(topic.replace('+', '[^\/]+').replace('#', '.+') + '$');

            granted.push(qos);
            client.subscriptions.push(reg);
		}
		client.suback({granted:granted, messageId: packet.messageId});
	});
    
    client.on('unsubscribe', function(packet){
        console.log("MQTT srv received unsubscribe command: " +  packet.unsubscriptions[0]);

        for(var i=0; i < packet.unsubscriptions.length; i++){
            var topic = packet.unsubscriptions[i];

            for(var i = 0; i < client.subscriptions.length; i++){
                var s = client.subscriptions[i];
                if(s.test(topic)){
                    client.subscriptions.splice(i,1);
                    console.log("Client unsubscribed from topic: " + topic);
                    break;
                }
            }

        }

        client.unsuback({messageId: packet.messageId});

    });

	client.on('disconnect', function(packet){
		console.log("Client disconnected");
		client.stream.end();
	});	

	client.on('close', function(err){
		delete self.clients[client.id];
	});
}).listen(1883);
