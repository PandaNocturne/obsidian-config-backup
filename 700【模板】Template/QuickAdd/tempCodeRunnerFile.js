const folderPath = 'D:/PandaNotes';
const ignoreFolders = ['.git', '.Obsidian', "900【素材】Assets","510_Bookxnote库","@熊猫卡片笔记"]; // 忽略的文件夹列表
const maxDepth = 4; // 最大检索深度
traverseFolder(folderPath, '', ignoreFolders, maxDepth);