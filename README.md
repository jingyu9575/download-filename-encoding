[![Mozilla Add-on](https://img.shields.io/amo/v/download-filename-encoding.svg?style=flat-square)](https://addons.mozilla.org/firefox/addon/download-filename-encoding/) [![Mozilla Add-on](https://img.shields.io/amo/d/download-filename-encoding.svg?style=flat-square)](https://addons.mozilla.org/firefox/addon/download-filename-encoding/)

# Download Filename Encoding

**Update**: It now works in Developer Edition 58b4 and Nightly 2017-11-20.

**Note**: this extension does not work with the latest Nightly as of 2017-09-14, because firefox does not give the filename information to extensions when the encoding is wrong. The builds before 2017-09-07 work. I've filed bug 1399472 in Firefox's bug tracker.

Firefox extension to set the character encoding of download filenames.

Legacy websites sometimes provide filenames of downloads without character encoding information, so Firefox cannot decode them correctly and give you incorrect, unreadable filenames. This extension tries to fix this problem by setting a default encoding for download filenames.

After installing you can configure this extension by clicking Preferences/Options of it in the Add-ons Manager. Set the default encoding in the "Encoding" text box, which is often the standard encoding of your country/language (e.g. "GBK" for Chinese). Check "Detect UTF-8" to try UTF-8 (international standard encoding) first and fall back to the encoding above. Check "Detect percent encoding" to fix filenames that are percent encoded e.g. %20%20.

Permissions:
* Access your data for all websites. It is required to modify download filenames for all websites. This extension does not store or upload your browsing data.

---

# 下载文件名编码

设置下载文件名编码的火狐扩展。

一些旧网站的下载没有提供文件名的字符编码，导致火狐保存的文件名为乱码。这个扩展通过设置默认的编码来解决此问题。

安装后在附加组件管理器单击这个扩展的选项按钮进行设置。在“编码”中输入默认的编码，通常是所在国家/语言的标准编码（如简体中文对应GBK）。选中“检测 UTF-8”可以先尝试UTF-8编码（国际标准）再尝试上面设置的编码。选中“检测百分号编码”可以修复如%20%20的百分号编码文件名。

权限：
* 存取您用于所有网站的数据：用于修改所有网站的下载文件名。扩展不会记录或上传个人数据。
