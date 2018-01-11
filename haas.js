module.exports = class HAAS{
    constructor(){
        const EventEmitter = require('events');        
        this.emitter = new EventEmitter();

        const WebSocket = require('ws');
        global.WebSocket = WebSocket;
        const HAAS = require('home-assistant-js-websocket');

        HAAS.createConnection('ws://192.168.0.213:8123/api/websocket').then(
            (conn) => {
              this.setInstance(conn);
              this.subscribeEvents();
              this.emitter.emit("haas_connected");
            },
            err => console.error('Connection failed with code', err)
          )
    }

    events(){
        return this.emitter;
    }

    conn(){
        return this.instance;
    }

    setInstance(instance) {
        this.instance = instance;
    }

    subscribeEvents(){
        let conn = this.instance;
        conn.addEventListener('ready', function(){
            console.log("HAAS Ready!");
            this.emitter.emit("haas_connected");
        });
        conn.addEventListener('disconnected', function(){
            console.log("HAAS Disconnected!");
            this.emitter.emit("haas_disconnected");
        });
        conn.subscribeEvents((e) => this.emitter.emit("state_changed", e), "state_changed");
    }

    callService(){

    }
}