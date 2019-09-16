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

const { tmpdir } = require('os');
const readChunk = require('read-chunk');
const fileType = require('file-type');

const express = require('express');
const expressRateLimit = require('express-rate-limit');
const formHandler = require('../middleware/form-handling.js');
const storage = new (require('../storage.js'))(
    config.storage.fileLimit || 100,
    config.storage.dir || tmpdir(),
);

const { randomBytes } = require('crypto');
const hashids = new (require('hashids/cjs'))(
    randomBytes(16).toString('base64'), 5
);
// incrementing counter of files
let counter = 0n; // TODO: size rollover?

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

# $1 - file
# $2 - channels, comma separated (optional)
# $3 - caption (optional)
ghetty_up() {
    if [ "$1" = '-l' ] || [ "$1" = '--list' ]; then
        curl -sSf 'https://images.ghetty.space/channels' \\
        | jq -r '.'
        return
    fi
    curl -sSf 'https://images.ghetty.space/upload' \\
        --http1.1 \\
        -F "caption=\${3}" \\
        -F "channel=\${2}" \\
        -F "file=@\${1};type=$(file --mime-type "$1" | grep -Po '(?<=: ).*')" \\
    | jq -r '.href'
}`);
});

uploader.post('/', [ formHandler, (req, res) => {
    if (req.error) {
        if (req.parsedForm.file) req.parsedForm.file.resume();
        res.send({
            status: 'error',
            message: req.error.toString(),
        });
        return;
    }

    let fname = `${hashids.encodeHex(++counter)}${req.parsedForm.extension}`;
    storage.store(req.parsedForm.file, fname).on('finish', async function() {
        let ftype = fileType(await readChunk(
            storage.getPath(fname), 0, 4100
        ));

        if (!ftype || ftype.mime !== req.parsedForm.mime) {
            res.send({
                status: 'error',
                message: Error(`extension mimetype ${req.parsedForm.mime}, does not match actual mimetype ${ftype.mime}`)
                    .toString(),
            });
        }
        else {
            res.send({
                status: 'ok',
                message: 'Successfully uploaded.',
                href: `${req.protocol}://${req.get('host')}/${fname}`,
            });
        }
    });
} ]);

module.exports = uploader;
