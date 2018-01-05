'use strict';

let HOST = "home.lan.unitedheroes.net";
let PORT = "8123";

document.getElementsByName("save_conf")[0].onclick = function() {
    let site = document.getElementsByName("site")[0].value;
    window.localStorage.setItem("host", site);
    console.info("Config saved");
};



function Connection()
{
    this.socket = {};
    this.cmds = {};
    this.event_handler;
    this.id_base = Date.now();
}

Connection.prototype.connect = function(url, secret) {
    if (! url.includes('api/websocket')) {
        url = url + '/api/websocket';
    }
    let socket = new WebSocket(url);
    let self = this;

    return new Promise((resolve, reject) => {
        socket.onopen = function(e) {
            console.info('websocket connection open', e);
        };

        socket.onmessage = function(message) {
            let cmd = JSON.parse(message.data);
            console.debug("message", cmd);
            if (cmd.type === "auth_ok") {
                self.socket = socket;
                resolve(self);
            }
            let command = 'msg_' + cmd.type;
            self[command](cmd);
        };

        socket.onerror = function(err){
            console.error("Websocket error: ", err);
            reject(err);
        };

        socket.onclose = function(e) {
            console.warn("Websocket connection closed", e);
        };
    });
};

Connection.prototype.send = function(cmd, callback) {
    try {
        if (cmd.id == undefined) {
            cmd.id = ++this.id_base;
        }
        if (callback) {
            this.cmds[cmd.id] = callback;
        }
        console.debug("send", cmd);
        this.socket.send(JSON.stringify(cmd));
    } catch(e) {
        console.error(e);
    }
};

Connection.prototype.event_handler = function(callback) {
    this.event_handler = callback;
    this.send({'type': 'subscribe_events', 'event_type': 'state_changed'});
};

Connection.prototype.error  = function(err) {
    console.error(err);
    // this.socket.close();
};

Connection.prototype.msg_auth_ok = function(msg){
    console.debug("Authed", msg);
};


Connection.prototype.msg_result = function(resp){
    if (!resp.success) {
        return this.error(resp);
    }
    console.debug("result", resp);
    if (this.cmds[resp.id]){
        this.cmds[resp.id](resp);
        delete(this.cmds[resp.id]);
    }
};

Connection.prototype.msg_event = function(event) {
    console.debug("event", event.event);
    if (this.event_handler !== undefined) {
        this.event_handler(event.event);
    }
}
