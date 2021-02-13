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

function mimeCheck(mime_rx, mime_exp, res) {
    if (mime_rx !== mime_exp) {
        res.status(400).send({
            status: 'error',
            message: `extension mimetype ${mime_exp}, does not match actual mimetype ${mime_rx}`,
        });
        return false;
    }
    return true;
}

module.exports = function(storage) {

    const hashid = require('../file-id.js')();

    return async function(req, res) {
        let fname = `${hashid()}${req.parsedForm.extension}`;
        let outfile = storage.store(fname);

        let data = Buffer.alloc(0);
        let ftype = undefined;
        for await (const b of req.parsedForm.file) {
            if (data.length < 4100) {
                data = Buffer.concat([data, b]);
            }

            if (data.length >= 4100 && !ftype) {
                ftype = await FileType.fromBuffer(Buffer.from(data, 0, 4100));
                if (!mimeCheck(ftype.mime, req.parsedForm.mime)) {
                    storage.cancel(fname);
                    return;
                }
            }
            outfile.write(b);
        }
        if (!ftype && data.length > 0) {
            ftype = await FileType.fromBuffer(data);
            if (!mimeCheck(ftype.mime, req.parsedForm.mime)) {
                storage.cancel(fname);
                return;
            }
        }

        res.send({
            status: 'ok',
            message: 'Successfully uploaded.',
            href: `${req.protocol}://${req.get('host')}/${fname}`,
        });
    };
};
