await ea.addElementsToView();
const img = ea.getViewSelectedElements().filter(el => el.type === "image");

const quickaddApi = this.app.plugins.plugins.quickadd.api;
const isConfirm = await quickaddApi.yesNoPrompt("MoveToTrash", `是否删除${img.length}张图片的本地文件？`);
if (!isConfirm) return;

for (i of img) {
    const currentPath = ea.plugin.filesMaster.get(i.fileId).path;
    const file = app.vault.getAbstractFileByPath(currentPath);
    if (!file) {
        new Notice("Can't find file: " + currentPath);
        continue;
    }
    const filePath = file.path;
    // 删除元素
    ea.deleteViewElements([i]);
    // 删除文件
    await(app.vault.adapter).trashLocal(filePath);
    new Notice("🗑删除成功");
}
await ea.addElementsToView(false, true);
await ea.getExcalidrawAPI().history.clear(); //避免撤消/重做扰乱
