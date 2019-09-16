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

app.use('/upload', require('./api/upload.js'));
app.use('/', express.static(join(__dirname, '../public'), {
    index: [ 'index.html' ],
}));
app.get('/:file', (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(join(config.storage.dir, req.params.file));
});

app.listen(config.web.port || 5657, config.web.interface);
