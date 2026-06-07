/*
 * @Author: 熊猫别熬夜 
 * @Date: 2024-03-25 16:01:58 
 * @Last Modified by: 熊猫别熬夜
 * @Last Modified time: 2024-03-25 16:35:24
 */
const activeFile = app.workspace.getActiveFile();
const choices = ["默认视图", "拓展视图", "中文视图", "英文视图"];
module.exports = async (params) => {
  const quickaddApi = app.plugins.plugins.quickadd.api;
  const choice = await quickaddApi.suggester(choices, choices);

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