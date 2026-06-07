/* eslint-disable */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => VaultInspectorPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian7 = require("obsidian");

// src/report/InspectorView.ts
var import_obsidian2 = require("obsidian");

// src/scanner/Issue.ts
var SCANNER_IDS = [
  "broken-links",
  "orphan-attachments",
  "empty-notes",
  "external-links",
  "duplicate-files",
  "frontmatter-types",
  "tag-usage",
  "large-files"
];
var SCANNER_LABELS = {
  "broken-links": "Broken Links",
  "orphan-attachments": "Orphan Attachments",
  "empty-notes": "Empty Notes",
  "external-links": "External Links",
  "duplicate-files": "Duplicate Files",
  "frontmatter-types": "Frontmatter Types",
  "tag-usage": "Tag Usage",
  "large-files": "Large Files"
};

// src/report/render-summary.ts
function renderSummary(container, result, actions) {
  const errors = result.issues.filter((i) => i.severity === "error").length;
  const warnings = result.issues.filter((i) => i.severity === "warning").length;
  const infos = result.issues.filter((i) => i.severity === "info").length;
  const duration = ((result.finishedAt - result.startedAt) / 1e3).toFixed(1);
  const summary = container.createDiv({ cls: "vi-summary" });
  summary.createEl("h2", { text: "Scan results" });
  const stats = summary.createDiv({ cls: "vi-stats" });
  const items = [
    { label: "Total", value: result.issues.length, cls: "vi-stat-total", severity: null },
    { label: "Errors", value: errors, cls: "vi-stat-error", severity: "error" },
    { label: "Warnings", value: warnings, cls: "vi-stat-warning", severity: "warning" },
    { label: "Info", value: infos, cls: "vi-stat-info", severity: "info" }
  ];
  for (const item of items) {
    const stat = stats.createDiv({ cls: `vi-stat ${item.cls}` });
    stat.createEl("span", { cls: "vi-stat-value", text: String(item.value) });
    stat.createEl("span", { cls: "vi-stat-label", text: item.label });
    if (actions) {
      stat.addClass("vi-stat-clickable");
      stat.addEventListener("click", () => actions.onFilterSeverity(item.severity));
    }
  }
  const meta = summary.createDiv({ cls: "vi-meta" });
  meta.createEl("span", { text: `${result.filesScanned} files scanned` });
  meta.createEl("span", { text: `${duration}s` });
  meta.createEl("span", { text: `${result.scannersRun.length} scanners` });
}

// src/report/render-issues.ts
var import_obsidian = require("obsidian");
function renderIssueList(container, config) {
  var _a;
  const grouped = groupByScanner(config.issues);
  for (const scannerId of config.scannersRun) {
    const scannerIssues = (_a = grouped[scannerId]) != null ? _a : [];
    if (scannerIssues.length === 0) continue;
    const section = container.createDiv({ cls: "vi-scanner-section" });
    section.createEl("h3", {
      cls: "vi-scanner-header",
      text: `${SCANNER_LABELS[scannerId]} (${scannerIssues.length})`
    });
    const list = section.createEl("ul", { cls: "vi-issue-list" });
    for (const issue of scannerIssues) {
      const isSelected = config.selectedFingerprints.has(issue.fingerprint);
      const cls = [
        "vi-issue",
        `vi-severity-${issue.severity}`,
        config.selectionMode ? "vi-selectable" : "",
        isSelected ? "vi-selected" : ""
      ].filter(Boolean).join(" ");
      const li = list.createEl("li", { cls });
      if (config.selectionMode) {
        const checkbox = li.createEl("input", { cls: "vi-issue-checkbox", type: "checkbox" });
        checkbox.checked = isSelected;
        checkbox.addEventListener("click", (e) => {
          e.stopPropagation();
          config.onToggleSelect(issue);
        });
        li.addEventListener("click", () => config.onToggleSelect(issue));
      }
      li.createEl("span", {
        cls: `vi-severity-badge vi-severity-${issue.severity}`,
        text: issue.severity.toUpperCase()
      });
      li.createEl("span", { cls: "vi-issue-title", text: issue.title });
      if (issue.primaryPath) {
        const pathEl = li.createEl("span", {
          cls: "vi-issue-path",
          text: issue.primaryPath
        });
        (0, import_obsidian.setTooltip)(pathEl, "Click to open");
        pathEl.addEventListener("click", (e) => {
          e.stopPropagation();
          config.onOpenFile(issue.primaryPath);
        });
      }
      li.createEl("div", { cls: "vi-issue-message", text: issue.message });
    }
  }
}
function groupByScanner(issues) {
  const groups = {};
  for (const issue of issues) {
    if (!groups[issue.scannerId]) groups[issue.scannerId] = [];
    groups[issue.scannerId].push(issue);
  }
  return groups;
}

