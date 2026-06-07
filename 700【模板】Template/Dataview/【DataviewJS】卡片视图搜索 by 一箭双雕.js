
let currentPage = 1;
const itemsPerPage = 8;
let totalPages = 1;
let currentMediaFiles = [];
let allFiles = [];
let mediaFileCount = 0;
let imageFileCount = 0;
let markdownFileCount = 0;

function highlightKeyword(text, keywords) {
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    return text.replace(regex, '<span style="background-color: yellow;">$1</span>');
}

function displayMedia(keywords, folderKeyword, excludeKeywords, page = 1) {
    allFiles = app.vault.getAllLoadedFiles();
    currentMediaFiles = allFiles.filter(file => {
        const containsKeywords = keywords.every(keyword => file.name.toLowerCase().includes(keyword.toLowerCase()));
        const inFolder = !folderKeyword || file.path.toLowerCase().includes(folderKeyword.toLowerCase());
        const folderPath = file.path.substring(0, file.path.lastIndexOf('/'));
        const exactFolderMatch = !folderKeyword || folderPath.toLowerCase().includes(folderKeyword.toLowerCase());
        const notExcluded = excludeKeywords.length === 0 || !excludeKeywords.some(excludeKeyword => file.name.toLowerCase().includes(excludeKeyword.toLowerCase()));
        return containsKeywords && exactFolderMatch && notExcluded;
    });

    mediaFileCount = currentMediaFiles.filter(file => [".mp4", ".mp3", ".m4a"].some(ext => file.name.endsWith(ext))).length;
    imageFileCount = currentMediaFiles.filter(file => [".png", ".jpg", ".jpeg", ".gif"].some(ext => file.name.endsWith(ext))).length;
    markdownFileCount = currentMediaFiles.filter(file => file.name.endsWith(".md")).length;

    totalPages = Math.ceil(currentMediaFiles.length / itemsPerPage);
    currentPage = page;

    clearResults();

    const resultCount = document.createElement("p");
    resultCount.innerHTML = `找到关键词 "${keywords.join(' ')}" 的 ${currentMediaFiles.length} 个文件 (媒体文件 ${mediaFileCount} 个, 图片 ${imageFileCount} 个, .md 文件 ${markdownFileCount} 个)<br><span style="font-size: smaller;">(可以自定义提示)</span>`;
    resultCount.style.fontWeight = "bold";
    resultCount.style.marginBottom = "10px";
    dv.container.appendChild(resultCount);

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, currentMediaFiles.length);

    const cardContainer = document.createElement("div");
    cardContainer.style.display = "flex";
    cardContainer.style.flexWrap = "wrap";
    cardContainer.style.gap = "10px";

    for (let i = startIndex; i < endIndex; i++) {
        const file = currentMediaFiles[i];
        const card = createFileCard(file, keywords);
        cardContainer.appendChild(card);
    }

    dv.container.appendChild(cardContainer);
    createPaginationControls();
}

function createFileCard(file, keywords) {
    const card = document.createElement("div");
    card.style.border = "1px solid #222222";
    card.style.borderRadius = "5px";
    card.style.padding = "10px";
    card.style.marginBottom = "10px";
    card.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
    card.style.backgroundColor = "#222222";
    card.style.flex = "0 1 calc(25% - 10px)";
    card.style.boxSizing = "border-box";

    const fileName = document.createElement("p");
    fileName.innerHTML = highlightKeyword(file.name, keywords);
    fileName.style.fontWeight = "bold";
    fileName.style.marginBottom = "5px";
    fileName.style.cursor = "pointer";

    fileName.addEventListener("click", () => {
        app.workspace.openLinkText(file.path, file.path, true);
    });

    const filePath = document.createElement("p");
    filePath.textContent = file.path;
    filePath.style.fontSize = "smaller";
    filePath.style.marginBottom = "5px";

    card.appendChild(fileName);
    card.appendChild(filePath);

    if ([".mp4", ".mp3", ".m4a"].some(ext => file.name.endsWith(ext))) {
        const media = document.createElement(file.name.endsWith(".mp4") ? "video" : "audio");
        media.src = app.vault.getResourcePath(file);
        media.alt = file.name;
        media.style.maxWidth = "100%";
        media.style.cursor = "pointer";
        media.controls = true;
        card.appendChild(media);
    } else if ([".png", ".jpg", ".jpeg", ".gif"].some(ext => file.name.endsWith(ext))) {
        const image = document.createElement("img");
        image.src = app.vault.getResourcePath(file);
        image.alt = file.name;
        image.style.maxWidth = "100%";
        image.style.cursor = "pointer";
        card.appendChild(image);
    }

    return card;
}

function createPaginationControls() {
    const paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";
    paginationContainer.style.display = "flex";
    paginationContainer.style.flexWrap = "wrap";
    paginationContainer.style.justifyContent = "center";
    paginationContainer.style.alignItems = "center";
    paginationContainer.style.marginTop = "20px";

    const prevButton = document.createElement("button");
    prevButton.className = "pagination-button";
    prevButton.textContent = "上一页";
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            displayMedia(getKeywords(), getFolderKeyword(), getExcludeKeywords(), currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevButton);

    const paginationList = document.createElement("div");
    paginationList.className = "pagination-list";
    paginationList.style.display = "flex";
    paginationList.style.flexWrap = "wrap";
    paginationList.style.justifyContent = "center";
    paginationList.style.alignItems = "center";
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
            displayMedia(getKeywords(), getFolderKeyword(), getExcludeKeywords(), i);
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
            displayMedia(getKeywords(), getFolderKeyword(), getExcludeKeywords(), currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextButton);

    dv.container.appendChild(paginationContainer);
}

function clearResults() {
    const inputElements = dv.container.querySelectorAll("input");
    dv.container.innerHTML = '';
    inputElements.forEach(input => dv.container.appendChild(input));
}

function getKeywords() {
    return keywordInput.value.trim().split(/\s+/).filter(keyword => keyword.length >= 2);
}

function getFolderKeyword() {
    return folderKeywordInput.value.trim();
}

function getExcludeKeywords() {
    return excludeInput.value.trim().split(/\s+/).filter(keyword => keyword.length > 0);
}

const inputContainer = document.createElement("div");
inputContainer.style.marginBottom = "10px";

const keywordInput = document.createElement("input");
keywordInput.type = "text";
keywordInput.placeholder = "用空格分隔多个关键词";
keywordInput.style.width = "260px";
keywordInput.style.marginRight = "10px";

const folderKeywordInput = document.createElement("input");
folderKeywordInput.type = "text";
folderKeywordInput.placeholder = "文件夹关键词（可选）";
folderKeywordInput.style.width = "150px";
folderKeywordInput.style.marginRight = "10px";

const excludeInput = document.createElement("input");
excludeInput.type = "text";
excludeInput.placeholder = "排除（用空格分隔多个关键词）";
excludeInput.style.width = "260px";

let timeout = null;

function handleInput() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const keywords = getKeywords();
        const folderKeyword = getFolderKeyword();
        const excludeKeywords = getExcludeKeywords();
        if (keywords.length > 0) {
            displayMedia(keywords, folderKeyword, excludeKeywords, 1);
        } else {
            clearResults();
        }
    }, 2000);
}

keywordInput.addEventListener("input", handleInput);
folderKeywordInput.addEventListener("input", handleInput);
excludeInput.addEventListener("input", handleInput);

inputContainer.appendChild(keywordInput);
inputContainer.appendChild(folderKeywordInput);
inputContainer.appendChild(excludeInput);
dv.container.appendChild(inputContainer);
