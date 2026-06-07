const outlineFileName = "Y-图形文件存储/Excalidraw图形/Excalidraw.Outline.md"
const markdownFileName = "Y-图形文件存储/Excalidraw图形/Excalidraw.Markdown.md"

let outlineFile = app.vault.getAbstractFileByPath(outlineFileName);

let newLeaf = app.plugins.plugins["obsidian-hover-editor"].spawnPopover(undefined, () => this.app.workspace.setActiveLeaf(newLeaf, false, true));
newLeaf.openFile(outlineFile);
