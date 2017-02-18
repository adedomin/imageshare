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

var fs = require('fs'),
    join = require('path').join

function Storage(max, img_path) {
    if (!(this instanceof Storage))
        return new Storage(max)
    if (!max) max = 20
    else if (max < 1) max = 20

    this.index = []
    this.max = max
    this.path = img_path

    this.store = (stream, name) => {
        this.add(name)
        return stream.pipe(
            fs.createWriteStream(join(this.path, name))
        )
    }

    this.add = (filename) => {
        if (this.index.length == this.max)
            this.remove(this.index.shift())   
        this.index.push(filename)
    }

    this.remove = (filename) => {
        fs.unlink(join(this.path, filename), (err) => {
            if (err) console.error(err)
        })
    }

    this.init = () => {
        fs.readdir(this.path, (err, files) => {
            if (err) throw err
            files.forEach(this.add)
        })
    }
}

module.exports = Storage