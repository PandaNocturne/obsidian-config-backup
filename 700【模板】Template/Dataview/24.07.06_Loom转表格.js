let {
  headers,
} = input;


const fs = require('fs');
const path = require('path');

// 读取loom文件
const filePath = path.join('d:', 'PandaNotes', '100【收集】Inbox', '【LOOM】办公软件笔记.loom');
const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 转换函数
const convertTable = (jsonData) => {
  const columns = jsonData.model.columns.map(col => col.content || col.id);
  const rows = jsonData.model.rows.map(row =>
    row.cells.map(cell => {
      if (Array.isArray(cell.content)) {
        return cell.content.join(', ').replace(/\n/g, '\n'); // 将数组内容转换为字符串并转义换行符
      } else if (typeof cell.content === 'string') {
        return cell.content.replace(/\n/g, '\n'); // 转义换行符
      } else {
        return cell.value || cell.tagIds || cell.path || cell.alias || cell.id;
      }
    })
  );
  return [columns, rows];
};

// 只保留特定列
const filterColumns = (columns, rows, columnNames) => {
  const indices = columnNames.map(name => columns.indexOf(name));
  const filteredRows = rows.map(row => indices.map(index => row[index]));
  return [columnNames, filteredRows];
};

const result = convertTable(jsonData);
const filteredResult = filterColumns(result[0], result[1], headers);
const [filteredColumns, filteredRows] = filteredResult;

// 输出dv 表格
dv.table(filteredColumns, filteredRows);