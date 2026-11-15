const $ = (id) => document.getElementById(id);

const fileInput = $("fileInput");
const inputEncoding = $("inputEncoding");
const outputEncoding = $("outputEncoding");
const searchInput = $("searchInput");
const downloadBtn = $("downloadBtn");
const clearBtn = $("clearBtn");
const warningDiv = $("warning");
const stats = $("stats");
const tableContainer = $("tableContainer");
const editToolbar = $("editToolbar");

const DELIMITER = ",";

let currentData = [];
let fileBuffer = null;      // bytes gốc của file (để đọc lại khi đổi encoding)
let fileName = "";
let selected = null;        // { r, c } ô đang chọn (index thật trong currentData)
let dirty = false;          // đã chỉnh sửa chưa
let undoStack = [];
let parseWarning = "";
let eol = "\r\n";           // giữ nguyên kiểu xuống dòng của file gốc
let endsWithNewline = true; // giữ nguyên việc có/không có xuống dòng cuối file
let lastInputValue = "AUTO";
let loadedEncoding = "";

/* ------------------------------------------------------------------ */
/* Events                                                             */
/* ------------------------------------------------------------------ */

fileInput.addEventListener("change", handleFile);
downloadBtn.addEventListener("click", downloadCSV);
clearBtn.addEventListener("click", clearData);

let searchTimer;
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderTable, 200);
});

inputEncoding.addEventListener("change", () => {
    if (!fileBuffer) {
        lastInputValue = inputEncoding.value;
        return;
    }
    if (dirty && !confirm("Đổi encoding sẽ đọc lại file gốc và mất các chỉnh sửa hiện tại. Tiếp tục?")) {
        inputEncoding.value = lastInputValue;
        return;
    }
    lastInputValue = inputEncoding.value;
    if (inputEncoding.value !== "AUTO") {
        outputEncoding.value = inputEncoding.value;
    }
    loadBuffer();
});

/* Sửa ô: dùng event delegation thay vì gắn listener cho từng ô */
tableContainer.addEventListener("input", (e) => {
    const el = e.target.closest("[data-r]");
    if (!el) return;
    currentData[+el.dataset.r][+el.dataset.c] = el.textContent;
    dirty = true;
});

tableContainer.addEventListener("focusin", (e) => {
    const el = e.target.closest("[data-r]");
    if (el) setSelected(el);
});

/* Paste luôn là text thuần, tránh chèn HTML vào ô */
tableContainer.addEventListener("paste", (e) => {
    if (!e.target.closest("[data-r]")) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    document.execCommand("insertText", false, text);
});

editToolbar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || btn.disabled) return;
    actions[btn.dataset.action]();
});

window.addEventListener("beforeunload", (e) => {
    if (dirty) {
        e.preventDefault();
        e.returnValue = "";
    }
});

/* ------------------------------------------------------------------ */
/* Load file                                                          */
/* ------------------------------------------------------------------ */

function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (x) => {
        fileBuffer = new Uint8Array(x.target.result);
        fileName = file.name;
        lastInputValue = inputEncoding.value;
        if (inputEncoding.value !== "AUTO") {
            outputEncoding.value = inputEncoding.value;
        }
        loadBuffer();
    };
    reader.readAsArrayBuffer(file);
}

function detectEncoding(bytes) {
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        return "UTF8_BOM";
    }
    const d = Encoding.detect(bytes);
    if (d === "SJIS") return "SJIS";
    if (d === "EUCJP") return "EUCJP";
    return "UTF8"; // ASCII / UTF8 / không xác định
}

function loadBuffer() {
    let enc = inputEncoding.value;

    if (enc === "AUTO") {
        enc = detectEncoding(fileBuffer);
        outputEncoding.value = enc; // mặc định tải về cùng encoding với file gốc
    }

    loadedEncoding = enc;

    const from = enc === "UTF8_BOM" ? "UTF8" : enc;

    const text = Encoding.codeToString(
        Encoding.convert(fileBuffer, { to: "UNICODE", from })
    );

    // giữ nguyên kiểu xuống dòng + dòng trống cuối file của file gốc
    const m = text.match(/\r\n|\n|\r/);
    eol = m ? m[0] : "\r\n";
    endsWithNewline = /[\r\n]$/.test(text);

    currentData = parseCSV(text, DELIMITER);
    selected = null;
    undoStack = [];
    dirty = false;

    refresh();
}

/* ------------------------------------------------------------------ */
/* Parse / build CSV                                                  */
/* ------------------------------------------------------------------ */