// src/report/InspectorView.ts
var import_obsidian3 = require("obsidian");
var VIEW_TYPE_INSPECTOR = "vault-inspector";
var InspectorView = class extends import_obsidian2.ItemView {
  constructor(leaf) {
    super(leaf);
    this.model = {
      result: null,
      isScanning: false,
      filterScanner: null,
      filterSeverity: null,
      enableFixActions: true,
      selectionMode: false,
      selectedFingerprints: /* @__PURE__ */ new Set(),
      ignoredExpanded: false,
      ignoredSelectionMode: false,
      ignoredSelectedFingerprints: /* @__PURE__ */ new Set()
    };
    this.onIgnoreAllIssues = null;
    this.onRestoreIssues = null;
    this.onFixAllIssues = null;
    this.onRevealFile = null;
    this.onRunScan = null;
    this.backToTopHandler = null;
  }
  getViewType() {
    return VIEW_TYPE_INSPECTOR;
  }
  getDisplayText() {
    return "Vault inspector";
  }
  getIcon() {
    return "shield-check";
  }
  async onOpen() {
    await Promise.resolve();
    const container = this.containerEl.children[1];
    container.empty();
    container.classList.add("vault-inspector");
    this.render();
  }
  async onClose() {
    await Promise.resolve();
    if (this.backToTopHandler) {
      const container = this.containerEl.children[1];
      container.removeEventListener("scroll", this.backToTopHandler);
      this.backToTopHandler = null;
    }
    this.onIgnoreAllIssues = null;
    this.onRestoreIssues = null;
    this.onFixAllIssues = null;
    this.onRevealFile = null;
    this.onRunScan = null;
  }
  setScanning(scanning) {
    this.model.isScanning = scanning;
    this.render();
  }
  setResult(result) {
    this.model.result = result;
    this.model.isScanning = false;
    this.model.selectionMode = false;
    this.model.selectedFingerprints = /* @__PURE__ */ new Set();
    this.model.ignoredSelectionMode = false;
    this.model.ignoredSelectedFingerprints = /* @__PURE__ */ new Set();
    this.render();
  }
  setEnableFixActions(enabled) {
    this.model.enableFixActions = enabled;
  }
  setCallbacks(callbacks) {
    this.onIgnoreAllIssues = callbacks.onIgnoreAllIssues;
    this.onRestoreIssues = callbacks.onRestoreIssues;
    this.onFixAllIssues = callbacks.onFixAllIssues;
    this.onRevealFile = callbacks.onRevealFile;
    this.onRunScan = callbacks.onRunScan;
  }
  hasResult() {
    return this.model.result !== null;
  }
  getResult() {
    return this.model.result;
  }
  // ─── Render ──────────────────────────────────────────────
  render() {
    const container = this.containerEl.children[1];
    if (this.backToTopHandler) {
      container.removeEventListener("scroll", this.backToTopHandler);
      this.backToTopHandler = null;
    }
    container.empty();
    if (this.model.isScanning) {
      container.createEl("div", { cls: "vi-progress", text: "Scanning vault..." });
      return;
    }
    if (!this.model.result) {
      const empty = container.createDiv({ cls: "vi-empty" });
      empty.createEl("p", { text: "No scan results yet." });
      const btn = empty.createEl("button", { cls: "vi-empty-btn", text: "Run scan now" });
      btn.addEventListener("click", () => {
        if (this.onRunScan) this.onRunScan();
      });
      empty.createEl("p", {
        cls: "vi-empty-hint",
        text: 'You can also click the search icon in the left ribbon, or use the command palette (Cmd/Ctrl+P) \u2192 "Vault Inspector: Run scan".'
      });
      return;
    }
    this.renderToolbar(container);
    renderSummary(container, this.model.result, {
      onFilterSeverity: (severity) => {
        this.model.filterSeverity = this.model.filterSeverity === severity ? null : severity;
        this.render();
      }
    });
    if (this.model.selectionMode) {
      this.renderMainActionBar(container);
    }
    const issuesContainer = container.createDiv({ cls: "vi-issues" });
    const visibleIssues = this.getVisibleIssues();
    renderIssueList(issuesContainer, {
      issues: visibleIssues,
      scannersRun: this.model.result.scannersRun,
      selectionMode: this.model.selectionMode,
      selectedFingerprints: this.model.selectedFingerprints,
      onOpenFile: (path) => {
        void this.handleOpenFile(path);
      },
      onToggleSelect: (issue) => this.handleToggleSelect(issue)
    });
    this.renderIgnoredSection(container);
    this.addBackToTop(container);
  }
  // ─── Toolbar ─────────────────────────────────────────────
  renderToolbar(container) {
    const toolbar = container.createDiv({ cls: "vi-toolbar" });
    this.renderScannerFilter(toolbar);
    this.renderSeverityFilter(toolbar);
    const visibleIssues = this.getVisibleIssues();
    if (visibleIssues.length > 0) {
      const selectBtn = toolbar.createEl("button", {
        cls: `vi-filter-btn vi-select-btn ${this.model.selectionMode ? "vi-active" : ""}`,
        text: this.model.selectionMode ? "Done" : "Select"
      });
      (0, import_obsidian2.setTooltip)(selectBtn, this.model.selectionMode ? "Exit selection mode" : "Enter selection mode");
      selectBtn.addEventListener("click", () => {
        this.model.selectionMode = !this.model.selectionMode;
        if (!this.model.selectionMode) this.model.selectedFingerprints = /* @__PURE__ */ new Set();
        this.render();
      });
    }
  }
  renderScannerFilter(toolbar) {
    if (!this.model.result) return;
    const group = toolbar.createDiv({ cls: "vi-filter-group" });
    group.createEl("button", {
      cls: `vi-filter-btn ${this.model.filterScanner === null ? "vi-active" : ""}`,
      text: "All"
    }).addEventListener("click", () => {
      this.model.filterScanner = null;
      this.render();
    });
    for (const scannerId of this.model.result.scannersRun) {
      const count = this.model.result.issues.filter((i) => i.scannerId === scannerId).length;
      group.createEl("button", {
        cls: `vi-filter-btn ${this.model.filterScanner === scannerId ? "vi-active" : ""}`,
        text: `${SCANNER_LABELS[scannerId]} (${count})`
      }).addEventListener("click", () => {
        this.model.filterScanner = this.model.filterScanner === scannerId ? null : scannerId;
        this.render();
      });
    }
  }
  renderSeverityFilter(toolbar) {
    if (!this.model.result) return;
    const group = toolbar.createDiv({ cls: "vi-filter-group" });
    for (const sev of ["error", "warning", "info"]) {
      const count = this.model.result.issues.filter((i) => i.severity === sev).length;
      if (count === 0) continue;
      group.createEl("button", {
        cls: `vi-filter-btn vi-severity-${sev} ${this.model.filterSeverity === sev ? "vi-active" : ""}`,
        text: `${sev} (${count})`
      }).addEventListener("click", () => {
        this.model.filterSeverity = this.model.filterSeverity === sev ? null : sev;
        this.render();
      });
    }
  }
  // ─── Main Action Bar ─────────────────────────────────────
  renderMainActionBar(container) {
    if (!this.model.result) return;
    const visibleIssues = this.getVisibleIssues();
    const selectedIssues = visibleIssues.filter((i) => this.model.selectedFingerprints.has(i.fingerprint));
    const selectedFixable = selectedIssues.filter((i) => i.fixAction);
    const bar = container.createDiv({ cls: "vi-action-bar" });
    const left = bar.createDiv({ cls: "vi-action-bar-left" });
    const right = bar.createDiv({ cls: "vi-action-bar-right" });
    const allSelected = visibleIssues.length > 0 && visibleIssues.every((i) => this.model.selectedFingerprints.has(i.fingerprint));
    const toggleAll = left.createEl("input", { cls: "vi-issue-checkbox", type: "checkbox" });
    toggleAll.checked = allSelected;
    (0, import_obsidian2.setTooltip)(toggleAll, allSelected ? "Deselect all" : "Select all");
    toggleAll.addEventListener("click", () => {
      if (allSelected) {
        this.model.selectedFingerprints = /* @__PURE__ */ new Set();
      } else {
        for (const issue of visibleIssues) this.model.selectedFingerprints.add(issue.fingerprint);
      }
      this.render();
    });
    if (this.model.enableFixActions && selectedFixable.length > 0) {
      const deleteBtn = right.createEl("button", { cls: "vi-action-btn vi-action-delete" });
      (0, import_obsidian3.setIcon)(deleteBtn, "trash-2");
      deleteBtn.createEl("span", { text: `(${selectedFixable.length})` });
      (0, import_obsidian2.setTooltip)(deleteBtn, "Move selected files to trash");
      deleteBtn.addEventListener("click", () => {
        if (this.onFixAllIssues) void this.onFixAllIssues(selectedFixable);
      });
    }
    if (selectedIssues.length > 0) {
      const ignoreBtn = right.createEl("button", { cls: "vi-action-btn vi-action-ignore" });
      (0, import_obsidian3.setIcon)(ignoreBtn, "eye-off");
      ignoreBtn.createEl("span", { text: `(${selectedIssues.length})` });
      (0, import_obsidian2.setTooltip)(ignoreBtn, "Hide selected issues from future scans");
      ignoreBtn.addEventListener("click", () => {
        if (this.onIgnoreAllIssues) void this.onIgnoreAllIssues(selectedIssues);
      });
    }
    const cancelBtn = right.createEl("button", { cls: "vi-action-btn" });
    (0, import_obsidian3.setIcon)(cancelBtn, "x");
    (0, import_obsidian2.setTooltip)(cancelBtn, "Exit selection mode");
    cancelBtn.addEventListener("click", () => {
      this.model.selectionMode = false;
      this.model.selectedFingerprints = /* @__PURE__ */ new Set();
      this.render();
    });
  }
  // ─── Ignored Section ─────────────────────────────────────
  renderIgnoredSection(container) {
    if (!this.model.result) return;
    const ignoredIssues = this.model.result.ignoredIssues;
    if (ignoredIssues.length === 0) return;
    const section = container.createDiv({ cls: "vi-ignored-section" });
    const header = section.createDiv({ cls: "vi-ignored-header" });
    const headerLeft = header.createDiv({ cls: "vi-ignored-header-left" });
    const chevron = headerLeft.createEl("span", { cls: "vi-ignored-chevron" });
    (0, import_obsidian3.setIcon)(chevron, this.model.ignoredExpanded ? "chevron-down" : "chevron-right");
    headerLeft.createEl("span", { text: `Ignored items (${ignoredIssues.length})` });
    headerLeft.addEventListener("click", () => {
      this.model.ignoredExpanded = !this.model.ignoredExpanded;
      if (!this.model.ignoredExpanded) {
        this.model.ignoredSelectionMode = false;
        this.model.ignoredSelectedFingerprints = /* @__PURE__ */ new Set();
      }
      this.render();
    });
    if (this.model.ignoredExpanded) {
      const selectBtn = header.createEl("button", {
        cls: `vi-filter-btn vi-select-btn ${this.model.ignoredSelectionMode ? "vi-active" : ""}`,
        text: this.model.ignoredSelectionMode ? "Done" : "Select"
      });
      (0, import_obsidian2.setTooltip)(selectBtn, this.model.ignoredSelectionMode ? "Exit selection mode" : "Select to restore");
      selectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.model.ignoredSelectionMode = !this.model.ignoredSelectionMode;
        if (!this.model.ignoredSelectionMode) this.model.ignoredSelectedFingerprints = /* @__PURE__ */ new Set();
        this.render();
      });
    }
    if (!this.model.ignoredExpanded) return;
    const body = section.createDiv({ cls: "vi-ignored-body" });
    if (this.model.ignoredSelectionMode) {
      this.renderIgnoredActionBar(body, ignoredIssues);
    }
    const listContainer = body.createDiv({ cls: "vi-ignored-list" });
    renderIssueList(listContainer, {
      issues: ignoredIssues,
      scannersRun: this.model.result.scannersRun,
      selectionMode: this.model.ignoredSelectionMode,
      selectedFingerprints: this.model.ignoredSelectedFingerprints,
      onOpenFile: (path) => {
        void this.handleOpenFile(path);
      },
      onToggleSelect: (issue) => this.handleIgnoredToggleSelect(issue)
    });
  }
  renderIgnoredActionBar(container, ignoredIssues) {
    const selectedIssues = ignoredIssues.filter((i) => this.model.ignoredSelectedFingerprints.has(i.fingerprint));
    const bar = container.createDiv({ cls: "vi-action-bar" });
    const left = bar.createDiv({ cls: "vi-action-bar-left" });
    const right = bar.createDiv({ cls: "vi-action-bar-right" });
    const allSelected = ignoredIssues.length > 0 && ignoredIssues.every((i) => this.model.ignoredSelectedFingerprints.has(i.fingerprint));
    const toggleAll = left.createEl("input", { cls: "vi-issue-checkbox", type: "checkbox" });
    toggleAll.checked = allSelected;
    (0, import_obsidian2.setTooltip)(toggleAll, allSelected ? "Deselect all" : "Select all");
    toggleAll.addEventListener("click", () => {
      if (allSelected) {
        this.model.ignoredSelectedFingerprints = /* @__PURE__ */ new Set();
      } else {
        for (const issue of ignoredIssues) this.model.ignoredSelectedFingerprints.add(issue.fingerprint);
      }
      this.render();
    });
    if (selectedIssues.length > 0) {
      const restoreBtn = right.createEl("button", { cls: "vi-action-btn" });
      (0, import_obsidian3.setIcon)(restoreBtn, "eye");
      restoreBtn.createEl("span", { text: `(${selectedIssues.length})` });
      (0, import_obsidian2.setTooltip)(restoreBtn, "Stop ignoring selected issues");
      restoreBtn.addEventListener("click", () => {
        if (this.onRestoreIssues) void this.onRestoreIssues(selectedIssues);
      });
    }
    const cancelBtn = right.createEl("button", { cls: "vi-action-btn" });
    (0, import_obsidian3.setIcon)(cancelBtn, "x");
    (0, import_obsidian2.setTooltip)(cancelBtn, "Exit selection mode");
    cancelBtn.addEventListener("click", () => {
      this.model.ignoredSelectionMode = false;
      this.model.ignoredSelectedFingerprints = /* @__PURE__ */ new Set();
      this.render();
    });
  }
  // ─── Helpers ─────────────────────────────────────────────
  addBackToTop(container) {
    const anchor = container.createDiv({ cls: "vi-back-to-top-anchor" });
    const btn = anchor.createEl("button", { cls: "vi-back-to-top" });
    (0, import_obsidian3.setIcon)(btn, "arrow-up");
    (0, import_obsidian2.setTooltip)(btn, "Back to top");
    btn.addEventListener("click", () => {
      container.scrollTo({ top: 0, behavior: "smooth" });
    });
    const updateVisibility = () => {
      btn.style.display = container.scrollTop > 200 ? "" : "none";
    };
    container.addEventListener("scroll", updateVisibility);
    this.backToTopHandler = updateVisibility;
    updateVisibility();
  }
  getVisibleIssues() {
    if (!this.model.result) return [];
    let issues = this.model.result.issues;
    if (this.model.filterSeverity) issues = issues.filter((i) => i.severity === this.model.filterSeverity);
    if (this.model.filterScanner) issues = issues.filter((i) => i.scannerId === this.model.filterScanner);
    return issues;
  }
  async handleOpenFile(path) {
    if (this.onRevealFile) {
      void this.onRevealFile(path);
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof import_obsidian2.TFile) await this.app.workspace.getLeaf(false).openFile(file);
  }
  handleToggleSelect(issue) {
    if (this.model.selectedFingerprints.has(issue.fingerprint)) {
      this.model.selectedFingerprints.delete(issue.fingerprint);
    } else {
      this.model.selectedFingerprints.add(issue.fingerprint);
    }
    this.render();
  }
  handleIgnoredToggleSelect(issue) {
    if (this.model.ignoredSelectedFingerprints.has(issue.fingerprint)) {
      this.model.ignoredSelectedFingerprints.delete(issue.fingerprint);
    } else {
      this.model.ignoredSelectedFingerprints.add(issue.fingerprint);
    }
    this.render();
  }
};

