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
'use strict';

const IRC = require('irc-framework');
const antispam = require('./irc-antispam');
const helpSpam = antispam(10000);
const fs = require('fs');
let inviteChannels = [];

module.exports = (config) => {
    let irc = new IRC.Client();

    function saveInvites() {
        fs.writeFile(
            config.irc.invite_file,
            JSON.stringify(inviteChannels),
            err => {
                if (err)
                    console.error(
                        `Failed to save invite file: ${
                            err.toString()}`
                    );
            }
        );
    }

    // error events kill the stupid bot otherwise
    irc.on('error', (message) => {
        console.error('*** IRC ERR ***', message);
    });

    irc.on('registered', () => {
        // if ident
        if (config.irc.nickserv_pass &&
            config.irc.nickserv_pass != '') {

            irc.say('NickServ', `IDENTIFY ${config.irc.nickserv_pass}`);
        }

        fs.readFile(config.irc.invite_file, (err, data) => {
            if (err || !data) {
                return irc.join(config.irc.channels.join(','));
            }

            try {
                inviteChannels = JSON.parse(data);
            }
            catch (e) {
                console.error(`Failed to read invite file: ${  err.toString()}`);
                console.log(`Joining ${config.irc.channels.join(',')}`);
                return irc.join(config.irc.channels.join(','));
            }

            config.irc.channels = config.irc.channels.concat(inviteChannels);
            console.log(`Joining ${config.irc.channels.join(',')}`);
            irc.join(config.irc.channels.join(','));
        });
    });

    irc.matchMessage(/^[.!](bots|help)/, (event) => {
        if (helpSpam(event.target)) return;
        event.reply(`ImageIRC [JavaScript|NodeJS] :: Upload At ${config.web.help_url || 'NO URL PROVIDED'}`);
    });

    irc.on('invite', event => {
        if (config.irc.channels.indexOf(event.channel) < 0) {
            config.irc.channels.push(event.channel);
            inviteChannels.push(event.channel);
            saveInvites();
        }
        irc.join(event.channel);
        console.log(`Invited to ${event.channel}`);
    });

    // this shouldn't happen
    irc.on('part', event => {
        if (event.nick == config.irc.nick) {
            config.irc.channels.splice(
                config.irc.channels.indexOf(event.channel), 1
            );
            let chanInd = inviteChannels.indexOf(event.channel);
            if (chanInd != -1) {
                inviteChannels.splice(
                    inviteChannels.indexOf(event.channel)
                );
                saveInvites();
            }
        }
        console.error(`Parted channel ${event.channel}`);
    });

    irc.on('kick', event => {
        if (event.kicked == config.irc.nick) {
            config.irc.channels.splice(
                config.irc.channels.indexOf(event.channel), 1
            );
            let chanInd = inviteChannels.indexOf(event.channel);
            if (chanInd != -1) {
                inviteChannels.splice(
                    inviteChannels.indexOf(event.channel)
                );
                saveInvites();
            }
        }
        console.error(`Kicked from ${event.channel}`);
    });

    irc.matchMessage(/^[.!]source\b/, (event) => {
        if (helpSpam(event.target)) return;
        event.reply('ImageIRC [JavaScript|NodeJS] :: Source https://github.com/adedomin/imageshare-irc');
    });

    irc.connect({
        host: config.irc.server,
        nick: config.irc.nick,
        port: config.irc.port,
        tls: config.irc.tls,
    });

    return irc;
};
