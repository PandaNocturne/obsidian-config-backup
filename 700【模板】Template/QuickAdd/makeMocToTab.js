const outputFileName = "Y-图形文件存储/Excalidraw图形/Obsidian.MOC.md";
// 获取当前笔记的路径
let markdownFile = app.vault.getAbstractFileByPath(outputFileName);

// // 清空文件夹
// if (markdownFile) {
//     app.vault.modify(markdownFile, "");
// } else {
//     app.vault.create(outputFileName, "");
// }

// 获取笔记的基本路径
const filePath = app.workspace.getActiveFile().path;
const path = require("path");


// 拆分filePath的路径
const filePaths = getFilePaths(filePath);
console.log(filePaths);

// 生成对应的Root文本

// FolderNote的设置
const folderNoteConfig = {
	folderPath: "",
	title: "Folder overview",
	showTitle: false,
	depth: 2,
	style: "list", // list、explorer
	includeTypes: ["folder", "markdown", "canvas"],
	disableFileTag: false,
	sortBy: "name",
	sortByAsc: true,
	showEmptyFolders: true,
	onlyIncludeSubfolders: false,
	storeFolderCondition: true,
	showFolderNotes: false,
};

let rootConfigs = [];

for (let filePath of filePaths) {
	folderNoteConfig.folderPath = filePath;
	folderNoteConfig.title = path.basename(filePath);
	// 将Object转文本，同时防止Obeject的引用。
	rootConfigs.push(convertConfigToText(folderNoteConfig));
};

const numRoot = rootConfigs.length;

let tabsList = [];
let lastPath = "";

for (let i = 0; i < numRoot; i++) {
	if (i >= 0) {
		// 当文件层次大于2时，第3个tab为当前文件所在的
		lastPath = filePaths.pop();
		tabsList.push(`tab:${lastPath.split("/").pop()}\n\n\`\`\`folder-overview\n${rootConfigs.pop()}\`\`\`\n`);
		break;
	} else {
		lastPath = filePaths[i].split('/').pop();
		tabsList.push(`tab:${lastPath}\n\n\`\`\`folder-overview\n${rootConfigs[i]}\`\`\`\n`);
	}
}

// 判断是否存在Folder文件
const fileName = path.basename(path.dirname(filePath));
const mocFile = `${path.dirname(filePath)}/${fileName}.md`;
let mocNote = app.vault.getAbstractFileByPath(mocFile);

// if (mocNote) {
// 	// 如果存在Folder文件，写入tab页面
// 	tabsList.push(`tab:MOC\n\n> [!example]+ [[${fileName}]]\n> ![[${fileName}]]`)
// }

let tabText = tabsList.join('\n');
let fileEmed = "";

fileEmed = `\`\`\`\`tab\n${tabText}\n\`\`\`\``;


// copyToClipboard(fileEmed)

// 设定一些yaml，特别定义csscalss好修改
let outlineYaml = "";
outlineYaml = "---\ncssclasses:\n  - small-font\n---\n\n";
let outputText = outlineYaml + fileEmed;

if (markdownFile) {
	app.vault.modify(markdownFile, outputText);
} else {
	app.vault.create(outputFileName, fileEmoutputTexted);
}


let QuickAdd;
module.exports = {}

// 把获取的文件路径拆分，不包含文件名。
function getFilePaths(filePath) {
	const paths = filePath.split("/");
	const filePaths = [];
	let currentPath = "";
	paths.forEach((path) => {
		currentPath += path;
		if (!path.includes(".")) {
			filePaths.push(currentPath);
			currentPath += "/";
		}
	});
	return filePaths;
}


// 将Object转文本，同时防止Obeject的引用。
function convertConfigToText(config) {
	let configText = "";
	for (const key in config) {
		if (Array.isArray(config[key])) {
			configText += `${key}:\n`;
			config[key].forEach((value) => {
				configText += `  - ${value}\n`;
			});
		} else {
			configText += `${key}: ${config[key]}\n`;
		}
	}
	return configText;
}

