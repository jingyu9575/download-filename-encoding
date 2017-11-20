# Download Filename Encoding

**Update**: It now works in Developer Edition 58b4 and Nightly 2017-11-20.

**Note**: this extension does not work with the latest Nightly as of 2017-09-14, because firefox does not give the filename information to extensions when the encoding is wrong. The builds before 2017-09-07 work. I've filed bug 1399472 in Firefox's bug tracker.

Legacy websites sometimes provide filenames of downloads without character encoding information, so Firefox cannot decode them correctly and give you incorrect, unreadable filenames. This extension tries to fix this problem by setting a default encoding for download filenames.

After installing you can configure this extension by clicking Preferences of it in the Add-ons Manager. Set the default encoding in the "Encoding" text box, which is often the standard encoding of your country/language (e.g. "GBK" for Chinese). Check "Detect UTF-8" to try UTF-8 (international standard encoding) first and fall back to the encoding above. Check "Detect percent encoding" to fix filenames that are percent encoded e.g. %20%20.

Permissions:
* Access your data for all websites. It is required to modify download filenames for all websites. This extension does not store or upload your browsing data.
