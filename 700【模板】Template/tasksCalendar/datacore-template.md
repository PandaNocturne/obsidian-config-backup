---
cssclasses:
  - tasksCalendarLite
---

> 使用方式
> 1. 将 `datacore-view.css` 放到你的 CSS snippets 并启用。
> 2. 若你的 Datacore 代码块名不是 `datacore`，把下面所有围栏名替换为你的实际名称（常见是 `dc`）。
> 3. 将 `"Task Management/Work"` 替换为你的任务目录或筛选条件。

<div class="tc-head">
  <div>
    <p class="tc-title">Tasks Calendar Lite (Datacore)</p>
    <p class="tc-subtitle">纯查询语法版：无 month/week 网格，仅保留核心任务视图</p>
  </div>
</div>

<div class="tc-section tc-overdue">

### Overdue

```datacore
TASK
FROM "Task Management/Work"
WHERE !completed
  AND due
  AND due < date(today)
SORT due ASC
```

</div>

<div class="tc-section tc-due">

### Due Today

```datacore
TASK
FROM "Task Management/Work"
WHERE !completed
  AND due = date(today)
SORT priority DESC, text ASC
```

</div>

<div class="tc-section tc-scheduled">

### Scheduled Today

```datacore
TASK
FROM "Task Management/Work"
WHERE !completed
  AND scheduled = date(today)
SORT priority DESC, text ASC
```

</div>

<div class="tc-section tc-process">

### In Progress (start <= today < due)

```datacore
TASK
FROM "Task Management/Work"
WHERE !completed
  AND start
  AND due
  AND start <= date(today)
  AND due > date(today)
SORT due ASC, priority DESC
```

</div>

<div class="tc-section tc-done">

### Done Today

```datacore
TASK
FROM "Task Management/Work"
WHERE completed
  AND completion = date(today)
SORT completion DESC
```

</div>

<div class="tc-note">
说明：
- 该版本对应你原 `view.js` 的“数据分类能力”，不包含原脚本的 month/week/list 切换、统计弹窗、点击 cell 创建日记等交互。
- 原脚本中的 `globalTaskFilter` 可通过 `WHERE !contains(text, "#task")` 或 `replace` 型字段在查询里按需扩展。
</div>