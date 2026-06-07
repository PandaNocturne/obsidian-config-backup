const { exec } = require('child_process');
const path = require('path');

module.exports = {
    entry: async (QuickAdd, settings, params) => {
        // 获取笔记的基本路径
        const activeFile = app.workspace.getActiveFile();
        if (!activeFile) return;

        let filePath = activeFile.path;
        console.log(filePath);
        let fileFullPath = app.vault.adapter.getFullPath(filePath);

        // 如果有选中文本或光标所在行有嵌入文件，则获取所在的文件路径
        try {
            const editor = app.workspace.activeEditor.editor;
            // 选择所在的一行
            const line = editor.getLine(editor.getCursor().line);
            // 获取选中的文本否则自动获取当前行的文本
            const selection = editor.getSelection() ? editor.getSelection() : line;

            if (selection) {
                const files = app.vault.getFiles();
                let selectionEmbed = matchSelectionEmbed(selection);
                if (selectionEmbed) {
                    const foundPath = getFilePath(files, selectionEmbed);
                    if (foundPath) {
                        filePath = foundPath;
                        fileFullPath = app.vault.adapter.getFullPath(filePath);
                    }
                }
            }
        } catch (error) {
            // 如果报错则跳过
            console.log(error);
        }

        let editors = settings["Editor"] ? settings["Editor"].split("\n").filter(i => i.trim() !== "") : [];
        editors.unshift(...['💡默认应用', '📂打开文件夹', "⚙编辑外部应用", "🗃FolderNotes", "🎐Hover"]);
        // 输入界面
        let choice = await QuickAdd.quickAddApi.suggester(editors.map(i => {
            if (i.includes("\\")) {
                return "⚡" + i.split("\\").at(-1).replace("\.exe", "");

            } else {
                return i;
            }
        }), editors);
        if (!choice) return;

        // 选择判断
        if (choice === editors[0]) {
            // 使用默认应用程序打开文件
            app.openWithDefaultApp(filePath);
        } else if (choice === editors[1]) {
            // 使用打开当前笔记文件夹
            app.showInFolder(filePath);
        } else if (choice === editors[3]) {
            app.commands.executeCommandById("folder-notes:create-folder-note");
            new Notice("📂已创建当前笔记为FolderNote！", 1000);
        } else if (choice === "🎐Hover") {
            const hoverFile = app.vault.getAbstractFileByPath(filePath);
            const newLeaf = app.plugins.plugins["obsidian-hover-editor"].spawnPopover(undefined, () => app.workspace.setActiveLeaf(newLeaf, false, true));
            newLeaf.openFile(hoverFile);
        } else if (choice === editors[2]) {
            let inputText = await QuickAdd.quickAddApi.wideInputPrompt("编辑外部软件绝对路径，多个以换行分割", null, settings["Editor"]);
            if (!inputText) return;
            settings["Editor"] = inputText;

        } else {
            exec(`"${choice}" "${fileFullPath}"`);
        }
    },

    settings: {
        name: "打开外部软件",
        author: "熊猫别熬夜",
        options: {
            "Editor": {
                type: "format",
                defaultValue: "",
                description: "",
            },
        }
    }
};

function matchSelectionEmbed(text) {
    const regex = /\[\[?([^\]]*?)(\|.*)?\]\]?\(?([^)\n]*)\)?/;
    const matches = text.match(regex);
    if (!matches) return;
    if (matches[3]) return decodeURIComponent(matches[3]);
    if (matches[1]) return decodeURIComponent(matches[1]);
}

function getFilePath(files, baseName) {
    if (!baseName) return;
    let files2 = files.filter(f => path.basename(f.path).replace(".md", "") === path.basename(baseName).replace(".md", ""));
    let filePath = files2.map((f) => f.path);
    return filePath[0];
}
