/*
 * copyright (c) 2021, anthony dedominic <adedomin@gmail.com>
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

const HashIds = require('hashids/cjs');

function pseudoRandId() {
    return Math.random().toString(36).slice(2);
}

module.exports = function(seed) {
    if (!seed) {
        seed = pseudoRandId();
    }

    const id_gen = new HashIds(seed, 5);
    let counter = 0 | 0;

    return function() {
        counter = counter + 1 | 0;
        return id_gen.encode(counter);
    };
};
