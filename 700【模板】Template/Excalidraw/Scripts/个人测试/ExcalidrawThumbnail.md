class ArrangeImagesModal extends ea.obsidian.Modal {
    constructor(app) {
        super(app);
        this.numRows = 2;
        this.numCols = 3;
        this.spacingX = 20;
        this.spacingY = 20;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass("arrange-images-modal"); // 添加自定义 CSS 类

        contentEl.createDiv({ text: "排列图片参数", cls: "modal-title" });

        // 创建表单容器
        const form = contentEl.createDiv({ cls: "modal-form" });

        // 行数
        const rowDiv = form.createDiv({ cls: "input-group" });
        rowDiv.createEl("label", { text: "行数 (n):", htmlFor: "rows" });
        const rowsInput = rowDiv.createEl("input", { type: "number", id: "rows", value: this.numRows.toString(), min: "1" });
        rowsInput.addEventListener("change", (evt) => {
            this.numRows = parseInt(evt.target.value);
        });

        // 列数
        const colDiv = form.createDiv({ cls: "input-group" });
        colDiv.createEl("label", { text: "列数 (m):", htmlFor: "cols" });
        const colsInput = colDiv.createEl("input", { type: "number", id: "cols", value: this.numCols.toString(), min: "1" });
        colsInput.addEventListener("change", (evt) => {
            this.numCols = parseInt(evt.target.value);
        });

        // 水平间距
        const spacingXDiv = form.createDiv({ cls: "input-group" });
        spacingXDiv.createEl("label", { text: "水平间距:", htmlFor: "spacingX" });
        const spacingXInput = spacingXDiv.createEl("input", { type: "number", id: "spacingX", value: this.spacingX.toString() });
        spacingXInput.addEventListener("change", (evt) => {
            this.spacingX = parseInt(evt.target.value);
        });

        // 垂直间距
        const spacingYDiv = form.createDiv({ cls: "input-group" });
        spacingYDiv.createEl("label", { text: "垂直间距:", htmlFor: "spacingY" });
        const spacingYInput = spacingYDiv.createEl("input", { type: "number", id: "spacingY", value: this.spacingY.toString() });
        spacingYInput.addEventListener("change", (evt) => {
            this.spacingY = parseInt(evt.target.value);
        });

        // 按钮组
        const buttonGroup = contentEl.createDiv({ cls: "modal-buttons" });
        const closeButton = buttonGroup.createEl("button", { text: "关闭" });
        closeButton.addEventListener("click", () => {
            this.close();
            console.log("用户取消排列");
        });

        const arrangeButton = buttonGroup.createEl("button", { text: "排列图片", cls: "mod-cta" }); // mod-cta 通常用于强调操作按钮
        arrangeButton.addEventListener("click", () => {
            if (isNaN(this.numRows) || isNaN(this.numCols) || isNaN(this.spacingX) || isNaN(this.spacingY) || this.numRows < 1 || this.numCols < 1) {
                new Notice("请输入有效的数字参数。");
                return;
            }
            this.close();
            // 在这里获取用户输入的参数并执行排列图片的逻辑
            console.log("用户设置的参数:", this.numRows, this.numCols, this.spacingX, this.spacingY);
            // 你需要在这里调用你的排列图片函数，并将这些参数传递给它
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.removeClass("arrange-images-modal"); // 移除自定义 CSS 类
    }
}

// 创建并打开模态框
new ArrangeImagesModal(app).open();

// 注意：这个脚本只负责显示界面，你需要在外层脚本中获取选中的元素
// 并调用 ArrangeImagesModal 中获取到的参数来执行实际的排列操作。