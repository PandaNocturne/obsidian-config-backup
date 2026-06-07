const folderConfig = {
  folderPath: "",
  title: "Folder overview",
  showTitle: false,
  depth: 10,
  style: "list",
  includeTypes: ["folder", "markdown", "canvas"],
  disableFileTag: false,
  sortBy: "name",
  sortByAsc: true,
  showEmptyFolders: true,
  onlyIncludeSubfolders: false,
  storeFolderCondition: true,
  showFolderNotes: true,
}

const tocConfigText = {
  style: "inline",
  min_depth: 1,
  max_depth: 6,
}

folderConfig.folderPath = "电脑编程111"

const folderConfigText = convertConfigToText(folderConfig)
console.log(folderConfigText)

function convertConfigToText(config) {
  let configText = ""
  for (const key in config) {
    if (Array.isArray(config[key])) {
      configText += `${key}:\n`
      config[key].forEach((value) => {
        configText += `  - ${value}\n`
      })
    } else {
      configText += `${key}: ${config[key]}\n`
    }
  }
  return configText
}