function parseCSV(text, delimiter = ",") {
    parseWarning = "";

    if (!text) return [];

    // bỏ BOM
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }

    const rows = [];
    let row = [];
    let cell = "";
    let inQuote = false;
    let atFieldStart = true; // dấu " chỉ mở quote khi nằm ở đầu ô
    let hasContent = false;  // dòng hiện tại có gì chưa (để không tạo dòng thừa cuối file)

    const endRow = () => {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        atFieldStart = true;
        hasContent = false;
    };

    for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (inQuote) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuote = false;
                }
            } else {
                cell += c;
            }
            continue;
        }

        if (c === '"' && atFieldStart) {
            inQuote = true;
            atFieldStart = false;
            hasContent = true;
            continue;
        }

        if (c === delimiter) {
            row.push(cell);
            cell = "";
            atFieldStart = true;
            hasContent = true;
            continue;
        }

        if (c === "\r") {
            if (text[i + 1] === "\n") i++;
            endRow();
            continue;
        }

        if (c === "\n") {
            endRow();
            continue;
        }

        cell += c;
        atFieldStart = false;
        hasContent = true;
    }

    if (inQuote) {
        parseWarning = "⚠ File có dấu \" chưa được đóng, dữ liệu cuối file có thể bị gộp vào một ô.";
    }

    if (hasContent) endRow();

    return rows;
}

