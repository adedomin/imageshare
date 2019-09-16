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

module.exports = function(req, res) {
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
};