// src/scanner/ScanRunner.ts
var ScanRunner = class {
  constructor(requestUrl2) {
    this.requestUrl = requestUrl2;
    this.scanners = [];
  }
  register(scanner) {
    this.scanners.push(scanner);
  }
  async run(app, settings) {
    const startedAt = Date.now();
    const markdownFiles = app.vault.getMarkdownFiles();
    const allFiles = app.vault.getFiles();
    const filePathIndex = new Set(allFiles.map((f) => f.path));
    const ctx = {
      app,
      metadataCache: app.metadataCache,
      vault: app.vault,
      requestUrl: this.requestUrl,
      markdownFiles,
      allFiles,
      filePathIndex,
      enabledScanners: new Set(
        Object.entries(settings.enabledScanners).filter(([, enabled]) => enabled).map(([id]) => id)
      ),
      ignoredFingerprints: new Set(settings.ignoredIssueFingerprints),
      largeMarkdownBytes: settings.largeMarkdownBytes,
      largeAttachmentBytes: settings.largeAttachmentBytes,
      duplicateHashMaxBytes: settings.duplicateHashMaxBytes,
      lowUsageTagThreshold: settings.lowUsageTagThreshold,
      watchedTags: settings.watchedTags,
      ignoredFolders: settings.ignoredFolders,
      ignoredProperties: settings.ignoredProperties,
      emptyNoteWordThreshold: settings.emptyNoteWordThreshold
    };
    const scannersRun = [];
    const issues = [];
    const ignoredIssues = [];
    for (const scanner of this.scanners) {
      if (!ctx.enabledScanners.has(scanner.id)) continue;
      scannersRun.push(scanner.id);
      const result = await scanner.scan(ctx);
      for (const issue of result) {
        if (ctx.ignoredFingerprints.has(issue.fingerprint)) {
          ignoredIssues.push(issue);
        } else {
          issues.push(issue);
        }
      }
    }
    return {
      startedAt,
      finishedAt: Date.now(),
      issues,
      ignoredIssues,
      filesScanned: allFiles.length,
      scannersRun
    };
  }
};

