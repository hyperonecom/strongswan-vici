'use strict';

const net = require('net');
const events = require ("events");

const { encode, decode } = require('./lib');

const VICI = function(opts = {}) {
    events.EventEmitter.call(this);

    this.socket = opts.socket || '/var/run/charon.vici';
    this.client = null;
    this.buffer = Buffer.alloc(0);
};

VICI.prototype.__proto__ = events.EventEmitter.prototype;

VICI.prototype.connect = function() {
    this.client = net.createConnection(this.socket);

    const self = this;
    self._events = this.client._events;

    this.client.on('data', function(data) {
        self.buffer = Buffer.concat([ self.buffer, data ]);
        try {
            const dec = new decode();
            const obj = dec.parse(data);
            self.emit('packet', obj);
            self.buffer = Buffer.alloc(0);
        }
        catch(e) {
        }
    });

    return this.client;
};

VICI.prototype.write = function(data) {
    this.client.write(data);
};

VICI.prototype.end = function(data) {
    this.client.end(data);
};

VICI.prototype._cmd = function(cmd, body) {
    const self = this;
    return new Promise(function(resolve, reject) {
        const removeListeners = () => Object.keys(listeners).forEach(e => { 
            // console.log(`remove listener for: ${e}`);
            self.removeListener(e, listeners[e]);
        });

        const listeners = {
            timeout: () => {
                reject();
                removeListeners();
            },
            error: (err) => {
                reject(err);
                removeListeners();
            },
            packet: (data) =>{
                resolve(data);
                removeListeners();
            }
        };

        Object.keys(listeners).forEach(e => self.on(e, listeners[e]));
        const enc = new encode();
        self.write(enc.cmd_request(cmd));
    });
};

VICI.prototype.cmd = function (cmd, data) {
    return this._cmd(cmd, data);
};

module.exports = VICI;
