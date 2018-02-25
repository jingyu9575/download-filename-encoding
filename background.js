let settings = {}
let siteEncodings = new Map()

const encodingAbbreviations = {
	"UTF-8": "U-8", "IBM866": "866", "ISO-8859-2": "I-2", "ISO-8859-3": "I-3",
	"ISO-8859-4": "I-4", "ISO-8859-5": "I-5", "ISO-8859-6": "I-6",
	"ISO-8859-7": "I-7", "ISO-8859-8": "I-8", "ISO-8859-8-I": "I8I",
	"ISO-8859-10": "I10", "ISO-8859-13": "I13", "ISO-8859-14": "I14",
	"ISO-8859-15": "I15", "ISO-8859-16": "I16", "KOI8-R": "KOI",
	"KOI8-U": "K-U", "MACINTOSH": "MAC", "WINDOWS-874": "874",
	"WINDOWS-1250": "W-0", "WINDOWS-1251": "W-1", "WINDOWS-1252": "W-2",
	"WINDOWS-1253": "W-3", "WINDOWS-1254": "W-4", "WINDOWS-1255": "W-5",
	"WINDOWS-1256": "W-6", "WINDOWS-1257": "W-7", "WINDOWS-1258": "W-8",
	"X-MAC-CYRILLIC": "CYR", "GBK": "GBK", "GB18030": "GB1", "BIG5": "B-5",
	"EUC-JP": "JP", "ISO-2022-JP": "IJP", "SHIFT_JIS": "JIS", "EUC-KR": "KR",
	"UTF-16BE": "UBE", "UTF-16LE": "U16", "X-USER-DEFINED": "USR",
}

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

	await browser.menus.removeAll()

	// ASCII only (background page uses system encoding)
	// %EF%BC%8C is fullwidth comma
	const quickSwitchList = (settings.quickSwitchList || '')
		.split(new RegExp(decodeURIComponent('[,%EF%BC%8C\\s]'))).filter(s => s)
	let menuParentId = undefined
	for (const [i, encoding] of quickSwitchList.entries()) {
		if (quickSwitchList.length > browser.menus.ACTION_MENU_TOP_LEVEL_LIMIT &&
			i === browser.menus.ACTION_MENU_TOP_LEVEL_LIMIT - 1)
			menuParentId = browser.menus.create({
				contexts: ['browser_action'],
				title: browser.i18n.getMessage('moreEntries'),
			})
		browser.menus.create({
			contexts: ['browser_action'],
			parentId: menuParentId,
			title: encoding,
			onclick: async () => {
				await browser.storage.local.set({ encoding })
				await reloadSettings()
			},
			type: 'radio',
			checked: encoding.toLowerCase() === settings.encoding.toLowerCase(),
		})
	}

	void browser.browserAction.setBadgeBackgroundColor({ color: 'cornflowerblue' })
	let text = settings.encoding
	try {
		const key = new TextDecoder(settings.encoding).encoding.toUpperCase()
		if (encodingAbbreviations.hasOwnProperty(key))
			text = encodingAbbreviations[key]
	} catch (error) { }
	void browser.browserAction.setBadgeText({ text })
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
			const decoded = decodeURIComponent(s)
			if (decoded !== s)
				return `UTF-8''${encodeURIComponent(decoded)}`
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

browser.browserAction.onClicked.addListener(() => browser.runtime.openOptionsPage())

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