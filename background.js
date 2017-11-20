let settings = {}

async function reloadSettings() {
	settings = await browser.storage.local.get()
	settings.encoding = (settings.encoding || document.characterSet)
		.replace(/[^-_a-zA-Z0-9:]/g, '')
}

browser.runtime.onMessage.addListener(async message => {
	if (!message || typeof message !== 'object') return
	if (message.type === 'reloadSettings')
		await reloadSettings()
	else if (message.type === 'defaultEncoding')
		return Promise.resolve(document.characterSet)
})

function isURLEncoded(s) {
	try {
		if (decodeURIComponent(s) !== s)
			return true
	} catch (err) { }
	return false
}

void async function () {
	await reloadSettings()

	browser.webRequest.onHeadersReceived.addListener(e => {
		for (const h of e.responseHeaders) {
			if (h.name.toLowerCase() == 'content-disposition') {
				const match = /^\s*attachment;\s*filename=([^;]+|"[^"]+")\s*$/i.exec(h.value)
				if (!match) continue
				let filename = match[1]
				if (filename.startsWith('"') && filename.endsWith('"'))
					filename = filename.slice(1, -1)
				if (/^\s*\=\?\S+?\?[qQbB]\?.+?\?\=\s*$/.test(filename)) continue
				let filenameSequence
				if (settings.detectURLEncoded && isURLEncoded(filename)) {
					filenameSequence = "UTF-8''" + filename
				} else {
					if (!settings.encoding) continue
					filenameSequence = settings.encoding + "''" +
						filename.replace(/[ -~]/g, encodeURIComponent)
					if (settings.detectUTF8) {
						try {
							const escapedFilename = escape(filename)
							decodeURIComponent(escapedFilename)
							filenameSequence = "UTF-8''" + escapedFilename
						} catch (err) { }
					}
				}
				h.value = `attachment; filename*=${filenameSequence}`
			}
		}
		return { responseHeaders: e.responseHeaders }
	}, { urls: ["<all_urls>"] }, ["blocking", "responseHeaders"])
}()