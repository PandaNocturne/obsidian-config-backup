class ImageModal extends ea.obsidian.Modal {
  constructor(app, frontImgs, backImgs, className) {
    super(app);
    this.frontImgs = frontImgs;
    this.backImgs = backImgs;
    this.className = className; // 新增类名属性
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty(); // 清空内容

    // 设置模态框的类名
    if (this.className) {
      contentEl.classList.add(this.className);
    }

    // 创建网格容器
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';

    // 遍历图片数组，创建翻转卡片
    this.frontImgs.forEach((frontImg, index) => {
      const backImg = this.backImgs[index];

      const flipCard = document.createElement('div');
      flipCard.className = 'flip-card';

      const flipCardInner = document.createElement('div');
      flipCardInner.className = 'flip-card-inner';

      // 添加点击事件监听器
      flipCard.addEventListener('click', () => {
        flipCardInner.classList.toggle('flipped'); // 切换 'flipped' 类
      });

      const flipCardFront = document.createElement('div');
      flipCardFront.className = 'flip-card-front';
      flipCardFront.appendChild(frontImg); // 将前景图片添加到正面

      const flipCardBack = document.createElement('div');
      flipCardBack.className = 'flip-card-back';
      flipCardBack.appendChild(backImg); // 将背景图片添加到背面

      flipCardInner.appendChild(flipCardFront);
      flipCardInner.appendChild(flipCardBack);
      flipCard.appendChild(flipCardInner);
      gridContainer.appendChild(flipCard); // 将翻转卡片添加到网格容器中
    });

    contentEl.appendChild(gridContainer); // 将网格容器添加到模态框中
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty(); // 关闭时清空内容
  }
}

await ea.addElementsToView();
const allEls = ea.getViewElements();
// const sceneElements = ea.getExcalidrawAPI().getSceneElements();
const scale = 0.2;
// 获取选中元素否则为全部元素
const selectedEls = ea.getViewSelectedElements();
const frameEls = selectedEls.filter(el => el.type === "frame");

if (frameEls.length === 0) {
  // 单个选择
  const frontEls = selectedEls;
  const backEls = selectedEls.filter(el => el.text !== "mask").filter(el => {
    const boundEls = el.boundElements;
    if (!Array.isArray(boundEls)) return true;
    for (const boundEl of boundEls) {
      let foundEl = allEls.find(el => el.id === boundEl.id);
      if (foundEl?.originalText === "mask") return false;
    }
    return true;
  });
  const frontImg = await createImage(frontEls, scale); // 前景图片
  const backImg = await createImage(backEls, scale); // 背景图片
  const modal = new ImageModal(app, [frontImg], [backImg], 'flip-cards-modal');
  modal.open();
  return;
}

// 以frame为单位选择
let frontImgs = [];
let backImgs = [];

for (const frameEl of frameEls) {
  let els2 = ea.getElementsInFrame(frameEl);
  els2 = els2.filter(el => el.type !== "frame");
  const frontEls = els2;
  const backEls = els2.filter(el => el.text !== "mask").filter(el => {
    const boundEls = el.boundElements;
    if (!Array.isArray(boundEls)) return true;
    for (const boundEl of boundEls) {
      let foundEl = allEls.find(el => el.id === boundEl.id);
      if (foundEl?.originalText === "mask") return false;
    }
    return true;
  });
  const frontImg = await createImage(frontEls, scale); // 前景图片
  const backImg = await createImage(backEls, scale); // 背景图片
  frontImgs.push(frontImg);
  backImgs.push(backImg);
}
const modal = new ImageModal(app, frontImgs, backImgs, 'flip-cards-modal');
modal.open();


async function createImage(selectedEls, scale) {
  const img = new Image();
  ea.selectElementsInView([...selectedEls]);
  await ea.targetView.svg(ea.targetView.getScene(true), undefined, true).then(svg => {
    let base64 = `data:image/svg+xml;base64,${btoa(
      unescape(encodeURIComponent(svg.outerHTML.replaceAll("&nbsp;", " "))),
    )}`;
    // 将SVG转换为PNG
    img.src = base64;
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
    };
  });
  return img;
}
