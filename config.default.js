var config = {
    // how many uploads allowed per ms
    upload_delay_ms: 2000,
    reverse_proxied: true,
    storage: {
        max_size: (1024**2)*10,
        // where to save images
        dir: '/tmp/uploads',
        // number of files to retain
        file_lim: 100
    },
    port: 5657,
    irc: {
        client: {
            userName: 'ImageShare',
            realName: 'bot',
            port: 6697,
            autoConnect: true,
            channels: ['#prussian'],
            secure: true,
            floodProtection: true,
            floodProtectionDelay: 300,
            sasl: false,
            stripColors: true,
            messageSplit: 512,
        },
        url: 'https://home.dedominic.pw:5657',
        server: 'irc.rizon.net',
        nick: 'ImageIRC-share'
    }
}

module.exports = config
