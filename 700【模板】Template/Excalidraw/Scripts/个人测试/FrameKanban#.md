const fs = require('fs');
const activefile = app.workspace.getActiveFile();
let settings = ea.getScriptSettings();

if (!settings["动态Kanban.md的路径"]) {
    settings = {
        "动态Kanban.md的路径": {
            value: "Excalidraw/Excalidraw.Kanban.md",
            // value: "00动态目录/kanbantest.md",
            description: "用作Frame大纲生成的kanban文件路径<br>以仓库根路径开始，如：Excalidraw/Excalidraw.Kanban.md"
        },
        "Kanban的宽度": {
            value: 330,
            description: "Kanban的宽度，默认值为330"
        },
        "缩略图是否带连接": {
            value: false,
            description: "如带连接，则单击缩略图即可跳转"
        },
        "启用自定义筛选": {
            value: false,
            description: "勾选以启用自定义筛选功能。启用后将作为基准筛选，后续的所有操作只针对该筛选后的Frame"
        },
        "自定义筛选符号": {
            value: "#",
            description: "设置自定义筛选的符号，如：#。设置后每次将自动筛选出所有含有该符号的Frame"
        },
        "启用默认生成": {
            value: false,
            description: "勾选以启用默认生成方式，启用后每次运行脚本将不再弹出操作框，直接根据默认操作生成大纲（适合只查看Frame大纲目录）"
        },
        "默认生成操作选项": {
            value: "2",
            description: "1:生成Frame卡片(有缩略图), 2:生成Frame大纲(无缩略图)"
        },
        // "默认排序方式": {
        //     value: "name",
        //     description: "name:按名称排序,date:按创建时间排序,mdate:按修改时间排序"
        // },后续可以todo
        "多标签模式": {
            value: true,
            description: "开启后支持向frame标题添加多个标签,否则只支持单个标签用于定位和筛选"
        }
    };
    ea.setScriptSettings(settings);
}

let kanbanWidth = settings["Kanban的宽度"].value;
const useCustomFilter = settings["启用自定义筛选"].value;
const filterSymbol = settings["自定义筛选符号"].value;
const UseDefaultSettings = settings["启用默认生成"].value;
const DefaultActionOption = settings["默认生成操作选项"].value;
const kanbanFilePath = settings["动态Kanban.md的路径"].value;
const multiTagEnabled = settings["多标签模式"].value;
const KanbanPath = app.vault.getAbstractFileByPath(kanbanFilePath);
const kanbanFullPath = app.vault.adapter.getFullPath(kanbanFilePath);
const fileName = app.workspace.getActiveFile().name;

await ea.addElementsToView();

let frameElements = ea.getViewElements().filter(el => el.type === "frame");
let selectedFrames = ea.getViewSelectedElements().filter(el => el.type === "frame");

if (useCustomFilter) {
    frameElements = frameElements.filter(el => el.name.includes(filterSymbol));
}

if (selectedFrames.length > 0) {
    frameElements = selectedFrames;
}

// 检查筛选后的frameElements数组是否为空，为空的话我设置了一个给用户的提示
if (frameElements.length === 0) {
    new Notice("根据筛选规则未匹配到frame，请前往设置或确保frame标题含有自定义筛选符");
    return;
}



const choices = ["1、生成Frame卡片(有缩略图)", "2、生成Frame大纲(无缩略图)", "3、为所选或所列Frame添加自定义前缀标签", "4、删除所选或所列Frame的前缀标签", "5、批量修改多个Frame前缀标签", "6、筛选指定标签的Frame", "7、打开Kanban文件", "8、重设Kanban宽度", "9、清空所选或所列Frame标题"];
let choice = "";
if (typeof choice === "undefined") {
    return;
}


// 设置中勾选启用默认生成的话
if (UseDefaultSettings && DefaultActionOption >= 1 && DefaultActionOption <= 2) {
    choice = choices[parseInt(DefaultActionOption) - 1];
} else {
    choice = await utils.suggester(choices, choices, "选择菜单（未选中且未筛选下默认对所有Frame进行操作）");
}

// 下面是新功能的代码和注释


// 新功能：清除用鼠标所多选中或所列Frame的标题。
// 这个功能可以用在当创建很多个frame后，如果后期整理frame需要自定义标题，可以统一清除excalidraw默认的frame标题；
if (choice === choices[8]) {
    frameElements.forEach(el => el.name = "");
    new Notice("所有Frame的标题已清空");
}


// 原有功能：! 设置看板宽度

if (choice === choices[7]) {
    settings["Kanban的宽度"].value = await utils.inputPrompt("请设置看板宽度", "请设置看板宽度。注意为数值型", kanbanWidth, 1);
    ea.setScriptSettings(settings);
    choice = choices[1];
}



