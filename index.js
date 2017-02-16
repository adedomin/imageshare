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


if (!config.storage.dir) throw 'You must define a storage directory'

// current latest file
var curr = (+fs.readdirSync(config.storage.dir).sort((a,b) => +b - +a)[0] + 1) % files_limit || 0

if (config.reverse_proxied) app.set('trust proxy', true)

var limit = new rate_lim({
    windowMs: config.upload_delay_ms || 2000, 
    max: 1,
    delayMs: 0
})

app.use('/upload', limit)

var req_fail = (req, res, msg, busboy) => {
    req.unpipe(busboy)
    res.status(500)
    res.set('Connection', 'close')
    return res.send({
        status: 'error',
        msg: msg
    })
}

app.post('/upload', (req, res) => {
    var caption = 'new image', channel = ''
    var busboy = new Busboy({ 
        headers: req.headers,
        limits: {
            fileSize: config.storage.max_size || (1024*1024)*10,
            files: 1,
            fieldSize: 300,
            fields: 2
        }
    })
    busboy.on('field', (field, value) => {
        if (field == 'caption' 
            && (value != '')) {

            caption = value
        }
        else if (field == 'channel' 
            && (value != '')) {
            
            channel = value
            if (channel != '-ALL-' && config.irc.client.channels.indexOf(channel) < 0) {
                req_fail(req, res, 'channel not in list', busboy)
            }
        }
    })
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype.indexOf('image') != 0 
            && mimetype.indexOf('video') != 0) {
            return req_fail(req, res, 'not a video or image', busboy)
        }

        file.on('limit', () => {
            req_fail(req, res, 'request too large', busboy)
        })
        file.pipe(fs.createWriteStream(
            path.join(config.storage.dir, ''+curr)
        )).on('finish', () => {
            res.redirect('/')
            if (channel != '-ALL-' && channel != '') {
                irc.say(channel, `${caption} -> ${req.protocol}://${req.get('host')}/${curr}`)
            }
            else {
                config.irc.client.channels.forEach(channel => {
                    irc.say(channel, `${caption} -> ${req.protocol}://${req.get('host')}/${curr}`)
                })
            }
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

var index = `
<!DOCTYPE html>
<html>
<head>
  <title>Upload an Image</title>

  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.3.1/css/bulma.min.css" crossorigin="anonymous">
  <style>
    #file {
      height: 100px;
    }
  </style>
</head>
<body>
  <section class="hero is-primary">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">
          Share Images with IRC
        </h1>
        <h2 class="subtitle">
          ${config.irc.client.channels.join(', ')} on ${config.irc.server}
        </h2>
      </div>
    </div>
  </section>
  <br>
  <section class="section">
    <div class="container">
      <form action="/upload" enctype="multipart/form-data" method="post">
        <label class="label">Caption</label>
        <p class="control has-addons">
          <span class="select">
            <select name="channel">
              <option value="-ALL-" selected>All channels</option>
              ${config.irc.client.channels.map(channel => {
                  return `<option value="${channel}">${channel}</option>` 
              })}
            </select>
          </span>
          <input class="input is-expanded" type="text" name="caption"><br>
        </p>
        <label class="label">Upload an Image</label>
        <p class="control">
          <input id="file" class="input" type="file" name="upload"><br>
        </p>
        <p class="control">
          <input class="button is-primary" type="submit" value="Upload">
        </p>
      </form>
    </div>
  </section>
</body>
</html>
`

app.get('/', (req, res) => {
    res.type('html')
    res.send(index)
})

app.listen(config.port || 5657, config.interface)
