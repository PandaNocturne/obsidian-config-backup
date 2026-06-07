---
uid: 20240704125938260
aliases: 
tags: 
cssclasses:
  - full_width_page
  - cards
created: 
modified: 
url: https://forum.pkmer.net/t/topic/4182
---

```dataviewjs
// 定义参数对象
let params = {
	headers :  ["ctime","mtime","截止日期"],     // 动态可定制表头
	FolderKey : "  ",        // 前置过滤 - 文件夹；
	TagKey :  "",            // 前置过滤 - 标签； 
	filterFileName :  "  ",       // 文件名搜索 
	filterTags :  " ",            // 标签搜索 
	WhichKey :  " ",              // key搜索 ~ 哪个字段 ？哪几个个字段 ？排除哪些？
	KeyValueFilter :  " ",        // 字段的value值，搜索啥？ 
	dateFilterBy :  "file.ctime",       //   要筛选的日期基准如 file.ctime；也 是自己定义的字段
	DateSearch :  "  ",                 // 日期中文搜索；  28    29号当天 
	Intervalday:  "  ",                // 时间块筛选；   -2  0   表示过去的2天
	AnkiFrequncey :  "  " ,            //  anki 复习间隔 ；输入（ 13 5 7 10 这样的间隔，+9 表示未来第9天）
	ContainerStartDateValue :  "",     // 日期起点 ，限制格式 yyyy-mm-dd 标准格式 
	ContainerEndDateValue :  "",       // 日期截止点，限制格式 yyyy-mm-dd 标准格式 
	ContainerMonthDateValue :  "",     // 限定月分 -格式有要求 ，比如   2024-08    
	ContainerWeekDateValue :  "",      //  限定周 - 格式有要求，比如 2024-W25    这个w要大写
	sortOption :  "file.ctime",    // 排序区域（file.name   file.ctime）  按什么排
	sortOrder :  "desc",           // 排序方式（asc\desc）  -全局变量
	PageSize :  "15",          //第3排的, 单页max, 输入框的值   
	pageNum :  1  ,  // 当前页	
};
// 使用参数对象调用 dv.view
(async () => {
	await dv.view("700【模板】Template/Dataview/【DataviewJS】小白搜索框版", params);
})();
```