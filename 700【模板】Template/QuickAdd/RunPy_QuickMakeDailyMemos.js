const { exec } = require("child_process")

// 指定目录下的Python脚本路径
const pythonScriptPath =
  "./PythonCode/20231002_QuickMakeDailyMemos/QuickMakeDailyMemos.py"

// 指定目录
const workingDirectory = "D:/PandaNotes/A-笔记模板库存/QuickAdd"

// 构建运行命令
const command = `python ${pythonScriptPath}`

// 设置工作目录
const options = {
  cwd: workingDirectory,
}

// 执行命令
exec(command, options, (error, stdout, stderr) => {
  if (error) {
    console.error(`执行命令时出错: ${error}`)
    return
  }

  // 打印输出结果
  console.log(`输出结果：${stdout}`)
})
