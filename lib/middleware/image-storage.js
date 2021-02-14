/*
 * copyright (c) 2019, anthony dedominic <adedomin@gmail.com>
 *
 * permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * the software is provided "as is" and the author disclaims all warranties
 * with regard to this software including all implied warranties of
 * merchantability and fitness. in no event shall the author be liable for
 * any special, direct, indirect, or consequential damages or any damages
 * whatsoever resulting from loss of use, data or profits, whether in an
 * action of contract, negligence or other tortious action, arising out of
 * or in connection with the use or performance of this software.
 */

'use strict';

const FileType = require('file-type');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipeline_p = promisify(pipeline);

function mimeCheck(mime_rx, mime_exp) {
    if (mime_rx !== mime_exp) {
        return Error(`extension mimetype ${mime_exp}, does not match actual mimetype ${mime_rx}`);
    }
    return null;
}

module.exports = function(storage) {

    const hashid = require('../file-id.js')();

    return async function(req, res) {
        let fname = `${hashid()}${req.parsedForm.extension}`;
        let outfile = storage.store(fname);

        let data = Buffer.alloc(0);
        let ftype = undefined;

        async function* checkMime(source) {
            for await (const chunk of source) {
                if (data.length < 4100) {
                    data = Buffer.concat([data, chunk]);
                }

                if (data.length >= 4100 && !ftype) {
                    ftype = await FileType.fromBuffer(Buffer.from(data, 0, 4100));
                    const reason = mimeCheck(ftype?.mime ?? 'unknown', req.parsedForm.mime);
                    if (reason) {
                        storage.cancel(outfile, fname);
                        throw reason;
                    }
                }

                yield chunk;
            }
            if (!ftype && data.length > 0) {
                ftype = await FileType.fromBuffer(data);
                const reason = mimeCheck(ftype?.mime ?? 'unknown', req.parsedForm.mime);
                if (reason) {
                    storage.cancel(outfile, fname);
                    throw reason;
                }
            }
        }


        try {
            await pipeline_p(req.parsedForm.file, checkMime, outfile);
            res.send({
                status: 'ok',
                message: 'Successfully uploaded.',
                href: `${req.protocol}://${req.get('host')}/${fname}`,
            });
        }
        catch (e) {
            let user_message = 'Unknown Error';
            if (e.toString().indexOf('Error: extension mimetype') == 0) {
                user_message = e.toString();
            }
            else {
                console.error(e?.stack ?? e.toString());
            }
            res.status(400).send({
                status: 'error',
                message: user_message,
            });
        }
    };
};
