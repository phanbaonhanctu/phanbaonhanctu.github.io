const fileInput =
    document.getElementById(
        "fileInput"
    );

const encodingSelect =
    document.getElementById(
        "encodingSelect"
    );

const tableContainer =
    document.getElementById(
        "tableContainer"
    );

const downloadBtn =
    document.getElementById(
        "downloadBtn"
    );

const clearBtn =
    document.getElementById(
        "clearBtn"
    );

const warningDiv =
    document.getElementById(
        "warning"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const stats =
    document.getElementById(
        "stats"
    );

let currentData = [];

fileInput.addEventListener(
    "change",
    handleFile
);

downloadBtn.addEventListener(
    "click",
    downloadCSV
);

clearBtn.addEventListener(
    "click",
    clearData
);

searchInput.addEventListener(
    "input",
    renderTable
);

function handleFile(e) {

    const file =
        e.target.files[0];

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload = (x) => {

        const bytes =

            new Uint8Array(
                x.target.result
            );

        const mode =
            encodingSelect.value;

        let encoding;

        switch (mode) {

            case 'SJIS':

                encoding = 'SJIS';
                break;

            case 'EUCJP':

                encoding = 'EUCJP';
                break;

            default:

                encoding = 'UTF8';
        }

        const text =

            Encoding.codeToString(

                Encoding.convert(

                    bytes,

                    {
                        to: 'UNICODE',

                        from: encoding
                    }
                )
            );

        currentData =
            parseCSV(text);

        validate();

        renderTable();

        downloadBtn.disabled = false;

        clearBtn.disabled = false;
    };

    reader.readAsArrayBuffer(
        file
    );
}

function validate() {

    const colCount =
        currentData[0]?.length || 0;

    let bad = [];

    currentData.forEach(
        (row, i) => {

            if (
                row.length !== colCount
            ) {

                bad.push(i + 1);
            }
        }
    );

    warningDiv.innerText =

        bad.length

            ? `⚠ Column mismatch rows: ${bad.join(', ')}`

            : '';

    stats.innerText =
        `Rows: ${currentData.length} | Columns: ${colCount}`;
}

function parseCSV(text) {

    let rows = [];
    let row = [];
    let cell = '';
    let quote = false;

    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const c = text[i];
        const next = text[i + 1];

        if (quote) {

            if (
                c == '"' &&
                next == '"'
            ) {

                cell += '"';
                i++;
            }

            else if (c == '"') {

                quote = false;
            }

            else {

                cell += c;
            }
        }

        else {

            if (c == '"') {

                quote = true;
            }

            else if (c == ',') {

                row.push(cell);
                cell = '';
            }

            else if (c == '\n') {

                row.push(cell);

                rows.push(row);

                row = [];
                cell = '';
            }

            else if (c != '\r') {

                cell += c;
            }
        }
    }

    row.push(cell);

    rows.push(row);

    return rows.filter(
        r =>

            !r.every(
                c =>
                    c.trim() === ''
            )
    );
}

function renderTable() {

    let data = [...currentData];

    const keyword =
        searchInput.value
            .toLowerCase();

    if (keyword) {

        data =
            data.filter(
                row =>

                    row.some(
                        c =>

                            String(c)

                                .toLowerCase()

                                .includes(keyword)
                    )
            );
    }

    const table =
        document.createElement(
            "table"
        );

    data.forEach(
        (row, i) => {

            const tr =
                document.createElement(
                    "tr"
                );

            row.forEach(
                (cell, j) => {

                    const el =

                        i === 0

                            ? document.createElement(
                                "th"
                            )

                            : document.createElement(
                                "td"
                            );

                    el.textContent =
                        cell;

                    el.contentEditable = true;

                    el.addEventListener(
                        "input",
                        () => {

                            currentData[i][j] =
                                el.textContent;
                        }
                    );

                    tr.appendChild(
                        el
                    );
                }
            );

            table.appendChild(
                tr
            );
        }
    );

    tableContainer.innerHTML = '';

    tableContainer.appendChild(
        table
    );
}

function escapeCSV(cell) {

    let s =
        String(cell ?? '');

    s = s.replace(
        /"/g,
        '""'
    );

    if (
        s.includes(',') ||
        s.includes('\n')
    ) {

        s = `"${s}"`;
    }

    return s;
}

function downloadCSV() {

    const csvContent =

        currentData

            .map(
                row =>

                    row.map(
                        escapeCSV
                    )

                        .join(',')
            )

            .join('\r\n');

    const mode =
        encodingSelect.value;

    let bytes;

    if (mode === "UTF8") {

        bytes =
            new TextEncoder()
                .encode(
                    csvContent
                );
    }

    else if (
        mode === "UTF8_BOM"
    ) {

        const body =

            new TextEncoder()

                .encode(
                    csvContent
                );

        bytes =
            new Uint8Array(

                [
                    0xEF,
                    0xBB,
                    0xBF,
                    ...body
                ]
            );
    }

    else {

        let target =

            mode === "SJIS"

                ? 'SJIS'

                : 'EUCJP';

        const encoded =

            Encoding.convert(

                Encoding
                    .stringToCode(
                        csvContent
                    ),

                {
                    to: target,

                    from: 'UNICODE'
                }
            );

        bytes =
            new Uint8Array(
                encoded
            );
    }

    const blob =

        new Blob(

            [bytes],

            {
                type:
                    'text/csv'
            }
        );

    const url =

        URL.createObjectURL(
            blob
        );

    const a =

        document.createElement(
            "a"
        );

    a.href = url;

    a.download =

        `csv_${Date.now()}.csv`;

    a.click();
}

function clearData() {

    currentData = [];

    tableContainer.innerHTML = '';

    warningDiv.innerHTML = '';

    stats.innerHTML = '';

    fileInput.value = '';

    downloadBtn.disabled = true;
    clearBtn.disabled = true;
}