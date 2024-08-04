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
const maxPasteSize = config?.storage?.maxPasteSize ?? 1024 * 30 /* 30KiB */;

const { pipeline } = require('stream');
const { promisify } = require('util');
const pipeline_p = promisify(pipeline);

module.exports = function(storage) {
    const hashid = require('../file-id.js')();

    return async function(req, res) {
        const fname = hashid();
        const outfile = storage.store(fname);

        async function* sizeCheck(source) {
            let totalWrite = 0;
            for await (const data of source) {
                totalWrite += data.length;
                if (totalWrite >= maxPasteSize) {
                    // It appears that form handling allows for some sort of resumption before
                    // breaking the connection, send the header now and break connection.
                    res.status(413).send({
                        status: 'error',
                        message: `Sent: ${totalWrite}B, Max Allowed: ${maxPasteSize}B.`,
                    });
                    storage.cancel(outfile, fname);
                    break;
                }
                yield data;
            }
        }

        try {
            await pipeline_p(req, sizeCheck, outfile);
            res.send({
                status: 'ok',
                message: 'successfully uploaded.',
                href: `${req.protocol}://${req.get('host')}/paste/${fname}`,
            });
        }
        catch (e) {
            if (e.toString() != 'Canceled') {
                console.error(e?.stack ?? e.toString());
            }
        }
    };
};
