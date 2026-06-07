module.exports = async (params) => {
    const file = app.workspace.getActiveFile();
    await app.fileManager.processFrontMatter(file, fm => {
        if (fm["excalidraw-plugin"]) {
            app.commands.executeCommandById("obsidian-excalidraw-plugin:PandaScripts/QuickSwitchFrame");
        } else {
            app.commands.executeCommandById("obsidian-another-quick-switcher:header-floating-search-in-file");
        }
    });
};
