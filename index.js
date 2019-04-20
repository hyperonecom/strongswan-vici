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

VICI.prototype = Object.create(events.EventEmitter.prototype);
VICI.prototype.constructor = VICI;

VICI.prototype.connect = function() {
    this.client = net.createConnection(this.socket);

    const self = this;
    this.client.on('connect', function() { self.emit('connect'); });
    this.client.on('drain', function() { self.emit('drain'); });
    this.client.on('end', function() { self.emit('end'); });
    this.client.on('close', function(hadError) { self.emit('close', hadError); });
    this.client.on('ready', function() { self.emit('ready'); });
    this.client.on('timeout', function() { self.emit('timeout'); });
    this.client.on('error', function(err) { self.emit('error', err); });

    this.client.on('data', function(data) {
        self.buffer = Buffer.concat([ self.buffer, data ]);
        try {
            const dec = new decode();
            const obj = dec.parse(data);
            self.emit('data', obj);
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
        self.on('data', data => resolve(data));
        self.on('error', err => reject(err));
        self.on('timeout', () => reject());

        const enc = new encode();
        self.write(enc.cmd_request(cmd));
    });
};

VICI.prototype.cmd = function (cmd, data) {
    return this._cmd(cmd, data);
};

module.exports = VICI;
