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

var argv = require('yargs')
    .usage('usage: $0 [init] [-c --config] config_path')
    .command('init [path]', 'create default configuration in home folder or optional path')
    .example('$0 init', 'write default config to home folder as .img-irc.js or as .config/imageshare-irc.js if XDG_CONFIG_HOME is defined')
    .example('$0 -c ./config.js & disown', 'start server, run in background')
    .describe('c', 'config path')
    .alias('c', 'config')
    .help('h')
    .alias('h', 'help')
    .argv

var fs = require('fs'), 
    path = require('path'),
    configpath = ''

if (process.env.XDG_CONFIG_HOME)
    configpath = path.join(process.env.XDG_CONFIG_HOME, 'imageshare-irc.js')
else if (process.env.HOME)
    configpath = path.join(process.env.HOME, '.img-irc.js')

if (argv._[0] == 'init') {
    return fs.createReadStream(
        path.join(__dirname, 'config.default.js')
    ).pipe(fs.createWriteStream(
        argv._[1] || configpath
    ))
}

var config = require(argv.c || configpath),
    express = require('express'),
    file_type = require('file-type'),
    rate_lim = require('express-rate-limit'),
    Busboy = require('busboy'),
    read_chunk = require('read-chunk'),
    files_limit = config.storage.file_lim || 100,
    IrcClient = require('irc').Client,
    irc = new IrcClient(config.irc.server, config.irc.nick, config.irc.client),
    app = express()

if (!config.storage.dir) throw 'You must define a storage directory'

// current latest file
var curr = (+fs.readdirSync(config.storage.dir).sort((a,b) => +b - +a)[0] + 1) % files_limit || 0

if (config.reverse_proxied) app.enable('trust proxy')

var limit = new rate_lim({
    windowMs: config.upload_delay_ms || 2000, 
    max: 1,
    delayMs: 0
})

app.use('/upload', limit)

app.post('/upload', (req, res) => {
    var busboy = new Busboy({ 
        headers: req.headers,
        limits: {
            fileSize: config.storage.max_size || (1024*1024)*10,
            files: 1
        }
    })
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype.indexOf('image') != 0) {
            res.status(500)
            return res.send({
                status: 'error',
                msg: 'not an image'
            })
        }
        file.pipe(fs.createWriteStream(
            path.join(config.storage.dir, ''+curr)
        )).on('finish', () => {
            res.redirect('/'+curr)
            config.irc.client.channels.forEach(channel => {
                irc.say(channel, `new image -> ${config.irc.url}/${curr}`)
            })
            curr = (curr + 1) % files_limit
        }) 
    })
    req.pipe(busboy)
})

app.get('/:file', (req, res) => {
    if (isNaN(+req.params.file)) {
        res.status(404)
        return res.send({
            status: 'error',
            msg: 'no such file'
        })
    }
    try {
        res.type(file_type(read_chunk.sync(
            path.join(config.storage.dir, req.params.file), 0, 4100
        )).ext)
    }
    catch (e) {
        res.status(404)
        return res.send({
            status: 'error',
            msg: 'no such file'
        })
    }
    res.sendFile(path.join(config.storage.dir, req.params.file))
}) 

app.get('/', (req, res) => {
    res.type('html')
    res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Upload an Image</title></head>
        <body>
        <form action="/upload" enctype="multipart/form-data" method="post">
        <input type="file" name="upload"><br>
        <input type="submit" value="Upload">
        </form>
        </body>
        </html>
        `)
})

app.listen(config.port || 5657)
