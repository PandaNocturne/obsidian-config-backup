<%*
const compPlugin = app.plugins.plugins["components"];
const copyNewFileLink = true;

// 模板的前缀，不需要的话可以改成空的 ""
const prefix = "comp-";

// 标题宽度
const titleWidth = 640;

// 页面数量限制
const pageLimit = 32;

if (!compPlugin) {
  new Notice("请安装 components 插件");
  return;
}

const compFolder = compPlugin.settings.folder;
console.log(compFolder)

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

// ---

const dbCompId = uuidv4();

// 用 OB 原生 API 获取当前活动笔记的路径、文件名、父级名称
const currentFolder = app.workspace.getActiveFile().parent.path;
const currentTitle = app.workspace.getActiveFile().basename;
const folderName = app.workspace.getActiveFile().parent.name;

const databaseComp = {
    "id": dbCompId,
    "type": "dynamicDataView",
    "titleAlign": "center",
    "tabTitle": "",
    "maxWidthRatio": -1,
    "showBorder": false,
    "showShadow": false,
    "createAt": new Date().toISOString(),
    "updateAt": new Date().toISOString(),
    "viewType": "table",
    "properties": [
        {
          "id": "__componentsTitleProperty_0x7c00",
          "name": "文件名",
          "type": "text",
          "isShow": true,
          "wrap": false,
          "options": {
            "width": "420",
            "pinned": "left"
          }
        }],
    "templates": [],
    "groups": [],
    "viewOptions": {
      "openPageIn": "tab",
      "itemSize": "components--page-card-medium",
      "showPropertyName": false,
      "hideFileName": false,
      "wrapFileName": false,
      "cover": {
        "type": "pageFirstImage",
        "value": "",
        "fit": "contains"
      },
      "headColumnWidth": titleWidth.toString(),
    },
    "filter": {
      "id": uuidv4(),
      "type": "group",
      "operator": "and",
      "conditions": [
        {
          "id": uuidv4(),
          "type": "filter",
          "operator": "contains",
          "property": "${file.path}",
          "value": currentFolder + "/",
          "conditions": []
        },
		{
          "id": uuidv4(),
			"type": "filter",
			"operator": "equals",
			"property": "${file.extension}",
			"value": "md",
			"conditions": []
		},
        {
          "id": uuidv4(),
          "type": "filter",
          "operator": "not_equals",
          "property": "${file.basename}",
          "value": currentTitle,
          "conditions": []
        }
      ]
    },
    
    "newPageLocation": {
      "location": currentFolder
    },
    "loadLimitPerPage": pageLimit
  };


// ---

const uuid = uuidv4();

const rootComp = {
    "id": uuid,
    "type": "multi",
    "titleAlign": "center",
    "tabTitle": "",
    "maxWidthRatio": -1,
    "showBorder": true,
    "showShadow": false,
    "createAt": new Date().toISOString(),
    "updateAt": new Date().toISOString(),
    "components": [],
    "layoutType": "column"
  }

const CompObj = {
  "components": [ rootComp ],
  "rootComponentId": rootComp.id
};

rootComp.components.push({"componentId": databaseComp.id});
CompObj["components"].push(databaseComp);

const newFileContent = JSON.stringify(CompObj, null, 2);
// console.log(newFileContent);

// ---

let newFilename = await tp.system.prompt("请输入模板名称");
if (!newFilename) {
  new Notice("取消创建");
  return;
}

newFilename = "comp-" + newFilename + ".components"

const newFileFullPath = `${compFolder}/${newFilename}`;

// TP 似乎只能创建 md 文件
// await tp.file.create_new(newFileContent, newFilename, false, compFolder);

let compEmbededLink = `\n![[${newFileFullPath}]]`;

const file = tp.file.find_tfile(newFilename);
if (file) {
	// app.workspace.getLeaf("tab").openFile(file);
	new Notice("同名模板文件已存在，直接插入");
	compEmbededLink = `![[${file.path}]]`;
} else {
	app.vault.create(`${newFileFullPath}`, newFileContent);
}

if (copyNewFileLink) {
  // console.log(`新模板文件已创建（已复制入剪贴板）`)
  navigator.clipboard.writeText(`![[${newFileFullPath}]]`)
  new Notice("已复制新文件链接到剪贴板!");
}

// 在坐标插入
const edi = app.workspace.activeEditor.editor;
edi.replaceRange(compEmbededLink, edi.getCursor());


-%>