// src/scanner/issue-fingerprint.ts
function generateFingerprint(scannerId, primaryPath, evidence) {
  const stableEvidence = Object.keys(evidence).sort().map((k) => `${k}=${evidence[k]}`).join("&");
  const raw = `${scannerId}:${primaryPath != null ? primaryPath : ""}:${stableEvidence}`;
  return hashString(raw);
}
function hashString(str) {
  let h1 = 2166136261;
  let h2 = 16777619;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = (h1 << 5) - h1 + c | 0;
    h2 = (h2 << 5) - h2 + c | 0;
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

// src/utils/paths.ts
function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/\/+$/, "");
}
function getExtension(path) {
  const normalized = normalizePath(path);
  const dotIndex = normalized.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex < normalized.lastIndexOf("/")) return "";
  return normalized.slice(dotIndex + 1).toLowerCase();
}
function getBasename(path) {
  const normalized = normalizePath(path);
  const slashIndex = normalized.lastIndexOf("/");
  const name = slashIndex === -1 ? normalized : normalized.slice(slashIndex + 1);
  const dotIndex = name.lastIndexOf(".");
  return dotIndex === -1 ? name : name.slice(0, dotIndex);
}
function isInFolder(path, folder) {
  const normalized = normalizePath(path);
  const normalizedFolder = normalizePath(folder).replace(/\/+$/, "");
  return normalized === normalizedFolder || normalized.startsWith(normalizedFolder + "/");
}
function isIgnoredPath(path, ignoredFolders) {
  return ignoredFolders.some((folder) => isInFolder(path, folder));
}

// src/scanner/scanners/broken-links.ts
var brokenLinksScanner = {
  id: "broken-links",
  scan(ctx) {
    var _a;
    const issues = [];
    const { markdownFiles, metadataCache } = ctx;
    for (const file of markdownFiles) {
      if (isIgnoredPath(file.path, ctx.ignoredFolders)) continue;
      const cache = metadataCache.getFileCache(file);
      if (!cache) continue;
      const meta = metadataCache;
      const linksForFile = (_a = meta.unresolvedLinks) == null ? void 0 : _a[file.path];
      if (!linksForFile) continue;
      for (const linkText of Object.keys(linksForFile)) {
        issues.push(...resolveLinkIssues(ctx, file.path, linkText));
      }
    }
    return issues;
  }
};
function resolveLinkIssues(ctx, sourcePath, linkText) {
  var _a;
  const issues = [];
  const rawTarget = linkText.split("|")[0].split("#")[0];
  if (!rawTarget) return issues;
  if (isAttachmentLink(rawTarget)) {
    if (!ctx.filePathIndex.has(rawTarget)) {
      issues.push(
        makeIssue(ctx, sourcePath, linkText, rawTarget, "error", `Attachment not found: ${rawTarget}`)
      );
    }
    return issues;
  }
  const headingPart = linkText.includes("#") ? linkText.split("#").slice(1).join("#") : null;
  const resolvedPath = findMarkdownPath(ctx, rawTarget);
  if (!resolvedPath) {
    issues.push(
      makeIssue(ctx, sourcePath, linkText, rawTarget, "error", `Linked file not found: ${rawTarget}`)
    );
    return issues;
  }
  if (headingPart) {
    const headingCache = ctx.metadataCache.getFileCache(
      ctx.markdownFiles.find((f) => f.path === resolvedPath)
    );
    const headings = (_a = headingCache == null ? void 0 : headingCache.headings) != null ? _a : [];
    const headingSlug = slugifyHeading(headingPart);
    const found = headings.some(
      (h) => slugifyHeading(h.heading) === headingSlug
    );
    if (!found) {
      issues.push(
        makeIssue(
          ctx,
          sourcePath,
          linkText,
          resolvedPath,
          "warning",
          `Heading "#${headingPart}" not found in ${resolvedPath}`
        )
      );
    }
  }
  return issues;
}
function isAttachmentLink(target) {
  var _a;
  const lastSegment = (_a = target.split("/").pop()) != null ? _a : "";
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = lastSegment.slice(dotIndex + 1).toLowerCase();
  return ext !== "md";
}
function findMarkdownPath(ctx, target) {
  const candidates = [target, target + ".md"];
  for (const candidate of candidates) {
    if (ctx.filePathIndex.has(candidate)) return candidate;
  }
  return null;
}
function slugifyHeading(heading) {
  return heading.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}
function makeIssue(_ctx, sourcePath, linkText, targetPath, severity, message) {
  return {
    scannerId: "broken-links",
    severity,
    title: "Broken link",
    message,
    primaryPath: sourcePath,
    relatedPaths: [targetPath],
    evidence: { link: linkText, target: targetPath },
    fingerprint: generateFingerprint("broken-links", sourcePath, {
      link: linkText,
      target: targetPath
    }),
    fixAction: {
      kind: "remove-link-text",
      label: "Remove link",
      description: `Remove "[[${linkText}]]" from "${sourcePath}"`,
      targetPaths: [sourcePath],
      linkText
    }
  };
}

// src/utils/hash.ts
async function hashContent(content) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// src/utils/format.ts
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// src/scanner/scanners/duplicate-files.ts
var duplicateFilesScanner = {
  id: "duplicate-files",
  async scan(ctx) {
    var _a, _b, _c;
    const issues = [];
    const files = ctx.allFiles.filter(
      (f) => f.stat.size > 0 && !isIgnoredPath(f.path, ctx.ignoredFolders)
    );
    const nameGroups = /* @__PURE__ */ new Map();
    for (const file of files) {
      const key = `${getBasename(file.path)}.${getExtension(file.path)}`;
      const group = (_a = nameGroups.get(key)) != null ? _a : [];
      group.push(file);
      nameGroups.set(key, group);
    }
    const sizeGroups = /* @__PURE__ */ new Map();
    for (const file of files) {
      const group = (_b = sizeGroups.get(file.stat.size)) != null ? _b : [];
      group.push(file);
      sizeGroups.set(file.stat.size, group);
    }
    const candidates = /* @__PURE__ */ new Set();
    for (const [, group] of nameGroups) {
      if (group.length >= 2) group.forEach((f) => candidates.add(f));
    }
    for (const [, group] of sizeGroups) {
      if (group.length >= 2) group.forEach((f) => candidates.add(f));
    }
    const hashGroups = /* @__PURE__ */ new Map();
    for (const file of candidates) {
      if (file.stat.size <= ctx.duplicateHashMaxBytes) {
        try {
          const content = await ctx.vault.readBinary(file);
          const hash = await hashContent(content);
          const group = (_c = hashGroups.get(hash)) != null ? _c : [];
          group.push(file.path);
          hashGroups.set(hash, group);
        } catch (e) {
          continue;
        }
      }
    }
    const hashReportedPaths = /* @__PURE__ */ new Set();
    for (const [, paths] of hashGroups) {
      if (paths.length < 2) continue;
      paths.forEach((p) => hashReportedPaths.add(p));
      const sorted = paths.slice().sort();
      const kept = sorted[0];
      const duplicates = sorted.slice(1);
      issues.push({
        scannerId: "duplicate-files",
        severity: "warning",
        title: "Duplicate files (hash-identical)",
        message: `${paths.length} files have identical content`,
        relatedPaths: paths,
        evidence: {
          count: paths.length,
          paths: paths.join(", ")
        },
        fingerprint: generateFingerprint("duplicate-files", void 0, {
          paths: sorted.join(",")
        }),
        fixAction: {
          kind: "trash-file",
          label: "Delete duplicates",
          description: `Keep "${kept}" and move ${duplicates.length} duplicate(s) to trash`,
          targetPaths: duplicates
        }
      });
    }
    for (const [name, group] of nameGroups) {
      if (group.length < 2) continue;
      const unreached = group.filter((f) => !hashReportedPaths.has(f.path));
      if (unreached.length < 2) continue;
      const paths = unreached.map((f) => f.path);
      issues.push({
        scannerId: "duplicate-files",
        severity: "info",
        title: "Duplicate file candidates (same name)",
        message: `${paths.length} files share the name "${name}"`,
        relatedPaths: paths,
        evidence: {
          count: paths.length,
          paths: paths.join(", ")
        },
        fingerprint: generateFingerprint("duplicate-files", void 0, {
          nameCandidates: paths.slice().sort().join(",")
        })
      });
    }
    for (const [size, group] of sizeGroups) {
      if (group.length < 2) continue;
      const unreached = group.filter((f) => !hashReportedPaths.has(f.path));
      if (unreached.length < 2) continue;
      const paths = unreached.map((f) => f.path);
      issues.push({
        scannerId: "duplicate-files",
        severity: "info",
        title: "Duplicate file candidates (same size)",
        message: `${paths.length} files share size ${formatSize(size)}`,
        relatedPaths: paths,
        evidence: {
          count: paths.length,
          size,
          paths: paths.join(", ")
        },
        fingerprint: generateFingerprint("duplicate-files", void 0, {
          sizeCandidates: paths.slice().sort().join(",")
        })
      });
    }
    return issues;
  }
};

