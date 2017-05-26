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

var express = require('express'),
    path = require('path'),
    crypto = require('crypto'),
    Hashids = require('hashids'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Busboy = require('busboy'),
    rate_lim = require('express-rate-limit'),
    app = express(),
    form = require('./form.js'),
    mime = require('mime-types'),
    readChunk = require('read-chunk'),
    fileType = require('file-type'),
    isSvg = require('is-svg'),
    createDOMPurify = require('dompurify'),
    jsdom = require('jsdom'),
    window = jsdom.jsdom('', {
        features: {
            FetchExternalResources: false, // disables resource loading over HTTP / filesystem
            ProcessExternalResources: false, // do not execute JS within script blocks
        },
    }).defaultView,
    DOMPurify = createDOMPurify(window),
    Readable = require('stream').Readable,
    index,
    hashids

function Web(config, storage) {

    index = form(config.irc.channels, config.irc.server)
    hashids = new Hashids()
    if (config.reverse_proxied) app.set('trust proxy', true)
    var limit = new rate_lim({
        windowMs: config.upload_delay_ms || 2000, 
        max: 1,
        delayMs: 0,
    })

    app.use('/upload', limit)

    var req_fail = (req, res, msg, busboy) => {
        req.unpipe(busboy)
        res.status(500)
        res.set('Connection', 'close')
        return res.send({
            status: 'error',
            msg,
        })
    }

    app.get('/upload', (req, res) => {
        res.type('text/plain')
        res.send(
`If you want to upload from your terminal, you can use the following shellscript function

# $1 - file path
# $2 - channel (optional)
# $3 - caption (channel must defined to use this)
ghetty_up() {
    curl 'https://images.ghetty.space/upload' \\
         -F "caption=\${3}" \\
         -F "channel=\${2:--nochan-}" \\
         -F "file=@\${1};type=$(file --mime-type "$1" | grep -Po '(?<=: ).*')" \\
         | grep -Po -m 1 '(?<=Redirecting to ).*'
}

Adapt for your needs, put it in your .shellrc file or whatever.`
        )

    })

    app.post('/upload', (req, res) => {
        var caption = 'new image', channel = '', fname = ''
        var busboy = new Busboy({ 
            headers: req.headers,
            limits: {
                fileSize: config.storage.max_size || (1024*1024)*10,
                files: 1,
                fieldSize: 300,
                fields: 2,
            },
        })
        busboy.on('field', (field, value) => {
            if (field == 'caption' 
                && (value != '')) {

                caption = value
            }
            else if (field == 'channel' 
                && (value != '')) {

                channel = value
                if (channel != '-nochan-' && config.irc.channels.indexOf(channel) < 0) {
                    req_fail(req, res, 'channel not in list', busboy)
                }
            }
        })
        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            if (mimetype != mime.lookup(filename)) {
                return req_fail(req, res, 'mimetype does not match extension of filename', busboy)
            }
            if (mimetype.indexOf('image') != 0
                && mimetype.indexOf('video') != 0) {

                return req_fail(req, res, 'not a video or image', busboy)
            }

            if (config.storage.disable_svg && mimetype.indexOf('svg') > -1) {
            
                return req_fail(req, res, 'SVGs are disabled', busboy)
            }

            file.on('limit', () => {
                req_fail(req, res, 'request too large', busboy)
            })

            crypto.randomBytes(8, (err, buffer) => {
                if (err || buffer.length < 8) {
                    return req_fail(req, res, 'crypto error', busboy)
                }

                var hexstr = buffer.toString('hex')
                hashids.salt = hexstr.slice(4)
                fname = hashids.encodeHex(hexstr.slice(0,4))
                    + '.'
                    + filename.split('.').slice(-1)

                // svg's are a special kind of hell
                if (mimetype.indexOf('svg') > -1) {
                    var svg_buffer = new Buffer('')
                    file.on('data', (data) => {
                        svg_buffer += data
                    }).on('end', () => {
                        svg_buffer = DOMPurify.sanitize(svg_buffer)
                        if (!isSvg(svg_buffer)) {
                            req_fail(req, res, 'mimetypes do not match', busboy)
                        }
                        else {
                            var stream = new Readable()
                            stream._read = () => {}
                            stream.push(svg_buffer)
                            stream.push(null)
                            storage.store(stream, fname).on('finish', () => {
                                if (channel == '-nochan-') {
                                    return res.redirect(
                                        `${req.protocol}://${req.get('host')}/${fname}`
                                    )
                                }
                                res.redirect('/')
                                this.emit('new', channel,
                                    `${caption} -> ${req.protocol}://${req.get('host')}/${fname}`
                                )
                            })
                        }
                    })
                    return
                }

                storage.store(
                    file, fname
                ).on('finish', () => {
                    var ftype = fileType(readChunk.sync( 
                        path.join(config.storage.dir, fname), 0, 4100
                    ))
                    if (!ftype || ftype.mime != mimetype) {
                        req_fail(req, res, 'mimetypes do not match', busboy)
                    }
                    else {
                        if (channel == '-nochan-') {
                            return res.redirect(
                                `${req.protocol}://${req.get('host')}/${fname}`
                            )
                        }
                        res.redirect('/')
                        this.emit('new', channel,
                            `${caption} -> ${req.protocol}://${req.get('host')}/${fname}`
                        )
                    }
                })
            })
        })
        req.pipe(busboy)
    })

    app.get('/favicon.ico', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'favicon.ico'))
    })

    app.get('/:file', (req, res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.sendFile(path.join(config.storage.dir, req.params.file))
    }) 

    app.get('/', (req, res) => {
        res.type('html')
        res.send(index)
    })

    app.listen(config.port || 5657, config.interface)
}

util.inherits(Web, EventEmitter)
module.exports = Web
