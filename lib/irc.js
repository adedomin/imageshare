/*
 * Copyright (c) 2017, prussian <genunrest@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var IRC = require('irc-framework')

module.exports = (config) => {
    var irc = new IRC.Client()
    // error events kill the stupid bot otherwise
    irc.on('error', (message) => {
        console.error('*** IRC ERR ***', message)
    })

    irc.on('registered', () => {
        // if ident
        if (config.irc.nickserv_pass && 
            config.irc.nickserv_pass != '') {

            irc.say('NickServ', `IDENTIFY ${config.irc.nickserv_pass}`)
        }
        config.irc.channels.forEach((channel) => irc.join(channel))
    })

    irc.matchMessage(/^[.!](bots|help)/, (event) => {
        event.reply(`ImageIRC [JavaScript|NodeJS] :: Upload At ${config.web.help_url || 'NO URL PROVIDED'}`)
    })

    irc.matchMessage(/^[.!]source/, (event) => {
        event.reply('ImageIRC [JavaScript|NodeJS] :: Source https://github.com/adedomin/imageshare-irc')
    })

    irc.connect({
        host: config.irc.server, 
        nick: config.irc.nick, 
        port: config.irc.port,
        tls: config.irc.tls,
    })

    return irc
}
