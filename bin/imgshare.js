#!/usr/bin/env node
/*
 * Copyright (c) 2017, Anthony DeDominic <adedomin@gmail.com>
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

const { argv, env, exit } = require('process');
const usage = `usage: imgshare [init] [-c --config] config_path

Commands:
  init [path]  create default configuration in home folder or
               optional path

Options:
  -c, --config  config path
  -h, --help    Show help                                 [boolean]`;

const fs = require('fs');
const path = require('path');
let configpath = '';

if (env.XDG_CONFIG_HOME) {
    configpath = path.join(env.XDG_CONFIG_HOME, 'imgshare.js');
}
else if (env.HOME) {
    configpath = path.join(env.HOME, '.config','imgshare.js');
}
else {
    // working directory
    configpath = 'imgshare.js';
}

let is_init = false;
let conf_next = false;
for (let arg of argv.slice(2)) {
    if      (arg == 'init') {
        is_init = true;
        conf_next = true;
    }
    else if (conf_next) {
        configpath = arg;
        conf_next = false;
    }
    else if (arg == '-c' || arg == '--config') conf_next = true;
    else if (arg.indexOf('--config=') == 0) {
        configpath = arg.slice('--config='.length);
    }
    else {
        if (arg != '-h' && arg != '--help') {
            console.error(`Unknown Argument: ${arg}`);
        }
        console.error(usage);
        exit(1);
    }
}

if (is_init) {
    const s = fs.createReadStream(
        path.join(__dirname, '../', 'config.default.js'),
    ).pipe(fs.createWriteStream(
        configpath,
    ));

    let hasErr = false;
    s.on('error', e => {
        console.error('Failed to write configuration: ', e.toString());
        hasErr = true;
    });

    s.on('close', () => {
        if (hasErr) exit(1);
        else        console.log(`Wrote default configuration to: ${configpath}`);
    });
}
else {
    process.env.CONFIG_PATH = path.resolve(configpath);
    require(`${__dirname}/../lib/web.js`);
}
