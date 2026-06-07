module.exports = {
    entry: async (params, settings) => {
        // params 是第一个参数，里面包含 quickAddApi 和 variables
        const quickAddApi = params.quickAddApi || app.plugins.plugins.quickadd.api;
        const {
            inputPrompt: prompt,
            suggester,
            wideInputPrompt
        } = quickAddApi;

        // ---------------- 1. 默认值计算 ----------------
        const defaultTitle = quickAddApi.date.now("YYMMDD_HHmmss");

        let title = defaultTitle;
        let taskType = "TaskNote";   // 默认切换回 TaskNote
        const typeDisplay = ["🗃️ Project (项目文件夹)", "🎯TaskNote (任务文件夹)", "📅 Journal (日志模式)"];
        const typeValues = ["Project", "TaskNote", "Journal"];

        const parseFolderFormat = (str) => {
            if (!str) return "";
            return str.replace(/\{\{DATE:(.*?)\}\}/g, (match, datePart) => {
                return quickAddApi.date.now(datePart);
            });
        };

        const defaultTaskNoteTag = settings["TaskNote默认标签"] || "";
        const defaultProjectTag = settings["Project默认标签"] || "";
        const projectsRootFolder = parseFolderFormat(settings["Project文件夹"] || "");
        const taskNoteRootFolder = parseFolderFormat(settings["TaskNote文件夹"] || "");

        const taskNoteTemplate = settings["TaskNote创建模板"] || "";
        const projectTemplate = settings["Project创建模板"] || "";
        const propertyName = settings["任务状态字段"] || "status";

        const taskNoteFolderNoteDefault = settings["TaskNote默认开启FolderNote"] !== false;
        const projectFolderNoteDefault = settings["Project默认开启FolderNote"] === true;
        let isFolderNote = taskType === "Project" ? projectFolderNoteDefault : taskNoteFolderNoteDefault;
        const statusConfigStr = settings["任务状态选项"] || "Plan\nScheduing\nIn Progress\nIn Review\nDone\nCancelled";
        const taskStatusOptionsArr = statusConfigStr.split("\n").map(s => s.trim()).filter(s => s);

        // 初始 tags 跟随 TaskNote
        let tags = defaultTaskNoteTag;
        let content = "";
        let projectFolder = "";
        let projectType = "";
        let taskStatus = taskStatusOptionsArr.length > 0 ? taskStatusOptionsArr[0] : "Plan";

        const rootFolder = app.vault.getAbstractFileByPath(projectsRootFolder);
        let projectFolderOptions = [];
        if (rootFolder && rootFolder.children) {
            projectFolderOptions = rootFolder.children
                .filter(f => f.children !== undefined)
                .map(f => f.name);
        }

        // ---------------- 2. 循环列表配置选项 ----------------
        while (true) {
            const typeLabel = typeDisplay[typeValues.indexOf(taskType)];

            let options = [
                `1. 任务类型： ${typeLabel}`
            ];

            // 按要求：Project 相关的分类和类型紧跟在 1 后面显示
            if (taskType === "Project") {
                options.push(`1.1 项目分类：📁 ${projectFolder || "未选择"}`);
                if (projectFolder) {
                    options.push(`1.2 项目类型：📂 ${projectType || "无 (根目录)"}`);
                }
            }

            options.push(`2. 任务名称：📄 ${title}`);
            options.push(`3. 任务状态：🔅 ${taskStatus || "未填写"}`);
            options.push(`4. 任务标签：#️⃣ ${tags || "空"}`);
            options.push(`5. 正文内容：✍️ ${content ? "(已输入内容)" : "空"}`);
            options.push(`6. FolderNote：${isFolderNote ? "✅ 开启" : "❌ 关闭"}`);
            options.push("✔️ 确定生成");
            options.push("❌ 取消退出");

            const select = await suggester(options, options);
            if (!select || select === "❌ 取消退出") return;

            if (select.includes("1. 任务类型")) {
                const optionsDisplay = typeDisplay.map(t => `${t}`);
                const newType = await suggester(optionsDisplay, typeValues);
                if (newType && newType !== taskType) {
                    if (newType === "Journal") {
                        const tasksApi = app.plugins.plugins['obsidian-tasks-plugin']?.apiV1;
                        if (!tasksApi) {
                            new Notice("未检测到 Tasks 插件，请先安装并启用。");
                            return;
                        }

                        // --- 2. 调用 Tasks 插件面板 ---
                        let taskLine = await tasksApi.createTaskLineModal();
                        if (taskLine) {
                            // --- 3. 获取每日日记路径 ---
                            const periodicNotes = app.plugins.plugins["periodic-notes"];
                            let dailySettings = periodicNotes ? periodicNotes.settings["daily"] : app.internalPlugins.plugins["daily-notes"]?.instance?.options;

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
                            return; 
                        } else {
                            return; 
                        }
                    }
                    // 切换时自动改变默认标签
                    if (taskType === "TaskNote" && tags === defaultTaskNoteTag) {
                        tags = newType === "Project" ? defaultProjectTag : tags;
                    } else if (taskType === "Project" && tags === defaultProjectTag) {
                        tags = newType === "TaskNote" ? defaultTaskNoteTag : tags;
                    }
                    if (!tags) {
                        tags = newType === "TaskNote" ? defaultTaskNoteTag : (newType === "Project" ? defaultProjectTag : "");
                    }
                    taskType = newType;
                    isFolderNote = taskType === "Project" ? projectFolderNoteDefault : taskNoteFolderNoteDefault;
                }
            } else if (select.includes("6. FolderNote")) {
                isFolderNote = !isFolderNote;
            } else if (select.includes("1.1 项目分类")) {
                const pFolderChoice = await suggester(
                    ["🔙 未选择 (清除选项)", "🖍️ (手动输入其它分类)", ...projectFolderOptions.map(t => `📁 ${t}`)],
                    ["", "__custom__", ...projectFolderOptions]
                );
                if (pFolderChoice === "__custom__") {
                    const customFolder = await prompt("📁 请输入自定义的项目分类", "", projectFolder) || "";
                    if (customFolder && customFolder !== projectFolder) {
                        projectFolder = customFolder;
                        projectType = "";
                    }
                } else if (pFolderChoice !== undefined && pFolderChoice !== projectFolder) {
                    projectFolder = pFolderChoice;
                    projectType = "";
                }
            } else if (select.includes("1.2 项目类型")) {
                const selectedFolderPath = `${projectsRootFolder}/${projectFolder}`;
                const selectedFolder = app.vault.getAbstractFileByPath(selectedFolderPath);
                let currentTypeOptions = [];
                if (selectedFolder && selectedFolder.children) {
                    const excludePattern = /^\d{6}_/;
                    currentTypeOptions = selectedFolder.children
                        .filter(f => f.children !== undefined)
                        .filter(f => !excludePattern.test(f.name))
                        .map(f => f.name);
                }

                const pTypeChoice = await suggester(
                    ["🔙 无 (存放在根目录)", "🖍️ (手动输入其它类型)", ...currentTypeOptions.map(t => `📂 ${t}`)],
                    ["", "__custom__", ...currentTypeOptions]
                );
                if (pTypeChoice === "__custom__") {
                    const customType = await prompt("📂 请输入自定义的项目类型", "", projectType) || "";
                    if (customType !== undefined && customType !== projectType) {
                        projectType = customType;
                    }
                } else if (pTypeChoice !== undefined && pTypeChoice !== projectType) {
                    projectType = pTypeChoice;
                }
            } else if (select.includes("2. 任务名称")) {
                const newTitle = await prompt("📌 任务名称", "建议格式: {{yymmddd}}_{{title}}", title);
                if (newTitle !== undefined) title = newTitle;
            } else if (select.includes("3. 任务状态")) {
                const statusChoice = await suggester(
                    ["🔙 无 (为空)", "🖍️ (手动输入其它状态)", ...taskStatusOptionsArr.map(t => `🔅 ${t}`)],
                    ["", "__custom__", ...taskStatusOptionsArr]
                );
                if (statusChoice === "__custom__") {
                    const customStatus = await prompt("🔅 请输入自定义的任务状态", "", taskStatus) || "";
                    if (customStatus !== undefined) taskStatus = customStatus;
                } else if (statusChoice !== undefined) {
                    taskStatus = statusChoice;
                }
            } else if (select.includes("4. 任务标签")) {
                const newTags = await prompt("🏷️ 任务标签", "例如: tag1, tag2", tags);
                if (newTags !== undefined) tags = newTags;
            } else if (select.includes("5. 正文内容")) {
                const newContent = await wideInputPrompt("✍️ 正文内容", "在这里输入该任务的详情或初始内容...", content);
                if (newContent !== undefined) content = newContent;
            } else if (select === "✔️ 确定生成") {
                try {
                    params.variables["title"] = title;
                    params.variables["taskType"] = taskType;
                    params.variables["projectFolder"] = projectFolder;
                    params.variables["projectType"] = projectType;
                    params.variables["taskStatus"] = taskStatus;
                    params.variables["tags"] = tags;
                    params.variables["content"] = content;

                    const createFolderRecursive = async (pathStr) => {
                        if (!pathStr) return;
                        let folders = pathStr.split(/[\\/]/);
                        let currentPath = '';
                        for (const folder of folders) {
                            if (!folder) continue;
                            currentPath = currentPath === '' ? folder : currentPath + '/' + folder;
                            if (!app.vault.getAbstractFileByPath(currentPath)) {
                                await app.vault.createFolder(currentPath);
                            }
                        }
                    };

                    let targetFolderPath = taskType === "Project" ? projectsRootFolder : taskNoteRootFolder;
                    if (taskType === "Project" && projectFolder) {
                        targetFolderPath += `/${projectFolder}`;
                        if (projectType) targetFolderPath += `/${projectType}`;
                    }
                    if (isFolderNote) targetFolderPath += `/${title}`;

                    await createFolderRecursive(targetFolderPath);
                    const targetFilePath = `${targetFolderPath}/${title}.md`;
                    let file = app.vault.getAbstractFileByPath(targetFilePath);

                    if (!file) {
                        let data = "";
                        const templatePathStr = taskType === "Project" ? projectTemplate : taskNoteTemplate;
                        if (templatePathStr) {
                            const tPath = templatePathStr.endsWith(".md") ? templatePathStr : templatePathStr + ".md";
                            const templateFile = app.vault.getAbstractFileByPath(tPath);
                            if (templateFile) {
                                let templateContent = await app.vault.read(templateFile);
                                data = await quickAddApi.format(templateContent);
                            }
                        }
                        file = await app.vault.create(targetFilePath, data);

                        const templaterPlugin = app.plugins.plugins["templater-obsidian"];
                        if (templaterPlugin && templaterPlugin.templater) {
                            await templaterPlugin.templater.overwrite_file_commands(file);
                            file = app.vault.getAbstractFileByPath(targetFilePath);
                        }
                    }

                    await app.fileManager.processFrontMatter(file, (fm) => {
                        const fileName = title.replace(/^[\d\.\_\-]+/, '');
                        const match = fileName.match(/【(.+?)】(.+)/);
                        let newTags = [];
                        let noteName = fileName;
                        if (match) {
                            noteName = match[2].trim();
                            newTags = match[1].split('+').map(tag => tag.replace(/\s/g, '').replace(/-/g, '/'));
                        }
                        fm.title = noteName;

                        let tagList = [];
                        if (tags) {
                            tagList = tags.split(/[,\s]+/).map(t => t.replace(/^#/, '').trim()).filter(t => t);
                        }
                        tagList = [...tagList, ...newTags];

                        if (tagList.length > 0) {
                            let oldTags = fm.tags ? (Array.isArray(fm.tags) ? fm.tags : [String(fm.tags)]) : [];
                            oldTags = oldTags.map(t => t.replace(/^#/, '').trim());
                            let allTags = Array.from(new Set([...oldTags, ...tagList]));
                            fm.tags = allTags.filter(tag => !allTags.some(otherTag =>
                                otherTag !== tag && otherTag.toLowerCase().startsWith(tag.toLowerCase() + "/")
                            ));
                        }
                        if (taskStatus) fm[propertyName] = taskStatus;
                    });

                    if (content) await app.vault.append(file, `\n${content}\n`);
                    new Notice(`✅ 成功生成笔记：${title}`);
                    await app.workspace.getLeaf().openFile(file);

                } catch (err) {
                    console.error(err);
                    new Notice("❌ 创建任务失败。");
                }
                break;
            }
        }
    },
    settings: {
        name: "任务生成器",
        author: "熊猫别熬夜",
        options: {
            "TaskNote文件夹": { type: "format", defaultValue: "310【任务】Tasks", description: "TaskNote 存放目录，支持 {{DATE:[...]}}" },
            "TaskNote创建模板": { type: "text", defaultValue: "", description: "TaskNote 模板路径" },
            "TaskNote默认标签": { type: "text", defaultValue: "#TaskNote", description: "TaskNote 默认标签" },
            "Project文件夹": { type: "format", defaultValue: "300【项目】Project", description: "Project 存放目录，支持 {{DATE:[...]}}" },
            "Project创建模板": { type: "text", defaultValue: "", description: "Project 模板路径" },
            "Project默认标签": { type: "text", defaultValue: "#Project", description: "Project 默认标签" },
            "任务状态字段": { type: "text", defaultValue: "status", description: "YAML 状态字段名" },
            "任务状态选项": { type: "format", defaultValue: "Plan\nScheduing\nIn Progress\nIn Review\nDone\nCancelled", description: "状态选项" },
            "TaskNote默认开启FolderNote": { type: "toggle", defaultValue: true, description: "TaskNote 是否默认生成 FolderNote (文件夹笔记)" },
            "Project默认开启FolderNote": { type: "toggle", defaultValue: false, description: "Project 是否默认生成 FolderNote (文件夹笔记)" }
        }
    }
};
