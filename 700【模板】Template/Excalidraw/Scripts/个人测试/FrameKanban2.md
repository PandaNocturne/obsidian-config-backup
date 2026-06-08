
const fs = require('fs');

let settings = ea.getScriptSettings();

if (!settings["ExcalidrawFameKanbanPath"]) {

    settings = {
        "ExcalidrawFameKanbanPath": {
            value: "Y-图形文件存储/Excalidraw/ExcalidrawFrameKanban.md",
            description: "用于存放Frame的Kanban文件的存储路径<br>ob的路径，如：Y-图形文件存储/Excalidraw/ExcalidrawFrameKanban.md"
        },
        "FameKanbanLaneWidth": {
            value: 330,
            description: "Kanban的宽度，默认值为330"
        },

        // 我在设置中加的选项
        "CustomFilterSymbol": {
            value: false,
            description: "勾选以启用自定义筛选符号功能",
        },
        "FilterSymbolText": {
            value: "#",
            description: "自定义的筛选符号或文本",
        }
        // 我在设置中加的选项

    };
    ea.setScriptSettings(settings);
}

const kanbanFilePath = settings["ExcalidrawFameKanbanPath"].value;
const KanbanLaneWidth = settings["FameKanbanLaneWidth"].value;
  // 获取设置中的选项内容
const useCustomFilter = settings["CustomFilterSymbol"].value;
const filterSymbol = settings["FilterSymbolText"].value;

await ea.addElementsToView(); 
let frameElements = ea.getViewElements().filter(el => el.type === "frame");
const fileName = app.workspace.getActiveFile().name;

// 如果勾选了自定义筛选符号，则在选择生成缩略图或分类与排序之前进行frame筛选
if (useCustomFilter) {
    frameElements = frameElements.filter(el => el.name.includes(filterSymbol));
}

// 检查筛选后的frameElements数组是否为空，为空的话我设置了一个给用户的提示
if (frameElements.length === 0) {
    new Notice("根据筛选规则未匹配到frame，请前往设置或确保frame标题含有自定义筛选符");
    return;
}



// 下面的我就基本没改动什么了

const choices = [true, false, "sort"];

const choice = await utils.suggester(choices, choices, "是否生成缩略图或者排序");
if (typeof choice === "undefined") {
    return; 
}


if (choice === "sort") {

    const basePath = (app.vault.adapter).getBasePath();
    const frameKanbanFullPath = `${basePath}/${kanbanFilePath}`;
    
    const updatedElements = await processFile(frameElements, frameKanbanFullPath, fileName);
    let markdownFile = app.vault.getAbstractFileByPath(kanbanFilePath);
    if (markdownFile) app.vault.modify(markdownFile, updatedElements.join("\n"));
    new Notice(`♻FrameKanban已排序`, 3000);
    return;
}


let frameLinks = [];
if (frameElements.length >= 1) {
    frameElements.sort((a, b) => {
     
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    for (let el of frameElements) {
        let frameLink;
        // !
        if (choice === true) {
            frameLink = `- ⏩[[${fileName}#^frame=${el.id}|${el.name}]]<br>![[${fileName}#^frame=${el.id}]]`;
        } else {
            frameLink = `- ⏩[[${fileName}#^frame=${el.id}|${el.name}]]`;

        }
        frameLinks.push(frameLink);
    }
}
const kanbanYaml = "---\n\nkanban-plugin: basic\n\n---\n\n";

const kanbanSetting = {
    "kanban-plugin": "basic",
    "lane-width": KanbanLaneWidth,
};

const kanbanEndText = `\n\n%% kanban:settings\n\`\`\`\n${JSON.stringify(kanbanSetting)}\n\`\`\`\n%%`;
const extrTexts = kanbanYaml + `## [[${fileName.length > 20 ? `${fileName}|${fileName.slice(0, 16)}......` : fileName}]]\n\n` + frameLinks.join("\n") + kanbanEndText;

let markdownFile = app.vault.getAbstractFileByPath(kanbanFilePath);

if (markdownFile) {
    app.vault.modify(markdownFile, extrTexts);
} else {
    file = await app.vault.create(kanbanFilePath, extrTexts);
}

if (choice === true) {
    new Notice(`🖼FrameKanban已刷新`, 3000);
} else {
    new Notice(`⏩FrameKanban已刷新`, 3000);
}

return;


async function processFile(allFrameEls, frameKanbanFullPath, fileName) {
    try {
        const data = await fs.promises.readFile(frameKanbanFullPath, 'utf8');
        const lines = data.split('\n');
        const updatedElements = [];

        const regex = new RegExp(`${fileName}#`);
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
                        elText = `Frame${j < 10 ? 0 : ""}${j}_${elText.replace(/Frame\d+_/, "")}`;
                        selectedEl.name = elText;
                        ea.addElementsToView();
                        lines[i] = lines[i].replace(/(^-\s.*?\[\[.*?\.md#\^\w+=[a-zA-Z0-9-_]+\|?)(.*?)(\]\].*)/, `$1${elText}$3`);
                    }
                }
            }
            updatedElements.push(lines[i]);
        }
  
        return updatedElements;
    } catch (error) {
        new Notice("🔴读取文件出现错误！");
        console.error(error);
    }
}
