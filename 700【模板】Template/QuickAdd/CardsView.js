const path = require('path');
const fs = require('fs');
const file = app.workspace.getActiveFile();
const fileFullPath = app.vault.adapter.getFullPath(file.path);

module.exports = {
    entry: async (QuickAdd, settings, params) => {
        
        // 可调节的参数
        // 卡片参数
        const width = Number(settings["width"]);
        const height = Number(settings["height"]);
        // 卡片间隔
        const space = Number(settings["space"]);
        // 每行卡片的数量限制
        const limit = Number(settings["limit"]);
        // 基于库的相对路径的Canvas
        const canvasPath = settings["canvasPath"];

        // 获取已打开的笔记列表
        const notes = app.workspace.getLastOpenFiles().filter(note => note.endsWith('.md'));

        const canvasData = {
            nodes: [],
            edges: []
        };

        let x = 0;
        let y = 0;
        let n = 1;
        let nodes = [];
        const length = notes.length;

        for (let i = 1; i <= length; i++) {
            const node = {
                id: "",
                type: "file",
                file: notes[i - 1],
                subpath: "",
                x: 0,
                y: 0,
                width: width,
                height: height,
            };

            node.id = String(i);
            node.x = x;
            node.y = y;
            console.log([notes[i - 1], x, y]);

            x += width + space;
            if (i >= limit * n) {
                y += height + space;
                x = 0;
                n = n + 1;
            }
            console.log([notes[i - 1], node.x, y]);

            nodes.push(node);
        }
        canvasData.nodes = nodes;
        console.log(canvasData);
        let canvasFile = app.vault.getAbstractFileByPath(canvasPath);
        let canvasJson = JSON.stringify(canvasData, null, 2);
        if (canvasFile) {
            app.vault.modify(canvasFile, canvasJson);
            app.workspace.activeLeaf.openFile(canvasFile);
        } else {
            canvasFile = app.vault.create(canvasPath, canvasJson);
            app.workspace.activeLeaf.openFile(canvasFile);
            // app.workspace.getLeaf("tab").openFile(canvasFile);
        }

        // 尝试重新加载缩略图
        setTimeout(() => {
            try {
                app.commands.executeCommandById("canvas-minimap:reload");
            } catch (error) {
                console.log(error);
            }
        }, 1000);

    },
    settings: {
        name: "CardsView",
        author: "熊猫别熬夜",
        options: {
            "canvasPath": {
                type: "text",
                defaultValue: "Y-图形文件存储/CardsView.canvas",
                placeholder: "相对路径",
                description: "设置Canvas路径，可以嵌套子文件夹",
            },
            "width": {
                type: "text",
                defaultValue: "670",
                placeholder: "卡片参数",
                description: "卡片宽度",

            },
            "height": {
                type: "text",
                defaultValue: "430",
                placeholder: "卡片参数",
                description: "卡片高度",
            },

            "limit": {
                type: "text",
                defaultValue: "4",
                placeholder: "每行卡片数量",
                description: "每行卡片数量",
            },
            "space": {
                type: "text",
                defaultValue: "50",
                placeholder: "卡片间隔",
                description: "卡片之间的间隔",

            },
        }
    }

};


function getHeadings(fileFullPath, level) {
    // 读取文件内容
    const fileContent = fs.readFileSync(fileFullPath, 'utf-8');
    // 使用正则表达式提取指定级别的标题
    const regex = new RegExp(`^#{2,${level}}\\s(.+)`, 'gm');
    const heads = [];
    let head;
    let counts = [];

    while ((head = regex.exec(fileContent)) !== null) {
        heads.push("#" + head[1]);
        counts.push(head[0].match(/#/g).length);
    }
    return { heads, counts };
}
