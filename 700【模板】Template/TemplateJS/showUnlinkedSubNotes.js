// 统计当前笔记所在的文件夹下，有哪些笔记还没出现在当前笔记内
// 可以通过修改 folderDepth 参数来设置搜索的目录层级

// 设置参数
const folderDepth = input?.depth || 1; // 设置搜索的目录层级，1表示只搜索当前目录，2表示搜索当前目录及其子目录，以此类推
const ignoreRules = input?.ignore || []; // 忽略规则，可以是正则表达式或字符串
const onlyNoteFolders = input?.fnOnly || false; // 是否只显示笔记文件夹（名称和父级文件夹相同的md笔记）

// 获取当前文件
const currentFile = dv.current();
// 获取当前文件的路径
const currentFilePath = currentFile.file.path;
// 获取当前文件所在的文件夹路径
const folderPath = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
// 如果路径中没有'/'，说明文件在根目录下
const currentFolder = folderPath === currentFilePath ? '' : folderPath;

// 获取当前文件的内容
const content = await dv.io.load(currentFilePath);

// 获取指定文件夹下的所有笔记
let notesInFolder = [];
if (folderDepth === 1) {
    // 只搜索当前目录
    notesInFolder = dv.pages()
        .where(p => p.file.path.startsWith(currentFolder) && 
                  p.file.path !== currentFilePath && 
                  p.file.path.substring(currentFolder.length + 1).indexOf('/') === -1);
} else {
    // 搜索多级目录
    notesInFolder = dv.pages()
        .where(p => {
            if (!p.file.path.startsWith(currentFolder) || p.file.path === currentFilePath) {
                return false;
            }
            
            // 计算路径中的目录层级
            const relativePath = p.file.path.substring(currentFolder.length + 1);
            const slashCount = (relativePath.match(/\//g) || []).length;
            return slashCount < folderDepth;
        });
}

// 应用忽略规则，过滤掉需要忽略的笔记
let ignoredCount = 0;
let filteredNotes = notesInFolder.filter(note => {
    // 检查是否符合忽略规则
    for (const rule of ignoreRules) {
        if (rule instanceof RegExp) {
            // 正则表达式规则
            if (rule.test(note.file.name) || rule.test(note.file.path)) {
                ignoredCount++;
                return false;
            }
        } else if (typeof rule === 'string') {
            // 字符串规则
            if (note.file.name.includes(rule) || note.file.path.includes(rule)) {
                ignoredCount++;
                return false;
            }
        }
    }
    return true;
});

// 如果启用了只显示笔记文件夹选项，进一步过滤笔记
if (onlyNoteFolders) {
    let noteFolderCount = 0;
    filteredNotes = filteredNotes.filter(note => {
        // 获取笔记的文件名（不含扩展名）
        const noteName = note.file.name;
        
        // 获取笔记所在的父文件夹名称
        const notePath = note.file.path;
        const lastSlashIndex = notePath.lastIndexOf('/');
        if (lastSlashIndex === -1) return false; // 如果在根目录，则不是笔记文件夹
        
        const parentFolderPath = notePath.substring(0, lastSlashIndex);
        const parentFolderName = parentFolderPath.substring(parentFolderPath.lastIndexOf('/') + 1);
        
        // 检查笔记名称是否与父文件夹名称相同
        const isNoteFolder = noteName === parentFolderName;
        if (isNoteFolder) noteFolderCount++;
        return isNoteFolder;
    });
    
    // 更新忽略计数，加上不是笔记文件夹的笔记数量
    ignoredCount += (notesInFolder.length - ignoredCount - filteredNotes.length);
}

// 检查每个笔记是否在当前文件中被引用
const unreferencedNotes = filteredNotes.filter(note => {
    // 构建链接格式，检查是否在内容中出现
    const linkFormats = [
        `[[${note.file.name}]]`, // 标准链接格式
        `![[${note.file.name}]]`, // 嵌入格式
        `[[${note.file.path}]]`, // 完整路径链接格式
        `![[${note.file.path}]]`, // 完整路径嵌入格式
        new RegExp(`\\[\\[${escapeRegExp(note.file.name)}\\|.*?\\]\\]`), // 带别名的链接格式 [[文件名|别名]]
        new RegExp(`\\[\\[${escapeRegExp(note.file.path)}\\|.*?\\]\\]`) // 带别名的完整路径链接格式 [[路径|别名]]
    ];
    
    // 如果笔记有别名，也检查别名链接
    if (note.aliases) {
        note.aliases.forEach(alias => {
            linkFormats.push(`[[${alias}]]`);
            linkFormats.push(`![[${alias}]]`);
        });
    }
    
    // 检查所有可能的链接格式
    return !linkFormats.some(format => {
        if (format instanceof RegExp) {
            return format.test(content);
        }
        return content.includes(format);
    });
});

// 用于转义正则表达式中的特殊字符
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& 表示整个匹配的字符串
}

// 显示结果
if (unreferencedNotes.length > 0) {
    // dv.header(3, "未引用的笔记列表");
    
    const noteTypeText = onlyNoteFolders ? "笔记文件夹" : "笔记";
    dv.paragraph(`共计 ${unreferencedNotes.length} 个未引用的${noteTypeText}${ignoredCount > 0 ? ` *（${ignoredCount} 个笔记被忽略规则过滤）*` : ''}`)

    dv.paragraph("#### 链接格式")
    dv.paragraph(
        unreferencedNotes.map(note => 
            dv.fileLink(note.file.path, false, note.file.name)
        )
    );

    
    dv.paragraph("\n#### 纯文本")
    
    // 拼接成一个纯文本，包在 > 中
    const pureText = "```txt\n" + unreferencedNotes.map(note => `[[${note.file.name}]]`).join('\n') + "\n```";

    dv.paragraph(pureText);
} else {
    const noteTypeText = onlyNoteFolders ? "笔记文件夹" : "笔记";
    dv.paragraph(`✅ 所有${noteTypeText}都已被引用${ignoredCount > 0 ? `，${ignoredCount} 个笔记被忽略规则过滤` : ''}`);
}