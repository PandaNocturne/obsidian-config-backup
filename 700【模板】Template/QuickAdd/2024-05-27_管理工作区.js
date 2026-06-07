module.exports = async (params) => {
    const projeckIds = Object.keys(app.commands.commands)
        .filter(key => key.includes("workspaces:") &&  !key.includes(":load"));
    const projeckNames = projeckIds.map(i => app.commands.commands[i].name);
    
    const quickAddApi = app.plugins.plugins.quickadd.api;
    const id = await quickAddApi.suggester(projeckNames, projeckIds);
    app.commands.executeCommandById(id);
};