// src/scanner/scanners/empty-notes.ts
var emptyNotesScanner = {
  id: "empty-notes",
  async scan(ctx) {
    const issues = [];
    for (const file of ctx.markdownFiles) {
      if (isIgnoredPath(file.path, ctx.ignoredFolders)) continue;
      const content = await ctx.vault.cachedRead(file);
      const body = stripFrontmatterAndTitle(content);
      if (body.trim().length === 0) {
        issues.push({
          scannerId: "empty-notes",
          severity: "warning",
          title: "Empty note",
          message: "This note has no content besides a title",
          primaryPath: file.path,
          relatedPaths: [],
          evidence: { size: file.stat.size },
          fingerprint: generateFingerprint("empty-notes", file.path, {}),
          fixAction: {
            kind: "trash-file",
            label: "Delete",
            description: `Move "${file.path}" to trash`,
            targetPaths: [file.path]
          }
        });
      }
    }
    return issues;
  }
};
function stripFrontmatterAndTitle(content) {
  let text = content;
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      text = text.slice(end + 4);
    }
  }
  text = text.replace(/^#+\s+.*$/m, "");
  return text;
}

// src/scanner/scanners/external-links.ts
var externalLinksScanner = {
  id: "external-links",
  async scan(ctx) {
    const issues = [];
    const urlMap = collectExternalUrls(ctx);
    const results = await checkUrls(urlMap, ctx);
    for (const result of results) {
      issues.push({
        scannerId: "external-links",
        severity: result.status >= 400 ? "warning" : "info",
        title: "Dead external link",
        message: `HTTP ${result.status} \u2014 ${result.url}`,
        primaryPath: result.sourcePath,
        relatedPaths: [],
        evidence: {
          url: result.url,
          status: result.status
        },
        fingerprint: generateFingerprint("external-links", result.sourcePath, {
          url: result.url
        })
      });
    }
    return issues;
  }
};
function collectExternalUrls(ctx) {
  var _a, _b;
  const entries = [];
  const seen = /* @__PURE__ */ new Set();
  for (const file of ctx.markdownFiles) {
    if (isIgnoredPath(file.path, ctx.ignoredFolders)) continue;
    const cache = ctx.metadataCache.getFileCache(file);
    if (!cache) continue;
    const links = (_a = cache.links) != null ? _a : [];
    const embeds = (_b = cache.embeds) != null ? _b : [];
    for (const link of [...links, ...embeds]) {
      const href = link.link;
      if (!isExternalUrl(href)) continue;
      if (seen.has(href)) continue;
      seen.add(href);
      entries.push({ url: href, sourcePath: file.path });
    }
    if (cache.frontmatter) {
      for (const value of Object.values(cache.frontmatter)) {
        if (typeof value === "string" && isExternalUrl(value)) {
          if (seen.has(value)) continue;
          seen.add(value);
          entries.push({ url: value, sourcePath: file.path });
        }
      }
    }
  }
  return entries;
}
function isExternalUrl(text) {
  return /^https?:\/\//i.test(text);
}
async function checkUrls(urlMap, ctx) {
  const results = [];
  const batchSize = 5;
  for (let i = 0; i < urlMap.length; i += batchSize) {
    const batch = urlMap.slice(i, i + batchSize);
    const checks = batch.map(async (entry) => {
      const status = await checkUrl(entry.url, ctx);
      if (status >= 400) {
        results.push({ ...entry, status });
      }
    });
    await Promise.all(checks);
  }
  return results;
}
async function checkUrl(url, ctx) {
  try {
    if (ctx == null ? void 0 : ctx.requestUrl) return await ctx.requestUrl(url);
    const response = await fetch(url, { method: "HEAD" });
    return response.status;
  } catch (e) {
    return 0;
  }
}

// src/utils/frontmatter-type.ts
function inferType(value) {
  if (value === null || value === void 0) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
    return "string";
  }
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}
function typesAreCompatible(a, b) {
  if (a === b) return true;
  if (a === "null" || b === "null") return true;
  if (a === "date" && b === "string" || a === "string" && b === "date")
    return true;
  return false;
}

// src/scanner/scanners/frontmatter-types.ts
var frontmatterTypesScanner = {
  id: "frontmatter-types",
  scan(ctx) {
    var _a;
    const issues = [];
    const ignoredProps = new Set(ctx.ignoredProperties);
    const propertyTypes = /* @__PURE__ */ new Map();
    for (const file of ctx.markdownFiles) {
      if (isIgnoredPath(file.path, ctx.ignoredFolders)) continue;
      const cache = ctx.metadataCache.getFileCache(file);
      const frontmatter = cache == null ? void 0 : cache.frontmatter;
      if (!frontmatter) continue;
      for (const [key, value] of Object.entries(frontmatter)) {
        if (key === "position") continue;
        if (ignoredProps.has(key)) continue;
        const type = inferType(value);
        let typeMap = propertyTypes.get(key);
        if (!typeMap) {
          typeMap = /* @__PURE__ */ new Map();
          propertyTypes.set(key, typeMap);
        }
        const paths = (_a = typeMap.get(type)) != null ? _a : [];
        paths.push(file.path);
        typeMap.set(type, paths);
      }
    }
    for (const [prop, typeMap] of propertyTypes) {
      const nonNullTypes = Array.from(typeMap.keys()).filter((t) => t !== "null");
      if (nonNullTypes.length <= 1) continue;
      let hasIncompatible = false;
      let hasDateAmbiguity = false;
      for (let i = 0; i < nonNullTypes.length - 1; i++) {
        for (let j = i + 1; j < nonNullTypes.length; j++) {
          if (!typesAreCompatible(nonNullTypes[i], nonNullTypes[j])) {
            hasIncompatible = true;
          }
          if (nonNullTypes[i] === "string" && nonNullTypes[j] === "date" || nonNullTypes[i] === "date" && nonNullTypes[j] === "string") {
            hasDateAmbiguity = true;
          }
        }
      }
      if (!hasIncompatible && !hasDateAmbiguity) continue;
      const severity = hasIncompatible ? "warning" : "info";
      const title = hasIncompatible ? "Frontmatter type drift" : "Frontmatter type ambiguity";
      const types = Array.from(typeMap.keys());
      const typeSummary = types.map((t) => {
        var _a2, _b;
        const count = (_b = (_a2 = typeMap.get(t)) == null ? void 0 : _a2.length) != null ? _b : 0;
        return `${t} (${count})`;
      }).join(", ");
      const allPaths = [];
      for (const paths of typeMap.values()) {
        allPaths.push(...paths);
      }
      issues.push({
        scannerId: "frontmatter-types",
        severity,
        title,
        message: `Property "${prop}" has mixed types: ${typeSummary}`,
        relatedPaths: allPaths.slice(0, 10),
        evidence: {
          property: prop,
          types: typeSummary,
          fileCount: allPaths.length
        },
        fingerprint: generateFingerprint("frontmatter-types", void 0, {
          property: prop,
          types: types.sort().join(",")
        })
      });
    }
    return issues;
  }
};

