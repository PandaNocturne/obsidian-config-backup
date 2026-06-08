class FloatingLatexEditor {
  constructor(app, defaultLatex = '') {
    this.app = app;
    this.defaultLatex = defaultLatex;
    this.result = null;
    this.createFloatingPanel();
    this.loadMathJax();
  }

  createFloatingPanel() {
    // 获取Excalidraw视图的父容器
    const excalidrawView = document.querySelector('.view-content.excalidraw-view');
    if (!excalidrawView) {
      console.error('Excalidraw视图未找到');
      return;
    }

    // 创建浮动面板
    this.panel = document.createElement('div');
    this.panel.classList.add('floating-latex-editor');
    excalidrawView.appendChild(this.panel);

    // 创建标题栏
    const titleBar = document.createElement('div');
    titleBar.classList.add('title-bar');
    this.panel.appendChild(titleBar);

    const title = document.createElement('h2');
    title.textContent = '输入LaTeX公式';
    titleBar.appendChild(title);

    // 创建折叠按钮
    const collapseButton = document.createElement('button');
    collapseButton.textContent = '-';
    collapseButton.classList.add('collapse-button');
    titleBar.appendChild(collapseButton);

    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = 'x';
    closeButton.classList.add('close-button');
    titleBar.appendChild(closeButton);

    // 创建内容容器
    this.content = document.createElement('div');
    this.content.classList.add('content');
    this.panel.appendChild(this.content);

    // 创建预览区域
    this.preview = document.createElement('div');
    this.preview.classList.add('latex-preview');
    this.content.appendChild(this.preview);

    // 创建输入区域
    this.input = document.createElement('textarea');
    this.input.placeholder = '在这里输入LaTeX公式...';
    this.input.value = this.defaultLatex;
    this.content.appendChild(this.input);

    // 渲染默认值
    this.renderLatex(this.defaultLatex);

    // 添加输入事件监听
    this.input.addEventListener('input', () => {
      const latex = this.input.value;
      this.renderLatex(latex);
    });

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    this.content.appendChild(buttonContainer);

    // 创建插入按钮
    const insertButton = document.createElement('button');
    insertButton.textContent = '插入公式';
    insertButton.addEventListener('click', () => {
      const latex = this.input.value;
      this.insertLatexToExcalidraw(latex);
    });
    buttonContainer.appendChild(insertButton);

    // 添加样式
    this.addStyles();

    // 添加拖动功能
    this.makeDraggable(titleBar);

    // 添加折叠功能
    collapseButton.addEventListener('click', () => {
      if (this.content.style.display === 'none') {
        this.content.style.display = 'block';
        collapseButton.textContent = '-';
      } else {
        this.content.style.display = 'none';
        collapseButton.textContent = '+';
      }
    });

    // 添加关闭功能
    closeButton.addEventListener('click', () => {
      this.panel.remove();
    });
  }

  async loadMathJax() {
    if (!window.MathJax) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  renderLatex(latex) {
    // 确保MathJax已加载
    if (window.MathJax) {
      // 使用MathJax渲染LaTeX
      this.preview.innerHTML = `\\(${latex}\\)`;
      MathJax.typesetPromise([this.preview]);
    } else {
      console.error('MathJax未加载');
    }
  }

  insertLatexToExcalidraw(latex) {
    // 在Excalidraw中插入LaTeX公式的逻辑
    console.log('插入公式:', latex);
    // 这里你需要实现将公式插入到Excalidraw中的逻辑
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .floating-latex-editor {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 300px;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
      }
      .title-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background-color: #f1f1f1;
        border-bottom: 1px solid #ccc;
        cursor: move;
      }
      .latex-preview {
        border: 1px solid #ccc;
        padding: 10px;
        margin-bottom: 10px;
        background-color: #f9f9f9;
        color: black;
        border-radius: 4px;
        min-height: 80px;
        overflow: auto;
      }
      textarea {
        width: 100%;
        height: 100px;
        padding: 10px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 4px;
        margin-bottom: 10px;
        font-family: monospace;
      }
      .button-container {
        display: flex;
        justify-content: space-between;
      }
      button {
        flex: 1;
        margin: 5px;
        padding: 10px;
        align-items: center;
        justify-content: center;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      button:hover {
        background-color: #0056b3;
      }
      .collapse-button, .close-button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);
  }

  makeDraggable(element) {
    let isDragging = false;
    let offsetX, offsetY;

    element.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = this.panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      this.panel.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const parentRect = this.panel.parentElement.getBoundingClientRect();
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        // 边界检查
        if (newLeft < parentRect.left) newLeft = parentRect.left;
        if (newTop < parentRect.top) newTop = parentRect.top;
        if (newLeft + this.panel.offsetWidth > parentRect.right) newLeft = parentRect.right - this.panel.offsetWidth;
        if (newTop + this.panel.offsetHeight > parentRect.bottom) newTop = parentRect.bottom - this.panel.offsetHeight;

        this.panel.style.left = `${newLeft}px`;
        this.panel.style.top = `${newTop}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      this.panel.style.cursor = 'move';
    });
  }
}

// 创建并显示浮动的LaTeX编辑器
const defaultLatex = "E = mc^2";
const floatingLatexEditor = new FloatingLatexEditor(app, defaultLatex);