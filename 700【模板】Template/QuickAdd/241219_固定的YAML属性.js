// ! 固定的YAML属性
const fixedProperties = ["uid", "banner", "title", "aliases", "tags", "url", "description", 'cssclasses', "date", "created", "modified"];
module.exports = async (QuickAdd, settings, params) => {
  // 保存文件
  await app.commands.executeCommandById('editor:save-file');
  await new Promise(r => setTimeout(r, 300));

  // 获取当前文件信息
  const file = app.workspace.getActiveFile();
  if (!file) {
    return; // 如果获取不到文件信息，则不执行后续代码
  }
  const ctime = new Date(file.stat["ctime"]);
  const mtime = new Date(file.stat["mtime"]);

  // 获取文件缓存的元数据
  const cachedMetadata = await app.metadataCache.getFileCache(file);
  // 如果没有 headings 则为空数组
  const headings = cachedMetadata?.headings || [];

  // 处理 YAML 属性  
  await app.fileManager.processFrontMatter(file, fm => {
    fixedProperties.forEach(prop => {
      if (!fm[prop]) {
        fm[prop] = ''; // 设置默认值为空字符串
      }
    });

    // ! 处理 文件名的tags 和 title
    //  如果文件名的格式是
    // 【标签】笔记名称
    // 的格式，则title只提取<笔记名称>，需额外复制<标签>至tags
    // 另外，【标签】的格式有如下几种
    // 【标签+标签】即以+号分割标签
    // 【标签-子标签】即-号为子标签，转换格式为“标签/子标签”，即替换-为/符号

    // 需要的步骤：
    // step1：正则提取 <标签> 和 <笔记名称>
    // step2：分离标签→将标签以+号分割
    // step3：将每组标签中的-替换为/
    // step4: 赋值给tags为数组，<笔记名称>赋值给title

    // Step 1: 正则提取 <标签> 和 <笔记名称>
    const fileName = file.basename.replace(/^[\d\.\_\-]+/, '');
    const match = fileName.match(/【(.+?)】(.+)/);
    let newTags = [];
    let noteName = fileName;

    if (match) {
      const rawTags = match[1];
      noteName = match[2].trim();

      // Step 2: 分离标签→将标签以+号分割
      newTags = rawTags.split('+').map(tag => {
        // Step 3: 将每组标签中去除空格后，将-替换为/
        return tag.replace(/\s/g, '').replace(/-/g, '/');
      });
    }


    // Step 4: 合并新旧tags，赋值给tags为数组，<笔记名称>赋值给title
    fm.tags = Array.isArray(fm.tags) ? [...new Set([...fm.tags, ...newTags])] : newTags;
    let newTitle = noteName;

    //! 设置 title 为第一个一级标题或文件名，且如果更新自动移动到aliases中
    // 从第一个一级标题获取，如果有多个一级标题则还是文件名
    if (headings) {
      const levelOneHeadings = headings.filter(h => h.level === 1);
      if (levelOneHeadings.length === 1) {
        newTitle = levelOneHeadings[0].heading;
      }
    }

    fm.title = newTitle;

    if (fm.title) {
      if (!Array.isArray(fm.aliases)) {
        fm.aliases = [];
      }
      if (!fm.aliases.includes(fm.title)) {
        fm.aliases.push(fm.title);
      }
    }

    // ! 设置一些日期属性
    // 设置 uid 为 YYYYMMDDHHmmSSS 格式
    if (!fm["uid"]) {
      fm.uid = moment().format('YYYYMMDDHHmmssSSS');
    }
    // 如果 date 不存在，则设置为 ctime 格式化后的值
    if (!fm["date"]) {
      fm["date"] = moment(ctime).format('YYYY-MM-DD');
    }
    // 如果 created 不存在，则设置为 ctime 格式化后的值
    if (!fm["created"]) {
      fm["created"] = moment(ctime).format('YYYY-MM-DD HH:mm:ss');
    }

    // 设置 modified 为 mtime 格式化后的值
    fm["modified"] = moment(mtime).format('YYYY-MM-DD HH:mm:ss');

    // !去除所有数组属性中的重复值
    for (const key in fm) {
      if (Array.isArray(fm[key])) {
        fm[key] = [...new Set(fm[key])];
      }
    }

  });
};