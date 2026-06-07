const path = require('path');

// 获取Excalidraw默认模版路径
const excalidrawTemplatePath = (app.plugins.plugins["obsidian-excalidraw-plugin"].settings["templateFilePath"]).replace(/\.md/, "") + ".md";

module.exports = {
  entry: async (QuickAdd, settings, params) => {
    const quickAddApi = QuickAdd.quickAddApi;
    const file = app.workspace.getActiveFile();
    const regex = /\son\s\d{2}\-\d{2}\-\d{2}_\d{2}\.\d{2}(\.\d{2})?$/;
    const timeFormat = "[ on ]YY-MM-DD_HH.mm.ss";

    const fileName = file.basename.replace(regex, "").replace(/\.excalidraw$/, "");
    let fileExt = file.extension;
    const fileDir = path.dirname(file.path);

    let newFileName = "";
    const options = [`📝笔记：${fileName}.md`, `🎨画板：${fileName}.excalidraw`, `💠白板：${fileName}.canvas`, `📅备份：${file.basename.replace(regex, "") + window.moment().format(timeFormat)}.${fileExt}`];
    const select = await quickAddApi.suggester(options, options);
    if (!select) return;

    if (fileName !== path.basename(fileDir) && select != options[3] && select != options[2]) {
      const folderPath = fileDir + "/" + fileName;
      const isCreat = await quickAddApi.yesNoPrompt("是否创建FolderNote？", `未检测到📁【${folderPath}】文件夹，该脚本需要在Foldernote的结构下创建文档副本，是否自动创建？`);
      if (!isCreat) return;
      console.log(folderPath);
      // 直接的./不识别，最好加上.replace(/^\.\//,"")
      const isFolderNote = await app.vault.getFolderByPath(folderPath.replace(/^\.\//, ""));
      console.log(isFolderNote);
      if (!isFolderNote) {
        await app.vault.createFolder(folderPath);
      }
      const destinationPath = path.join(folderPath, file.basename.replace(regex, "") + "." + fileExt);
      await app.fileManager.renameFile(app.vault.getAbstractFileByPath(file.path), destinationPath);

      new Notice(`已构建FolderNote结构！`);
      return;
    }

    let content = "";
    // 🎨Excalidraw
    if (select === options[1]) {
      fileExt = "md";
      newFileName = `${fileName}.excalidraw`;
      const newFilePath = `${fileDir}/${newFileName}.${fileExt}`;
      const existFile = app.vault.getAbstractFileByPath(newFilePath);
      if (existFile) {
        await app.workspace.activeLeaf.openFile(existFile);
        return;
      }
      const file = await app.vault.getAbstractFileByPath(excalidrawTemplatePath);
      content = await app.vault.read(file);
    }
    // 💠Canvas
    else if (select === options[2]) {
      fileExt = "canvas";
      newFileName = `${fileName}`;
      const newFilePath = `${fileDir}/${newFileName}.${fileExt}`;
      const existFile = app.vault.getAbstractFileByPath(newFilePath);
      if (existFile) {
        await app.workspace.activeLeaf.openFile(existFile);
        return;
      }
      content = await convertMdToCanvas(file, quickAddApi, settings);
    }
    // 📄主笔记
    else if (select === options[0]) {
      fileExt = "md";
      newFileName = `${fileName}`;
      const newFilePath = `${fileDir}/${newFileName}.${fileExt}`;
      const existFile = app.vault.getAbstractFileByPath(newFilePath);
      if (existFile) {
        await app.workspace.activeLeaf.openFile(existFile);
        return;
      }
      content = "";
    }
    // 📅备份
    else {
      let fileExt = file.extension;
      // const file = await app.vault.getAbstractFileByPath(excalidrawTemplatePath);
      content = await app.vault.read(file);
      if (/\.excalidraw$/.test(file.basename.replace(regex, ""))) {
        newFileName = fileName + ".excalidraw" + window.moment().format(`${timeFormat}`);
      } else if (file.extension === "canvas") {
        fileExt = "canvas";
        newFileName = fileName + window.moment().format(`${timeFormat}`);
      } else {
        newFileName = fileName + window.moment().format(`${timeFormat}`);
      }
      const isCreat = await quickAddApi.yesNoPrompt("是否备份副本？", `是否备份为【${newFileName}.${fileExt}】，这样的文件往往是冗余的......`);
      if (!isCreat) return;
    }
    const newFilePath = `${fileDir}/${newFileName}.${fileExt}`;
    console.log(newFilePath);
    let newFile = app.vault.getAbstractFileByPath(newFilePath);
    if (!newFile) {
      newFile = await app.vault.create(newFilePath, content);
      // if (select === options[3]) return;
      await app.workspace.activeLeaf.openFile(newFile);
      await app.workspace.activeLeaf.rebuildView();
      return;
    }
    await app.workspace.activeLeaf.openFile(newFile);
  },
  settings: {
    name: "Switch Copy Settings",
    author: "熊猫别熬夜",
    options: {
      "level": {
        type: "text",
        defaultValue: "2",
        description: "上次选择的标题级别",
      },
      "columns": {
        type: "text",
        defaultValue: "5",
        description: "上次选择的每行卡片数",
      },
      "space": {
        type: "text",
        defaultValue: "100",
        description: "上次选择的卡片间隔",
      },
      "width": {
        type: "text",
        defaultValue: "1080",
        description: "卡片宽度",
      },
      "height": {
        type: "text",
        defaultValue: "600",
        description: "卡片高度",
      }
    }
  }
};


// 第一次转换Canvas会平铺主笔记

async function convertMdToCanvas(file, quickAddApi, settings) {
  // 默认参数
  const savedWidth = Number(settings["width"]) || 1080;
  const savedHeight = Number(settings["height"]) || 600;
  const space = Number(settings["space"]) || 100;
  const savedLevel = Number(settings["level"]) || 0;
  const savedColumns = Number(settings["columns"]) || 5;

  const fileContent = await app.vault.read(file);
  const headingRegex = /^#+\s/gm;
  let match;
  const levels = new Set();
  while ((match = headingRegex.exec(fileContent)) !== null) {
    levels.add(match[0].trim().length);
  }

  const sortedLevels = Array.from(levels).sort();
  if (sortedLevels.length === 0) {
    new Notice("该笔记中没有标题！");
    return JSON.stringify({ nodes: [], edges: [] });
  }

  // 使用 suggester 模拟一个简单的参数配置 Modal
  let selectedLevel = savedLevel && sortedLevels.includes(savedLevel) ? savedLevel : sortedLevels[0];
  let columns = savedColumns;
  let currentSpace = space;
  let width = savedWidth;
  let height = savedHeight;

  while (true) {
    const options = [
      `📌 标题级别: H${selectedLevel}`,
      `🔢 每行卡片: ${columns}`,
      `📏 卡片间隔: ${currentSpace}`,
      `📐 卡片宽度: ${width}`,
      `📐 卡片高度: ${height}`,
      "🚀 开始转换",
      "❌ 取消"
    ];

    const select = await quickAddApi.suggester(options, options);
    if (!select || select === options[6]) return JSON.stringify({ nodes: [], edges: [] });

    if (select === options[0]) {
      const levelStr = await quickAddApi.suggester(
        sortedLevels.map(l => `H${l}`),
        sortedLevels.map(l => l.toString())
      );
      if (levelStr) selectedLevel = parseInt(levelStr);
    } else if (select === options[1]) {
      const colStr = await quickAddApi.inputPrompt("请输入列数", columns.toString());
      if (colStr) columns = parseInt(colStr) || 5;
    } else if (select === options[2]) {
      const spaceStr = await quickAddApi.inputPrompt("请输入卡片间隔", currentSpace.toString());
      if (spaceStr) currentSpace = parseInt(spaceStr) || 100;
    } else if (select === options[3]) {
      const widthStr = await quickAddApi.inputPrompt("请输入卡片宽度", width.toString());
      if (widthStr) width = parseInt(widthStr) || 1080;
    } else if (select === options[4]) {
      const heightStr = await quickAddApi.inputPrompt("请输入卡片高度", height.toString());
      if (heightStr) height = parseInt(heightStr) || 600;
    } else if (select === options[5]) {
      // 保存参数到设置中
      settings["level"] = selectedLevel.toString();
      settings["columns"] = columns.toString();
      settings["space"] = currentSpace.toString();
      settings["width"] = width.toString();
      settings["height"] = height.toString();
      // 尝试保存 QuickAdd 设置以持久化
      if (app.plugins.plugins.quickadd) {
        await app.plugins.plugins.quickadd.saveSettings();
      }
      break;
    }
  }

  const canvasData = {
    nodes: [],
    edges: []
  };

  console.log("开始获取标题");
  const { heads, counts } = getHeadingsFromContent(fileContent, selectedLevel);
  console.log(heads);

  let nodes = [];
  let edges = [];
  const length = heads.length;

  for (let i = 0; i < length; i++) {
    const subpath = heads[i];
    const row = Math.floor(i / columns);
    const col = i % columns;

    const node = {
      id: generateStableId(file.path + subpath),
      type: "file",
      file: file.path,
      subpath: subpath,
      x: col * (width + currentSpace),
      y: row * (height + currentSpace),
      width: width,
      height: height,
    };

    console.log([subpath, node.x, node.y]);
    nodes.push(node);

    // ! 依次连接卡片
    // if (i > 0) {
    //   edges.push({
    //     id: generateStableId(nodes[i - 1].id + node.id),
    //     fromNode: nodes[i - 1].id,
    //     fromSide: "right",
    //     toNode: node.id,
    //     toSide: "left",
    //     styleAttributes: { "pathfindingMethod": "square" }
    //   });
    // }
  }
  canvasData.nodes = nodes;
  canvasData.edges = edges;
  const canvasJson = JSON.stringify(canvasData, null, 2);
  return canvasJson;
}

function getHeadingsFromContent(fileContent, level) {
  // 使用正则表达式提取指定级别的标题
  const regex = new RegExp(`^#{${level}}\\s(.+)`, 'gm');
  const heads = [];
  let head;
  let counts = [];

  while ((head = regex.exec(fileContent)) !== null) {
    heads.push("#" + head[1]);
    counts.push(head[0].match(/#/g).length);
  }
  return { heads, counts };
}

function generateStableId(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }

  // 使用两个不同的 seed 生成 16 位 hex
  let hex = Math.abs(hash).toString(16).padStart(8, '0');

  // 再来一轮混淆以补足 16 位
  let hash2 = 5381;
  for (let i = input.length - 1; i >= 0; i--) {
    const char = input.charCodeAt(i);
    hash2 = ((hash2 << 5) + hash2) + char;
  }
  hex += Math.abs(hash2).toString(16).padStart(8, '0');

  return hex.substring(0, 16);
}
