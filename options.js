for (const element of document.querySelectorAll('[data-i18n]'))
	element.innerText = browser.i18n.getMessage(element.dataset['i18n'])

browser.runtime.sendMessage({ type: 'defaultEncoding' }).then(
	v => document.querySelector('[data-key=encoding]').placeholder = v)

for (const input of document.querySelectorAll('[data-key]')) {
	const key = input.dataset.key
	browser.storage.local.get(key).then(obj => {
		const value = obj[key]
		if (input.type === 'checkbox')
			input.checked = value
		else
			input.value = '' + (value == null ? '' : value)
	})
	input.addEventListener('change', async () => {
		if (!input.checkValidity()) return
		let value
		if (input.type === 'number')
			value = Number(input.value)
		else if (input.type === 'checkbox')
			value = input.checked
		else
			value = input.value
		await browser.storage.local.set({ [key]: value })
		await browser.runtime.sendMessage({ type: 'reloadSettings' })
	})
}
