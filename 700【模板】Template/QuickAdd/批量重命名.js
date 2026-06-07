
function uniReg(str, func, isVault) {
    let place = isVault ? app.vault : app.workspace;
    place._[str].map(ev => String(ev.fn) == String(func) && place.offref(ev));
    app.plugins.plugins.quickadd.registerEvent(place.on(str, func));
}; 

const appFRN = (old, now) => app.fileManager.renameFile(app.vault.getAbstractFileByPath(old), now);
let prompt = (str, holder, value) => this.quickAddApi.inputPrompt(str, holder, value); 
let rgx; 
let form;

let confirm = async (files, info) => {
    let test = files[0]; if (!test) return; do {
        rgx = await prompt(`${info} 正则`, rgx, rgx); if (!rgx) return;
        form = await prompt(`${info} 替换`, form, form);
    } while (!form);
    const repi = (p, i) => p.basename.replace(eval(rgx), eval(form));
    await this.quickAddApi.yesNoPrompt(test.name, [test].map((p, i) => repi(p, i)))
        ? files.map(async (p, i) => await appFRN(p.path, `${p.parent.path}/${repi(p, i)}.${p.extension}`)) : confirm(files, info);
};

// 添加到右侧菜单
let addi = (menu, param, func) => menu.addItem(i => i.setTitle('批量重命名').setIcon('percent').onClick(async () => await func(param)));

let multiFRN = async (menu, items) => addi(menu, items, async items => {
    let files = items.filter(item => item.extension); 
    let paths = files.map(p => p.path);
    let box = await this.quickAddApi.checkboxPrompt(paths, paths);
    files = files.filter(p => box.includes(p.path)); 
    await confirm(files, '');
});

let folderFRN = async (menu, item) => !item.extension && addi(menu, item, async folder => {
    let files = folder.children.filter(child => child.extension); 
    await confirm(files, folder.path);
}); 

uniReg('files-menu', multiFRN, 0); 
uniReg('file-menu', folderFRN, 0);