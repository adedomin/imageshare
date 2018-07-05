/*
 * Copyright (c) 2017, prussian <genunrest@gmail.com>
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

const fs = require('fs');
const { join } = require('path');

class Storage {

    constructor(max, imgPath) {
        if (!max) max = 20;
        else if (max < 1) max = 20;

        this.index = [];
        this.max = max;
        this.path = imgPath;
        fs.readdir(this.path, (err, files) => {
            if (err) throw err;
            files.forEach(f => this.add(f));
        });
    }

    store(stream, name) {
        this.add(name);
        return stream.pipe(
            fs.createWriteStream(join(this.path, name))
        );
    }

    add(filename) {
        if (this.index.length == this.max)
            this.remove(this.index.shift());
        this.index.push(filename);
    }

    remove(filename) {
        fs.unlink(join(this.path, filename), (err) => {
            if (err) console.error(err);
        });
    }
}

module.exports = Storage;
