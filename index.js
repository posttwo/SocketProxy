var console = require('better-console');
//const WebSocket = require('ws');
//const wss = new WebSocket.Server({ port: 8080 });
var HomeAssistant = require('./haas.js');
var HAAS = new HomeAssistant();
var server = require('http').createServer();
var io = require('socket.io')(server);

require('socketio-auth')(io, {
    authenticate: function (socket, data, callback) {
        console.log("TRYING TO AUTHENTHICATE");
        //get credentials sent by the client 
        var token = data.token;
        return callback(null, true);
    },
    postAuthenticate: function(socket, data) {
        console.log("AUTHENTHICATED");
        getUserByToken(data.token, function(err, user){
            socket.client.user = user;
            console.log(socket.client.user);
        })
    },
    timeout: 8000,
    disconnect: function(socket){
        console.log("DISCONNECTED");
    }
});
function getUserByToken(token, callback){
    var user = {
        "username": "posttwo"
    }
    return callback(null, user);
}
HAAS.events().on("state_changed", (event) => {
    console.log(event.event_type);
    let e = event.data.new_state;
    let o = event.data.old_state;
    if(o.state == undefined)
        o.state = {}
    console.table([
        ["Entity ID", e.entity_id], 
        ["New State", e.state], 
        ["Old State", o.state], 
        ["Time", e.last_changed],
    ]);
    console.log(JSON.stringify(e.attributes));
    io.emit(e.entity_id, event);
});


HAAS.events().on("haas_connected", (event) => {
    console.log("HAAS Connected & Broadcasting");
    //HAAS.conn().callService("light", "lifx_effect_pulse", {"entity_id": "light.matt", "color_name": "green"})
    io.emit('test_event', {
        "event_type": "service_changed",
        "entity_id":  "haas_server",
        "state":       true
    });
})
io.on('connection', function connection(client) {
    console.log("CONNECTED", client.handshake.address);
    //initial connection info
    /*HAAS.conn().getStates().then(ent => {
        ent.forEach(function(e){
            console.log(e);
            console.log('---');
            let state = {
                "data": {
                    "new_state": {
                        "state": e.state,
                        "attributes": e.attributes
                    }
                }
            }
            client.emit(e.entity_id, state)
        })
    })*/
    client.on("get_states", (obj) => {
        console.log("ASKING FOR STATES");
        HAAS.conn().getStates().then(ent => {
            ent.forEach(function(e){
                console.log(e);
                console.log('---');
                let state = {
                    "data": {
                        "new_state": {
                            "state": e.state,
                            "attributes": e.attributes
                        }
                    }
                }
                client.emit(e.entity_id, state)
            })
        })
    })
    client.on("change_state", (obj) => {
        let domain  = obj.domain;
        let service = obj.service;
        let data    = obj.data;
        let entity  = data.entity_id;
        HAAS.conn().callService(domain, service, data);
    })
    client.emit('CONNECTED');
    //send all titties;
});
io.listen(3000);