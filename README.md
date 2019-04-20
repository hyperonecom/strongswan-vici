# strongswan-vici

JavaScript implementation of The **Versatile IKE Control Interface** (VICI) protocol for **strongSwan**.

strongSwan is an OpenSource IPsec-based VPN solution.

## Summary

**VICI protocol** provides an interface for external applications to configure, control and monitor the IKE daemon called charon which is main part of strongSwan. It provides a stable IPC interface, allowing external tools to query, configure and control the IKE daemon.

[strongSwan](https://www.strongswan.org/) is a multiplatform IPsec implementation and offers strong authentication mechanisms using X.509 public key certificates and optional secure storage of private keys and certificates on smartcards. strongSwan supports IKEv1 and fully implements the Internet Key Exchange (IKEv2) protocol defined by [RFC 5996](https://tools.ietf.org/html/rfc5996).

## Example

### Code

```js
'use strict';

const VICI = require('strongswan-vici');

const vici = new VICI({
    socket: '/var/run/charon.vici'
});

const v = vici.connect();

v.on('connect', () => {
    vici.cmd('version')
        .then(data => {
            console.log(data);
            vici.end();
        })
        .catch(console.log);
});

```

### Output
```
{ type: 'CMD_RESPONSE',
  message:
   { daemon: 'charon',
     version: '5.5.1',
     sysname: 'Linux',
     release: '4.9.0-8-amd64',
     machine: 'x86_64' } }
```

## VICI Protocol details

The VICI protocol runs over a reliable transport protocol. However the protocol does not offer any security or authentication mechanisms. Therefore it strongly recommended to use it only over a UNIX socket with appropirate permissions set as required.

A low-level VICI protocol description is available in:

* github, vici plugin [sources folder](https://github.com/strongswan/strongswan/tree/57447015db828832e0e141dcdab7fbf61f828851/src/libcharon/plugins/vici)
* strongswan.org, [VICI protocol](https://www.strongswan.org/apidoc/md_src_libcharon_plugins_vici_README.html) section

## Contributing

All new contributions to the project are welcome, be it a new functionality or bugfix. It is awsome that you would like to contribute! Open an issue so we can discuss your plans.

## License

strongswan-vici is licensed under a Apache License.
