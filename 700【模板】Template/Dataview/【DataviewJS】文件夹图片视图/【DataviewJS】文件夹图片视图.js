let {
    attachmentTypes,
    folderPath,
    itemsPerPage,
} = input;

const path = require('path');
attachmentTypes = attachmentTypes ? attachmentTypes : ['svg', 'gif', 'png', 'jpeg', 'jpg', 'webp', 'mp4'];
itemsPerPage = itemsPerPage ? itemsPerPage : 20;

// 获取笔记的基本路径
const fullPath = app.workspace.getActiveFile().path;
activePath = folderPath ? folderPath : path.dirname(fullPath);
console.log(`当前路径（无文件名）: ${activePath}`);


// 获取文件数据
const files = await app.vault.getFiles();
let fileData = [];
fileData = getMediaPathsbyFolderPath(files, activePath, attachmentTypes);
console.log(`获取了${fileData.length}个媒体文件`);
await displayMedia({ fileData, attachmentTypes, itemsPerPage });
async function displayMedia({ fileData, attachmentTypes, itemsPerPage = 10, page: currentPage = 1 }) {
    // !计算总页数
    const totalPages = Math.ceil(fileData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = fileData.slice(startIndex, endIndex);

    // 清除结果
    clearResults();

    // 创建卡片容器
    const cardContainer = document.createElement("div");
    cardContainer.className = "card-container";
    // cardContainer.style.display = "flex";
    // cardContainer.style.flexFlow = "row wrap";

    
    // 使用 Promise.all 并行处理文件卡片创建
    const cardPromises = paginatedData.map(async ({ imgPath }) => {
        const file = await app.vault.getFileByPath(imgPath);
        return createFileCard(file, attachmentTypes);
    });

    const cards = await Promise.all(cardPromises);
    cards.forEach(card => cardContainer.appendChild(card));

    dv.container.appendChild(cardContainer);

    // 添加分页控件
    if (fileData.length > itemsPerPage) {
        createPaginationControls({ fileData, totalPages, currentPage, itemsPerPage, cardContainer, attachmentTypes });
    }
}

function clearResults() {
    dv.container.innerHTML = '';
}

function createFileCard(file, attachmentTypes) {
    const card = document.createElement("div");
    card.className = "file-card"; // 添加类名
    card.style.flex = "1 1 auto";
    card.style.height = "200px";
    card.style.width = "300px";
    card.style.position = "relative";
    // 确保 card 的内容居中;
    card.style.display = "flex";
    card.style.justifyContent = "center"; // 垂直居中
    card.style.alignItems = "center"; // 水平居中

    if ([".mp4", ".mp3", ".m4a"].some(ext => file.name.endsWith(ext))) {
        const media = document.createElement(file.name.endsWith(".mp4") ? "video" : "audio");
        media.src = app.vault.getResourcePath(file);
        media.className = "media-element"; // 添加类名
        media.controls = true;
        card.appendChild(media);
    } else if (attachmentTypes.some(ext => file.name.endsWith(ext))) {
        const image = document.createElement("img");
        image.src = app.vault.getResourcePath(file);
        image.className = "image-element"; // 添加类名
        image.style.display = "block"; // 确保图片是块级元素
        // image.style.height = "150px"; // 设置统一的图片高度
        image.style.width = "100%";
        image.style.maxWidth = "100%";
        image.style.maxHeight = "100%";
        image.style.objectFit = "contain"; // 确保图片按比例缩放并裁剪以适应容器
        card.appendChild(image);
    }
    const searchButton = createSearchButton(file);
    card.appendChild(searchButton);

    return card;
}


// 获取文件路径函数
function getFilePath(files, baseName) {
    let files2 = files.filter(f => path.basename(f.path).replace(".md", "") === baseName.replace(".md", ""));
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

function createPaginationControls({ fileData, totalPages, currentPage, itemsPerPage, cardContainer, attachmentTypes }) {
    const paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";
    paginationContainer.style.width = "100%";
    paginationContainer.style.justifyContent = "center";
    paginationContainer.style.position = "relative";
    paginationContainer.style.bottom = "15px";
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
    paginationList.style.maxWidth = "80%";
    paginationList.style.overflow = "auto";
    paginationList.style.display = "flex";
    // paginationList.style.justifyContent = "center";
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

    // // 将分页控件作为兄弟元素添加到现有的 container 之后
    // cardContainer.insertAdjacentElement('afterend', paginationContainer);
    // console.log('分页控件添加到 DOM 中');

    // 将分页控件作为子元素添加到现有的 container 中
    cardContainer.appendChild(paginationContainer);
    console.log('分页控件添加到容器中');
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

