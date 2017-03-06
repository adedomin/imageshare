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

module.exports = (config) => {
    var IrcClient = require('irc').Client,
        irc = new IrcClient(config.irc.server, config.irc.nick, config.irc.client)

    // error events kill the stupid bot otherwise
    irc.addListener('error', (message) => {
        console.error('*** IRC ERR ***', message)
    })

    irc.addListener('registered', () => {
        // if ident
        if (config.irc.nickserv_pass && config.irc.nickserv_pass != '') {
            irc.say('NickServ', `IDENTIFY ${config.irc.nickserv_pass}`)
        }
    })

    irc.addListener('message', function (nick, chan, msg) {
        if (!(/^[.!](bots|help)/.test(msg))) return
        irc.say(chan, `ImageIRC [JavaScript|NodeJS] :: Upload At ${config.help_url || 'NO URL PROVIDED'}`)
    })

    irc.addListener('message', function (nick, chan, msg) {
        if (!(/^[.!]source/.test(msg))) return
        irc.say(chan, 'ImageIRC [JavaScript|NodeJS] :: Source https://github.com/GeneralUnRest/imageshare-irc')
    })

    return irc
}
