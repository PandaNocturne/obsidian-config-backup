/*
 * @Author: 熊猫别熬夜 
 * @Date: 2025-01-15 00:13:57 
 * @Last Modified by: 熊猫别熬夜
 * @Last Modified time: 2025-03-09 14:28:50
 */
module.exports = async () => {
  (function () {
    // 创建并添加样式
    const styleElement = document.createElement("style");
    styleElement.textContent = `
.search-params{
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
}
.search-form-container {
  width: 100%;
  padding: 10px;
  margin: auto;
  background-color: var(--background-primary);

  button {
    background-color: var(--background-primary);
    border-radius: 4px;
    border: 1px solid var(--background-modifier-border);
  }

  select, label, button {
    padding: 4px;
  }

  /* 隐藏第一行操作符和删除按钮 */
  .form-row:first-child .operator,
  .form-row:first-child .remove-row {
    display: none;
  }

  .form-row {
    display: flex;
    gap: 0 5px;
    align-items: center;
    margin-bottom: 10px;

    input[type="text"] {
      flex: 1;
      border-width: 1px;
    }
  }

}


.input-group {
  display: flex;
  width: 100%;
  align-items: center;
  height: 20px;


  input {
    margin-right: 0px !important;
    padding: 5px;
    border-radius: 4px 0 0 4px;
    box-shadow: none !important;
  }

  .icon-button {
    box-shadow: none;
    color: var(--text-normal);
    margin-left: 0px !important;
    border-left: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;

  }

  .icon-button[data-select-option=""] {
    display: none;
  }
}


/* 大小写和正则控件 */
.controls {
  display: flex;
  gap: 0 2px;

  .toggle.toggle {
    padding: 0px;
    margin: 0px;
    cursor: pointer;
    display: flex;

    input {
      display: none;
    }
  }

  .toggle-label {
    display: flex;
    align-items: center;
    justify-items: center;
    padding: 2px 2px;
    border-radius: 4px;
  }

  .toggle input:checked+.toggle-label {
    background: var(--background-modifier-hover);
  }
}

.button-group {
  display: flex;
  justify-content: space-between;

  button {
    padding: 5px 10px;
  }
}

.date-group {
  width: 100%;
  display: flex;
  justify-content: space-between;

  button {
    border-width: 1px;
    border-radius: 3px;
  }
}

.navigation-buttons {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 4px;

  button {
    border: none;
  }

  .import-button,
  .copy-button,
  .reset-button {
    flex: 1;
    font-size: large;
  }

  .graph-button,
  .search-button {
    flex: 1;
    color: var(--text-accent);
    font-size: large;
  }

  .reset-button {
    color: var(--text-error);
  }
}

.result {
  margin-top: 10px;

  textarea {
    width: 100%;
    height: 300px;
    resize: vertical;
  }
}
  `;
    document.head.appendChild(styleElement);

    // 移除已存在的 form-container
    const existingContainer = document.querySelector('.search-form-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // 创建 HTML 结构
    const queryControlsContainer = document.createElement("div");
    queryControlsContainer.className = "search-form-container";
    queryControlsContainer.innerHTML = `
<div class="search-section"><div class="form-row"><select class="operator"><option>AND</option><option>OR</option><option>NOT</option></select><select class="type"><option>all</option><option>file</option><option>tag</option><option>path</option></select><div class="input-group"><input type="text"name="file"><button class="icon-button"onclick="handleTypeIconClick(this)"></button></div><!--大小写和正则控件--><div class="controls"><label class="toggle"><input type="radio"name="search-mode"class="case-sensitive"><span class="toggle-label"><svg xmlns="http://www.w3.org/2000/svg"width="24"height="24"viewBox="0 0 24 24"fill="none"stroke="currentColor"stroke-width="2"stroke-linecap="round"stroke-linejoin="round"class="svg-icon uppercase-lowercase-a"><path d="M10.5 14L4.5 14"></path><path d="M12.5 18L7.5 6"></path><path d="M3 18L7.5 6"></path><path d="M15.9526 10.8322C15.9526 10.8322 16.6259 10 18.3832 10C20.1406 9.99999 20.9986 11.0587 20.9986 11.9682V16.7018C20.9986 17.1624 21.2815 17.7461 21.7151 18"></path><path d="M20.7151 13.5C18.7151 13.5 15.7151 14.2837 15.7151 16C15.7151 17.7163 17.5908 18.2909 18.7151 18C19.5635 17.7804 20.5265 17.3116 20.889 16.6199"></path></svg></span></label><label class="toggle"><input type="radio"name="search-mode"class="regex"><span class="toggle-label"><svg xmlns="http://www.w3.org/2000/svg"width="24"height="24"viewBox="0 0 24 24"fill="none"stroke="currentColor"stroke-width="2"stroke-linecap="round"stroke-linejoin="round"class="lucide lucide-regex"><path d="M17 3v10"/><path d="m12.67 5.5 8.66 5"/><path d="m12.67 10.5 8.66-5"/><path d="M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z"/></svg></span></label></div><button class="remove-row"onclick="removeRow(this)">➖</button><button class="add-row"onclick="addRow(this)">➕</button></div></div><!--<div class="date-group"><div class="creation-date"><label>创建时间：</label><input type="date"name="date_from"><span>~</span><input type="date"name="date_to"><button class="clear-date"onclick="clearDate(this)">清空</button></div><div class="modification-date"><label>修改时间：</label><input type="date"name="date_from"><span>~</span><input type="date"name="date_to"><button class="clear-date"onclick="clearDate(this)">清空</button></div></div>--><div class="navigation-buttons"><button class="import-button"onclick="importFromSearchBox()">导入</button><button class="copy-button"onclick="copySearchQuery()">复制</button><button class="graph-button"onclick="openGraphView()">图谱</button><button class="search-button"onclick="executeSearch()">搜索</button><button class="reset-button"onclick="clearSearchForm()">重置</button></div>
`;
    // 添加容器
    document.body.appendChild(queryControlsContainer);

    // 找到搜索容器并在其第一个子元素前插入
    const searchContainer = document.querySelector('.workspace-leaf-content[data-type="search"]');
    if (searchContainer) {
      searchContainer.insertBefore(queryControlsContainer, searchContainer.children[0]);
    }
  })();


  function generateIcons(options, values) {
    return options.reduce((icons, option) => {
      icons[option] = values[option] || '';
      return icons;
    }, {});
  }

  const options = ["all", "file", "tag", "path", "content", "line", "block", "section", "task", "task-todo", "tasks-done"];
  const iconsWithValues = {
    'file': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sticky-note"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>',
    'tag': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tags"><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/></svg>',
    'path': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-closed"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M2 10h20"/></svg>'
  };
  const icons = generateIcons(options, iconsWithValues);

  // !点击图标触发事件
  async function handleTypeIconClick(button) {
    const row = button.closest('.form-row');
    const type = row.querySelector('.type').value;
    const options = getOptionsByType(type);
    const quickAddApi = app.plugins.plugins.quickadd.api;
    const choice = await quickAddApi.suggester(options, options);
    if (choice) {
      const type = row.querySelector('.type').value;
      if (type === 'tag') {
        row.querySelector('input[type="text"]').value += ` ${choice.replace(/^#/, '')}`;
      } else {
        row.querySelector('input[type="text"]').value += ` "${choice}"`;
      }
    }
  }

  // 图标类型
  function getOptionsByType(type) {
    let options;
    switch (type) {
      case 'file':
        options = app.vault.getFiles()
          .filter(f => f.path.endsWith('.md'))
          .map(f => f.basename);
        options.sort();
        break;
      case 'tag':
        options = Object.keys(app.metadataCache.getTags());
        options.sort();
        break;
      case 'path':
        options = app.vault.getAllFolders().map(f => f.path);
        break;
      default:
        return [];
    }
    return options;
  }

  // !添加和删除按钮
  function addRow(button) {
    const currentRow = button.closest('.form-row');
    const currentType = currentRow.querySelector('.type').value;
    const currentOperator = currentRow.querySelector('.operator').value;
    const newRow = currentRow.cloneNode(true);

    // 只重置文本输入
    newRow.querySelectorAll('input[type="text"]').forEach(input => {
      input.value = '';
    });

    // 为新行的 radio 设置新的 name
    const newName = `search-mode-${Math.random().toString(36).substr(2, 9)}`;
    newRow.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.name = newName;
    });

    // 设置 operator 的值
    newRow.querySelector('.operator').value = currentOperator;

    currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
    initializeRow(newRow, currentType);
  }
  function removeRow(button) {
    const row = button.closest('.form-row');
    const container = row.parentNode;
    if (container.querySelectorAll('.form-row').length > 1) {
      row.remove();
    }
  }

  function initializeRow(row, option, clearInputs = false) {
    if (clearInputs) {
      row.querySelectorAll('input[type="text"]').forEach(input => {
        input.value = '';
      });
    }
    const typeSelect = row.querySelector('.type');
    const button = row.querySelector('.icon-button');

    // 使用选中的属性初始化选项
    typeSelect.innerHTML = options.map(opt =>
      `<option>${opt}</option>`
    ).join('');

    // 设置默认选项
    typeSelect.value = option; // 确保选择项被设置

    // 添加 change 事件监听器
    typeSelect.addEventListener('change', function () {
      const selectedOption = typeSelect.value;
      button.setAttribute('data-select-option', icons[selectedOption]);
      button.innerHTML = icons[selectedOption];
    });

    // 触发 change 事件以设置初始状态
    typeSelect.dispatchEvent(new Event('change'));

    // 添加可取消选择的单选框逻辑
    const radios = row.querySelectorAll('input[type="radio"]');
    const rowName = `search-mode-${Math.random().toString(36).substr(2, 9)}`; // 每行共用一个name
    radios.forEach(radio => {
      radio.name = rowName; // 同一行的radio使用相同name实现互斥
      let lastState = false;
      radio.addEventListener('click', function () {
        if (this.checked && lastState) {
          this.checked = false;
        }
        lastState = this.checked;
      });
    });
  }

  function clearDate(button) {
    const container = button.parentElement;
    container.querySelectorAll('input[type="date"]').forEach(input => {
      input.value = '';
    });
  }

  // 转换查询条件为 Obsidian 搜索语法
  function convertToObsidianQuery(formRows, lineBreak = false) {
    let query = [];
    formRows.forEach(row => {
      const operator = row.querySelector('.operator').value;
      let type = row.querySelector('.type').value;
      type = type === 'all' ? "" : `${type}:`;
      const input = row.querySelector('input[type="text"]').value;
      const isCaseSensitive = row.querySelector('.case-sensitive').checked;
      const isRegex = row.querySelector('.regex').checked;

      if (input.trim()) {
        let searchTerm = input;
        if (isRegex) {
          searchTerm = `/${searchTerm}/`;
        } else if (type == 'tag:') {
          searchTerm = searchTerm.trim().split(" ").map(t => t.startsWith("#") ? t : `#${t}`).join(" ");
        } else {
          searchTerm = `(${searchTerm})`;
        }

        if (isCaseSensitive) {
          searchTerm = `match-case:${searchTerm}`;
        }

        let queryPart = '';
        switch (operator) {
          case 'AND': queryPart = `(${type}${searchTerm})`; break;
          case 'OR': queryPart = `${operator} (${type}${searchTerm})`; break;
          case 'NOT': queryPart = `-(${type}${searchTerm})`; break;
        }
        query.push(queryPart);
      }
    });

    return lineBreak ? query.join("\n") : query.join(" ");
  }

  // 搜索按钮点击处理函数
  function executeSearch() {
    const formRows = document.querySelectorAll('.form-row');
    const queryValue = convertToObsidianQuery(formRows);
    const searchInputs = document.querySelectorAll('.search-input-container > input');
    searchInputs.forEach(searchInput => {
      if (searchInput && searchInput.value !== queryValue) {
        searchInput.value = queryValue;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          bubbles: true
        }));
      }
    });
  }

  function openGraphView() {
    app.commands.executeCommandById("graph:open");

    setTimeout(() => {
      const formRows = document.querySelectorAll('.form-row');
      const queryValue = convertToObsidianQuery(formRows);

      // 更新图谱视图的搜索框
      const graphSearch = document.querySelector('.graph-control-section .search-input-container input');
      if (graphSearch) {
        graphSearch.value = queryValue;
        graphSearch.dispatchEvent(new Event('input', { bubbles: true }));
        graphSearch.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          bubbles: true
        }));
      }
    }, 100);
  }

  // 添加重置函数
  function clearSearchForm(n = 2) {
    const container = document.querySelector('.search-section');
    if (!container) return;
    const templateRow = container.querySelector('.form-row');
    if (!templateRow) return;
    // 清空现有内容
    container.innerHTML = '';
    // 添加初始行
    for (let i = 0; i < n; i++) {
      const newRow = templateRow.cloneNode(true);
      container.appendChild(newRow);
      initializeRow(newRow, options[0], true);
    }
    // 触发 change 事件以确保 UI 更新
    container.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 添加导入功能
  function importFromSearchBox() {
    const searchInput = document.querySelector('.workspace-leaf-content[data-type="search"] .search-row input');
    if (!searchInput || !searchInput.value.trim()) {
      new Notice('No query to import');
      return;
    }

    // 解析查询字符串
    const query = searchInput.value.trim();
    const parts = query.split(/(?<=\)) (?=[-(]|\w+:|\()/g).filter(p => p.trim());

    // 清空现有行并生成对应行数
    clearSearchForm(parts.length);
    const container = document.querySelector('.search-section');
    const templateRow = container.querySelector('.form-row');

    parts.forEach((part, index) => {
      let row = index === 0 ? templateRow : templateRow.cloneNode(true);
      if (index > 0) {
        container.appendChild(row);
        initializeRow(row, 'all');
      }

      // 解析操作符
      if (part.startsWith('-')) {
        row.querySelector('.operator').value = 'NOT';
        part = part.slice(1);
      } else if (part.startsWith('OR ')) {
        row.querySelector('.operator').value = 'OR';
        part = part.slice(3);
      } else {
        row.querySelector('.operator').value = 'AND';
      }

      // 解析类型和值
      let type = 'all';
      let value = part.replace(/^\(|\)$/g, '');

      const typeMatch = value.match(/^(file|tag|path|content|line|block|section|task|task-todo|tasks-done):/);
      if (typeMatch) {
        type = typeMatch[1];
        value = value.slice(typeMatch[0].length);
      }

      // 设置类型
      row.querySelector('.type').value = type;

      // 处理大小写和正则
      const caseSensitive = value.startsWith('match-case:');
      if (caseSensitive) {
        row.querySelector('.case-sensitive').checked = true;
        value = value.slice(11);
      }

      const isRegex = value.startsWith('/') && value.endsWith('/');
      if (isRegex) {
        row.querySelector('.regex').checked = true;
        value = value.slice(1, -1);
      }

      // 处理标签特殊格式
      if (type === 'tag') {
        value = value.replace(/#/g, '');
      }
      // 设置值
      row.querySelector('input[type="text"]').value = value.replace(/^\(|\)$/g, '');
    });

    // 清空空行
    const rows = container.querySelectorAll('.form-row');
    rows.forEach(row => {
      const input = row.querySelector('input[type="text"]');
      if (!input.value.trim()) {
        row.remove();
      }
    });
  }

  function copyToClipboard(extrTexts) {
    const txtArea = document.createElement('textarea');
    txtArea.value = extrTexts;
    document.body.appendChild(txtArea);
    txtArea.select();
    if (document.execCommand('copy')) {
      new Notice('Copied to clipboard');
    } else {
      new Notice('Failed to copy');
    }
    document.body.removeChild(txtArea);
  }

  function copySearchQuery() {
    const formRows = document.querySelectorAll('.form-row');
    const queryValue = convertToObsidianQuery(formRows, true);
    const formattedQuery = `\`\`\`query\n${queryValue}\n\`\`\``;
    copyToClipboard(formattedQuery);
  }

  // 把所有函数暴露到全局作用域
  window.addRow = addRow;
  window.removeRow = removeRow;
  window.handleTypeIconClick = handleTypeIconClick;
  window.openGraphView = openGraphView;
  window.executeSearch = executeSearch;
  window.clearSearchForm = clearSearchForm;
  window.clearDate = clearDate;
  // 绑定导入按钮事件
  window.importFromSearchBox = importFromSearchBox;
  window.copySearchQuery = copySearchQuery;

  // 修改初始化逻辑
  (function initialize() {
    clearSearchForm();

    const searchInputs = document.querySelectorAll('.search-input-container > input');
    searchInputs.forEach(searchInput => {
      if (searchInput) {
        searchInput.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          bubbles: true
        }));
      }
    });
  })();
};
