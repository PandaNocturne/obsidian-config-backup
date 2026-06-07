const quickAddApi = app.plugins.plugins.quickadd.api;
module.exports = async () => {
    const input = await quickAddApi.inputPrompt(`输入要打开的网址链接`, null);
    if (!input) return;
    app.workspace.getLeaf('tab').setViewState({
        type: "webviewer",
        active: 1,
        state: {
            url: input
        }
    });
};