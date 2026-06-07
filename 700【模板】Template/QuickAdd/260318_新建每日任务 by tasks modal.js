module.exports = async (params) => {
    const {app} = params;
    const tasksApi = app.plugins.plugins['obsidian-tasks-plugin']?.apiV1;

    if (!tasksApi) {
        new Notice("未检测到 Tasks 插件，请先安装并启用。");
        return;
    }

    // --- 2. 调用 Tasks 插件面板 ---
    let taskLine = await tasksApi.createTaskLineModal();
    
    // 任务创建完成后停止监听
    // observer.disconnect();

    if (!taskLine) return; // 用户取消了输入

    // --- 3. 获取每日日记路径 (适配 Periodic Notes 或自带日记) ---
    const periodicNotes = app.plugins.plugins["periodic-notes"];
    let dailySettings;
    
    if (periodicNotes) {
        dailySettings = periodicNotes.settings["daily"];
    } else {
        // 如果没装 Periodic Notes，尝试获取系统自带日记设置
        dailySettings = app.internalPlugins.plugins["daily-notes"]?.instance?.options;
    }

    if (!dailySettings) {
        new Notice("未能获取日记设置，请检查插件配置。");
        return;
    }

    const dailyFormat = dailySettings.format || "YYYY-MM-DD";
    const dailyFolder = dailySettings.folder || "";
    const fileName = window.moment().format(dailyFormat);
    const path = `${dailyFolder}/${fileName}.md`.replace(/\/+/g, '/');

    // --- 4. 检查并创建文件 ---
    let file = app.vault.getAbstractFileByPath(path);
    
    if (!file) {
        let data = "";
        const templatePath = dailySettings.template;
        if (templatePath) {
            const templateFile = app.vault.getAbstractFileByPath(templatePath.endsWith(".md") ? templatePath : templatePath + ".md");
            if (templateFile) {
                data = await app.vault.read(templateFile);
            }
        }
        file = await app.vault.create(path, data);
    }

    // --- 5. 追加任务内容 ---
    await app.vault.append(file, taskLine + '\n');
    new Notice("任务已成功添加到今日日记！");
};