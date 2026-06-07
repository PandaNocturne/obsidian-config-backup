/*
 * @Author: 熊猫别熬夜 
 * @Date: 2024-06-13 07:04:22 
 * @Last Modified by: 熊猫别熬夜
 * @Last Modified time: 2025-08-01 14:53:45
*/

module.exports = {
  entry: async (QuickAdd, settings, params) => {
    // 获取默认配置
    const fs = require('fs');
    const path = require('path');
    // 获取库的基本路径
    const basePath = (app.vault.adapter).getBasePath();

    // 日期格式
    const dateFormat = settings["归档日期格式(date format)"].replace("{{DATE:", "").replace("}}", "");

    // 获取设置的指定附件文件夹路径：
    // const assetsPath = "900【素材】Assets/910_ObsidianAssets";
    let assetsPath = await app.vault.config.attachmentFolderPath;
    if (settings["自定义文件夹路径(custom folder path)"]) {
      assetsPath = settings["自定义文件夹路径(custom folder path)"];
    }

    const assetsPathFull = basePath + "/" + assetsPath;
    console.log(assetsPathFull);

    // 获取该路径下所有附件：
    const assetsList = fs.readdirSync(assetsPathFull).filter(file => {
      const ext = path.extname(file).toLowerCase();
      // 使用正则表达式来匹配文件扩展名：
      // 如果 settings["文件类型(file type)"] 为空值，则匹配所有文件类型
      const regexMatch = new RegExp("\\.(" + (settings["文件类型(file type)"] || ".+") + ")$", "i");
      return regexMatch.test(ext);
    }).map(file => assetsPath + "/" + file);

    console.log(assetsList);

    // 批量获取创建日期并用ob的API移动附件
    for (const filePath of assetsList) {
      try {
        const ctime = await app.vault.getAbstractFileByPath(filePath).stat["ctime"];
        const formattedDatePath = assetsPath + "/" + moment(ctime).format(dateFormat);
        console.log(formattedDatePath);
        try {
          if (!await app.vault.getFolderByPath(formattedDatePath)) {
            await app.vault.createFolder(formattedDatePath);
          }
        } catch (folderErr) {
          console.warn(`创建文件夹失败，已跳过: ${formattedDatePath}`, folderErr);
          continue; // 跳过本次循环
        }

        // ! 2024-08-17_00-53 修改附件名称
        // const attachmentDateFormat = "YYYYMMDDhhmmssSSS";
        const destinationPath = path.join(formattedDatePath, path.basename(filePath));
        // const destinationPath = path.join(formattedDatePath, `File-${moment(ctime).format(attachmentDateFormat)}${path.extname(filePath).toLowerCase()}`);
        try {
          await app.fileManager.renameFile(app.vault.getAbstractFileByPath(filePath), destinationPath);
        } catch (moveErr) {
          console.warn(`移动文件失败，已跳过: ${filePath} -> ${destinationPath}`, moveErr);
          continue; // 跳过本次循环
        }
      } catch (err) {
        console.warn(`处理文件时出错，已跳过: ${filePath}`, err);
        continue; // 跳过本次循环
      }
    }
    new Notice(`🔊${assetsList.length}个附件归档已完成`);
  },
  settings: {
    name: "按创建时间归档Obsidian附件",
    author: "熊猫别熬夜",
    options: {
      "自定义文件夹路径(custom folder path)": {
        type: "text",
        defaultValue: "",
        description: "如果为空则为Obsidian默认附件存放路径"
      },
      "归档日期格式(date format)": {
        type: "format",
        defaultValue: "{{DATE:YYYY/YYYY-MM/YYYY-MM-DD}}",
        description: "如果想以文件类型分类，可以配置{{DATE:[图形文件]YYYY/YYYY-MM-DD}}、{{DATE:[视频文件]YYYY/YYYY-MM-DD}}",
      },
      "文件类型(file type)": {
        type: "text",
        defaultValue: "png|jpe?g|webp|gif|mp[34]|pdf",
        description: "文件后缀类型，不同类型用|分隔，不区分大小写，如果为空值则默认全部附件。"
      }
    }
  }
};