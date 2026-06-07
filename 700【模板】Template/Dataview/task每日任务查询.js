
// 获取当前日期
const today = window.moment();
let selectedDate = today;

const daysOfWeek = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期天"];
const dayButtonsContainer = document.createElement("div");
const defaultDayButtonsContainerStyle = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  marginBottom: "10px",
};
Object.assign(dayButtonsContainer.style, defaultDayButtonsContainerStyle);

// 存储当前选中的按钮
let selectedButton;
let todayButton;
// 添加样式的默认值
const defaultButtonStyle = {
  margin: "0 5px",
  padding: "5px 10px",
  cursor: "pointer",
  fontSize: "large",
  flex: "1 1 auto",
  color: "var(--text-normal)",
  backgroundColor: "transparent",
};

// 在创建按钮时应用默认样式
daysOfWeek.forEach((day, index) => {
  const button = document.createElement("button");
  Object.assign(button.style, defaultButtonStyle);
  button.textContent = day;

  // 如果今天是这个按钮所代表的日子，则设为红色
  if (today.day() === (index + 1) % 7) {
    // 因为我们daysOfWeek索引从0开始（星期一）
    button.style.color = "red";
    todayButton = button; // 记录今天按钮
  }

  button.addEventListener("click", () => {
    // 设置选中的日期
    selectedDate = today.clone().startOf("week").add(index, "days");
    updateTasksView();

    // 更新先前选中按钮的样式
    if (selectedButton) {
      Object.assign(selectedButton.style, defaultButtonStyle); // 恢复默认样式
      if (selectedButton === todayButton) {
        // 检查是否是今天按钮
        selectedButton.style.color = "red";
      }
    }

    // 更新选中按钮的样式
    button.style.backgroundColor = "var(--interactive-accent)";
    button.style.color = "var(--text-on-accent)";
    selectedButton = button; // 更新当前选中的按钮
  });

  dayButtonsContainer.appendChild(button);
});

// 创建左右按钮
const buttonStyleCommon = {
  margin: "0 5px",
  padding: "5px 10px",
  border: "none",
  backgroundColor: "var(--interactive-accent)",
  fontSize: "large",
  color: "var(--text-on-accent)",
  cursor: "pointer",
};

const leftButton = document.createElement("button");
Object.assign(leftButton.style, buttonStyleCommon);
leftButton.textContent = "←";

const rightButton = document.createElement("button");
Object.assign(rightButton.style, buttonStyleCommon);
rightButton.textContent = "→";

leftButton.addEventListener("click", () => {
  const currentIndex = Array.from(dayButtonsContainer.children).indexOf(selectedButton) - 1;
  const previousIndex = currentIndex - 1;
  if (previousIndex >= 0) {
    dayButtonsContainer.children[previousIndex + 1].click();
  } else {
    // 如果当前是星期一，点击左按钮则跳到星期天
    // dayButtonsContainer.children[daysOfWeek.length].click();
  }
}
);
rightButton.addEventListener("click", () => {
  const currentIndex = Array.from(dayButtonsContainer.children).indexOf(selectedButton) - 1;
  const nextIndex = currentIndex + 1;
  if (nextIndex < daysOfWeek.length) {
    dayButtonsContainer.children[nextIndex + 1].click();
  } else {
    // 如果当前是星期天，点击右按钮则跳到星期一
    // dayButtonsContainer.children[1].click();
  }
}
);

dayButtonsContainer.prepend(leftButton);
dayButtonsContainer.appendChild(rightButton);

dv.container.appendChild(dayButtonsContainer);

function updateTasksView() {
  dv.container.innerHTML = "";
  dv.container.appendChild(dayButtonsContainer);

  const dateStr = selectedDate.format("YYYY-MM-DD");
  const query = `
    {(done on ${dateStr}) OR (happens on ${dateStr}) \\
    } OR {(happens on or before ${dateStr}) AND (not done) AND (happens on this week)\\
    } OR {filter by function \\
        const filename = task.file.filenameWithoutExtension;\\
        const date1 = window.moment(filename).format('YYYY-MM-DD');\\
        return date1 === '${dateStr}';}
    # show tree
    # group by recurring reverse
    group by status.name reverse
    limit groups 4
    short mode
    `;

  dv.paragraph("```tasks\n" + query + "\n```");
}

const todayIndex = today.day() === 0 ? 6 : today.day() - 1;
dayButtonsContainer.children[todayIndex + 1].click();
