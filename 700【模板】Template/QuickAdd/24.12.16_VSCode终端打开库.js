
// ref: [PKMer_Obsidian 插件：QuickAdd 自动化操作的编辑器]( https://pkmer.cn/show/20230508001129 )
const exec = require('child_process');
const quickAddApi = app.plugins.plugins.quickadd.api;

const basePath = app.vault.adapter.basePath.replaceAll("\\", "/");

module.exports = async (params) => {
  const choices = [`code`, `cursor`, `antigravity`,`trae`];
  const choice = await quickAddApi.suggester(choices, choices);
  if (!choice) return;
  try {
    const line = app.workspace.activeLeaf.view.editor.getCursor().line;
    const filePath = app.workspace.getActiveFile().path;
    const fileFullPath = app.vault.adapter.getFullPath(filePath);

    exec.exec(`${choice} -n "${basePath}"`);
    setTimeout(() => {
      exec.exec(`${choice} -g "${fileFullPath}:${line + 1}"`);
    }, 1000);
    new Notice(`🟢正在用${choice}打开Obsidian库`);
  } catch (e) {
    new Notice(`🔴 ${e.message}`);
  }
};