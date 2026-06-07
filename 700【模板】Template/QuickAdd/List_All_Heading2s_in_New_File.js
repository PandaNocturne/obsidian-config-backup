/*
 * @Author          : RuiShi
 * @Date            : 2024-02-19 13:21:13
 * @LastEditTime    : 2024-02-19 13:21:13
 * @FilePath        : /Extras/Scripts/List_All_Heading2s_in_New_File.js
 * @Description     : 根据已有的md文件列出所有二级标题内容
 */
function List_All_Heading2s_in_New_File(tp) {
  const title = tp.file.title;
  const content = tp.file.content;
  if (!content || !content.length) return;

  // 使用正则表达式匹配所有二级标题内容
  const regex = /^##\s+(.+)\n/gm;
  let match;
  let heading2s = [];

  // 循环匹配所有二级标题
  while ((match = regex.exec(content)) !== null) {
    heading2s.push(match[1]);
  }

  // 对匹配到的二级标题内容进行处理
  const processedHeadings = heading2s.map((heading, index) => {
    // 添加文件名和序号
    const modifiedHeading = `[[${title}#${heading}]] ^element${index + 1}`;
    return modifiedHeading;
  });

  // 将处理后的二级标题内容重新连接成一个字符串，每行之间用两个换行符分隔
  return processedHeadings.join('\n\n');
}

module.exports = List_All_Heading2s_in_New_File;
