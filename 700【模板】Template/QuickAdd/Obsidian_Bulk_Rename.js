const path = require("path");
// 在Obsidian中导入QuickAdd的API
const quickaddApi = app.plugins.plugins.quickadd.api;

module.exports = {
    entry: async (QuickAdd, settings, params) => {
        // 输入界面
        const oldFileNames = await quickaddApi.wideInputPrompt("🟢原文件名", "注意文件路径必须要有后缀");
        if (!oldFileNames) return;
        const newFileNames = await quickaddApi.wideInputPrompt("🟡新文件名", "注意文件路径必须要有后缀");

        let oldFileNamesArray = oldFileNames.split("\n");
        let newFileNamesArray = newFileNames.split("\n");

        // 获取库的基本路径
        const basePath = (app.vault.adapter).getBasePath().replace(/\\/g, '/');
        //  转义路径中的反斜杠为斜杠 去除数组中包含库的基本路径
        oldFileNamesArray = oldFileNamesArray.map(fileName => fileName.replace(/\\/g, '/').replace(`${basePath}/`, ''));
        newFileNamesArray = newFileNamesArray.map(fileName => fileName.replace(/\\/g, '/').replace(`${basePath}/`, ''));
        if (oldFileNamesArray.length !== newFileNamesArray.length) return;

        const changeItems = oldFileNamesArray.map((oldFileName, index) => {
            const oldFileNameWithoutPath = path.basename(oldFileName);
            const newFileNameWithoutPath = path.basename(newFileNamesArray[index]);
            return `${oldFileNameWithoutPath}⏩${newFileNameWithoutPath}`;
        });

        // 重新检查一下
        let selectedItems = [];
        selectedItems = await quickaddApi.checkboxPrompt(changeItems, changeItems);
        if (!selectedItems) return;
        console.log(selectedItems);

        const selectedIndexes = selectedItems.map(item => {
            const oldFileNameWithoutPath = item.split('⏩')[0];
            return oldFileNamesArray.findIndex(newFileName => path.basename(newFileName) === oldFileNameWithoutPath);
        }).filter(index => index !== -1);

        console.log(selectedIndexes);

        oldFileNamesArray = selectedIndexes.map(index => oldFileNamesArray[index]);
        newFileNamesArray = selectedIndexes.map(index => newFileNamesArray[index]);

        let changeOldFiles = [];
        let changeNewFiles = [];
        // 记录报错的文档路径到 bugFilePaths
        let bugFilePaths = [];

        for (let i = 0; i < oldFileNamesArray.length; i++) {
            const oldFileName = oldFileNamesArray[i];
            const newFileName = newFileNamesArray[i];
            console.log([oldFileName, newFileName]);
            if (oldFileName === newFileName) continue;
            // 如果app.fileManager.renameFile报错请continue，并报出 oldFileName 以及对应的错误，应该是库中文件名有重复的了
            try {
                await app.fileManager.renameFile(app.vault.getAbstractFileByPath(oldFileName), newFileName);
                changeOldFiles.push(oldFileName);
                changeNewFiles.push(newFileName);
            } catch (error) {
                new Notice(`❌${oldFileName}重命名出现错误，已记录到Log\n\n${error}\n\n`);
                bugFilePaths.push(oldFileName);
                continue;
            }
        }

        // 生成记录的markdown的RenameChangeLog.md，记录到 bugFilePaths
        const timstamp = quickaddApi.date.now("YYYY-MM-DD_HH-mm");
        const logContent = `## ${timstamp}\n\n### ❌bugFilePaths\n\n\`\`\`\n${bugFilePaths.join("\n")}\n\`\`\`\n\n### 🕓oldFilePaths\n\n\`\`\`\n${changeOldFiles.join("\n")}\n\`\`\`\n\n### ♻newFilePaths\n\n\`\`\`\n${changeNewFiles.join("\n")}\n\`\`\`\n\n`;

        // ! 配置RenameChangeLo路径
        let renameLogPath = settings["RenameChangeLogPath"];
        let file = app.vault.getAbstractFileByPath(renameLogPath);
        if (file) {
            await app.vault.append(file, logContent);
        } else {
            await app.vault.create(renameLogPath, logContent);
        }
        new Notice("✅替换完成");
    },
    settings: {
        name: "Obsidian-Bulk-Rename",
        author: "熊猫别熬夜",
        options: {
            "RenameChangeLogPath": {
                type: "text",
                defaultValue: "RenameChangeLog.md",
                description: "设置批量重命名修改记录文件路径，嵌套文件夹请用/符号",
            },
        }
    },
};