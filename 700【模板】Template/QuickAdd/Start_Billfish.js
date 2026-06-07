const { exec } = require('child_process');

const billfishPath = 'D:\\Billfish\\Billfish.exe';

exec(`start "" "${billfishPath}"`, (error, stdout, stderr) => {
  if (error) {
    console.error(`执行命令时出错：${error}`);
    return;
  }
  console.log('Billfish软件已成功打开！');
  new Notice("Billfish软件已成功打开！");
});

// const { exec } = require("child_process")

// const billfishPath = "D:\\Billfish\\Billfish.exe"
// const imagePath =
//   "D:\\PandaNotes\\@熊猫卡片笔记\\每日Memos记录\\📆202310\\📅20231016\\📅20231016_SolidWorks的问题-ESC键失灵.png"

// exec(`"${billfishPath}" "${imagePath}"`, (error, stdout, stderr) => {
//   if (error) {
//     console.error(`执行命令时出错：${error}`)
//     return
//   }
//   console.log(`成功打开图片：${imagePath}`)
// })
