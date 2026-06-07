
const quickaddApi = this.app.plugins.plugins.quickadd.api;
const ea = ExcalidrawAutomate;

// 设置quickerInsetNote模板设置
let settings = ea.getScriptSettings();
//set default values on first run
if (!settings["quickerInsertTimestampNotePath"]) {
	settings = {
		"quickerInsertTimestampNotePath": {
			value: "D-每日生活记录/QuickNotes",
			description: "TimeStampNote的存放路径(相对路径)<br>eg：D-每日生活记录/QuickNotes"
		},
		"quickerInsertTemplate": {
			value: "YYYY/YYYYMM/YYYYMMDDHHMMSS",
			description: "TimeStampNote默认名称，若为存储路径用/隔开<br>eg：YYYY/YYYYMM/YYYYMMDDHHMMSS"
		}
	};
	ea.setScriptSettings(settings);
}

// 存储路径
const filePath = settings["quickerInsertTimestampNotePath"];

alert(filePath)
// 调用函数生成时间戳
const timestamp = quickaddApi.date.now(settings["quickerInsertTemplate"]);

// 设置fileStyles默认值为Text(回车符即可插入)
let fileStyles = "Text";
const fileAlistName = await quickaddApi.inputPrompt(
	"插入文档的Alisa",
	"输入文件名别名",
	"📝",
	[
		{
			caption: "Text",
			action: () => { fileStyles = "Text"; return; }
		},
		{
			caption: "Frame",
			action: () => { fileStyles = "Frame"; return; }
		},
		{
			caption: "Image",
			action: () => { fileStyles = "Image"; return; }
		}
	]
);



