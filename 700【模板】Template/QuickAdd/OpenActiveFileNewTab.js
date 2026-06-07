// const file = this.app.workspace.getActiveFile();
// filePath = this.app.vault.adapter.getFullPath(file.path);
// let obLink = `obsidian://advanced-uri?vault=PandaNotes&filepath=${file.path}&newpane=true`;
// console.log(obLink);
// const { shell } = require('electron');

// shell.openExternal(obLink);

// 获取笔记的基本路径
const file = app.workspace.getActiveFile();
// console.log(file)
let tags = [];
// await app.fileManager.processFrontMatter(file,fm => {  
//   tags=fm.tags;
// })
// console.log(tags)

const activeFileCache = app.metadataCache.getFileCache(file);
tags = activeFileCache.frontmatter.tags;
console.log(tags);