#!/usr/bin/env node
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

var { argv } = require('yargs')
    .usage('usage: $0 [init] [-c --config] config_path')
    .command('init [path]', 'create default configuration in home folder or optional path')
    .example('$0 init', 'write default config to home folder as .img-irc.js or as .config/imageshare-irc.js if XDG_CONFIG_HOME is defined')
    .example('$0 -c ./config.js & disown', 'start server, run in background')
    .describe('c', 'config path')
    .alias('c', 'config')
    .help('h')
    .alias('h', 'help');

var fs = require('fs'),
    path = require('path'),
    configpath = '';

if (process.env.XDG_CONFIG_HOME)
    configpath = path.join(process.env.XDG_CONFIG_HOME, 'imageshare-irc.js');
else if (process.env.HOME)
    configpath = path.join(process.env.HOME, '.img-irc.js');

if (argv._[0] == 'init') {
    return fs.createReadStream(
        path.join(__dirname, '../', 'config.default.js')
    ).pipe(fs.createWriteStream(
        argv._[1] || configpath
    ));
}

if (!argv.c) argv.c = configpath;
argv.c = path.resolve(argv.c);

require(`${__dirname}/../index`)(argv);
