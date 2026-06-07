function markdownListToTable(markdown) {
  // 解析 Markdown 列表
  const lines = markdown.split('\n').filter(line => line.trim().length > 0);
  const tableData = [];
  let currentRow = [];

  lines.forEach(line => {
    const trimmedLine = line;
    if (/^[-\d]+\.? /.test(trimmedLine)) {
      if (currentRow.length > 0) {
        tableData.push(currentRow);
      }
      currentRow = [trimmedLine.replace(/^[-\d]+\.? /, '')];
    } else if (/^[\s\t]+[-\d]+\.?/.test(line)) {
      currentRow.push(trimmedLine.replace(/^[\s\t]+[-\d]+\.? /, ''));
    }
  });

  if (currentRow.length > 0) {
    tableData.push(currentRow);
  }

  if (tableData.length === 0) {
    return '';
  }

  // 创建表格头部
  const columnCount = Math.max(...tableData.map(row => row.length));
  let table = '|';
  for (let i = 0; i < columnCount; i++) {
    table += ` 列${i + 1} |`;
  }
  table += '\n|';
  for (let i = 0; i < columnCount; i++) {
    table += ' --- |';
  }

  // 创建表格内容
  tableData.forEach(rowData => {
    table += '\n|';
    rowData.forEach(cellData => {
      table += ` ${cellData} |`;
    });
    for (let i = rowData.length; i < columnCount; i++) {
      table += ' <|'; // 填充空单元格
    }
  });

  return table;
}

function copyToClipboard(texts) {
  const txtArea = document.createElement('textarea');
  txtArea.value = texts;
  document.body.appendChild(txtArea);
  txtArea.select();
  if (document.execCommand('copy')) {
    console.log('copy to clipboard.');
  } else {
    console.log('fail to copy.');
  }
  document.body.removeChild(txtArea);
}

module.exports = async () => {
  const editor = await app.workspace.activeEditor.editor;
  const selection = editor.getSelection();
  const table = markdownListToTable(selection);
  copyToClipboard(table);
  new Notice('List2Table 成功，已复制到剪切板');
};