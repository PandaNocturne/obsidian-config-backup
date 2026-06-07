/*
 * @Author: Antigravity
 * @Date: 2026-04-10
 * @Description: 获取指定日期（默认上一天）的文件创建情况，用于AI生成日报。
 */

module.exports = {
    entry: async (params, settings) => {
        const { app, quickAddApi } = params;
        const { inputPrompt, suggester, wideInputPrompt } = quickAddApi;

        // 1. 获取目标日期
        const yesterday = window.moment().subtract(1, 'days').format('YYYY-MM-DD');
        const today = window.moment().format('YYYY-MM-DD');
        
        const dateOptions = [
            `昨天 (${yesterday})`,
            `今天 (${today})`,
            "📅 手动输入日期"
        ];
        const dateChoices = [yesterday, today, "custom"];
        
        let targetDate = await suggester(dateOptions, dateChoices);
        
        if (!targetDate) return;
        
        if (targetDate === "custom") {
            targetDate = await inputPrompt("请输入日期 (YYYY-MM-DD)", "YYYY-MM-DD", yesterday);
            if (!targetDate) return;
        }
        
        const m = window.moment(targetDate, 'YYYY-MM-DD', true);
        if (!m.isValid()) {
            new Notice("❌ 无效的日期格式！");
            return;
        }

        const startOfDay = m.startOf('day').valueOf();
        const endOfDay = m.endOf('day').valueOf();

        // 1.5 选择获取类型
        const actionTypeOptions = ["🆕 仅新创建文件", "📝 仅修改过的文件", "🔄 获取创建及修改"];
        const actionTypeValues = ["created", "modified", "both"];
        const actionType = await suggester(actionTypeOptions, actionTypeValues);
        if (!actionType) return;

        // 排除文件夹逻辑
        const excludeFolders = (settings["排除文件夹"] || "").split(",").map(s => s.trim()).filter(s => s);

        // 2. 获取并统计文件
        const allFiles = app.vault.getFiles(); 
        let createdFiles = [];
        let modifiedFiles = [];

        allFiles.forEach(file => {
            // 基础过滤
            if (file.extension !== 'md') return;
            if (file.path.endsWith('.excalidraw.md')) return;
            const isExcluded = excludeFolders.some(folder => file.path.startsWith(folder));
            if (isExcluded) return;

            const ctime = file.stat.ctime;
            const mtime = file.stat.mtime;

            const isCreatedInRange = (ctime >= startOfDay && ctime <= endOfDay);
            const isModifiedInRange = (mtime >= startOfDay && mtime <= endOfDay);

            if (isCreatedInRange) {
                createdFiles.push(file);
            } else if (isModifiedInRange) {
                // 如果是范围内创建的，跳过 modified 统计以防重复显示
                modifiedFiles.push(file);
            }
        });

        if (createdFiles.length === 0 && modifiedFiles.length === 0) {
            new Notice(`🚫 ${targetDate} 没有符合条件的笔记动态。`);
            return;
        }

        // 3. 构建结果内容
        let result = `### ${targetDate} 笔记动态汇总\n\n`;
        
        // 处理新创建
        if (actionType === "created" || actionType === "both") {
            result += `#### 🆕 新创建 (${createdFiles.length})\n`;
            if (createdFiles.length === 0) {
                result += "> 无新创建笔记\n";
            } else {
                createdFiles.sort((a,b) => a.stat.ctime - b.stat.ctime).forEach(file => {
                    const timeStr = window.moment(file.stat.ctime).format("HH:mm:ss");
                    result += `- [${timeStr}] [[${file.basename}]] (路径: \`${file.path}\`)\n`;
                });
            }
            result += "\n";
        }

        // 处理修改
        if (actionType === "modified" || actionType === "both") {
            result += `#### 📝 历史修改 (${modifiedFiles.length})\n`;
            if (modifiedFiles.length === 0) {
                result += "> 无修改记录\n";
            } else {
                // 按修改时间倒序排列
                modifiedFiles.sort((a,b) => b.stat.mtime - a.stat.mtime).forEach(file => {
                    const timeStr = window.moment(file.stat.mtime).format("HH:mm:ss");
                    result += `- [${timeStr}] [[${file.basename}]] (路径: \`${file.path}\`)\n`;
                });
            }
            result += "\n";
        }

        // 4. 处理结果
        const finalAction = await suggester(["📋 复制并退出", "👁️ 查看详情并复制", "❌ 取消"], ["copy", "view", "cancel"]);
        
        if (finalAction === "copy" || finalAction === "view") {
            if (finalAction === "view") {
                await wideInputPrompt("📄 文件创建详情", "你可以修改或复制以下内容", result);
            }
            
            // 写入剪贴板
            await window.navigator.clipboard.writeText(result);
            new Notice("✅ 已复制到剪贴板");
            
            // 将结果存入变量，供后续 QuickAdd Capture 或 Template 使用
            params.variables["createdFilesInfo"] = result;
            return result;
        }
    },
    settings: {
        name: "获取文件创建情况",
        author: "Antigravity",
        options: {
            "排除文件夹": {
                type: "text",
                defaultValue: "700【模板】Template, 900【素材】Assets",
                description: "不统计这些文件夹中的文件 (多个用逗号隔开)"
            }
        }
    }
};
