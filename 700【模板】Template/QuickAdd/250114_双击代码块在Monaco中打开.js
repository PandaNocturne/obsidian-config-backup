// 全局变量，确保只添加一次事件监听器
if (typeof window.isDblClickListenerAdded === 'undefined') {
  window.isDblClickListenerAdded = false;
}

module.exports = async () => {
  if (!window.isDblClickListenerAdded) {
    document.addEventListener('dblclick', function (event) {
      // 编辑模式下，代码块空白处双击用code-files插件打开
      if (event.target.matches('.HyperMD-codeblock, .cm-hmd-codeblock , .codeblock-customizer-line')) {
        console.log('Code block double-clicked!');
        try {
          app.commands.executeCommandById("code-files:open-codeblock-in-monaco");
        } catch (error) {
          console.error('Error executing command:', error);
        }
      }

      // 双击tab标题，定位文件列表
      if (event.target.matches('.workspace-tab-header-inner-title')) {
        console.log('Tab double-clicked!');
        try {
          app.commands.executeCommandById("workspace:move-to-new-window");
        } catch (error) {
          console.error('Error executing command:', error);
        }
      }
    });

    window.isDblClickListenerAdded = true;
  }
};