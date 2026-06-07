module.exports = async () => {
  // 定义一个函数来添加按钮并绑定点击事件
  function addButtonToTreeItems() {
    // 获取所有.tree-item元素
    const treeItems = document.querySelectorAll('.workspace-leaf-content[data-type="outline"] .tree-item');

    // 为每个.tree-item元素添加按钮
    treeItems.forEach(function (treeItem) {
      // 如果已经有按钮，不再添加
      if (treeItem.querySelector('button')) return;

      // 创建按钮元素
      const button = document.createElement('button');
      button.textContent = '🔍';
      // 直接通过style属性设置样式
      button.style.position = 'absolute';
      button.style.right = '0px';
      button.style.top = '0px';
      button.style.zIndex = '1';
      button.style.width = '2rem';
      button.style.height = '1.5rem';

      // 为父元素设置position: relative
      treeItem.style.position = 'relative';

      // 添加点击事件监听器
      button.addEventListener('click', function () {
        console.log('🔍按钮被点击，执行命令');
        executeCommand(treeItem);
      });

      // 将按钮添加到.tree-item元素中
      treeItem.appendChild(button);
    });
  }

  // 定义执行命令的函数
  function executeCommand(treeItem) {
    app.commands.executeCommandById("obsidian-zoom:zoom-out");
    // 模拟 tree-item-self 点击事件
    const treeItemSelf = treeItem.querySelector('.tree-item-self');
    if (treeItemSelf) {
      treeItemSelf.click();
    }
    app.commands.executeCommandById("obsidian-zoom:zoom-in");
  }

  // 监控 DOM 变化
  const observer = new MutationObserver(addButtonToTreeItems);
  document.querySelectorAll('.workspace-leaf-content[data-type="outline"]').forEach(container => {
    observer.observe(container, { childList: true, subtree: true });
  });

  // 初始调用
  addButtonToTreeItems();

};