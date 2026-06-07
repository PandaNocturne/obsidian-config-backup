const path = require('path');
const { exec } = require('child_process');
const quickAddApi = app.plugins.plugins.quickadd.api;

module.exports = {
    entry: async (QuickAdd, settings, params) => {
        const moment = window.moment;

        // 获取当前时间并格式化
        const formattedDate = quickAddApi.date.now(settings["文件命名格式"].replace("{{DATE:", "").replace("}}", ""));

        // 设置基础文件夹和文件路径
        const baseFolder = settings["文件路径"];

        const filePath = `${baseFolder}/${formattedDate}.canvas`;
        const folderPath = path.dirname(filePath);

        // 设置默认内容
        const defaultContent = JSON.stringify({
            edges: [],
            nodes: []
        }, null, 2); // 格式化为美观的JSON字符串

        // 创建嵌套文件夹
        if (!app.vault.getFolderByPath(folderPath)) {
            await app.vault.createFolder(folderPath);
        }

        // 创建新的Canvas文件，并写入默认内容
        await app.vault.create(filePath, defaultContent);

        // 获取Canvas文件的抽象文件对象
        const canvasPath = app.vault.getAbstractFileByPath(filePath);

        // 在新的标签页中打开Canvas文件
        await app.workspace.getLeaf("tab").openFile(canvasPath);
    },
    settings: {
        name: "新建Canvas",
        author: "熊猫别熬夜",
        options: {
            "文件路径": {
                type: "format",
                defaultValue: "",
            },
            "文件命名格式": {
                type: "format",
                defaultValue: "{{DATE:YYYY-MM-DD_HHmmss}}",
                description: "默认插入为时间戳的文件名格式：{{DATE:YYYY-MM-DD_HHmmss}}；",
            },
        }
    }
};
