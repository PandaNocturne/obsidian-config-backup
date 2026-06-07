const fs = require("fs")
const path = require("path")

// 获取已存在的ZoteroItems
const requestGetZoteroItems = {
	method: "GET",
	redirect: "follow",
	token: "5c440035-c263-4690-bfd4-10d51d1e1030",
}

// 填写Zotero文件夹位置
const folderPath = "D:/Zotero/cache/library"
const data = {
	items: [],
	folderId: "LODQQ4PGTAW5S", // 需要同步的Eagle文件ID
	token: "5c440035-c263-4690-bfd4-10d51d1e1030",
}

// 开始同步
fetch(
	"http://localhost:41595/api/item/list?token=YOUR_API_TOKEN&ext=png&limit=99999999",
	requestGetZoteroItems
)
	.then((response) => response.json())
	.then((result) => {
		const zoteroItems = result
		// console.log(zoteroItems);
		const zoteroItemsKeys = Object.values(zoteroItems.data);
		const names = zoteroItemsKeys.map((item) => item.name);
		console.log(names.length);


		// 读取文件夹中的所有文件
		fs.readdir(folderPath, (err, files) => {
			if (err) {
				console.error("无法读取文件夹:", err)
				return
			}
			// 遍历文件夹中的所有文件
			files.forEach((file) => {
				// 检查文件是否为.png文件
				let newItem
				if (path.extname(file) === ".png") {
					// 创建新的项目对象
					newItem = {
						path: path.join(folderPath, file),
						name: path.parse(file).name,
						website: `zotero://open-pdf/library/items/${path.parse(file).name
							}?annotation=${path.parse(file).name}`,
						tags: ["Zotero"],
					}


					// 如果已存在图片则跳过
					if (names.includes(newItem.name)) {
						console.log(`${newItem.name} 已存在，跳过添加`);
						return // 跳过当前循环，继续下一个文件
					}

					// 将新的项目添加到数据中
					data.items.push(newItem)
					console.log(`已添加 ${newItem.name}`)					
				}
			})

			

			// 如果data.items为空，则跳过添加
			if (data.items.length === 0) return
			var requestOptions = {
				method: "POST",
				body: JSON.stringify(data),
				redirect: "follow",
			}
			fetch("http://localhost:41595/api/item/addFromPaths", requestOptions)
				.then((response) => response.json())
				.then((result) => console.log(result))
				.catch((error) => console.log("error", error))
		})
	})
