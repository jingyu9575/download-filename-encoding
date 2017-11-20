for (const element of document.querySelectorAll('[data-i18n]'))
	element.innerText = browser.i18n.getMessage(element.dataset['i18n'])

const encodingInput = document.getElementById('encodingInput')
const detectUTF8Input = document.getElementById('detectUTF8Input')
const detectURLEncodedInput = document.getElementById('detectURLEncodedInput')

async function saveSettings() {
	await browser.storage.local.set({
		encoding: encodingInput.value,
		detectUTF8: detectUTF8Input.checked,
		detectURLEncoded: detectURLEncodedInput.checked,
	})
	await browser.runtime.sendMessage({ type: 'reloadSettings' })
}

void async function () {
	const settings = await browser.storage.local.get()
	encodingInput.value = settings.encoding || ''
	detectUTF8Input.checked = !!settings.detectUTF8
	detectURLEncodedInput.checked = !!settings.detectURLEncoded

	for (const node of document.getElementsByTagName('input'))
		node.addEventListener('change', saveSettings, false)

	encodingInput.placeholder = 
		await browser.runtime.sendMessage({ type: 'defaultEncoding' })
}()