// src/utils/file-types.ts
var ATTACHMENT_EXTENSIONS = /* @__PURE__ */ new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "pdf",
  "mp3",
  "mp4",
  "wav",
  "mov",
  "zip"
]);
function isAttachment(path) {
  const ext = getExtension(path);
  return ext !== "" && ATTACHMENT_EXTENSIONS.has(ext);
}
function isMarkdown(path) {
  const ext = getExtension(path);
  return ext === "md";
}

// src/scanner/scanners/large-files.ts
var largeFilesScanner = {
  id: "large-files",
  scan(ctx) {
    const issues = [];
    for (const file of ctx.allFiles) {
      if (isIgnoredPath(file.path, ctx.ignoredFolders)) continue;
      const isMd = isMarkdown(file.path);
      const threshold = isMd ? ctx.largeMarkdownBytes : ctx.largeAttachmentBytes;
      if (file.stat.size > threshold) {
        issues.push({
          scannerId: "large-files",
          severity: "warning",
          title: "Large file",
          message: `File is ${formatSize(file.stat.size)}, exceeds ${formatSize(threshold)} threshold`,
          primaryPath: file.path,
          relatedPaths: [],
          evidence: {
            size: file.stat.size,
            threshold,
            type: isMd ? "markdown" : "attachment"
          },
          fingerprint: generateFingerprint("large-files", file.path, {
            size: file.stat.size
          })
        });
      }
    }
    issues.sort((a, b) => b.evidence.size - a.evidence.size);
    return issues;
  }
};

// src/scanner/scanners/orphan-attachments.ts
var orphanAttachmentsScanner = {
  id: "orphan-attachments",
  scan(ctx) {
    const issues = [];
    const referencedPaths = collectReferencedPaths(ctx);
    for (const file of ctx.allFiles) {
      if (isIgnoredPath(file.path, ctx.ignoredFolders)) continue;
      if (!isAttachment(file.path)) continue;
      if (!referencedPaths.has(file.path)) {
        const severity = isRecent(file.stat.mtime) ? "info" : "warning";
        issues.push({
          scannerId: "orphan-attachments",
          severity,
          title: "Orphan attachment",
          message: "This attachment is not referenced by any note",
          primaryPath: file.path,
          relatedPaths: [],
          evidence: {
            lastModified: file.stat.mtime
          },
          fingerprint: generateFingerprint("orphan-attachments", file.path, {
            orphan: true
          }),
          fixAction: {
            kind: "trash-file",
            label: "Delete",
            description: `Move "${file.path}" to trash`,
            targetPaths: [file.path]
          }
        });
      }
    }
    return issues;
  }
};
function collectReferencedPaths(ctx) {
  var _a, _b, _c, _d;
  const paths = /* @__PURE__ */ new Set();
  for (const file of ctx.markdownFiles) {
    const cache = ctx.metadataCache.getFileCache(file);
    if (!cache) continue;
    const links = (_a = cache.links) != null ? _a : [];
    const embeds = (_b = cache.embeds) != null ? _b : [];
    for (const link of [...links, ...embeds]) {
      const resolvedMeta = ctx.metadataCache;
      const resolved = (_d = (_c = resolvedMeta.resolvedLinks) == null ? void 0 : _c[file.path]) == null ? void 0 : _d[link.link];
      if (typeof resolved === "string") {
        paths.add(resolved);
      } else {
        const linkPath = link.link.split("#")[0].split("|")[0];
        if (ctx.filePathIndex.has(linkPath)) {
          paths.add(linkPath);
        }
      }
    }
  }
  return paths;
}
function isRecent(mtime) {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
  return mtime > oneWeekAgo;
}

