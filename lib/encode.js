'use strict';

const { packetType, elementType } = require('./constants');

// The Versatile IKE Control Interface (VICI) protocol
// https://www.strongswan.org/apidoc/md_src_libcharon_plugins_vici_README.html


const Encode = function(obj) {
	this._buffer = [];
};

Encode.prototype.encKeyValue = function (k, v) {
	return this.push([
		this._encNumber(elementType.KEY_VALUE),
		this._encField(k),
		this._encField(v, 2),
	]);
};

Encode.prototype.encArray = function (k, v) {
	this.push([
		this._encNumber(elementType.LIST_START),
		this._encField(k)
	]);

	v.forEach(i => {
		return this.push([
			this._encNumber(elementType.LIST_ITEM),
			this._encField(i, 2),
		]);
	});
	
	this.push(this._encNumber(elementType.LIST_END));
};

Encode.prototype.encObject = function (k, v) {
	this.push([
		this._encNumber(elementType.SECTION_START),
		this._encField(k),
	]);
	this.msgFromObject(v);
	this.push(this._encNumber(elementType.SECTION_END));
};

Encode.prototype._encField = function (i, l) {
	i = i.toString();
	return Buffer.concat([
		this._encNumber(i.length, l),
		Buffer.from(i, 'utf8')
	]);
};

Encode.prototype._encNumber = function (i, l = 1) {
	const number = Buffer.alloc(l);
	number.writeUIntBE(i, 0, l);
	return number;
};

Encode.prototype.msgFromObject = function (obj) {
	Object.keys(obj).forEach(k => {
		// console.log(this._buffer);
		if( typeof obj[k] === 'string' || typeof obj[k] === 'number' ) {
			return this.encKeyValue(k, obj[k]);
		}

		if( Array.isArray(obj[k]) ) {
			return this.encArray(k, obj[k]);
		}

		if( typeof obj[k] === 'object' ) {
			return this.encObject(k, obj[k]);
		}
	});
};

Encode.prototype.push = function(buf) {
	if( Array.isArray(buf)) {
		return this._buffer.push(...buf);
	}
	return this._buffer.push(buf);
};

Encode.prototype.unshift = function(buf) {
	if( Array.isArray(buf)) {
		return this._buffer.unshift(...buf);
	}
	return this._buffer.unshift(buf);
};

Encode.prototype._getBuffer = function() {
	// console.log(this._buffer);
	return Buffer.concat(this._buffer);
};

Encode.prototype.getTransportBuffer = function () {
	const packet = this._getBuffer();
	return Buffer.concat([
		this._encNumber(packet.length, 4), // message length
		packet
	]); 
};

Encode.prototype.buildMessage = function (pktType, obj) {
	this.push(this._encNumber(pktType)); // Packet Type
	this.msgFromObject(obj);
	return this.getTransportBuffer();
};

Encode.prototype.cmd_request = function (cmd, data) {
	this.push(this._encNumber(packetType.CMD_REQUEST));
	this.push(this._encField(cmd));
	if (data) {
		this.msgFromObject(obj);
	}
	return this.getTransportBuffer();
};

module.exports = Encode;
