async function extractHeadingContent(heading, includeHeading = false, includeSubheadings = false) {
  const { currentFile } = this;
  const file = currentFile;
  const cache = app.metadataCache.getFileCache(file);
  const headings = cache?.headings || [];
  const expectedHeading = heading || "";

  let match = -1;
  let matchLevel = 0;
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const sharps = "#".repeat(h.level);
    const head = `${sharps} ${h.heading}`;
    if (head === expectedHeading) {
      match = i;
      matchLevel = h.level;
      break;
    }
  }
  if (match === -1) {
    return "";
  }

  const fileContent = await app.vault.cachedRead(file);
  const fileContentLines = fileContent.split("\n");
  if (match >= 0) {
    const next = match + 1;
    let nextHeading;
    
    if (includeSubheadings) {
      // 查找下一个同级或更高级的标题
      for (let i = next; i < headings.length; i++) {
        if (headings[i].level <= matchLevel) {
          nextHeading = headings[i];
          break;
        }
      }
    } else {
      // 保持原有逻辑，查找下一个标题
      nextHeading = next >= headings.length ? null : headings[next];
    }

    const matchLine = headings[match].position.start.line;
    let res;
    if (nextHeading) {
      const nextLine = nextHeading.position.start.line;
      // get line from match line to next heading line
      const headingContent = fileContentLines
        .slice(matchLine, nextLine)
        .join("\n");
      res = headingContent;
    } else {
      // get line from match line
      const headingContent = fileContentLines.splice(matchLine).join("\n");
      res = headingContent;
    }
    if (!includeHeading) {
      const headingLine = fileContentLines[matchLine];
      res = res.replace(headingLine, "").trim();
    }
    const el = document.createElement("div");
    el.className = "heading-content-preview";
    // 先处理 ![[]] 语法
    const processedContent = res.replace(/!\[\[(.*?)\]\]/g, (match, p1) => {
        try {
            // 使用 Obsidian 的 parseLinktext 来解析链接
            const { path } = obsidian.parseLinktext(p1);
            // 获取链接的目标文件
            const targetFile = app.metadataCache.getFirstLinkpathDest(path, file.path);
            
            if (targetFile) {
                const resourcePath = app.vault.getResourcePath(targetFile);
                return `<img class="heading-content-img" src="${resourcePath}" alt="${path}">`;
            }
            console.log("Image not found:", path);
            return match;
        } catch (error) {
            console.error("Error processing image:", error);
            return match;
        }
    });
    await obsidian.MarkdownRenderer.render(app, processedContent, el, file.path, null);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .heading-content-preview {
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            background-color: var(--background-primary);
        }
        .heading-content-preview img.heading-content-img {
            max-width: 100%;
            border-radius: 3px;
            margin: 5px 0;
        }
        .heading-content-preview p {
            margin: 8px 0;
            line-height: 1.5;
        }
    `;
    el.prepend(style);

    const innerHTML = el.innerHTML;
    el.remove();
    return innerHTML;
  } else {
    return "";
  }
}

exports.default = {
  name: "extractHeadingContent",
  description: `提取指定标题下的文本内容

  使用方法

  \`\`\`js
  extractHeadingContent('## 你的标题', true) // 包含标题文本
  extractHeadingContent('## 你的标题', false) // 不包含标题文本
  extractHeadingContent('## 你的标题', false, true) // 不包含标题文本，但查找子级
  \`\`\`
  
      `,
  entry: extractHeadingContent,
};
