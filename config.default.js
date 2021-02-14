'use strict';
const config = {
    limits: {
        // Delay for up to 10 minutes (in ms)
        window: 10 * 60 * 1000,
        // how many uploads allowed before delays kick in
        delayAfter: 3,
        // time to delay request (in ms; is multiplied by number of req made in window)
        delayLength: 1000,
    },
    storage: {
        // 10MiB
        maxSize: (1024*1024)*10,
        // 30kiB
        maxPasteSize: (1024)*30,
        // where to save images (null = random /tmp path)
        dir: null,
        // where to save pastes (null = random /tmp path)
        pasteDir: null,
        // number of files to retain
        fileLimit: 100,
        // number of pastes to retain
        pasteLimit: 2000,
    },
    web: {
        port: 5657,
        interface: null, // leave as null to bind to all
        // if server is behind something like nginx
        // for forwarded for headers
        reverseProxied: false,
    },
};

module.exports = config;