// 原有功能：! open打开形式
if (choice === choices[6]) {
    const choices = ["新标签页", "垂直标签页", "水平标签页", "悬浮标签页，需要安装Hover插件"];
    const choice = await utils.suggester(choices, choices, "是否生成缩略图或者排序");
    if (choice === choices[0]) {
        // app.workspace.activeLeaf.openFile(KanbanFullPath);
        app.workspace.getLeaf("tab").openFile(KanbanPath);
    } else if (choice === choices[1]) {
        app.workspace.getLeaf('split', 'vertical').openFile(KanbanPath);

    } else if (choice === choices[2]) {
        app.workspace.getLeaf('split', 'horizontal').openFile(KanbanPath);

    } else if (choice === choices[3]) {
        let newLeaf = app.plugins.plugins["obsidian-hover-editor"].spawnPopover(undefined, () => this.app.workspace.setActiveLeaf(newLeaf, false, true));
        newLeaf.openFile(KanbanPath);
    }
    return;
}




// 提示用户输入需要筛选的标签名，可以筛选多个。如果用户输入标签名时用一个空格隔开写了多个标签名，则筛选frame标题中同时含有这多个标签名的frame；如果用户输入标签名用两个空格隔开多个标签名，则筛选分别含有这多个标签名的frame；

if (choice === choices[5]) {
    const input = await utils.inputPrompt("请输入需要筛选的标签名", "可以筛选多个标签。如果有多个标签名，请用空格或两个空格隔开。用一个空格隔开:筛选同时含有指定标签的frame；用两个空格隔开:筛选分别含有指定标签的frame");

    let tags = input.split(/\s+/).map(tag => "#" + tag);
    let isDoubleSpace = input.includes("  ");

    frameElements = frameElements.filter(el =>
        isDoubleSpace ? tags.some(tag => el.name.includes(tag)) : tags.every(tag => el.name.includes(tag))
    );

    new Notice(frameElements.length === 0 ? "未找到满足标签条件的frame" : "已筛选并刷新大纲");
    if (frameElements.length !== 0) choice = choices[1];

    await ea.addElementsToView();
}


// !新功能：修改前缀标签
if (choice === choices[4]) {
    let originTagName = await utils.inputPrompt("原来的标签名", "请直接输入标签名，不需要带“#”号");
    let frameElements = ea.getViewElements().filter(el => el.type === "frame" && el.name.includes("#" + originTagName));

    if (frameElements.length > 0) {
        let newTagName = await utils.inputPrompt("新的标签名", "请输入新的标签名，不需要带“#”号");
        frameElements.forEach(el => el.name = el.name.replace("#" + originTagName, "#" + newTagName));
        new Notice("标签修改成功");
    } else {
        new Notice("没有检查到该标签或操作已取消");
    }
}

// !新功能：删除用shift所多选中或所列的Frame的前缀标签
if (choice === choices[3]) {
    let deleteTag = await utils.inputPrompt("删除标签名", "请输入要删除的前缀标签名，“一个空格”表示清空被选中或所列Frame的”所有“前缀标签");

    frameElements.forEach(el => {
        if (deleteTag === " ") {
            el.name = el.name.includes("*") ? el.name.substring(el.name.indexOf("*") + 1) : el.name;
        } else {
            el.name = el.name.replace("#" + deleteTag, "");
        }
    });

    new Notice("Frame标题标签已删除");
    choice = choices[1];
}
// !新功能：单标签模式添加前缀标签或者多标签模式下添加前缀标签；
if (choice === choices[2]) {
    let frameElements = ea.getViewElements().filter(el => el.type === "frame");
    let tagName = await utils.inputPrompt("标签名", "请输入要添加的自定义前缀标签名");

    for (let el of frameElements) {
        let frameTitle = el.name; 
        let tag = frameTitle.includes("*") ? `#${tagName}` : `#${tagName}*`;

        if (multiTagEnabled) {
            el.name = `${tag} ${el.name}`;
        } else {
            if (frameTitle.includes("*")) {
                let atIndex = frameTitle.indexOf("*");
                let updatedTitle = frameTitle.substring(atIndex + 1); 
                el.name = `${tag}* ${updatedTitle}`; 
            } else {
                el.name = `${tag} ${frameTitle}`;
            }
        }
    }
    new Notice("标签添加完成");
}


