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
const expressRateLimit = require('express-rate-limit');
const formHandler = require('../middleware/form-handling.js');
const imageStorer = require('../middleware/image-storage.js');

const uploader = express.Router();
const limitMiddleware = new expressRateLimit({
    windowMs: config.limits.window || 2000,
    max: config.limits.max_per_window || 3,
    delayMs: 0,
    message: JSON.stringify({
        status: 'error',
        message: 'Too many uploads, try again later.',
    }),
});

uploader.use('/', limitMiddleware);
uploader.get('/', (req, res) => {
    res.type('text/plain');
    res.send(`Terminal Users:

#!/bin/sh
# $1 - file
curl -sSf 'https://${req.get('host')}/upload' \\
    --http1.1 \\
    -F "file=@\${1};type=$(file --mime-type "$1" | sed -n 's/.*: //p')" \\
| jq -r '.href'
`);
});

uploader.post('/', [ formHandler, imageStorer ]);

module.exports = uploader;
