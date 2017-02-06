Usage
-----

    usage: imgirc [init] [-c --config] config_path

    Commands:
      init [path]  create default configuration in home folder or
                   optional path

    Options:
      -c, --config  config path
      -h, --help    Show help                                 [boolean]

    Examples:
      imgirc init                     write default config to home
                                        folder as .img-irc.js or as
                                        .config/imageshare-irc.js if
                                        XDG_CONFIG_HOME is defined
      imgirc -c ./config.js & disown  start server, run in background

License
-------

    Copyright (c) 2017, prussian <genunrest@gmail.com>

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted, provided that the above
    copyright notice and this permission notice appear in all copies.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
