var config = {
    // how many uploads allowed per ms
    limits: {
        window: 2000,
        max_per_window: 3,
    },
    // if server is behind something like nginx
    // for forwarded for headers
    reverse_proxied: false,
    storage: {
        // 10MiB
        max_size: (1024*1024)*10,
        // where to save images
        dir: '/tmp/uploads',
        // number of files to retain
        file_lim: 100,
        // svg's are a bit of a mess to do safely
        disable_svg: false,
    },
    web: {
        port: 5657,
        interface: null, // leave as null to bind to all
        // for help text, lets users know where they can upload images
        help_url: null,
    },
    irc: {
        server: 'irc.rizon.net',
        port: 6697,
        nick: 'ImageIRC_',
        tls: true,
        nickserv_pass: '',
        channels: ['#prussian'],
        // file to persist invites to
        invite_file: '/tmp/imgirc-invites.json',
    },
}

module.exports = config
