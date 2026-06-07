module.exports = async (params) => {
  document.addEventListener('keydown', function (event) {
    if (event.key == 'Tab') {
      console.log('Tab key pressed');
      handleTabKey();
    }
  });
};
// // 处理Tab键的逻辑
function handleTabKey(event) {
  const { editor } = app.workspace.activeEditor;
  let cursor = editor.getCursor();
  let line = editor.getLine(cursor.line);
  let start = cursor.ch;
  let end = cursor.ch;
  let customChars = ['"', "'", '`', "’", "”", "“"]; // 可自定义的字符

  if (customChars.includes(line[start - 1]) && customChars.includes(line[end])) {
    // 移动光标
    editor.setCursor({ line: cursor.line, ch: start });
    // 取消缩进
    const newLine = line.replace(/^\t/, '');
    editor.replaceRange(newLine, { line: editor.getCursor().line, ch: 0 }, { line: editor.getCursor().line, ch: line.length });

  } else if (customChars.includes(line[end])) {
    // 移动光标
    editor.setCursor({ line: cursor.line, ch: end + 1 });
    // 取消缩进
    const newLine = line.replace(/^\t/, '');
    editor.replaceRange(newLine, { line: editor.getCursor().line, ch: 0 }, { line: editor.getCursor().line, ch: line.length });

  }
}


