const path = require('path');

/**
 * 带图复制脚本 - 优化版
 * 
 * 优化点：
 * 1. 完善了 Notice 提示系统，覆盖上传开始、过程报错及最终结果。
 * 2. 将核心变量获取移入 module.exports 内部，确保运行时的准确性。
 * 3. 增强了对 Wiki 链接和 Markdown 链接的匹配逻辑。
 * 4. 优化了文件查找逻辑，支持不区分大小写的匹配。
 * 5. 改进了剪贴板复制的兼容性及错误处理。
 */
module.exports = async () => {
    // 0. 基础环境检查
    if (typeof app === 'undefined') {
        console.error("未找到 Obsidian 环境");
        return;
    }

    // 1. 获取当前活跃视图
    const activeView = app.workspace.getActiveViewOfType(Object.getPrototypeOf(app.workspace.activeLeaf.view).constructor);
    if (!activeView || activeView.getViewType() !== 'markdown') {
        new Notice("❌ 请在 Markdown 编辑器中使用此脚本");
        return;
    }

    const { editor, file } = activeView;
    const fileName = file ? file.basename : "image";
    const uploadUrl = "http://127.0.0.1:36677/upload";

    // 2. 获取选中文本
    let selection = editor.getSelection();
    if (!selection) {
        new Notice("⚠️ 请先选择包含图片的文本内容");
        return;
    }

    const files = app.vault.getFiles();
    const lines = selection.split("\n");
    let processedContent = [];
    let stats = { total: 0, success: 0, fail: 0 };

    // 3. 预识别图片任务
    const imageTasks = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const embedPath = matchSelectionEmbed(line);
        if (embedPath && /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(embedPath)) {
            imageTasks.push({ index: i, embedPath, line });
        }
    }

    if (imageTasks.length > 0) {
        new Notice(`🚀 正在上传 ${imageTasks.length} 张图片到目标服务器...`, 2000);
    } else {
        // 如果没有图片，直接复制选中文本并提示
        await copyToClipboard(selection);
        new Notice(`✅ 已成功复制选中文本`);
        return;
    }

    // 4. 遍历处理每一行
    for (let i = 0; i < lines.length; i++) {
        const task = imageTasks.find(t => t.index === i);
        if (!task) {
            processedContent.push(lines[i]);
            continue;
        }

        stats.total++;
        const { embedPath, line } = task;
        const wikiPath = findFilePath(files, embedPath);

        if (!wikiPath) {
            new Notice(`❌ 库中未找到图片: ${embedPath}`, 5000);
            processedContent.push(line);
            stats.fail++;
            continue;
        }

        const absolutePath = app.vault.adapter.getFullPath(wikiPath);
        
        try {
            const data = await uploadFiles([absolutePath], uploadUrl);
            
            if (data && data.success) {
                // 构造新链接。使用当前文档名作为 alt 文本，或保留原始 alt
                const imgWiki = `![[${embedPath}]]`;
                const imgLink = `![${fileName}](${data.result})`;
                
                // 替换逻辑：优先替换 Wiki 链接，如果不匹配则尝试替换 Markdown 链接格式
                let newLine = line.replace(imgWiki, imgLink);
                if (newLine === line) {
                    const mdRegex = /!\[.*?\]\(.*?\)/;
                    newLine = line.replace(mdRegex, imgLink);
                }
                
                processedContent.push(newLine);
                stats.success++;
            } else {
                new Notice(`❌ 上传失败: ${path.basename(absolutePath)}`, 5000);
                processedContent.push(line);
                stats.fail++;
            }
        } catch (error) {
            console.error("Upload error:", error);
            new Notice(`❌ 网络请求失败: ${error.message}`, 5000);
            processedContent.push(line);
            stats.fail++;
        }
    }

    // 5. 组装结果并复制到剪贴板
    const finalResult = processedContent.join("\n");
    await copyToClipboard(finalResult);

    // 6. 最终结果提示
    const noticeMsg = `✅ 处理完成\n成功: ${stats.success}\n失败: ${stats.fail}`;
    new Notice(noticeMsg, 5000);
};

/**
 * 从文本行中提取图片链接路径
 */
function matchSelectionEmbed(text) {
    // 兼容 ![[filename.png]] 和 ![alt](path/to/image.png)
    const regex = /!\[\[?([^\]]*?)(\|.*)?\]\]?\(?([^)\n]*)\)?/;
    const matches = text.match(regex);
    if (!matches) return null;
    
    // matches[3] 为 Markdown 格式路径，matches[1] 为 Wiki 格式路径
    const foundPath = matches[3] || matches[1];
    return foundPath ? decodeURIComponent(foundPath.trim()) : null;
}

/**
 * 在库中查找匹配的文件路径（不区分大小写）
 */
function findFilePath(files, embedPath) {
    const targetBase = path.basename(embedPath).toLowerCase();
    const match = files.find(f => {
        const fBase = path.basename(f.path).toLowerCase();
        return fBase === targetBase;
    });
    return match ? match.path : null;
}

/**
 * 调用接口上传文件。直接使用 Obsidian 的 requestUrl 避免跨域
 */
async function uploadFiles(imagePathList, url) {
    const response = await requestUrl({
        url: url,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list: imagePathList }),
    });
    return response.json;
}

/**
 * 复制到系统剪贴板
 */
async function copyToClipboard(text) {
    try {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // 回退方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    } catch (err) {
        console.error("Clipboard Error:", err);
        new Notice("❌ 复制到剪贴板失败");
    }
}
