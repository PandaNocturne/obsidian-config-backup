
module.exports = async () => {
  const quickAddApi = app.plugins.plugins.quickadd.api;
  const path = require('path');
  const attachmentTypes = ['svg', 'gif', 'png', 'jpeg', 'jpg', 'webp', 'mp4', 'bmp', 'tiff', 'ico'];
  const itemsPerPage = 30;
  const maxDisplayedImages = itemsPerPage * 50; // 新增：限制显示图片的数量

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

  // 判断是否是文件夹笔记，如果为FolderNote则直接使用当前路径，否则弹出文件夹选择器
  if (!choicePath) {
    choicePath = await quickAddApi.suggester(listPaths, listPaths);
  }
  if (!choicePath) return;

  console.log(`选择路径: ${choicePath}`);

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

  // 新增：限制显示图片的数量
  if (fileData.length > maxDisplayedImages) {
    fileData = fileData.slice(0, maxDisplayedImages);
    console.log(`限制显示图片数量为${maxDisplayedImages}`);
    new Notice(`媒体文件数量过多，限制到${maxDisplayedImages}`)
  }

  await displayMedia({ fileData, attachmentTypes, itemsPerPage });

  // 创建一个 <style> 元素
  const style = document.createElement('style');
  // 定义 CSS 样式
  const css = `
  `;

  // 将 CSS 样式添加到 <style> 元素中
  style.appendChild(document.createTextNode(css));

  // 将 <style> 元素添加到文档的 <head> 中
  document.head.appendChild(style);

  // !计算加载时间
  const endTime = performance.now();
  const loadTime = ((endTime - startTime) / 1000).toFixed(2);

  // !显示加载时间
  new Notice(`✔ ${fileData.length}个文件已加载完毕! 加载时间: ${loadTime}秒`);



  async function displayMedia({ fileData, attachmentTypes, itemsPerPage = 10, page: currentPage = 1 }) {
    // !计算总页数
    const totalPages = Math.ceil(fileData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = fileData.slice(startIndex, endIndex);

    // ! 新建tab页
    const isFile = await app.workspace.getActiveFile();
    const leaf = await app.workspace.getLeaf(Boolean(isFile));
    await app.workspace.setActiveLeaf(leaf);
    const container = leaf.view.containerEl.children[1];
    container.innerHTML = '';

    // 创建卡片容器
    const cardContainer = document.createElement("div");
    cardContainer.className = "card-container";

    // 使用 Promise.all 并行处理文件卡片创建
    const cardPromises = paginatedData.map(async ({ imgPath }) => {
      const file = await app.vault.getFileByPath(imgPath);
      return createFileCard(file, attachmentTypes);
    });

    const cards = await Promise.all(cardPromises);
    cards.forEach(card => cardContainer.appendChild(card));

    container.appendChild(cardContainer);


    // 添加分页控件
    if (fileData.length > itemsPerPage) {
      createPaginationControls({ fileData, totalPages, currentPage, itemsPerPage, cardContainer, attachmentTypes });
    }

  };

  function createFileCard(file, attachmentTypes) {
    const card = document.createElement("div");
    card.className = "file-card";
    card.style.position = "relative";

    let mediaElement = createMediaElement(file, attachmentTypes);
    if (mediaElement) {
      card.appendChild(mediaElement);
      const searchButton = createSearchButton(file);
      card.appendChild(searchButton);
    }

    return card;
  }

  function createPaginationControls({ fileData, totalPages, currentPage, itemsPerPage, cardContainer, attachmentTypes }) {
    const paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";
    paginationContainer.style.display = "flex";
    paginationContainer.style.flexWrap = "wrap";

    const prevButton = document.createElement("button");
    prevButton.className = "pagination-button";
    prevButton.textContent = "上一页";
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
      if (currentPage > 1) {
        displayMedia({ fileData, attachmentTypes, itemsPerPage, page: currentPage - 1 });
      }
    });
    paginationContainer.appendChild(prevButton);

    const paginationList = document.createElement("div");
    paginationList.className = "pagination-list";
    paginationList.style.display = "flex";
    paginationList.style.flexWrap = "wrap";
    paginationList.style.margin = "0 10px";
    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement("button");
      pageButton.className = "pagination-button";
      pageButton.textContent = i;
      pageButton.style.margin = "2px";
      pageButton.style.padding = "5px 10px";
      pageButton.style.border = "none";
      pageButton.style.borderRadius = "3px";
      pageButton.style.cursor = "pointer";
      pageButton.style.backgroundColor = i === currentPage ? "#0033cc" : "#e0e0e0";
      pageButton.style.color = i === currentPage ? "#ffffff" : "#000000";

      pageButton.addEventListener("click", () => {
        displayMedia({ fileData, attachmentTypes, itemsPerPage, page: i });
      });

      paginationList.appendChild(pageButton);
    }
    paginationContainer.appendChild(paginationList);

    const nextButton = document.createElement("button");
    nextButton.className = "pagination-button";
    nextButton.textContent = "下一页";
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
      if (currentPage < totalPages) {
        displayMedia({ fileData, attachmentTypes, itemsPerPage, page: currentPage + 1 });
      }
    });
    paginationContainer.appendChild(nextButton);

    // 将分页控件作为兄弟元素添加到现有的 container 之后
    cardContainer.insertAdjacentElement('afterend', paginationContainer);
    console.log('分页控件添加到 DOM 中');
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

    const uniqueMedia = [...new Set(allImgs.map(JSON.stringify))].map(JSON.parse);
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

    const uniqueMedia = [...new Set(allImgs.map(JSON.stringify))].map(JSON.parse);
    console.log(`找到的唯一图片数量: ${uniqueMedia.length}`);
    return uniqueMedia;
  }
};