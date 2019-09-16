'use strict';
const config = {
    // how many uploads allowed per ms
    limits: {
        window: 2000,
        maxPerWindow: 3,
    },
    // if server is behind something like nginx
    // for forwarded for headers
    reverse_proxied: false,
    storage: {
        // 10MiB
        maxSize: (1024*1024)*10,
        // where to save images
        dir: '/tmp/uploads',
        // number of files to retain
        fileLimit: 100,
    },
    web: {
        port: 5657,
        interface: null, // leave as null to bind to all
        // for help text, lets users know where they can upload images
        helpUrl: null,
    },
    irc: {
        server: 'irc.rizon.net',
        port: 6697,
        nick: 'ImageIRC_',
        tls: true,
        nickservPass: '',
    },
};

module.exports = config;
