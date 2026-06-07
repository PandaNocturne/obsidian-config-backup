const fs = require('fs');
const path = require('path');
const folderPath = (app.vault.adapter).getBasePath();

module.exports = {
    entry: async (QuickAdd, settings, params) => {
        const folderMindPath = settings["folderMindPath"];
        const maxDepth = Number(settings["maxDepth"]);
        const level = Number(settings["level"]);
        const ignoreFolders = settings["ignoreFolders"].split(',');
        console.log(ignoreFolders);
        const ignoreSubfoldersList = settings["ignoreSubfoldersList"].split(',');
        console.log(ignoreSubfoldersList);
        const listPaths = traverseFolder(folderPath, '', ignoreFolders, ignoreSubfoldersList, maxDepth);
        // console.log(listPaths);

        // 设定固定Yaml
        // 根据主题生成配色
        const currentMode = app.vault.config.theme;
        let mindmapTheme = "cold";
        if (currentMode !== "obsidian") {
            mindmapTheme = "warm";
        }

        const markmindYaml = `---\nmindmap-plugin: basic\nmindmap-theme: ${mindmapTheme}\ndisplay-mode: mind\n---\n`;
        const text = markmindYaml + `# FolderMind\n` + listPaths.join("\n");

        let mindFile = app.vault.getAbstractFileByPath(folderMindPath);

        if (mindFile) {
            app.vault.modify(mindFile, text);
        } else {
            mindFile = app.vault.create(folderMindPath, text);
        }
        app.workspace.activeLeaf.openFile(mindFile);
        // await app.workspace.activeLeaf.rebuildView();
        new Notice("文件夹导图生成成功！");

        setTimeout(() => {
            try {
                app.commands.executeCommandById(`obsidian-markmind:Expand to node level ${level}`);
            } catch (error) {
                console.log(error);
            }
        }, 1000);


    },
    settings: {
        name: "Tree Folder Mind",
        author: "熊猫别熬夜",
        options: {
            "folderMindPath": {
                type: "text",
                defaultValue: "FolderNote.markmind.md",
                placeholder: "相对路径",
                description: "设置文件夹导图路径，可以嵌套子文件夹",
            },
            "maxDepth": {
                type: "dropdown",
                defaultValue: 3,
                options: [1, 2, 3, 4, 5, 6],
                description: "设置挖掘文件夹的深度",
            },
            "level": {
                type: "dropdown",
                defaultValue: 2,
                options: [1, 2, 3, 4, 5],
                description: "设置mind默认展开的深度",
            },
            "ignoreFolders": {
                type: "text",
                defaultValue: "@【熊阿莫】赞美太阳！",
                placeholder: "忽略文件夹",
                description: "设置忽略文件夹，多个用逗号隔开"
            },
            "ignoreSubfoldersList": {
                type: "text",
                defaultValue: "900【素材】Assets,510_Bookxnote库,700【模板】Template,550_CodeSnippet,540_图形文件存储",
                description: "忽略某个文件夹下的子文件夹，即不展开，多个用逗号隔开"
            }
        }
    }
};

function traverseFolder(folderPath, indent = '', ignoreFolders = [], ignoreSubfoldersList = [], maxDepth = 4, currentDepth = 1, listPaths = []) {
    if (currentDepth > maxDepth) {
        return listPaths;
    }
    const files = fs.readdirSync(folderPath);

    files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory() && !file.startsWith('.') && !ignoreSubfoldersList.some(folder => filePath.includes(folder + "\\")) && !ignoreFolders.includes(file)) {
            const fileName = path.basename(filePath);
            const mocFile = `${filePath}/${fileName}.md`;
            let mocNote = fs.existsSync(mocFile);
            let listPath = "";
            if (mocNote) {
                listPath = indent + '- [[' + file + ']]';
            } else {
                listPath = indent + "- " + file;
            }
            console.log(listPath);
            listPaths.push(listPath);

            listPaths = traverseFolder(filePath, indent + '  ', ignoreFolders, ignoreSubfoldersList, maxDepth, currentDepth + 1, listPaths);
        }
    });
    return listPaths;
}

