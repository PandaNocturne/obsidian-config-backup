module.exports = async () => {
    const active_file = app.workspace.getActiveFile();
    const markmind_mode = "markdown";
    await app.fileManager.processFrontMatter(active_file, fm => {
        if (fm["mindmap-plugin"] === markmind_mode) {
            delete fm["mindmap-plugin"];
        } else {
            fm["mindmap-plugin"] = markmind_mode;
        }
    });
    app.commands.executeCommandById("obsidian-markmind:Toggle to markdown or mindmap");
};
