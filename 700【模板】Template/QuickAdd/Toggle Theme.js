
// 获取所有主题
const themes = Object.keys(app.customCss.themes);
themes.unshift("default");
const themesMode = ["Auto", "Dark", "Light"];

// 获取当前模式
const light = "moonstone";
const dark = "obsidian";
const currentMode = app.vault.config.theme;

module.exports = {
	entry: async (QuickAdd, settings, params) => {
		const themeName1 = settings["theme 1"];
		const themeMode1 = settings["theme 1 mode"];

		const themeName2 = settings["theme 2"];
		const themeMode2 = settings["theme 2 mode"];
		let themeName = app.customCss.theme;
		let themeMode = "Auto";

		// 更换主题
		if (themeName1 === themeName2) {
			// 如果2个主题相等，则只设置深浅模式变化
			if (currentMode == dark) {
				themeMode = "Light";
			} else if (currentMode == light) {
				themeMode = "Dark";
			}
		}
		else if (themeName !== themeName1) {
			themeName = themeName1;
			themeMode = themeMode1;
			app.customCss.setTheme(themeName);
		} else {
			themeName = themeName2;
			themeMode = themeMode2;
			app.customCss.setTheme(themeName);
		}

		switch (themeMode) {
			case "Auto":
				new Notice(`🌗切换为${themeName}主题`);
				break;
			case "Dark":
				if (currentMode != dark) { //如果当前不是暗色，就切换为暗色
					app.commands.executeCommandById("theme:use-dark");
				}
				new Notice(`🌘切换为${themeName}主题深色模式`);
				break;
			case "Light":
				if (currentMode != light) { //如果当前不是亮色，就切换为亮色
					app.commands.executeCommandById("theme:use-light");
				}
				new Notice(`🌕切换为${themeName}主题浅色模式`);
				break;
		}
	},
	settings: {
		name: "Toggle Theme",
		author: "熊猫别熬夜",
		options: {
			"theme 1": {
				type: "dropdown",
				defaultValue: "Blue Topaz",
				options: themes,
				description: "设置第1个主题",
			},
			"theme 1 mode": {
				type: "select",
				defaultValue: "Auto",
				options: themesMode,
				description: "设置第1个主题的深浅模式，默认Auto为不更改",

			},
			"theme 2": {
				type: "dropdown",
				defaultValue: "default",
				options: themes,
				description: "设置第2个主题",

			},
			"theme 2 mode": {
				type: "select",
				defaultValue: "Auto",
				options: themesMode,
				description: "设置第2个主题的深浅模式，默认Auto为不更改",
			},
		}
	},
};
