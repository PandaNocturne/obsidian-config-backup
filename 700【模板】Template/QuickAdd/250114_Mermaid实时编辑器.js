module.exports = async () => {
  // 将函数定义为 window 的一个属性
  window.mermaidHandleClick = function (event) {
    if (event.target.matches('.mermaid+.edit-block-button')) {
      console.log('Mermaid edit button clicked!');
      try {
        openMermaidEditor();
      } catch (error) {
        console.error('Error opening mermaid editor:', error);
      }
    }
  };

  // 使用 window.mermaidHandleClick 确保是同一个函数引用
  document.removeEventListener('click', window.mermaidHandleClick);
  document.addEventListener('click', window.mermaidHandleClick);
  new Notice('Mermaid edit button listener added.');

};

function openMermaidEditor() {
  new Promise((resolve) => { setTimeout(resolve, 100); });
  const selection = window.getSelection();
  const mermaidCode = selection.toString().trim(); // 去除多余的换行
  console.log(mermaidCode);

  const ea = ExcalidrawAutomate;
  const modal = new ea.obsidian.Modal(app);
  // 使用 MarkdownPreviewView 替换 CodeMirror
  // 使用 textarea 替换 MarkdownPreviewView
  const textArea = modal.contentEl.createEl('textarea', {
    value: mermaidCode,
    cls: 'mermaid-text-editor'
  });

  // 创建渲染区
  const renderArea = modal.contentEl.createEl('div', {
    cls: 'mermaid-render-area'
  });

  // 将渲染区添加到模态窗口中
  modal.contentEl.appendChild(renderArea);

  // 显示模态窗口
  modal.open();

  // 初始化时渲染
  const initialWrappedMermaid = `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
  ea.obsidian.MarkdownRenderer.renderMarkdown(initialWrappedMermaid, renderArea, '');

  // 实时渲染
  textArea.addEventListener('input', () => {
    renderArea.empty();
    const wrappedMermaid = `\`\`\`mermaid\n${textArea.value}\n\`\`\``;
    ea.obsidian.MarkdownRenderer.renderMarkdown(wrappedMermaid, renderArea, '');
  });
}