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
        file_lim: 100,
        // svg's are a bit of a mess to do safely
        disable_svg: true,
    },
    port: 5657,
    interface: null, // leave as null to bind to all
    // for help text, lets users know where they can upload images
    help_url: null,
    irc: {
        server: 'irc.rizon.net',
        port: 6697,
        nick: 'ImageIRC_',
        tls: true,
        nickserv_pass: '',
        channels: ['#prussian'],
    },
}

module.exports = config
