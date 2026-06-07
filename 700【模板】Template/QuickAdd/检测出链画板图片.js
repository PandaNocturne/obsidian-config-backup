const outputFileName = "Y-图形文件存储/Excalidraw图形/Excalidraw.Outline.md";
// 获取当前笔记的路径
let markdownFile = app.vault.getAbstractFileByPath(outputFileName);
if (markdownFile) {
    app.vault.modify(markdownFile, "");
} else {
    app.vault.create(outputFileName, "");
}

// 获取笔记的基本路径
const filePath = app.workspace.getActiveFile().path;
const path = require('path');
const { off } = require('process');

// 获取库的基本路径
const basePath = (app.vault.adapter).getBasePath()

const fs = require('fs');
const mdText = fs.readFileSync(`${basePath}/${filePath}`, 'utf8');

const regexMdLink = /\[\[.*?]]/g;
const matchesMdLink = mdText.match(regexMdLink);

const regexCanvasLinks = /"file":"(.*?\.md)"/g;
const matchesCanvasLinks = mdText.match(regexCanvasLinks)?.map(match => match.slice(8, -1)) || [];

let outputCanvas = [];
for (i of matchesCanvasLinks) {
    outputCanvas.push(`[[${i}]]`);
}

const filteredMatches = matchesMdLink ? matchesMdLink.filter(match => !match.includes('.png') && !match.includes('.jpg')) : matchesCanvasLinks ? outputCanvas : ["无匹配项"];

let outputLinks = [];
for (i of filteredMatches) {
    outputLinks.push(`- ${i}`);
}
// 设定一些yaml，特别定义csscalss好修改
let outlineYaml = "";
outlineYaml = "---\ncssclasses:\n  - small-font\n  - two-column-grid-list\n---\n";
let outputText = outlineYaml + outputLinks.join("\n");

if (markdownFile) {
    app.vault.modify(markdownFile, outputText);
} else {
    app.vault.create(outputFileName, outputText);
}
