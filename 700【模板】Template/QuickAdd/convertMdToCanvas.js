const path = require('path');
const fs = require('fs');

// 获取笔记的基本路径
const file = app.workspace.getActiveFile();
const fileFullPath = app.vault.adapter.getFullPath(file.path);

module.exports = {
    entry: async (QuickAdd, settings, params) => {
        entry: async (QuickAdd, settings, params) => {
            // 卡片参数
            const width = Number(settings["width"]) || 1080;
            const height = Number(settings["height"]) || 1000;
            // 从设置中获取初始值
            const space = Number(settings["space"]) || 250;
            const savedLevel = Number(settings["level"]) || 0; // 0 表示还没存过，取第一个
            const savedColumns = Number(settings["columns"]) || 5;

            const canvasPath = file.path.replace(".md", '.canvas');

            const canvasData = {
                nodes: [],
                edges: []
            };
            if (file.extension === 'md') {
                // 获取笔记中的所有标题级别
                const fileContent = fs.readFileSync(fileFullPath, 'utf-8');
                const headingRegex = /^#+\s/gm;
                let match;
                const levels = new Set();
                while ((match = headingRegex.exec(fileContent)) !== null) {
                    levels.add(match[0].trim().length);
                }

                const sortedLevels = Array.from(levels).sort();
                if (sortedLevels.length === 0) {
                    new Notice("该笔记中没有标题！");
                    return;
                }

                // 使用 suggester 模拟一个简单的参数配置 Modal
                let selectedLevel = savedLevel && sortedLevels.includes(savedLevel) ? savedLevel : sortedLevels[0];
                let columns = savedColumns;
                let currentSpace = space;

                while (true) {
                    const options = [
                        `📌 标题级别: H${selectedLevel}`,
                        `🔢 每行卡片: ${columns}`,
                        `📏 卡片间隔: ${currentSpace}`,
                        "🚀 开始转换",
                        "❌ 取消"
                    ];

                    const select = await QuickAdd.quickAddApi.suggester(options, options);
                    if (!select || select === options[4]) return;

                    if (select === options[0]) {
                        const levelStr = await QuickAdd.quickAddApi.suggester(
                            sortedLevels.map(l => `H${l}`),
                            sortedLevels.map(l => l.toString())
                        );
                        if (levelStr) selectedLevel = parseInt(levelStr);
                    } else if (select === options[1]) {
                        const colStr = await QuickAdd.quickAddApi.inputPrompt("请输入列数", columns.toString());
                        if (colStr) columns = parseInt(colStr) || 5;
                    } else if (select === options[2]) {
                        const spaceStr = await QuickAdd.quickAddApi.inputPrompt("请输入卡片间隔", currentSpace.toString());
                        if (spaceStr) currentSpace = parseInt(spaceStr) || 250;
                    } else if (select === options[3]) {
                        // 保存参数到设置中
                        settings["level"] = selectedLevel.toString();
                        settings["columns"] = columns.toString();
                        settings["space"] = currentSpace.toString();
                        // 尝试保存 QuickAdd 设置以持久化
                        if (app.plugins.plugins.quickadd) {
                            await app.plugins.plugins.quickadd.saveSettings();
                        }
                        break;
                    }
                }

                console.log("开始获取标题");
                const { heads, counts } = getHeadingsFromContent(fileContent, selectedLevel);
                console.log(heads);

                let nodes = [];
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

                    // node.id = String(i);
                    console.log([subpath, node.x, node.y]);
                    nodes.push(node);
                }
                canvasData.nodes = nodes;
                console.log(canvasData);
                let canvasFile = app.vault.getAbstractFileByPath(canvasPath);
                const canvasJson = JSON.stringify(canvasData, null, 2);
                if (canvasFile) {
                    await app.vault.modify(canvasFile, canvasJson);
                    app.workspace.activeLeaf.openFile(canvasFile);
                } else {
                    canvasFile = await app.vault.create(canvasPath, canvasJson);
                    app.workspace.activeLeaf.openFile(canvasFile);
                }

                // 尝试重新加载缩略图
                setTimeout(() => {
                    try {
                        app.commands.executeCommandById("canvas-minimap:reload");
                    } catch (error) {
                        console.log(error);
                    }
                }, 1000);


            } else if (file.extension === 'canvas') {
                fs.readFile(fileFullPath, 'utf8', (err, data) => {
                    if (err) throw err;
                    const canvasData = JSON.parse(data);
                    // 获取nodes中的object.file
                    canvasData.nodes;
                    // const mdFilePath = canvasData.nodes[0].file;
                    const mdFilePath = file.path.replace(".canvas", '.md');
                    app.workspace.activeLeaf.openFile(app.vault.getAbstractFileByPath(mdFilePath));
                });

            }

        },
            settings: {
            name: "Convert md to canvas",
                author: "熊猫别熬夜",
                    options: {
                "width": {
                    type: "text",
                        defaultValue: "1080",
                            placeholder: "卡片宽度",
                                description: "卡片宽度";
                },
                "height": {
                    type: "text",
                        defaultValue: "1000",
                            placeholder: "卡片高度",
                                description: "卡片高度";
                },
                "space": {
                    type: "text",
                        defaultValue: "250",
                            placeholder: "卡片间隔",
                                description: "卡片之间的间隔";
                },
                "level": {
                    type: "text",
                        defaultValue: "2",
                            description: "上次选择的标题级别";
                },
                "columns": {
                    type: "text",
                        defaultValue: "5",
                            description: "上次选择的每行卡片数";
                }
            }
        }


    };


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
