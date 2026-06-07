module.exports = async () => {  // 获取用户选中的文本
  function getSelectedText() {
    var text = "";
    try {
      const editor = app.workspace.activeEditor.editor;
      text = editor.getSelection()
      text = text ? text : window.getSelection().toString();
    } catch (e) {
      // console.error(e);
      text = window.getSelection().toString();
    }
    
    return text;
  };

  // 获取包含 .chatbotContainer 的侧边栏元素
  var sidebar = document.querySelector('.workspace-split.mod-horizontal.mod-sidedock.mod-right-split:has(.chatbotContainer)');

  if (sidebar) {
    // 检查侧边栏是否被折叠
    if (sidebar.classList.contains('is-sidedock-collapsed')) {
      // 移除折叠类以展开侧边栏
      sidebar.classList.remove('is-sidedock-collapsed');
      // 执行其他操作
      // app.commands.executeCommandById("bmo-chatbot:open-bmo-chatbot");
      app.commands.executeCommandById("app:toggle-right-sidebar");
    }
  }

  // 获取.chatbox下的textarea元素
  const textarea = document.querySelector('.chatbox textarea');
  // 检查textarea是否存在
  if (textarea) {
    var selectedText = getSelectedText();
    selectedText = selectedText.replace(/\n\n/g, '\n');
    textarea.value = selectedText;
    textarea.focus();
  } else {
    console.error("找不到.chatbox下的textarea元素");
  }
};




