const fs = require('fs');
const path = require('path');
const process = require('process');

module.exports = {
    entry: async (QuickAdd, settings, params) => {
        // 获取选中的文本
        const editor = app.workspace.activeEditor.editor;
        // 选择所在的一行
        const line = editor.getLine(editor.getCursor().line);
        // 获取选中的文本否则自动获取当前行的文本
        const selection = editor.getSelection() ? editor.getSelection() : line;

        let selectionEmbed = matchSelectionEmbed(selection);
        console.log(selectionEmbed);
        const files = app.vault.getFiles();

        // Wiki: 获取库所有文件列表
        let wikiPath = getFilePath(files, selectionEmbed); // 匹配Wiki链接
        console.log(wikiPath);
        if (!wikiPath) {
            new Notice("❌未找到对应文件");
            return;
        };

        // 复制并删除文件
        const types = String(settings["Types"]).split(",");
        if (wikiPath.endsWith(".md") || types.includes(path.extname(wikiPath).slice(1))) {
            let markdownText = getMarkdownText(wikiPath);
            copyToClipboard(markdownText);
            await app.vault.trash(app.vault.getAbstractFileByPath(wikiPath));
            new Notice("💡已复制内容到剪切板，并删除文件");
        } else {
            new Notice("❌已删除文件");
            await app.vault.trash(app.vault.getAbstractFileByPath(wikiPath));
            editor.replaceSelection("");
        }
        return;
    },
    settings: {
        name: "复制并删除",
        author: "熊猫别熬夜",
        options: {
            "Types": {
                type: "text",
                defaultValue: "md,txt,js,py",
                description: "可复制文件的类型，多个以,分离",
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

// 获取文件路径下的 md 中的文本(排除 Yaml)
function getMarkdownText(filePath) {
    // 获取文件的完整路径
    const fileFullPath = app.vault.adapter.getFullPath(filePath);
    // 读取文件内容
    const fileContent = fs.readFileSync(fileFullPath, 'utf8');
    // 排除首行YAML区域
    const markdownText = fileContent.replace(/---[\s\S]*?---\n*/, '').replace(/\n*/, '');
    return markdownText;
}