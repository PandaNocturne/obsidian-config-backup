/*
 * @Author          : RuiShi
 * @Date            : 2024-02-19 13:46:23
 * @LastEditTime    : 2024-02-19 13:46:23
 * @FilePath        : /Extras/Scripts/List_All_Heading2_elements_in_New_File.js
 * @Description     : 根据已有的md文件尽可能平方列出所有可被excalidraw识别的二级标题内容，排列方式为从上往下，从左到右
 */
function List_All_Heading2_elements_in_New_File(tp) {
  const title = tp.file.title;
  const content = tp.file.content;
  if (!content || !content.length) return;

  // 创建一个 Date 对象，表示当前时间
  const currentDate = new Date();

  // 获取当前时间的时间戳（毫秒数）
  const timestamp = currentDate.getTime();

  // 使用正则表达式匹配所有二级标题内容
  const regex = /^##\s+(.+)\n/gm;
  // 匹配到的总数赋值给matches
  const matches = content.match(regex);
  // 若matches为0或空则直接返回，若存在值则将其根号后向下取整并赋值给rowCount
  let rowCount;
  if (!matches || !matches.length ) return;
  rowCount = Math.floor(Math.sqrt(matches.length));

  // 循环匹配所有二级标题
  let match;
  let heading2s = [];
  while ((match = regex.exec(content)) !== null) {
    heading2s.push(match[1]);
  }

  // 对匹配到的二级标题内容进行处理
  const processedHeadings = heading2s.map((heading, index) => {
    const index_x = Math.floor(index / rowCount );
    const index_y = index % rowCount ;
    // 构建 JSON 格式的字符串
    const json1 = `{
      "type": "embeddable",
      "version": 333,
      "versionNonce": 1333333333,
      "isDeleted": false,
      "id": "element${index + 1}",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 0,
      "opacity": 100,
      "angle": 0,
      "x": ${ 790 * index_x },
      "y": ${ 800 * index_y },
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "width": 779.27272827,
      "height": 789.56835209,
      "seed": 333333,
      "groupIds": [],
      "frameId": null,
      "roundness": {
	  "type": 3
      },
      "boundElements": [],
      "updated": ${timestamp},
      "link": `;
    const json2 = `,
      "locked": false,
      "customData": {
        "mdProps": {
          "useObsidianDefaults": false,
          "backgroundMatchCanvas": false,
          "backgroundMatchElement": true,
          "backgroundColor": "#fff",
          "backgroundOpacity": 60,
          "borderMatchElement": true,
          "borderColor": "#fff",
          "borderOpacity": 0,
          "filenameVisible": true
        }
      },
      "validated": true,
      "scale": [
        1,
        1
      ]
    },`;

    // 返回带有标题内容的 JSON 字符串
    return `${json1}"[[${title}#${heading}]]"${json2}`;
  });

  // 将处理后的二级标题内容重新连接成一个字符串，每行之间用换行符分隔
  let result = processedHeadings.join('\n')
  // 使用正则表达式匹配并删除最终内容的最后一个英文逗号
  result = result.replace(/,(?![\w\W])/, '');

  return result;
}

module.exports = List_All_Heading2_elements_in_New_File;
