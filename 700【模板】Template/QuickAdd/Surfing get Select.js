selObj = window.getSelection()
text = selObj.toString()
text = await decodeURIComponent(text)
this.quickAddApi.utility.setClipboard(text)

return text
