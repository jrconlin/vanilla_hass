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
}

Connection.prototype.connect = function(url = 'ws://'+ HOST + ':' + PORT + '/api/websocket',
                                        secret) {
    let socket = new WebSocket(url);
    let self = this;

    return new Promise((resolve, reject) => {
        socket.onopen = function(e) {
            console.log('Open ' + JSON.stringify(e));
        };

        socket.onmessage = function(message) {
            let cmd = JSON.parse(message.data);
            console.log("Message = " + JSON.stringify(cmd));
            if (cmd.type === "auth_ok") {
                self.socket = socket;
                resolve(self);
            }
            let command = 'msg_' + cmd.type;
            self[command](cmd);
        };

        socket.onerror = function(err){
            console.error("Websocket error: " + err);
            reject(err);
        };

        socket.onclose = function(e) {
            console.log("Websocket connection closed: " + JSON.stringify(e));
        };
    });
};

Connection.prototype.send = function(cmd, callback) {
    try {
        let req = {
            "type": cmd,
            "id": Date.now(),
        };
        if (callback) {
            this.cmds[req.id] = callback;
        }
        this.socket.send(JSON.stringify(req));
    } catch(e) {
        console.error(e);
    }
};

Connection.prototype.error  = function(err) {
    console.error(err);
    this.socket.close();
};

Connection.prototype.msg_auth_ok = function(msg){
    console.debug("Authed", msg);
};


Connection.prototype.msg_result = function(resp){
    if (!resp.success) {
        return this.error(resp);
    }
    console.debug(resp);
    if (this.cmds[resp.id]){
        this.cmds[resp.id](resp);
        delete(this.cmds[resp.id]);
    }
};
