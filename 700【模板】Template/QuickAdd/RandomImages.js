const fs = require('fs');
const directory = 'Y-图形文件存储/Wallpapers壁纸/';
const outputFileName = "Y-图形文件存储/Excalidraw图形/Excalidraw.Outline.md";
// 获取库的基本路径
const basePath = (app.vault.adapter).getBasePath();
const imagesDirectory = `${basePath}/${directory}`;


fs.readdir(imagesDirectory, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    const imageFiles = files.filter(file => {
        return file.endsWith('.jpg') || file.endsWith('.png');
    });

    if (imageFiles.length === 0) {
        console.error('No image files found in the directory.');
        return;
    }

    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    let randomImageFile = imageFiles[randomIndex];

    let randomImageLink = `![[${randomImageFile}#bg]]`;
    
    // 设定一些yaml，特别定义csscalss好修改
    let outlineYaml = "";
    outlineYaml = "---\ncssclasses:\n  - Excalidraw-Markdown\n---\n";
    inputText = outlineYaml + randomImageLink

    let markdownFile = app.vault.getAbstractFileByPath(outputFileName);

    if (markdownFile) {
        app.vault.modify(markdownFile, inputText);
    } else {
        app.vault.create(outputFileName, inputText);
    }

});


