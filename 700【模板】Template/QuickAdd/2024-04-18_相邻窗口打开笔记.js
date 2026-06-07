
module.exports = async (params) => {
  // 打开模式
  const options = ["open-in-new-window", "move-to-new-window"];
  // const quickAddApi = app.plugins.plugins.quickadd.api;
  // const option = await quickAddApi.suggester(options, options);
  option = options[0];
  if (!option) return;

  // 获取激活窗口的位置和大小
  var activeWindowLeft = activeWindow.screenX;
  var activeWindowTop = activeWindow.screenY;
  var activeWindowWidth = activeWindow.outerWidth; 
  var activeWindowHeight = activeWindow.outerHeight;

  // 相邻窗口打开
  var newWindowLeft = activeWindowLeft + activeWindowWidth + 5; 
  var newWindowTop = activeWindowTop+100;

  // // 屏幕中间打开
  // var screenWidth = activeWindow.screen.width;
  // var screenHeight = activeWindow.screen.height;
  // // 计算窗口左上角的坐标，使其位于显示器中央
  // var newWindowLeft = (screenWidth - newWindowWidth) / 2;
  // var newWindowTop = (screenHeight - newWindowHeight) / 2;

  // 设置默认的窗口大小
  var newWindowWidth = 450;
  var newWindowHeight = 480;

  if (option === options[0]) {
    // 在新窗口打开一个当前文档
    app.commands.executeCommandById("workspace:open-in-new-window");
  } else if (option === options[1]) {
    // 发送到新窗口
    app.commands.executeCommandById("workspace:move-to-new-window");
  }

  // 暂停100ms
  await new Promise(resolve => setTimeout(resolve, 1));

  // 将激活窗口置顶
  activeWindow.electronWindow.setAlwaysOnTop(true);

  // 设置窗口的位置和大小
  activeWindow.resizeTo(newWindowWidth, newWindowHeight); // 调整窗口大小为宽度，高度
  activeWindow.moveTo(newWindowLeft, newWindowTop);
};

