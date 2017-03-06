var config = {
    // how many uploads allowed per ms
    upload_delay_ms: 2000,
    reverse_proxied: false,
    storage: {
        // 10MiB
        max_size: (1024*1024)*10,
        // where to save images
        dir: '/tmp/uploads',
        // number of files to retain
        file_lim: 100
    },
    port: 5657,
    interface: null, // leave as null to bind to all
    // for help text, lets users know where they can upload images
    help_url: null,
    irc: {
        server: 'irc.rizon.net',
        nick: 'ImageIRC',
        nickserv_pass: '',
        client: {
            autoConnect: true,
            port: 6697,
            channels: ['#prussian'],
            secure: true,
            floodProtection: true,
            floodProtectionDelay: 300
        }
    }
}

module.exports = config
