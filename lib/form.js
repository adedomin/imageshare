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

module.exports = (channels, server) => `
<!DOCTYPE html>
<html>
  <head>
    <title>Upload an Image</title>
    
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.3.1/css/bulma.min.css" crossorigin="anonymous">
    <style>
    #file {
    height: 100px;
    }
    </style>
  </head>
  <body>
    <section class="hero is-primary">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            Share Images with IRC
          </h1>
          <h2 class="subtitle">
            ${channels.join(', ')} on ${server}
          </h2>
        </div>
      </div>
    </section>
    <br>
    <section class="section">
      <div class="container">
        <form action="/upload" enctype="multipart/form-data" method="post">
          <label class="label">Caption</label>
          <p class="control has-addons">
            <span class="select">
              <select name="channel">
                <option value="-ALL-" selected>All channels</option>
                ${channels.map(channel => {
                    return `<option value="${channel}">${channel}</option>` 
                })}
              </select>
            </span>
            <input class="input is-expanded" type="text" name="caption"><br>
          </p>
          <label class="label">Upload an Image</label>
          <p class="control">
            <input id="file" class="input" type="file" name="upload"><br>
          </p>
          <p class="control">
            <input class="button is-primary" type="submit" value="Upload">
          </p>
        </form>
      </div>
    </section>
  </body>
</html>
`
