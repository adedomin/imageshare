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
const Busboy = require('busboy');
const mime = require('mime-types');
const { extname } = require('path');

module.exports = function(req, res, next) {
    const busboy = new Busboy({
        headers: req.headers,
        limits: {
            fileSize: config.storage.maxSize ?? (1024*1024)*10,
            files: 1,
            fieldSize: 300,
            fields: 1,
        },
    });

    req.parsedForm = {};

    busboy.on('file', (fieldname, file, filename) => {
        const mimetype = mime.lookup(filename).toString();
        if (mimetype.indexOf('image') !== 0 &&
            mimetype.indexOf('video') !== 0) {
            // discard contents of stream
            file.resume();
            req.parsedForm.hasErr = `mimetype: ${mimetype}, is not an image or a video.`;
        }

        if (mimetype.indexOf('svg') > -1) {
            // discard contents of stream
            file.resume();
            req.parsedForm.hasErr = 'SVGs are not supported.';
        }

        req.parsedForm.file = file;
        req.parsedForm.extension = extname(filename);
        req.parsedForm.mime = mimetype;
        if (!req.parsedForm.hasErr) next();
    });

    busboy.on('finish', () => {
        if (!req.parsedForm.file) {
            res.status(400)
                .send({
                    status: 'error',
                    message: 'No file uploaded.',
                });
        }
        else if (req.parsedForm.hasErr) {
            res.status(415)
                .send({
                    status: 'error',
                    message: req.parsedForm.hasErr,
                });
        }
    });

    req.pipe(busboy);
};
