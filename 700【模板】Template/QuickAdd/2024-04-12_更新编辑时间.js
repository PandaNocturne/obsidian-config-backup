module.exports = {
  entry: async (QuickAdd, settings, params) => {
    const file = app.workspace.getActiveFile();
    const yaml = settings["Properties"];
    // 保存文件
    await app.commands.executeCommandById('editor:save-file');
    await new Promise(r => setTimeout(r, 300));
    await app.fileManager.processFrontMatter(file, fm => {
      if (!fm[yaml]) {
        fm[yaml] = "";
        const ctime = new Date(file.stat[settings["Type"]]);
        fm[yaml] = moment(ctime).format(settings["Format"]);
      }
      if (settings["Type"] === "mtime") {
        const ctime = new Date(file.stat[settings["Type"]]);
        fm[yaml] = moment(ctime).format(settings["Format"]);
      }
    });
  },
  settings: {
    name: "插入文档的编辑或创建时间",
    author: "熊猫别熬夜",
    options: {
      "Type": {
        type: "select",
        defaultValue: "ctime",
        options: [
          "ctime",
          "mtime",
        ],
      },
      "Properties": {
        type: "text",
        defaultValue: "date",
      },
      "Format": {
        type: "text",
        defaultValue: "YYYY-MM-DD",
      },
    }
  }
};

