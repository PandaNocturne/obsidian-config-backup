module.exports = async () => {
  const { exec } = require("child_process");
  const file = app.workspace.getActiveFile();
  const fileFullPath = app.vault.adapter.getFullPath(file.path);
  const command = `prettier --write --semi=true --tab-width=4 "${fileFullPath}"`;

  // 执行命令
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行命令时出错: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`命令执行错误输出: ${stderr}`);
      return;
    }
    console.log(`命令执行成功: ${stdout}`);
    new Notice("Prettier格式化成功！");
  });
};