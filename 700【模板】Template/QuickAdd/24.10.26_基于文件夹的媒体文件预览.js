
module.exports = async () => {
  const quickAddApi = app.plugins.plugins.quickadd.api;
  const path = require('path');

  // 定义所有可用的媒体类型
  const allAttachmentTypes = ['svg', 'gif', 'png', 'jpeg', 'jpg', 'webp', 'mp4', 'bmp', 'tiff', 'ico'];
  const itemsPerPage = 18;
  const maxDisplayedImages = itemsPerPage * 50; // 新增：限制显示图片的数量

  // 第一步：选择文件夹路径
  // 获取ob的目录路径
  const listPaths = await app.vault.getAllFolders().map(f => f.path);
  // listPaths.unshift("./"); // 获取全部笔记的图片，全部加载比较卡

  let choicePath = "";
  // 获取笔记的基本路径
  try {
    const activeFilePath = await app.workspace.getActiveFile().path;
    listPaths.unshift("当前Index笔记");
    // const fileName = path.basename(activeFilePath);
    // const isFolderNote = path.basename(path.dirname(activeFilePath)) === fileName.replace(".md", "").replace(".canvas", "");
    // if (isFolderNote) {
    //   choicePath = path.dirname(activeFilePath);
    // } else {
    //   listPaths.unshift(path.dirname(activeFilePath));
    // }
    listPaths.unshift(path.dirname(activeFilePath));
  } catch (error) {
    console.error("获取活动文件路径时出错:", error);
  }

  // 选择文件夹路径
  if (!choicePath) {
    choicePath = await quickAddApi.suggester(listPaths, listPaths);
  }
  if (!choicePath) return;

  console.log(`选择路径: ${choicePath}`);

  // 第二步：选择要显示的媒体文件类型
  // 创建包含"全部类型"选项的列表
  const typeOptions = ['全部类型', ...allAttachmentTypes];
  // 设置默认选中的选项（只勾选"全部类型"）
  const defaultSelected = ['全部类型'];
  const selectedTypes = await quickAddApi.checkboxPrompt(typeOptions, defaultSelected);
  if (!selectedTypes || selectedTypes.length === 0) {
    new Notice("未选择任何媒体类型，操作已取消");
    return;
  }

  // 处理选择的类型
  let attachmentTypes;
  if (selectedTypes.includes('全部类型')) {
    attachmentTypes = allAttachmentTypes;
    console.log(`选择了全部类型: ${attachmentTypes.join(', ')}`);
  } else {
    attachmentTypes = selectedTypes;
    console.log(`选择的媒体类型: ${attachmentTypes.join(', ')}`);
  }

  // 记录开始时间
  const startTime = performance.now();

  // 获取文件数据
  const files = await app.vault.getFiles();
  let fileData = [];
  if (choicePath === "当前Index笔记") {
    fileData = getMediaPathsbyMarkdwonPath(files, attachmentTypes);
  } else {
    fileData = getMediaPathsbyFolderPath(files, choicePath, attachmentTypes);
  }
  console.log(`获取了${fileData.length}个媒体文件`);

  // 新增：按照新→旧排序显示
  // 先为每个fileData项添加ctime属性
  fileData.forEach(item => {
    const file = app.vault.getFileByPath(item.imgPath);
    if (file && file.stat && typeof file.stat.ctime === "number") {
      item._ctime = file.stat.ctime;
    } else {
      item._ctime = 0;
    }
  });
  // 按ctime降序排序（新→旧）
  fileData.sort((a, b) => b._ctime - a._ctime);

  // 新增：限制显示图片的数量
  if (fileData.length > maxDisplayedImages) {
    fileData = fileData.slice(0, maxDisplayedImages);
    console.log(`限制显示图片数量为${maxDisplayedImages}`);
    new Notice(`媒体文件数量过多，限制到${maxDisplayedImages}`);
  }

  // 定义样式并注入到文档中（只注入一次）
  const styleId = 'media-preview-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .card-container {
         display: grid;
         grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
         align-content: start;
         gap: 15px;
         padding: 20px;
         background: var(--background-primary);
         overflow-y: auto;
         flex: 1;
       }
       .file-card {
         border: 1px solid var(--background-modifier-border);
         border-radius: 8px;
         overflow: hidden;
         background: var(--background-secondary);
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         min-height: 200px;
         position: relative;
         box-shadow: 0 2px 4px rgba(0,0,0,0.1);
         transition: transform 0.2s;
       }
       .file-card:hover {
         transform: scale(1.02);
       }
       .media-element, .image-element {
         max-width: 100%;
         max-height: 200px;
         object-fit: contain;
         cursor: pointer;
       }
       .search-button {
         position: absolute;
         bottom: 5px;
         right: 5px;
         background: var(--background-primary);
         border: 1px solid var(--background-modifier-border);
         border-radius: 4px;
         padding: 2px 5px;
         cursor: pointer;
         opacity: 0.6;
         transition: opacity 0.2s;
       }
       .search-button:hover {
         opacity: 1;
       }
       .pagination-container {
         display: flex;
         justify-content: center;
         align-items: center;
         padding: 10px 20px;
         gap: 10px;
         background: var(--background-primary);
         border-bottom: 1px solid var(--background-modifier-border);
         z-index: 100;
         flex-shrink: 0;
       }
      .pagination-button {
        padding: 5px 12px;
        border-radius: 4px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        cursor: pointer;
      }
      .pagination-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .pagination-button.active {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      .media-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        cursor: pointer;
      }
      .media-modal-overlay img, .media-modal-overlay video {
        max-width: 90%;
        max-height: 90%;
        box-shadow: 0 0 20px rgba(0,0,0,0.5);
      }
    `;
    document.head.appendChild(style);
  }

  // 获取初始 leaf
  const isFile = await app.workspace.getActiveFile();
  const leaf = await app.workspace.getLeaf(Boolean(isFile));
  await app.workspace.setActiveLeaf(leaf);

  await displayMedia({ fileData, attachmentTypes, itemsPerPage, leaf });

  // !计算加载时间
  const endTime = performance.now();
  const loadTime = ((endTime - startTime) / 1000).toFixed(2);

  // !显示加载时间
  new Notice(`✔ ${fileData.length}个文件已加载完毕! 加载时间: ${loadTime}秒`);



  async function displayMedia({ fileData, attachmentTypes, itemsPerPage = 10, page: currentPage = 1, leaf }) {
    // !计算总页数
    const totalPages = Math.ceil(fileData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = fileData.slice(startIndex, endIndex);

    // ! 使用传入的 leaf，不再重复获取
    if (!leaf || leaf.view === undefined) {
      new Notice("预览页面已关闭，操作停止");
      return;
    }

    // 获取容器，改用更通用的方式
    const container = leaf.view.contentEl || leaf.view.containerEl.children[1] || leaf.view.containerEl;
    container.innerHTML = '';

    // 强制容器为 flex 布局，防止内部内容滚动
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';
    container.style.overflow = 'hidden';

    // 添加分页控件到顶部
    if (fileData.length > itemsPerPage) {
      createPaginationControls({ fileData, totalPages, currentPage, itemsPerPage, container, attachmentTypes, leaf });
    }

    // 创建卡片容器
    const cardContainer = document.createElement("div");
    cardContainer.className = "card-container";

    // 确保卡片容器滚动到顶部
    cardContainer.scrollTop = 0;

    // 使用 Promise.all 并行处理文件卡片创建
    const cardPromises = paginatedData.map(async ({ imgPath }) => {
      const file = await app.vault.getFileByPath(imgPath);
      return createFileCard(file, attachmentTypes);
    });

    const cards = await Promise.all(cardPromises);
    cards.forEach(card => cardContainer.appendChild(card));

    container.appendChild(cardContainer);
  };

  function createFileCard(file, attachmentTypes) {
    const card = document.createElement("div");
    card.className = "file-card";

    let mediaElement = createMediaElement(file, attachmentTypes);
    if (mediaElement) {
      card.appendChild(mediaElement);
      const searchButton = createSearchButton(file);
      card.appendChild(searchButton);
    }

    return card;
  }

  function createPaginationControls({ fileData, totalPages, currentPage, itemsPerPage, container, attachmentTypes, leaf }) {
    const paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";

    // 上一页
    const prevButton = document.createElement("button");
    prevButton.className = "pagination-button";
    prevButton.textContent = "上一页";
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
      if (currentPage > 1) {
        displayMedia({ fileData, attachmentTypes, itemsPerPage, page: currentPage - 1, leaf });
      }
    });
    paginationContainer.appendChild(prevButton);

    // 分页页码
    const pageButtonsList = document.createElement("div");
    pageButtonsList.style.display = "flex";
    pageButtonsList.style.gap = "5px";
    pageButtonsList.style.margin = "0 10px";
    pageButtonsList.style.flexWrap = "wrap";
    pageButtonsList.style.justifyContent = "center";

    const maxVisiblePages = 5; // 限制显示的页码数量
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 第一页
    if (startPage > 1) {
      addPageButton(1, pageButtonsList, currentPage === 1);
      if (startPage > 2) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "...";
        pageButtonsList.appendChild(ellipsis);
      }
    }

    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
      addPageButton(i, pageButtonsList, i === currentPage);
    }

    // 最后一页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "...";
        pageButtonsList.appendChild(ellipsis);
      }
      addPageButton(totalPages, pageButtonsList, currentPage === totalPages);
    }

    paginationContainer.appendChild(pageButtonsList);

    // 下一页
    const nextButton = document.createElement("button");
    nextButton.className = "pagination-button";
    nextButton.textContent = "下一页";
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
      if (currentPage < totalPages) {
        displayMedia({ fileData, attachmentTypes, itemsPerPage, page: currentPage + 1, leaf });
      }
    });
    paginationContainer.appendChild(nextButton);

    // 辅助函数：创建页码按钮
    function addPageButton(pageNum, parent, isActive) {
      const btn = document.createElement("button");
      btn.className = `pagination-button${isActive ? ' active' : ''}`;
      btn.textContent = pageNum;
      btn.addEventListener("click", () => {
        if (!isActive) {
          displayMedia({ fileData, attachmentTypes, itemsPerPage, page: pageNum, leaf });
        }
      });
      parent.appendChild(btn);
    }

    // 将分页控件添加到 container 中
    container.appendChild(paginationContainer);
  }

  function createMediaElement(file, attachmentTypes) {
    let mediaElement;
    const fileExtension = path.extname(file.path).split('.').pop().toLowerCase();
    if (attachmentTypes.includes(fileExtension)) {
      if (fileExtension === "mp4") {
        mediaElement = document.createElement("video");
        mediaElement.src = app.vault.getResourcePath(file);
        mediaElement.className = "media-element";
        mediaElement.controls = true;
      } else {
        mediaElement = document.createElement("img");
        mediaElement.className = "image-element";
        mediaElement.src = app.vault.getResourcePath(file);
        // 实现懒加载
        mediaElement.loading = 'lazy';
        mediaElement.addEventListener("click", () => {
          openMediaInModal(mediaElement.src);
        });
      }
    }
    return mediaElement;
  }

  function createSearchButton(file) {
    const searchButton = document.createElement("button");
    searchButton.innerHTML = "🔍";
    searchButton.className = "search-button";
    searchButton.style.position = "absolute";
    searchButton.style.bottom = "10px";
    searchButton.style.right = "10px";
    searchButton.addEventListener("click", () => {
      const searchQuery = encodeURIComponent(file.name);
      const searchUrl = `obsidian://search?vault=${encodeURIComponent(app.vault.getName())}&query="${searchQuery}"`;
      window.open(searchUrl, '_blank');
    });
    return searchButton;
  }

  function openMediaInModal(src) {
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "media-modal-overlay";

    let mediaElement;
    if (src.endsWith(".mp4")) {
      mediaElement = document.createElement("video");
      mediaElement.controls = true;
    } else {
      mediaElement = document.createElement("img");
    }
    mediaElement.src = src;
    modalOverlay.appendChild(mediaElement);

    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
        window.isModalOpen = false;
      }
    });

    document.body.appendChild(modalOverlay);
  }

  function getFilePath(files, baseName) {
    let files2 = files.filter(f => path.basename(f.path).replace(".md", "") === path.basename(baseName).replace(".md", ""));
    let filePath = files2.map((f) => f.path);
    return filePath[0];
  }

  function getMediaPathsbyFolderPath(files, folderPath, attachmentTypes, isolatedFile = true) {
    const selectFiles = folderPath === "./"
      ? files
      : files.filter(file => file.path.startsWith(`${folderPath}`));
    let allImgs = [];

    for (const file of selectFiles) {
      const cache = app.metadataCache.getFileCache(file);
      if (!cache) continue;

      let embeds = [];
      let links = [];

      const noteName = path.basename(file.path, path.extname(file.path));
      if (cache.embeds) {
        embeds = cache.embeds.map(e => ({
          link: e.link,
          position: e.position,
          noteName: noteName
        }));
      }
      if (cache.links) {
        links = cache.links.map(l => ({
          link: l.link,
          position: l.position,
          noteName: noteName
        }));
      }

      const allLinks = [...embeds, ...links];

      const media = allLinks.filter(link => {
        const fileExtension = path.extname(link.link).split('.').pop();
        return attachmentTypes.includes(fileExtension);
      });
      // console.log(`媒体文件: ${media}`);
      media.forEach(i => {
        const imgPath = getFilePath(files, i.link);
        if (imgPath) {
          allImgs.push({
            imgPath,
            notePath: file.path,
            position: i.position,
            noteName: i.noteName
          });
        }
      });

      // 检查文件本身是否是图片文件
      const fileExtension = path.extname(file.path).split('.').pop();
      if (attachmentTypes.includes(fileExtension) && isolatedFile) {
        allImgs.push({
          imgPath: file.path,
          notePath: file.path,
          position: null,
          noteName: noteName
        });
      }
    }

    // 改进的去重逻辑：基于imgPath去重，但保留所有引用信息
    const mediaMap = new Map();
    allImgs.forEach(item => {
      if (mediaMap.has(item.imgPath)) {
        // 如果文件已存在，添加引用信息
        const existing = mediaMap.get(item.imgPath);
        if (!existing.references) {
          existing.references = [{
            notePath: existing.notePath,
            position: existing.position,
            noteName: existing.noteName
          }];
        }
        existing.references.push({
          notePath: item.notePath,
          position: item.position,
          noteName: item.noteName
        });
      } else {
        // 新文件，直接添加
        mediaMap.set(item.imgPath, {
          imgPath: item.imgPath,
          notePath: item.notePath,
          position: item.position,
          noteName: item.noteName,
          references: []
        });
      }
    });

    const uniqueMedia = Array.from(mediaMap.values());
    console.log(`找到的唯一图片数量: ${uniqueMedia.length}`);
    return uniqueMedia;
  }

  function getMediaPathsbyMarkdwonPath(files, attachmentTypes) {
    // 获取当前活动文件和缓存的元数据
    const file = app.workspace.getActiveFile();
    if (!file) {
      console.error("无法获取当前活动文件");
      return [];
    }

    const cachedMetadata = app.metadataCache.getFileCache(file);
    if (!cachedMetadata) {
      console.error("无法获取文件缓存");
      return [];
    }

    // 提取链接和嵌入的文件
    const allLinks = [
      ...(cachedMetadata.links || []).map(l => l.link),
      ...(cachedMetadata.embeds || []).map(e => e.link)
    ];

    const selectFiles = allLinks
      .map(note => getFilePath(files, note))
      .filter(Boolean);
    selectFiles.push(file.path);

    const allImgs = selectFiles.flatMap(filePath => {
      const file = app.vault.getFileByPath(filePath);
      const cache = app.metadataCache.getFileCache(file);
      if (!cache) return [];

      const noteName = path.basename(filePath, path.extname(filePath));
      const allFileLinks = [
        ...(cache.embeds || []).map(e => ({
          link: e.link,
          position: e.position,
          noteName: noteName
        })),
        ...(cache.links || []).map(l => ({
          link: l.link,
          position: l.position,
          noteName: noteName
        }))
      ];

      return allFileLinks
        .filter(link => attachmentTypes.includes(path.extname(link.link).slice(1)))
        .map(i => {
          const imgPath = getFilePath(files, i.link);
          return imgPath ? {
            imgPath,
            notePath: filePath,
            position: i.position,
            noteName: i.noteName
          } : null;
        })
        .filter(Boolean);
    });

    // 改进的去重逻辑：基于imgPath去重，但保留所有引用信息
    const mediaMap = new Map();
    allImgs.forEach(item => {
      if (mediaMap.has(item.imgPath)) {
        // 如果文件已存在，添加引用信息
        const existing = mediaMap.get(item.imgPath);
        if (!existing.references) {
          existing.references = [{
            notePath: existing.notePath,
            position: existing.position,
            noteName: existing.noteName
          }];
        }
        existing.references.push({
          notePath: item.notePath,
          position: item.position,
          noteName: item.noteName
        });
      } else {
        // 新文件，直接添加
        mediaMap.set(item.imgPath, {
          imgPath: item.imgPath,
          notePath: item.notePath,
          position: item.position,
          noteName: item.noteName,
          references: []
        });
      }
    });

    const uniqueMedia = Array.from(mediaMap.values());
    console.log(`找到的唯一图片数量: ${uniqueMedia.length}`);
    return uniqueMedia;
  }
};