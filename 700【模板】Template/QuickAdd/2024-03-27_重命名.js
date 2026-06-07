/*
 * @Author: 熊猫别熬夜 
 * @Date: 2024-03-27 11:51:21 
 * @Last Modified by: 熊猫别熬夜
 * @Last Modified time: 2026-03-14 12:12:53
 */
const path = require('path');
const quickAddApi = app.plugins.plugins.quickadd.api;
module.exports = async (params) => {
  let file = app.workspace.getActiveFile();
  if (!file) return;

  let selection = "";
  let editor = null;

  // 尝试获取编辑器和选中文本
  if (app.workspace.activeEditor && app.workspace.activeEditor.editor) {
    editor = app.workspace.activeEditor.editor;
    try {
      const line = editor.getLine(editor.getCursor().line);
      selection = editor.getSelection() ? editor.getSelection() : line;
    } catch (error) {
      console.log("无法从编辑器获取选择:", error);
    }
  }

  // 如果在阅读模式或编辑器中没有选择，尝试获取全局选择
  if (!selection) {
    selection = window.getSelection().toString();
  }

  if (selection) {
    // !如果为标题
    const regex = /^(#+)\s(.*)/;
    const matches = selection.match(regex);
    if (matches && editor) {
      // 重命名小标题 (仅在编辑模式下有效)
      app.commands.executeCommandById('editor:rename-heading');
      return;
    }

    // !如果为wiki链接
    let selectionEmbed = matchSelectionEmbed(selection);
    if (selectionEmbed) {
      const files = app.vault.getFiles();
      const wikiPath = getFilePath(files, selectionEmbed); // 匹配Wiki链接
      if (wikiPath) {
        let newName = "";
        if (wikiPath.endsWith('.excalidraw.md')) {
          newName = await quickAddApi.inputPrompt(`🗳重命名嵌入的Excalidraw文件`, null, path.basename(wikiPath).replace(".excalidraw.md", ""), "");
          if (!newName) return;
          newName = newName + ".excalidraw";
        } else {
          newName = await quickAddApi.inputPrompt(`🗳重命名嵌入的${path.extname(wikiPath)}文件`, null, path.basename(wikiPath).replace(path.extname(wikiPath), ""), "");
        }
        if (!newName) return;
        newName = newName.replace(/\s+/g, " ");
        await app.fileManager.renameFile(app.vault.getAbstractFileByPath(wikiPath), `${path.dirname(wikiPath)}/${newName}${path.extname(wikiPath)}`);
        return;
      } else {
        new Notice(`❌未找到文件: ${selectionEmbed}`);
      }
    };
  }
  // !最终重命名文件
  let newName = "";

  if (String(file.basename).endsWith('.excalidraw')) {
    newName = await quickAddApi.inputPrompt(`🎨重命名Excalidraw文件`, null, String(file.basename).replace(".excalidraw", ""), "");
    if (!newName) return;
    newName = newName + ".excalidraw";
    copyToClipboard(newName);
  } else {
    newName = await quickAddApi.inputPrompt('📄重命名当前文档', null, String(file.basename));
    if (!newName) return;
    copyToClipboard(newName);
  }
  // 2024-04-23_17:16:53 优化一下，合并多余空格
  newName = newName.replace(/\s+/g, " ");
  await app.fileManager.renameFile(file, `${file.parent.path}/${newName}.${file.extension}`);

  // 2024-06-21_22-56 检测相同路径下是否存在同名的不同后缀文件，连带一起重命名

  return;
};
function matchSelectionEmbed(text) {
  const regex = /\[\[?([^\]]{2,100}?)(\|.*)?\]\]?\(?([^)\n]*)\)?/;
  const matches = text.match(regex);
  if (!matches) return;
  if (matches[3]) return decodeURIComponent(matches[3]);
  if (matches[1]) return decodeURIComponent(matches[1]);
}

function getFilePath(files, baseName) {
  let files2 = files.filter(f => path.basename(f.path).replace(".md", "") === path.basename(baseName).replace(".md", ""));
  let filePath = files2.map((f) => f.path);
  return filePath[0];
}

function copyToClipboard(extrTexts) {
  const txtArea = document.createElement('textarea');
  txtArea.value = extrTexts;
  document.body.appendChild(txtArea);
  txtArea.select();
  if (document.execCommand('copy')) {
    console.log('copy to clipboard.');
  } else {
    console.log('fail to copy.');
  }
  document.body.removeChild(txtArea);
}
