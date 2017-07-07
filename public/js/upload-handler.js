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

var selectedChannels = [],
    caption = '',
    banner = document.getElementById('banner-color'),
    statusMsg = document.getElementById('status-mesg'),
    files = document.getElementById('file'),
    dropzone = document.getElementById('dropzone'),
    submit = document.getElementById('submit')
 

function setInfo(message) {
    statusMsg.innerHTML = message
    banner.classList.remove('is-success')
    banner.classList.remove('is-danger')
    banner.classList.add('is-primary')
}

function setFailBanner(message) {
    statusMsg.innerHTML = message
    banner.classList.remove('is-primary')
    banner.classList.remove('is-success')
    banner.classList.add('is-danger')
}

function setSuccessBanner(message) {
    statusMsg.innerHTML = message
    banner.classList.remove('is-danger')
    banner.classList.remove('is-primary')
    banner.classList.add('is-success')
}

function addSelected(channel) {
    selectedChannels.push(channel)
}

function removeSelected(channel) {
    var pos = selectedChannels.indexOf(channel) 
    if (pos < 0) return
    selectedChannels.splice(pos, 1)
}

function addChannelButton(channel) {
    var box = document.createElement('button')
    box.classList.add('button')
    box.textContent = channel
    box.onclick = () => {
        if (selectedChannels.indexOf(channel) < 0) {
            box.classList.add('is-info')
            addSelected(channel)
        }
        else {
            box.classList.remove('is-info')
            removeSelected(channel)
        }
    }
    document.getElementById('channel-list').appendChild(box)
}

function modifyCaption(el) {
    caption = el.target.value
}

function createFileBox(file, xhr) {
    var box = document.createElement('div')
    box.classList.add('box')
    box.classList.add('column')
    box.classList.add('is-3')
    box.classList.add('has-text-centered')
    box.style.padding='5px'

    var url = document.createElement('a')
    url.href = ''
    url.textContent = `Uploading ${file.name}...`
    box.appendChild(url)

    xhr.imageUrl = url

    return box
}

function finishedUpload(el) {
    var xhr = el.target
    var box = xhr.box
    var url = xhr.imageUrl

    var res
    try {
        res = JSON.parse(xhr.responseText)
    }
    catch (e) {
        return setFailBanner('failed to parse upload response') 
    }

    if (xhr.status != 200 || res.status == 'error') {
        if (box && box.parentNode) box.parentNode.removeChild(box) 
        return setFailBanner(res.msg || 'unknown error')
    }

    url.href = res.href
    url.innerHTML = res.href
    setSuccessBanner('Successfully Uploaded')
    document.getElementById('uploads')
        .appendChild(xhr.box)

    dropzone.innerHTML = 'Select or Drop Files'
}

var movingDotPos = -1
function incrementProgress(el) {
    var dots = ['.', '.', '.', '.', '.', '.', '.']
    movingDotPos = (movingDotPos + 1) % dots.length
    dots[movingDotPos] = 'o'

    if (el.lengthComputable) {
        dropzone.innerHTML = `${dots.join('')} ${Math.floor((el.loaded / el.total)*100)}%`
    }
    else {
        dropzone.innerHTML = `${dots.join('')}`
    }
}

function handleFile(file) {
    if (file.type.indexOf('image') != 0 &&
        file.type.indexOf('video') != 0 ) {

        return setFailBanner('You can only upload images or videos')
    }

    var xhr = new XMLHttpRequest()
    xhr.open('POST', 'upload')
    xhr.upload.addEventListener('progress', incrementProgress)
    // xhr.upload.addEventListener('error', finishedUpload)
    xhr.addEventListener('load', finishedUpload)
    xhr.addEventListener('error', finishedUpload)
    xhr.box = createFileBox(file, xhr)

    var form = new FormData()
    form.append('caption', caption)
    form.append('channel', selectedChannels.join(','))
    form.append('file', file)
    xhr.send(form)

}

function changeFileLabel(el) {
    dropzone.innerHTML = `Selected (${el.target.files.length})`
    if (el.target.files.length > 0)
        submit.disabled = false
}

function uploadFile(el) {
    setInfo('Uploading...')
    Array.prototype.forEach.call(el.files, handleFile)
    submit.disabled = true
}

function dropHandle(el) {
    el.preventDefault()
    var data = el.dataTransfer
    if (data.files) Array.prototype.forEach.call(data.files, handleFile)
    submit.disabled = true
}

function dragover(el) {
    el.preventDefault()
}

function dragend(ev) {
    ev.dataTransfer.clearData()
}

document.addEventListener('DOMContentLoaded', () => {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', 'channels')
    xhr.onreadystatechange = () => {
        if ( xhr.readyState == XMLHttpRequest.DONE && 
             xhr.status === 200
        ) {
            try {
                JSON.parse(xhr.responseText).forEach(channel => {
                    addChannelButton(channel)
                })
            }
            catch (e) {
                setFailBanner('Failed to fetch channels')
            }
        }
    }
    xhr.send()
    document.getElementById('caption-input').onchange = modifyCaption
    files.onchange = changeFileLabel

    dropzone.ondrop = dropHandle
    dropzone.ondragover = dragover
    dropzone.ondragend = dragend
    submit.onclick = uploadFile.bind(null, files)
})
