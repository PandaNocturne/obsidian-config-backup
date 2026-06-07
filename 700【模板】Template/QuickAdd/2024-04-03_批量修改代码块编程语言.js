// 参考：[【已解决】批量修改一篇笔记内所有代码块的编程语言](https://forum-zh.obsidian.md/t/topic/29855/3)

module.exports = async (params) => {
  const file = await this.app.workspace.getActiveFile();
  let content = await this.app.vault.read(file);
  // 正则
  let reg = /```.*\n.*?\S[\s\S]*?```$/gm;

  let choices = ["autohotkey", "bash", "basic", "batch", "c", "csharp", "cpp", "css", "docker", "fortran", "golang", "haskell", "html", "ini", "java", "javascript", "json", "kotlin", "less", "lua", "makefile", "markdown", "matlab", "nginx", "objectivec", "perl", "php", "plaintext", "powershell", "python", "r", "ruby", "rust", "sass", "scala", "scheme", "shell", "sql", "swift", "typescript", "vim", "wiki", "yaml"];

  let choice = await params.quickAddApi.suggester(choices, choices);
  if (!choice) return;
  let b = content.match(reg);
  for (let i of b) {
    content = content.replace(i, '```' + choice + '\n' + i.split('\n').slice(1).join('\n'));
  }
  await app.vault.modify(app.vault.getAbstractFileByPath(file.path), content);
};