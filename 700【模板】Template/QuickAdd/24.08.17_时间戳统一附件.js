/*
 * @Author: 熊猫别熬夜 
 * @Date: 2024-08-17 00:49:04 
 * @Last Modified by: 熊猫别熬夜
 * @Last Modified time: 2025-08-17 23:35:53
 */

// 导入所需模块
const path = require('path');
const files = app.vault.getFiles();
// 获取当前活动文件和缓存的元数据
const file = app.workspace.getActiveFile();
const cachedMetadata = app.metadataCache.getFileCache(file);
let listPaths = app.vault.getAllFolders().map(f => f.path);
listPaths.unshift("/");

// 导出异步函数
module.exports = async () => {
  let links = [];
  let embeds = [];
  // 提取链接和嵌入的文件
  if (cachedMetadata.links) {
    links = cachedMetadata.links.map(l => l.link);
  }
  if (cachedMetadata.embeds) {
    embeds = cachedMetadata.embeds.map(e => e.link);
  }

  let allLinks = [...links, ...embeds];
  console.log(allLinks);
  // 获取所有文件和链接文件路径
  let linkFilePaths = [];
  for (let i = 0; i < allLinks.length; i++) {
    const link = allLinks[i];
    const filePath = getFilePath(files, link);
    if (filePath) {
      linkFilePaths.push(filePath);
    }
  };
  console.log(linkFilePaths);
  // 检查链接文件是否在同一文件夹中
  const activefile = app.workspace.getActiveFile();
  console.log(activefile);
  // 筛选出附件
  const attachmentTypes = ['png', "jpg", 'jpeg', 'avif', 'gif', 'webp', 'mp4', 'bmp', 'tif'];
  const attachments = linkFilePaths.filter(link => attachmentTypes.some(type => link.endsWith('.' + type)));
  // 移动文件到附件文件夹
  const attachmentFolder = await app.vault.config.attachmentFolderPath;
  const attachmentDateFormat = "YYYYMMDDhhmmssSSS";
  for (let i = 0; i < attachments.length; i++) {
    const oldFilePath = attachments[i];
    console.log(`oldFilePath:${oldFilePath}`);
    const oldFile = app.vault.getAbstractFileByPath(oldFilePath);
    const ctime = await oldFile.stat["ctime"];
    const ext = path.extname(oldFilePath).toLowerCase();
    const regex = new RegExp(`File-\\d{17}${ext}`);
    // 已经符合格式的直接跳过，避免重复重命名
    if (regex.test(path.basename(oldFilePath))) {
      console.log(`文件名已符合格式，跳过: ${oldFilePath}`);
      continue;
    }

    const baseName = `File-${moment(ctime).format(attachmentDateFormat)}`;
    const normalizePath = (p) => p.replace(/\\/g, '/'); // Obsidian 路径统一为正斜杠
    let newFilePath = normalizePath(path.join(attachmentFolder, `${baseName}${ext}`));
    let suffix = 1;
    // 如果存在同名文件，则在末尾追加递增后缀保证唯一且稳定
    while (app.vault.getAbstractFileByPath(newFilePath)) {
      newFilePath = normalizePath(path.join(attachmentFolder, `${baseName}-${suffix}${ext}`));
      suffix += 1;
    }
    console.log(`rename to: ${newFilePath}`);
    await app.fileManager.renameFile(oldFile, newFilePath);
  }
  new Notice("✅已重命名");
};

// 获取文件路径函数
function getFilePath(files, baseName) {
  let files2 = files.filter(f => path.basename(f.path).replace(".md", "") === path.basename(baseName).replace(".md", ""));
  let filePath = files2.map((f) => f.path);
  return filePath[0];
}

function matchSelectionEmbed(text) {
  const regex = /\[\[?([^\]]*?)(\|.*)?\]\]?\(?([^)\n]*)\)?/;
  const matches = text.match(regex);
  if (!matches) return;
  if (matches[3]) return decodeURIComponent(matches[3]);
  if (matches[1]) return decodeURIComponent(matches[1]);
};