// src/scanner/scanners/tag-usage.ts
var tagUsageScanner = {
  id: "tag-usage",
  scan(ctx) {
    var _a, _b;
    const issues = [];
    const tagCounts = /* @__PURE__ */ new Map();
    const watchedSet = new Set(ctx.watchedTags);
    for (const file of ctx.markdownFiles) {
      if (isIgnoredPath(file.path, ctx.ignoredFolders)) continue;
      const cache = ctx.metadataCache.getFileCache(file);
      if (!cache) continue;
      const tags = collectTags(cache);
      for (const tag of tags) {
        tagCounts.set(tag, ((_a = tagCounts.get(tag)) != null ? _a : 0) + 1);
      }
    }
    for (const [tag, count] of tagCounts) {
      if (count >= ctx.lowUsageTagThreshold) continue;
      if (watchedSet.has(tag)) continue;
      issues.push({
        scannerId: "tag-usage",
        severity: "info",
        title: "Low-usage tag",
        message: `Tag "${tag}" is only used ${count} time(s), below threshold of ${ctx.lowUsageTagThreshold}`,
        relatedPaths: [],
        evidence: { tag, count, threshold: ctx.lowUsageTagThreshold },
        fingerprint: generateFingerprint("tag-usage", void 0, {
          tag,
          lowUsage: true
        })
      });
    }
    for (const watchedTag of ctx.watchedTags) {
      const count = (_b = tagCounts.get(watchedTag)) != null ? _b : 0;
      if (count > 0) continue;
      issues.push({
        scannerId: "tag-usage",
        severity: "info",
        title: "Missing watched tag",
        message: `Watched tag "${watchedTag}" does not appear in the vault`,
        relatedPaths: [],
        evidence: { tag: watchedTag, count: 0, watched: true },
        fingerprint: generateFingerprint("tag-usage", void 0, {
          tag: watchedTag,
          watched: true
        })
      });
    }
    return issues;
  }
};
function collectTags(cache) {
  var _a;
  const tags = [];
  const frontmatterTags = (_a = cache.frontmatter) == null ? void 0 : _a.tags;
  if (frontmatterTags) {
    if (Array.isArray(frontmatterTags)) {
      for (const t of frontmatterTags) {
        tags.push(String(t).replace(/^#/, ""));
      }
    } else if (typeof frontmatterTags === "string" || typeof frontmatterTags === "number") {
      tags.push(String(frontmatterTags).replace(/^#/, ""));
    }
  }
  const inlineTags = cache.tags;
  if (inlineTags) {
    for (const t of inlineTags) {
      tags.push(t.tag.replace(/^#/, ""));
    }
  }
  return tags;
}

// src/scanner/register-scanners.ts
function registerDefaultScanners(scanRunner) {
  scanRunner.register(brokenLinksScanner);
  scanRunner.register(largeFilesScanner);
  scanRunner.register(orphanAttachmentsScanner);
  scanRunner.register(emptyNotesScanner);
  scanRunner.register(externalLinksScanner);
  scanRunner.register(duplicateFilesScanner);
  scanRunner.register(frontmatterTypesScanner);
  scanRunner.register(tagUsageScanner);
}

// src/settings/settings.ts
var DEFAULT_SETTINGS = {
  enabledScanners: Object.fromEntries(
    SCANNER_IDS.map((id) => [id, true])
  ),
  enableFixActions: true,
  largeMarkdownBytes: 100 * 1024,
  largeAttachmentBytes: 5 * 1024 * 1024,
  duplicateHashMaxBytes: 1024 * 1024,
  lowUsageTagThreshold: 2,
  emptyNoteWordThreshold: 5,
  watchedTags: [],
  ignoredIssueFingerprints: [],
  ignoredFolders: [],
  ignoredProperties: [],
  reportFolderPath: "Vault Inspector Reports"
};

// src/settings/settings-tab.ts
var import_obsidian4 = require("obsidian");
var InspectorSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian4.Setting(containerEl).setName("Scanning").setHeading();
    this.addScannersSection();
    this.addFixActionsSection();
    this.addThresholdsSection();
    this.addTagsSection();
    this.addIgnoredSection();
    this.addExportSection();
  }
  addScannersSection() {
    const { containerEl } = this;
    new import_obsidian4.Setting(containerEl).setName("Enabled scanners").setHeading();
    for (const id of SCANNER_IDS) {
      new import_obsidian4.Setting(containerEl).setName(SCANNER_LABELS[id]).addToggle(
        (toggle) => toggle.setValue(this.plugin.settings.enabledScanners[id]).onChange(async (value) => {
          this.plugin.settings.enabledScanners[id] = value;
          await this.plugin.saveSettings();
        })
      );
    }
  }
  addFixActionsSection() {
    const { containerEl } = this;
    new import_obsidian4.Setting(containerEl).setName("Fix actions").setHeading();
    new import_obsidian4.Setting(containerEl).setName("Enable fix actions").setDesc("Show fix buttons on issues that can be automatically resolved (files moved to trash).").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enableFixActions).onChange(async (value) => {
        this.plugin.settings.enableFixActions = value;
        await this.plugin.saveSettings();
      })
    );
  }
  addThresholdsSection() {
    const { containerEl } = this;
    new import_obsidian4.Setting(containerEl).setName("Thresholds").setHeading();
    new import_obsidian4.Setting(containerEl).setName("Large Markdown threshold (kb)").addSlider(
      (slider) => slider.setLimits(50, 1e3, 50).setValue(this.plugin.settings.largeMarkdownBytes / 1024).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.largeMarkdownBytes = value * 1024;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Large attachment threshold (mb)").addSlider(
      (slider) => slider.setLimits(1, 50, 1).setValue(this.plugin.settings.largeAttachmentBytes / (1024 * 1024)).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.largeAttachmentBytes = value * 1024 * 1024;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Duplicate hash cap (mb)").setDesc("Files above this size are reported as candidates without content hashing.").addSlider(
      (slider) => slider.setLimits(1, 10, 1).setValue(this.plugin.settings.duplicateHashMaxBytes / (1024 * 1024)).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.duplicateHashMaxBytes = value * 1024 * 1024;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Empty note word threshold").setDesc("Notes with this many words or fewer are flagged as empty/stub.").addSlider(
      (slider) => slider.setLimits(0, 20, 1).setValue(this.plugin.settings.emptyNoteWordThreshold).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.emptyNoteWordThreshold = value;
        await this.plugin.saveSettings();
      })
    );
  }
  addTagsSection() {
    const { containerEl } = this;
    new import_obsidian4.Setting(containerEl).setName("Tags").setHeading();
    new import_obsidian4.Setting(containerEl).setName("Watched tags (comma-separated)").addText(
      (text) => text.setValue(this.plugin.settings.watchedTags.join(", ")).setPlaceholder("E.g. Todo, review, project").onChange(async (value) => {
        this.plugin.settings.watchedTags = value.split(",").map((t) => t.trim()).filter(Boolean);
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Low usage tag threshold").addSlider(
      (slider) => slider.setLimits(1, 10, 1).setValue(this.plugin.settings.lowUsageTagThreshold).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.lowUsageTagThreshold = value;
        await this.plugin.saveSettings();
      })
    );
  }
  addIgnoredSection() {
    const { containerEl } = this;
    new import_obsidian4.Setting(containerEl).setName("Ignored items").setHeading();
    new import_obsidian4.Setting(containerEl).setName("Ignored folders (comma-separated)").setDesc("Files in these folders are excluded from scans.").addText(
      (text) => text.setValue(this.plugin.settings.ignoredFolders.join(", ")).setPlaceholder("E.g. Templates, archive").onChange(async (value) => {
        this.plugin.settings.ignoredFolders = value.split(",").map((f) => f.trim()).filter(Boolean);
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Ignored frontmatter properties (comma-separated)").setDesc("These properties are excluded from type consistency checks.").addText(
      (text) => text.setValue(this.plugin.settings.ignoredProperties.join(", ")).setPlaceholder("E.g. Cssclasses, aliases").onChange(async (value) => {
        this.plugin.settings.ignoredProperties = value.split(",").map((p) => p.trim()).filter(Boolean);
        await this.plugin.saveSettings();
      })
    );
  }
  addExportSection() {
    const { containerEl } = this;
    new import_obsidian4.Setting(containerEl).setName("Export").setHeading();
    new import_obsidian4.Setting(containerEl).setName("Report folder").setDesc("Folder for exported Markdown reports.").addText(
      (text) => text.setValue(this.plugin.settings.reportFolderPath).setPlaceholder("Inspector reports").onChange(async (value) => {
        this.plugin.settings.reportFolderPath = value.trim() || "Inspector reports";
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/report/markdown-export.ts
function generateMarkdownReport(result) {
  var _a;
  const lines = [];
  const now = /* @__PURE__ */ new Date();
  lines.push(`# Vault Inspector Report`);
  lines.push(``);
  lines.push(`- **Date:** ${now.toLocaleString()}`);
  lines.push(`- **Files scanned:** ${result.filesScanned}`);
  lines.push(`- **Duration:** ${((result.finishedAt - result.startedAt) / 1e3).toFixed(1)}s`);
  lines.push(`- **Scanners run:** ${result.scannersRun.length}`);
  lines.push(``);
  const errors = result.issues.filter((i) => i.severity === "error").length;
  const warnings = result.issues.filter((i) => i.severity === "warning").length;
  const infos = result.issues.filter((i) => i.severity === "info").length;
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`| Severity | Count |`);
  lines.push(`|---|---|`);
  lines.push(`| Total | ${result.issues.length} |`);
  lines.push(`| Errors | ${errors} |`);
  lines.push(`| Warnings | ${warnings} |`);
  lines.push(`| Info | ${infos} |`);
  lines.push(``);
  const grouped = groupByScanner2(result.issues);
  for (const scannerId of result.scannersRun) {
    const issues = (_a = grouped[scannerId]) != null ? _a : [];
    lines.push(`## ${SCANNER_LABELS[scannerId]} (${issues.length})`);
    lines.push(``);
    if (issues.length === 0) {
      lines.push(`No issues found.`);
      lines.push(``);
      continue;
    }
    lines.push(`| Severity | Title | File | Message |`);
    lines.push(`|---|---|---|---|`);
    for (const issue of issues) {
      const title = escapeMd(issue.title);
      const path = issue.primaryPath ? escapeMd(issue.primaryPath) : "-";
      const message = escapeMd(issue.message);
      lines.push(`| ${issue.severity} | ${title} | \`${path}\` | ${message} |`);
    }
    lines.push(``);
  }
  return lines.join("\n");
}
function groupByScanner2(issues) {
  const groups = {};
  for (const issue of issues) {
    if (!groups[issue.scannerId]) groups[issue.scannerId] = [];
    groups[issue.scannerId].push(issue);
  }
  return groups;
}
function escapeMd(text) {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

// src/fix/fix-executor.ts
var import_obsidian5 = require("obsidian");
async function executeFixAction(app, action) {
  switch (action.kind) {
    case "trash-file":
      return trashFiles(app, action.targetPaths);
    case "remove-link-text":
      return removeLinkText(app, action.targetPaths[0], action.linkText);
    default:
      return 0;
  }
}
async function trashFiles(app, paths) {
  let count = 0;
  for (const path of paths) {
    const file = app.vault.getAbstractFileByPath(path);
    if (file) {
      await app.fileManager.trashFile(file);
      count++;
    }
  }
  return count;
}
async function removeLinkText(app, sourcePath, linkText) {
  const file = app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof import_obsidian5.TFile)) return 0;
  const content = await app.vault.read(file);
  const target = linkText.split("|")[0].split("#")[0];
  const escaped = escapeRegex(target);
  const pattern = new RegExp(
    `!?\\[\\[${escaped}(?:#[^\\]|]*)?(?:\\|[^\\]]*)?\\]\\]`,
    "g"
  );
  const updated = content.replace(pattern, "");
  if (updated === content) return 0;
  await app.vault.modify(file, updated);
  return 1;
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/fix/confirm-modal.ts
var import_obsidian6 = require("obsidian");
function showConfirmModal(app, actions) {
  return new Promise((resolve) => {
    const modal = new ConfirmFixModal(app, actions, resolve);
    modal.open();
  });
}
var ConfirmFixModal = class extends import_obsidian6.Modal {
  constructor(app, actions, resolve) {
    super(app);
    this.actions = actions;
    this.resolve = resolve;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("vi-confirm-modal");
    const isBatch = this.actions.length > 1;
    const allPaths = this.actions.flatMap((a) => a.targetPaths);
    contentEl.createEl("h3", {
      text: isBatch ? `Confirm batch cleanup (${allPaths.length} files)` : "Confirm fix"
    });
    if (isBatch) {
      contentEl.createEl("p", {
        text: `This will move ${allPaths.length} file(s) to trash.`
      });
      const list = contentEl.createDiv({ cls: "vi-file-list" });
      for (const path of allPaths) {
        list.createEl("div", { cls: "vi-file-list-item", text: path });
      }
    } else {
      contentEl.createEl("p", { text: this.actions[0].description });
    }
    const btnRow = contentEl.createDiv({ cls: "vi-confirm-buttons" });
    btnRow.createEl("button", { text: "Cancel" }).addEventListener("click", () => {
      this.resolve(false);
      this.close();
    });
    const confirmBtn = btnRow.createEl("button", { cls: "vi-confirm-destructive", text: "Confirm" });
    confirmBtn.addEventListener("click", () => {
      this.resolve(true);
      this.close();
    });
  }
  onClose() {
    this.contentEl.empty();
    this.resolve(false);
  }
};

// src/main.ts
var VaultInspectorPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.scanRunner = new ScanRunner(async (url) => {
      const response = await (0, import_obsidian7.requestUrl)({ url, method: "HEAD" });
      return response.status;
    });
  }
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_INSPECTOR, (leaf) => new InspectorView(leaf));
    this.addCommand({
      id: "run-scan",
      name: "Run scan",
      callback: () => this.runScan()
    });
    this.addCommand({
      id: "export-report",
      name: "Export report",
      callback: () => this.exportReport()
    });
    registerDefaultScanners(this.scanRunner);
    this.addSettingTab(new InspectorSettingTab(this.app, this));
    this.addRibbonIcon("shield-check", "Run scan", () => this.runScan());
  }
  onunload() {
  }
  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async runScan() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_INSPECTOR)[0];
    if (!leaf) {
      const rightLeaf = this.app.workspace.getRightLeaf(false);
      if (!rightLeaf) return;
      leaf = rightLeaf;
      await leaf.setViewState({ type: VIEW_TYPE_INSPECTOR, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    const view = leaf.view;
    view.setCallbacks({
      onIgnoreAllIssues: async (issues) => {
        for (const issue of issues) {
          this.settings.ignoredIssueFingerprints.push(issue.fingerprint);
        }
        await this.saveSettings();
        new import_obsidian7.Notice(`Ignored ${issues.length} issue(s)`);
        view.setScanning(true);
        const result2 = await this.scanRunner.run(this.app, this.settings);
        view.setResult(result2);
      },
      onRestoreIssues: async (issues) => {
        const toRestore = new Set(issues.map((i) => i.fingerprint));
        this.settings.ignoredIssueFingerprints = this.settings.ignoredIssueFingerprints.filter(
          (fp) => !toRestore.has(fp)
        );
        await this.saveSettings();
        new import_obsidian7.Notice(`Restored ${issues.length} issue(s)`);
        view.setScanning(true);
        const result2 = await this.scanRunner.run(this.app, this.settings);
        view.setResult(result2);
      },
      onFixAllIssues: async (issues) => {
        const actions = issues.map((i) => i.fixAction).filter(Boolean);
        if (actions.length === 0) return;
        const confirmed = await showConfirmModal(this.app, actions);
        if (!confirmed) return;
        let fixed = 0;
        for (const action of actions) {
          try {
            await executeFixAction(this.app, action);
            fixed++;
          } catch (e) {
          }
        }
        new import_obsidian7.Notice(`Fixed ${fixed} issue(s)`);
        view.setScanning(true);
        const result2 = await this.scanRunner.run(this.app, this.settings);
        view.setResult(result2);
      },
      onRevealFile: async (path) => {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file) {
          if (file instanceof import_obsidian7.TFile) {
            await this.app.workspace.getLeaf(false).openFile(file);
          }
        } else {
          new import_obsidian7.Notice(`File not found: ${path}`);
        }
      },
      onRunScan: () => {
        void this.runScan();
      }
    });
    view.setEnableFixActions(this.settings.enableFixActions);
    view.setScanning(true);
    const result = await this.scanRunner.run(this.app, this.settings);
    view.setResult(result);
  }
  async exportReport() {
    var _a;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_INSPECTOR);
    const view = (_a = leaves[0]) == null ? void 0 : _a.view;
    if (!view || !view.hasResult()) {
      new import_obsidian7.Notice("Run a scan first before exporting.");
      return;
    }
    const result = view.getResult();
    const report = generateMarkdownReport(result);
    const folder = this.settings.reportFolderPath;
    const now = /* @__PURE__ */ new Date();
    const filename = `Vault Inspector Report ${now.toISOString().replace(/[:.]/g, "-").slice(0, 19)}.md`;
    const filepath = `${folder}/${filename}`;
    await this.app.vault.createFolder(folder).catch(() => {
    });
    await this.app.vault.create(filepath, report);
    new import_obsidian7.Notice(`Report exported to ${filepath}`);
  }
};

/* nosourcemap */