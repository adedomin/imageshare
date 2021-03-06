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
const { join } = require('path');

const express = require('express');

const app = express();

const { uploadImage, getImage } = require('./api/upload.js');
const paste = require('./api/paste.js');

if (config?.web?.reverseProxied) app.set('trust proxy', true);

app.use('/upload', uploadImage);
app.use('/paste', paste);
app.use('/', express.static(join(__dirname, '../public'), {
    index: [ 'index.html' ],
}));
app.get('/:file', getImage);

if (config?.web?.unix != undefined) {
    const server = app.listen(config?.web?.unix, function() {
        process.once('SIGINT', function() {
            server.close();
            process.exit();
        });
        process.once('SIGTERM', function() {
            server.close();
            process.exit();
        });
    });
}
else {
    app.listen(config?.web?.port ?? 5657, config?.web?.interface ?? null);
}