let frameLinks = [];
if (frameElements.length >= 1) {
    // 根据设置中的排序方式进行排序
    // let sortType = settings["默认排序方式"].value;
    // frameElements.sort((a, b) => {
    //     if (sortType === "name") {
    //         // 根据 name 进行排序
    //         if (a.name < b.name) {
    //             return -1;
    //         }
    //         if (a.name > b.name) {
    //             return 1;
    //         }
    //     } else if (sortType === "date") {
    //         // 根据 date 进行排序
    //         return new Date(a.date) - new Date(b.date);
    //     } else if (sortType === "mdate") {
    //         // 根据 mdate 进行排序
    //         return new Date(a.mdate) - new Date(b.mdate);
    //     }
    //     return 0;
    // });排序功能可以在设置中设置默认排序方式（todo）
    frameElements.sort((a, b) => a.name.localeCompare(b.name));



    for (let el of frameElements) {
        let frameLink;
        if (choice === choices[0]) {
            if (settings["缩略图是否带连接"].value) {
                frameLink = `- [ ] [[${fileName}#^frame=${el.id}|${el.name}]]<br>[![[${fileName}#^frame=${el.id}]]](${fileName}#^frame=${el.id})`;
            } else {
                frameLink = `- [ ] [[${fileName}#^frame=${el.id}|${el.name}]]<br>![[${fileName}#^frame=${el.id}]]`;
            }
            // choices2在执行添加前缀之前需要先生成一遍大纲目录
        } else if (choice === choices[1] || choice === choices[2]) {
            frameLink = `- [ ] [[${fileName}#^frame=${el.id}|${el.name}]]`;
        }
        frameLinks.push(frameLink);
    }


}
// 但是choices2不需要提示“大纲已刷新”。
if (choice === choices[0] || choice === choices[1]) {
    new Notice(`大纲已刷新`, 3000);
}


// 给frame排序
// 作为生成大纲时的默认操作，不再单独需要排序；具体的排序方式可以在设置中设置（todo）
const updatedElements = await processFile(frameElements, kanbanFullPath, fileName);

let markdownFile = app.vault.getAbstractFileByPath(kanbanFilePath);
if (markdownFile) app.vault.modify(markdownFile, updatedElements.join("\n"));
// 具体的排序规则要去做

// ! 给aliaes添加所有Frame的名称
// 也可以再将标题的前缀标签添加到markdown文件的yaml中的tags里面；（todo）
const allFrameElements = ea.getViewElements().filter(el => el.type === "frame");
await app.fileManager.processFrontMatter(activefile, fm => {
    fm.aliases = [];
    for (el of allFrameElements) {
        fm.aliases.push(el.name);
    }
});
await ea.addElementsToView();



// kanban的设置
const kanbanYaml = "---\n\nkanban-plugin: basic\n\n---\n\n";
const kanbanSetting = {
    "kanban-plugin": "basic",
    "lane-width": kanbanWidth,
    "show-checkboxes": false,
    "archive-with-date": false
};

const kanbanEndText = `\n\n%% kanban:settings\n\`\`\`\n${JSON.stringify(kanbanSetting)}\n\`\`\`\n%%`;
const extrTexts = kanbanYaml + `## [[${fileName.replace(".md", "")}]]\n\n` + frameLinks.join("\n") + kanbanEndText;

if (KanbanPath) {
    app.vault.modify(KanbanPath, extrTexts);
} else {
    file = await app.vault.create(kanbanFilePath, extrTexts);
}
return;






// 
async function processFile(allFrameEls, fileName) {
    try {

        const data = await fs.promises.readFile(kanbanFullPath, 'utf8');
        const lines = data.split('\n');
        const updatedElements = [];
        const regex = new RegExp(`\\[\\[${fileName}\\#(\\^frame).*\\]\\]`);;
        let j = 0;
        for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
                let regex = /^-\s.*?\[\[(.*?\.md)#\^(\w+)=([a-zA-Z0-9-_]+)\|?(.*?)\]\].*/;
                let elLinkStyle = lines[i].match(regex)[2];
                let elID = lines[i].match(regex)[3];
                let elText = lines[i].match(regex)[4] ? lines[i].match(regex)[4] : `未定义名称`;
                console.log(`第${i}行：${elID} ${elLinkStyle} ${elText}`);

                if (elLinkStyle !== 'frame') return;
                for (let selectedEl of allFrameEls) {
                    console.log(selectedEl.id);
                    if (selectedEl.id === elID) {
                        j = j + 1;
                        console.log(selectedEl.name);
                        // 对frame进行标序号的方式，可能没有必要？？？
                        // elText = `Frame${j < 10 ? 0 : ""}${j}_${elText.replace(/Frame\d+_/, "")}`;
                        selectedEl.name = elText;
                        lines[i] = lines[i].replace(/(^-\s.*?\[\[.*?\.md#\^\w+=[a-zA-Z0-9-_]+\|?)(.*?)(\]\].*)/, `$1${elText}$3`);
                    }
                }
            }

            ea.copyViewElementsToEAforEditing(allFrameEls);
            ea.addElementsToView();
            updatedElements.push(lines[i]);
        }
        return updatedElements;
    } catch (error) {
        new Notice("🔴读取文件出现错误！");
        console.error(error);
    }
}

