'use strict';

const { elementType, packetType } = require('./constants');

// The Versatile IKE Control Interface (VICI) protocol
// https://www.strongswan.org/apidoc/md_src_libcharon_plugins_vici_README.html

const Decode = function() {
    this._buffer = null;
    this._offset = 0;
};

Decode.prototype.parse = function (data) {
    if (Buffer.isBuffer(data) === false) {
        throw "parameter is not a Buffer";
    };

    if (!this._buffer) {
        this._buffer = data;
    };

    const length = this._readNumber(4);

    if (data.length !== length + 4) {
        throw `Wrong packet length. Packet length: ${data.length - 4} Expected length: ${length}`;
    }

    const rcvPacketType = this._readNumber(1);

    return {
        type: Object.keys(packetType).find(key => packetType[key] === rcvPacketType),
        message: this.decodeMessage(),
    };
};

Decode.prototype.readSection = function () {
    return this._buildResponse(this._readField(1), this.decodeMessage());
};

Decode.prototype.readKeyValue = function () {
    return this._buildResponse(this._readField(1), this._readField(2));
};

Decode.prototype.readArray = function () {
    return this._buildResponse(this._readField(1), this.decodeMessage());
};

Decode.prototype._buildResponse = function (key, value) {
    const result = {};
    result[key] = value;
    return result;
};

Decode.prototype._readField = function (l) {
    const length = this._readNumber(l);
    const result = this._readString(length);
    return result;
};

Decode.prototype._readNumber = function (l = 1) {
    const number = this._buffer.readUIntBE(this._offset, l);
    this._offset += l;
    return number;
};

Decode.prototype._readString = function (l = 1) {
    const result = this._buffer.toString('utf8', this._offset, this._offset + l);
    this._offset += l;
    return result;
};

Decode.prototype.decodeMessage = function () {

    const message = {};
    const list = [];

    while(this._offset < this._buffer.length) {
        const type = this._readNumber(1);

        switch(type) {
            case elementType.SECTION_START:
                // console.log('SECTION_START');
                Object.assign(message, this.readSection());
                break;

            case elementType.SECTION_END:
                // console.log('SECTION_END');
                return message;

            case elementType.KEY_VALUE:
                // console.log('KEY_VALUE');
                Object.assign(message, this.readKeyValue());
                break;

            case elementType.LIST_START:
                // console.log('LIST_START');
                Object.assign(message, this.readArray());
                break;

            case elementType.LIST_ITEM:
                // console.log('LIST_ITEM');
                list.push(this._readField(2))
                break;

            case elementType.LIST_END:
                // console.log('LIST_END');
                return list;

            default:
                throw `Element Type not found: ${type}`;
        };
    }
    return message;
};

module.exports = Decode;
