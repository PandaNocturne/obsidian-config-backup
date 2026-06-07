

function mainView({dvOpArg,propertyTypesArg,folderArg}) {
  console.log(dvOpArg,propertyTypesArg)
  const dvOp = dvOpArg
  const folder = folderArg;
  const propertyTypes = [
    ...propertyTypesArg
  ]


// 创建视图元素
  const listRoot = dvOp.el("div", "", {cls: "listRoot", attr: {style: "display: flex;height: 505px;"}});
  const mainRoot = dvOp.el("div", "", {
    container: listRoot,
    cls: "leftRoot",
    attr: {style: "height: 500px; min-width: 200px; overflow: scroll; padding: 5px;"}
  });

  propertyTypes.forEach(item => {
    item.btn = dvOp.el("li", dvOp.el("button", item.name), {container: mainRoot, attr: {style: "margin: 5px"}})
  })
  const leftRoot = dvOp.el("div", "", {
    container: listRoot,
    cls: "leftRoot",
    attr: {style: "height: 500px; min-width: 500px; overflow: scroll; padding: 5px;"}
  });
  const rightRoot = dvOp.el("div", "", {
    container: listRoot,
    cls: "rightRoot",
    attr: {style: "height: 500px; min-width: 500px; overflow: scroll; padding: 5px; flex-grow: 1;"}
  });

  let isInit = true

  function showData(a, code, type) {
    // 清除旧元素
    rightRoot.replaceChildren();
    // 如果类型不为空，则查询该类型数据列表
    if (a && a !== "") {
      dvOp.pages(`"${folder}"`)
        .where(t => type === "list" ? t[code] && t[code].includes(a) : t[code] && t[code] === a)
        .map(k => k.file.link)
        .forEach(item => {
          dvOp.el("li", item, {container: rightRoot, attr: {style: "margin: 5px"}});
        });
    }
  }

  propertyTypes.forEach(typeItem => {
    typeItem.btn.addEventListener("click", async (evt) => {
      evt.preventDefault();
      leftRoot.replaceChildren();
      rightRoot.replaceChildren();
      const typeMap = [];
      // 查找类型列表
      if (typeItem.type === 'list') {
        for (const item of dvOp.pages(`"${folder}"`)) {
          if (item[typeItem.code] && item[typeItem.code].length > 0) {
            for (const it of item[typeItem.code]) {
              const typeObj = typeMap.findIndex(value => value.name === it);
              if (typeObj > -1) {
                typeMap[typeObj].count += 1;
              } else {
                typeMap.push({name: it, count: 1});
              }
            }
          }
        }
      } else {
        for (const item of dvOp.pages(`"${folder}"`)) {
          if (item[typeItem.code] && item[typeItem.code].length > 0) {
            const it = item[typeItem.code];
            const typeObj = typeMap.findIndex(value => value.name === it);
            if (typeObj > -1) {
              typeMap[typeObj].count += 1;
            } else {
              typeMap.push({name: it, count: 1});
            }
          }
        }
      }


      for (const item of typeMap) {
        const li = dvOp.el("li", "", {container: leftRoot, attr: {style: "margin: 5px"}});
        const button = dvOp.el("button", `${item.name}(${item.count})`, {container: li});
        button.addEventListener("click", async (evt) => {
          evt.preventDefault();
          showData(item.name, typeItem.code, typeItem.type);
        });
        if (isInit) {
          button.click()
          isInit = false
        }
      }
    });
  })

  propertyTypes[0].btn.click()
}

mainView(input)

