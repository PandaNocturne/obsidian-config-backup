
module.exports = async (params) => {
  // 获取笔记的基本路径
  const filePath = app.workspace.getActiveFile().path;
  // 设置默认的窗口大小
  const newWindowWidth = 380;
  const newWindowHeight = 420;

  await app.workspace.openPopoutLeaf({ width: newWindowWidth, height: newWindowHeight }).openFile(app.vault.getAbstractFileByPath(filePath));

  // 窗口置顶
  activeWindow.electronWindow.setAlwaysOnTop(true);

  // 控制界面缩放
  activeWindow.electronWindow.webContents.zoomFactor = 0.7;
};

