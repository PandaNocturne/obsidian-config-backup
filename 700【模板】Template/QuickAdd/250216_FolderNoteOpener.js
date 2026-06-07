
module.exports = async () => {
    const quickAddApi = app.plugins.plugins.quickadd.api;
    let listFolderPaths = app.vault.getAllFolders().map(f => f.path);
    let listPaths = app.vault.getFiles();

    // 根据文件夹路径查找FolderNotes
    let folderNotes = listFolderPaths.flatMap(folderPath => {
        let folderName = folderPath.split('/').pop();
        return listPaths.filter(file => {
            return file.parent.path === folderPath && file.basename === folderName;
        });
    });

    const folderPaths = folderNotes.map(f => f.path);
    const folderNames = folderNotes.map(f => "📄" + f.basename + "." + f.extension + "\n📁" + f.parent.path);

    let inputFolderNote = await quickAddApi.suggester(folderNames, folderPaths);

    if (!inputFolderNote) return;
    
    const FolderNotePath = app.vault.getAbstractFileByPath(inputFolderNote);
    // app.workspace.getLeaf("tab").openFile(FolderNotePath); // 在新标签页打开
    app.workspace.getLeaf("").openFile(FolderNotePath); // 在当前标签页打开

};

