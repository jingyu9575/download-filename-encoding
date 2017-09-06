let settings = {}

async function reloadSettings() {
	settings = await browser.storage.local.get()
	settings.encoding = (settings.encoding || '').replace(/[^-_a-zA-Z0-9:]/g, '')
}

browser.runtime.onMessage.addListener(async message => {
	if (!message || typeof message !== 'object') return
	if (message.type === 'reloadSettings')
		await reloadSettings()
})

void async function () {
	await reloadSettings()

	browser.webRequest.onHeadersReceived.addListener(e => {
		if (!settings.encoding) return {}
		for (const h of e.responseHeaders) {
			if (h.name.toLowerCase() == 'content-disposition') {
				const match = /^\s*attachment;\s*filename=([^;]+|"[^"]+")\s*$/.exec(h.value)
				if (match) {
					let filename = match[1]
					if (filename.startsWith('"') && filename.endsWith('"'))
						filename = filename.slice(1, -1)
					let filenameSequence = settings.encoding + "''" +
						filename.replace(/[ -~]/g, encodeURIComponent)
					if (settings.detectUTF8) {
						try {
							const escapedFilename = escape(filename)
							decodeURIComponent(escapedFilename)
							filenameSequence = "UTF-8''" + escapedFilename
						} catch (err) { }
					}
					h.value = `attachment; filename*=${filenameSequence}`
				}
				return { responseHeaders: e.responseHeaders };
			}
		}
		return {}
	}, { urls: ["<all_urls>"] }, ["blocking", "responseHeaders"])
}()