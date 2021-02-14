/*
 * Copyright (c) 2021, Anthony DeDominic <adedomin@gmail.com>
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

const storage = new (require('../storage.js'))(
    config?.storage?.pasteLimit ?? 1000,
    config?.storage?.pasteDir,
);
const pasteHandler = require('../middleware/paste-handler.js')(storage);

const uploader = express.Router();
const limitMiddleware = new expressSlowDown({
    windowMs:   config?.limits?.window ?? 10 * 60 * 1000 /* 10 minutes */,
    delayAfter: config?.limits?.delayAfter ?? 3,
    delayMs:    config?.limits?.delayLength ?? 1000,
});

uploader.get('/', (req, res) => {
    res.type('text/plain');
    res.send(`Terminal Users:

#!/bin/sh
# $1 - file
curl '${req.protocol}://${req.get('host')}/paste' \\
  --data-binary "@\${1:--}" \\
| jq -r '.href'
`);
});
uploader.get('/:file', (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'text/plain; charset="utf-8"');
    res.sendFile(storage.getPath(req.params.file));
});

uploader.use('/', limitMiddleware);
uploader.post('/', pasteHandler);

module.exports = uploader;
