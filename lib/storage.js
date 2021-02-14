/*
 * Copyright (c) 2017, Anthony DeDominic <adedomin@gmail.com>
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
const { tmpdir } = require('os');

const DEBUG = true;

function tdir() {
    const template = join(tmpdir(), 'imgshare-');
    const path = fs.mkdtempSync(template);
    console.warn(`Warning: No path configured; saving Files at: ${path}`);
    return path;
}

class Storage {

    /**
     * constructs a brand new storage object
     * @param max - max number of files
     * @param imgPath - filesystem path to store files in
     */
    constructor(max, imgPath) {
        if (!max) max = 20;
        else if (max < 1) max = 20;

        this.index = [];
        this.max = max;
        this.path = imgPath ?? tdir();
        fs.readdir(this.path, (err, files) => {
            if (err) throw err;
            files.forEach(f => this.add(f));
        });
    }

    /**
     * Create a new file for a given name, return a writable for writing to.
     * @param {string} name - file name.
     * @return {Writable} a writable stream for a given file path.
     */
    store(name) {
        const s = fs.createWriteStream(this.getPath(name));
        s.once('finish', () => {
            this.add(name);
        });
        return s;
    }

    /**
     * Cancels a stream and removes it from storage.
     * @param {Writable} stream - writable stream.
     * @param {string} name - file name.
     */
    cancel(stream, name) {
        if (!stream.destroyed) stream.destroy('Canceled');
        this.remove(name);
    }

    /**
     * Track a Given file name
     * @param filename - a new file to keep in the ring buffer.
     */
    add(filename) {
        if (this.index.length == this.max)
            this.remove(this.index.shift());
        this.index.push(filename);
        if (DEBUG) console.log(`Added ${join(this.path, filename)}`);
    }

    /**
     * Remove a given filename from storage
     * @param {string} filename
     */
    remove(filename) {
        fs.unlink(join(this.path, filename), (err) => {
            if (err) console.error(err);
            else if (DEBUG) console.log(`Removed ${join(this.path, filename)}`);
        });
    }

    getPath(filename) {
        return `${join(this.path, filename)}`;
    }
}

module.exports = Storage;
