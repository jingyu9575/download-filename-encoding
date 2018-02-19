let settings = {}
let siteEncodings = new Map()

async function reloadSettings() {
	settings = await browser.storage.local.get()
	settings.encoding = (settings.encoding || document.characterSet)
		.replace(/[^-_a-zA-Z0-9:]/g, '')
	siteEncodings = new Map()
	for (const s of (settings.siteEncodings || '').split(/\r|\n/)) {
		const match = s.match(/^\s*(\S+)\s+(\S+)/)
		if (!match) continue
		siteEncodings.set(match[2].toLowerCase(), match[1])
	}
}

browser.runtime.onMessage.addListener(async message => {
	if (!message || typeof message !== 'object') return
	if (message.type === 'reloadSettings')
		await reloadSettings()
	else if (message.type === 'defaultEncoding')
		return Promise.resolve(document.characterSet)
})

function processURLEncoded(s, encoding) {
	if (settings.detectURLEncoded) {
		try {
			if (decodeURIComponent(s) !== s)
				return `UTF-8''${s}`
		} catch (err) { }
	}
	if (settings.detectNonStandardURLEncoded) {
		try {
			const seq = unescape(s)
			if (seq !== s) {
				const arr = [...seq].map(v => v.charCodeAt(0)).filter(v => v <= 255)
				new TextDecoder(encoding).decode(Uint8Array.from(arr))
				return `${encoding}''${s}`
			}
		} catch (err) { }
	}
	return undefined
}

function siteEncodingForURL(url) {
	return siteEncodings.get(new URL(url).hostname.toLowerCase())
		|| settings.encoding
}

void async function () {
	await reloadSettings()

	browser.webRequest.onHeadersReceived.addListener(e => {
		let contentDispositionHeader = undefined
		let encoding = undefined
		for (const h of e.responseHeaders) {
			if (h.name.toLowerCase() == 'content-disposition') {
				contentDispositionHeader = h
				const match = /^\s*attachment;\s*filename=([^;]+|"[^"]+")\s*$/i
					.exec(h.value)
				if (!match) break
				let filename = match[1]
				if (filename.startsWith('"') && filename.endsWith('"'))
					filename = filename.slice(1, -1)
				if (/^\s*\=\?\S+?\?[qQbB]\?.+?\?\=\s*$/.test(filename)) return {}
				let filenameSequence = processURLEncoded(filename)
				if (!filenameSequence) {
					if (!encoding) encoding = siteEncodingForURL(e.url)
					if (!encoding) return {}
					filenameSequence = encoding + "''" +
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
				return { responseHeaders: e.responseHeaders }
			}
		}
		// detect URL encoded filename in URL
		if (settings.detectURLEncoded || settings.detectNonStandardURLEncoded) {
			let filename = new URL(e.url).pathname.replace(
				new URL('.', e.url).pathname, '')
			try {
				filename = decodeURIComponent(filename)
			} catch (err) { }
			if (!encoding) encoding = siteEncodingForURL(e.url)
			const filenameSequence = processURLEncoded(filename, encoding)
			if (filenameSequence) {
				const headerSuffix = `;filename*=${filenameSequence}`
				if (contentDispositionHeader) {
					if (!(/\s*\w+\s*/.exec(contentDispositionHeader.value || '')))
						return {}
					contentDispositionHeader.value += headerSuffix
				} else {
					e.responseHeaders.push({
						name: 'Content-Disposition',
						value: 'inline' + headerSuffix,
					})
				}
				return { responseHeaders: e.responseHeaders }
			}
		}
		return {}
	}, { urls: ["<all_urls>"], types: ['main_frame', 'sub_frame'] },
		["blocking", "responseHeaders"])
}()