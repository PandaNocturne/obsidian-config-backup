// https://forum-zh.obsidian.md/t/topic/49325/5
module.exports = async () => {
    // --- Setup ---
    const editor = app.workspace.activeEditor.editor;
    const cursor = editor.getCursor();
    const currentLineNumber = cursor.line;
    const line = editor.getLine(currentLineNumber);

    // --- Helper: Get Timestamp ---
    function getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- Helper: Get Indent ---
    function getIndent(lineContent) {
        const match = lineContent.match(/^(\s*)/);
        return match ? match[1] : "";
    }

    // --- Helper: Replace Line and Set Cursor ---
    function replaceAndExit(newLine) {
        editor.replaceRange(newLine, { line: currentLineNumber, ch: 0 }, { line: currentLineNumber, ch: line.length });
        editor.setCursor({ line: currentLineNumber, ch: newLine.length });
        // Stop script execution after performing an action
        return;
    }

    // --- Regex Definitions ---
    const indent = getIndent(line);
    let coreText = "";
    let newLine = "";
    let match;

    // STANDARD FORMATS (Strict: require full timestamp and match end of line $)
    const regexDoneStd = /^\s*- \[x\] (.*?) ✅ (\d{4}-\d{2}-\d{2})$/;
    const regexCancelledStd = /^\s*- \[-\] (.*?) ❌ (\d{4}-\d{2}-\d{2})$/;
    const regexQuestionStd = /^\s*- \[\?\] (.*?) ❓️ (\d{4}-\d{2}-\d{2})$/;
    const regexInProgressStd = /^\s*- \[\/\] (.*?) ⏳ (\d{4}-\d{2}-\d{2})$/;
    const regexTodo = /^\s*- \[ \](.*)/; // Capture text after marker

    // VARIANT FORMATS (for Normalization)
    // Matches "- [x] Text" but only if NOT followed by a standard emoji/timestamp pattern
    const regexDonePlain = /^\s*- \[x\](?! .*?✅ \d{4}-\d{2}-\d{2})(?! .*?❌ \d{4}-\d{2}-\d{2})(?! .*?❓️ \d{4}-\d{2}-\d{2})(?! .*?⏳ \d{4}-\d{2}-\d{2})(.*)/;
    // Matches "- [/] Text" but only if NOT followed by a standard emoji/timestamp pattern
    const regexInProgressPlain = /^\s*- \[\/\](?! .*?✅ \d{4}-\d{2}-\d{2})(?! .*?❌ \d{4}-\d{2}-\d{2})(?! .*?❓️ \d{4}-\d{2}-\d{2})(?! .*?⏳ \d{4}-\d{2}-\d{2})(.*)/;

    // --- 1. NORMALIZATION STEP: Convert variants to Standard Format ---

    // Normalize Plain Done Task (e.g., from simple checkbox click)
    if ((match = line.match(regexDonePlain))) {
        coreText = match[1].trim();
        newLine = `${indent}- [x] ${coreText} ✅ ${getTimestamp()}`; // Standardize Done
        return replaceAndExit(newLine);
    }
    // Normalize Plain InProgress Task
    else if ((match = line.match(regexInProgressPlain))) {
        coreText = match[1].trim();
        newLine = `${indent}- [/] ${coreText} ⏳ ${getTimestamp()}`; // Standardize InProgress
        return replaceAndExit(newLine);
    }

    // --- 2. MAIN CYCLE STEP: Switch between Standard Formats ---

    // Add state symbols and time stamps based on current state
    if ((match = line.match(regexDoneStd))) {
        // Current: Done -> Next: Plain Text
        coreText = match[1].trim(); // Use captured group
        newLine = `${indent}${coreText}`; // No emoji or timestamp
        // Handle case where coreText might be empty
        if (newLine === indent) {
            newLine = indent.trimEnd(); // Avoid line with only whitespace
        }
        return replaceAndExit(newLine);
    } else if ((match = line.match(regexCancelledStd))) {
        // Current: Cancelled -> Next: Question
        coreText = match[1].trim();
        newLine = `${indent}- [?] ${coreText} ❓️ ${getTimestamp()}`;
        return replaceAndExit(newLine);
    } else if ((match = line.match(regexQuestionStd))) {
        // Current: Question -> Next: Done
        coreText = match[1].trim();
        newLine = `${indent}- [x] ${coreText} ✅ ${getTimestamp()}`;
        return replaceAndExit(newLine);
    } else if ((match = line.match(regexInProgressStd))) {
        // Current: InProgress -> Next: Cancelled
        coreText = match[1].trim();
        newLine = `${indent}- [-] ${coreText} ❌ ${getTimestamp()}`;
        return replaceAndExit(newLine);
    } else if ((match = line.match(regexTodo))) {
        // Current: Todo -> Next: InProgress
        coreText = match[1].trim();
        newLine = `${indent}- [/] ${coreText} ⏳ ${getTimestamp()}`;
        return replaceAndExit(newLine);
    } else {
        // Current: Plain Text -> Next: Todo
        coreText = line.trim(); // Get original text
        if (coreText === "") {
            // If line was empty or just whitespace, create a simple todo item
            newLine = `${indent}- [ ] `;
        } else {
            // Otherwise, convert plain text to todo item
            newLine = `${indent}- [ ] ${coreText}`;
        }
        return replaceAndExit(newLine);
    }
};