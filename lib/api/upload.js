/*
 * Copyright (c) 2019, Anthony DeDominic <adedomin@gmail.com>
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

const config = require(process.env.CONFIG_PATH);

const express = require('express');
const expressSlowDown = require('express-slow-down');

const formHandler = require('../middleware/form-handling.js');
const storage = new (require('../storage.js'))(
    config.storage.fileLimit ?? 100,
    config.storage.dir,
);
const imageStorer = require('../middleware/image-storage.js')(storage);

const uploader = express.Router();
const limitMiddleware = new expressSlowDown({
    windowMs: config.limits.window ?? 10 * 60 * 1000 /* 10 minutes */,
    delayAfter: config.limits.delayAfter ?? 3,
    delayMs: 1000,
});

uploader.use('/', limitMiddleware);
uploader.get('/', (req, res) => {
    res.type('text/plain');
    res.send(`Terminal Users:

#!/bin/sh
# $1 - file
curl -sSf 'https://${req.get('host')}/upload' \\
    --http1.1 \\
    -F "file=@\${1}" \\
| jq -r '.href'
`);
});

uploader.post('/', [ formHandler, imageStorer ]);

module.exports.uploadImage = uploader;
module.exports.getImage = function(req, res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(storage.getPath(req.params.file));
};