function escapeCSV(cell, delimiter = ",") {
    if (cell === null || cell === undefined) return "";

    let s = String(cell);

    // RFC4180: nhân đôi dấu "
    s = s.replace(/"/g, '""');

    const needQuote =
        s.includes(delimiter) ||
        s.includes('"') ||
        s.includes("\n") ||
        s.includes("\r") ||
        /^\s|\s$/.test(s);

    return needQuote ? `"${s}"` : s;
}

function toCSV() {
    const body = currentData
        .map((row) => {
            // dòng chỉ có 1 ô rỗng phải ghi là "" kẻo thành dòng trống
            if (row.length === 1 && row[0] === "") return '""';
            return row.map((cell) => escapeCSV(cell, DELIMITER)).join(DELIMITER);
        })
        .join(eol);

    return endsWithNewline ? body + eol : body;
}

/* ------------------------------------------------------------------ */
/* Render                                                             */
/* ------------------------------------------------------------------ */

function refresh() {
    validate();
    renderTable();
    updateControls();
}

function validate() {
    const colCount = currentData[0]?.length || 0;
    const bad = [];

    currentData.forEach((row, i) => {
        if (row.length !== colCount) bad.push(i + 1);
    });

    const msgs = [];
    if (bad.length) msgs.push(`⚠ Số cột khác dòng tiêu đề tại dòng: ${bad.join(", ")}`);
    if (parseWarning) msgs.push(parseWarning);
    warningDiv.innerText = msgs.join("\n");

    stats.innerText =
        `Rows: ${currentData.length} | Columns: ${colCount}` +
        (loadedEncoding ? ` | Encoding file gốc: ${loadedEncoding}` : "");
}

function renderTable() {
    const keyword = searchInput.value.toLowerCase();
    const colCount = currentData[0]?.length || 0;
    const table = document.createElement("table");

    currentData.forEach((row, r) => {
        // luôn hiện dòng tiêu đề; chỉ lọc các dòng dữ liệu
        if (r > 0 && keyword) {
            const match = row.some((c) => String(c).toLowerCase().includes(keyword));
            if (!match) return;
        }

        const tr = document.createElement("tr");
        if (row.length !== colCount) tr.classList.add("bad-row");

        const num = document.createElement("th");
        num.className = "rownum";
        num.textContent = r + 1;
        tr.appendChild(num);

        row.forEach((cell, c) => {
            const el = document.createElement(r === 0 ? "th" : "td");
            el.textContent = cell;
            el.contentEditable = "plaintext-only";
            if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
            el.dataset.r = r;
            el.dataset.c = c;
            if (selected && selected.r === r && selected.c === c) {
                el.classList.add("selected");
            }
            tr.appendChild(el);
        });

        table.appendChild(tr);
    });

    tableContainer.innerHTML = "";
    tableContainer.appendChild(table);
}

function setSelected(el) {
    const prev = tableContainer.querySelector(".selected");
    if (prev) prev.classList.remove("selected");
    el.classList.add("selected");
    selected = { r: +el.dataset.r, c: +el.dataset.c };
}

function updateControls() {
    const has = currentData.length > 0;
    downloadBtn.disabled = !has;
    clearBtn.disabled = !has;

    editToolbar.querySelectorAll("[data-action]").forEach((btn) => {
        btn.disabled = btn.dataset.action === "undo" ? !undoStack.length : !has;
    });
}

function focusSelected() {
    if (!selected) return;
    const el = tableContainer.querySelector(
        `[data-r="${selected.r}"][data-c="${selected.c}"]`
    );
    if (el) {
        el.focus();
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
}

/* ------------------------------------------------------------------ */
/* Thêm / xoá hàng, cột                                               */
/* ------------------------------------------------------------------ */

function pushUndo() {
    undoStack.push(JSON.stringify(currentData));
    if (undoStack.length > 30) undoStack.shift();
}

function commit() {
    dirty = true;
    refresh();
    focusSelected();
}

function needSelection() {
    if (selected) return true;
    alert("Hãy click vào một ô trước.");
    return false;
}

const actions = {
    addRowAbove() {
        addRow("above");
    },
    addRowBelow() {
        addRow("below");
    },
    deleteRow,
    addColLeft() {
        addCol("left");
    },
    addColRight() {
        addCol("right");
    },
    deleteCol,
    undo,
};

function addRow(where) {
    if (!currentData.length) return;
    pushUndo();

    const cols = currentData[0].length;
    let idx;

    if (!selected) {
        idx = currentData.length; // không chọn ô nào → thêm vào cuối
    } else {
        idx = where === "above" ? selected.r : selected.r + 1;
        idx = Math.max(1, idx); // không chèn lên trên dòng tiêu đề
    }

    currentData.splice(idx, 0, Array(cols).fill(""));
    selected = { r: idx, c: selected ? Math.min(selected.c, cols - 1) : 0 };
    commit();
}

function deleteRow() {
    if (!needSelection()) return;

    if (selected.r === 0 && !confirm("Đây là dòng tiêu đề. Vẫn xoá?")) return;

    pushUndo();
    currentData.splice(selected.r, 1);

    selected = currentData.length
        ? { r: Math.min(selected.r, currentData.length - 1), c: selected.c }
        : null;

    commit();
}

function addCol(where) {
    if (!currentData.length) return;
    pushUndo();

    const colCount = currentData[0].length;
    let idx;

    if (!selected) {
        idx = colCount;
    } else {
        idx = where === "left" ? selected.c : selected.c + 1;
    }

    currentData.forEach((row) => {
        while (row.length < idx) row.push(""); // dòng bị thiếu cột thì bù cho đủ
        row.splice(idx, 0, "");
    });

    selected = { r: selected ? selected.r : 0, c: idx };
    commit();
}

function deleteCol() {
    if (!needSelection()) return;

    if ((currentData[0]?.length || 0) <= 1) {
        alert("Không thể xoá cột cuối cùng.");
        return;
    }

    pushUndo();
    const c = selected.c;

    currentData.forEach((row) => {
        if (c < row.length) row.splice(c, 1);
    });

    selected = { r: selected.r, c: Math.min(c, currentData[0].length - 1) };
    commit();
}

function undo() {
    const snap = undoStack.pop();
    if (!snap) return;

    currentData = JSON.parse(snap);

    if (selected) {
        selected.r = Math.min(selected.r, Math.max(currentData.length - 1, 0));
        selected.c = Math.min(selected.c, Math.max((currentData[0]?.length || 1) - 1, 0));
    }

    commit();
}

/* ------------------------------------------------------------------ */
/* Download                                                           */
/* ------------------------------------------------------------------ */

/* Tìm các ký tự không có trong encoding đích (sẽ bị đổi thành "?") */
function findUnmappable(text, mode) {
    const bad = [];

    for (const ch of new Set(text)) {
        if (ch.charCodeAt(0) < 0x80) continue;

        const enc = Encoding.convert(Encoding.stringToCode(ch), {
            to: mode,
            from: "UNICODE",
        });
        const dec = Encoding.codeToString(
            Encoding.convert(enc, { to: "UNICODE", from: mode })
        );

        if (dec !== ch) bad.push(ch);
    }

    return bad;
}

function downloadCSV() {
    const mode = outputEncoding.value;
    const csv = toCSV();
    let parts;

    switch (mode) {
        case "UTF8":
            parts = [new TextEncoder().encode(csv)];
            break;

        case "UTF8_BOM":
            parts = [new Uint8Array([0xEF, 0xBB, 0xBF]), new TextEncoder().encode(csv)];
            break;

        case "SJIS":
        case "EUCJP": {
            const bad = findUnmappable(csv, mode);

            if (bad.length) {
                const list = bad.slice(0, 30).join(" ") + (bad.length > 30 ? " ..." : "");
                const ok = confirm(
                    `Các ký tự sau không có trong ${mode} và sẽ bị thay bằng "?":\n\n${list}\n\nVẫn tải file?`
                );
                if (!ok) return;
            }

            const encoded = Encoding.convert(Encoding.stringToCode(csv), {
                to: mode,
                from: "UNICODE",
            });
            parts = [new Uint8Array(encoded)];
            break;
        }

        default:
            alert("Unsupported encoding");
            return;
    }

    const blob = new Blob(parts, { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const base = fileName ? fileName.replace(/\.[^.]+$/, "") : "csv";
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}_edited.csv`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    dirty = false;
}

/* ------------------------------------------------------------------ */
/* Clear                                                              */
/* ------------------------------------------------------------------ */

function clearData() {
    if (dirty && !confirm("Dữ liệu đã chỉnh sửa chưa tải về sẽ bị mất. Tiếp tục?")) return;

    currentData = [];
    fileBuffer = null;
    fileName = "";
    selected = null;
    undoStack = [];
    dirty = false;
    parseWarning = "";
    loadedEncoding = "";

    tableContainer.innerHTML = "";
    warningDiv.innerHTML = "";
    stats.innerHTML = "";
    fileInput.value = "";

    updateControls();
}