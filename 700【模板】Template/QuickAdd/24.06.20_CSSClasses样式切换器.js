const activeFile = app.workspace.getActiveFile();
const choices = ["默认视图", "list-card", "无序-表格化阅览", "无序-时间轴阅览"];
module.exports = async (params) => {
  const quickaddApi = app.plugins.plugins.quickadd.api;
  const choice = await quickaddApi.suggester(choices, choices);
  if (!choice) return;

  await app.fileManager.processFrontMatter(activeFile, fm => {
    if (!fm["cssclasses"]) fm["cssclasses"] = [];
    // 清除所有选项
    fm["cssclasses"] = fm["cssclasses"].filter(item => !choices.includes(item));

    // 根据选择的选项添加对应的视图
    for (let i = 1; i < choices.length; i++) {
      if (choice === choices[i]) {
        fm["cssclasses"].push(choices[i]);
        return;
      }
    }
  });
  console.log("运行完成");
};