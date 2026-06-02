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

function parseCSV(
    text,
    delimiter = ','
) {

    if (!text)
        return [];

    /*
        remove BOM
    */

    if (
        text.charCodeAt(0)
        === 0xFEFF
    ) {

        text =
            text.slice(1);
    }

    const rows = [];

    let row = [];
    let cell = '';

    let inQuote = false;

    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const c = text[i];

        const next =
            text[i + 1];

        /*
            inside quoted field
        */

        if (inQuote) {

            if (
                c === '"' &&
                next === '"'
            ) {

                cell += '"';

                i++;

                continue;
            }

            if (c === '"') {

                inQuote = false;

                continue;
            }

            cell += c;

            continue;
        }

        /*
            opening quote
        */

        if (c === '"') {

            inQuote = true;

            continue;
        }

        /*
            delimiter
        */

        if (
            c === delimiter
        ) {

            row.push(cell);

            cell = '';

            continue;
        }

        /*
            CRLF
        */

        if (
            c === '\r' &&
            next === '\n'
        ) {

            row.push(cell);

            rows.push(row);

            row = [];
            cell = '';

            i++;

            continue;
        }

        /*
            LF only
        */

        if (c === '\n') {

            row.push(cell);

            rows.push(row);

            row = [];
            cell = '';

            continue;
        }

        /*
            standalone CR
        */

        if (c === '\r') {

            row.push(cell);

            rows.push(row);

            row = [];
            cell = '';

            continue;
        }

        cell += c;
    }

    /*
        unfinished quote detection
    */

    if (inQuote) {

        console.warn(
            'CSV Warning: unclosed quote'
        );
    }

    row.push(cell);

    rows.push(row);

    return rows.filter(

        row =>

            !(
                row.length === 1
                &&
                row[0] === ''
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

function escapeCSV(
    cell,
    delimiter = ','
) {

    if (
        cell === null ||
        cell === undefined
    ) {

        return '';
    }

    let s =
        String(cell);

    /*
        normalize newline
    */

    s = s.replace(
        /\r\n/g,
        '\n'
    );

    s = s.replace(
        /\r/g,
        '\n'
    );

    /*
        Excel Formula Injection
    */

    if (
        /^[=+\-@]/.test(
            s
        )
    ) {

        s = "'" + s;
    }

    /*
        RFC4180 quote escape
    */

    s = s.replace(
        /"/g,
        '""'
    );

    /*
        need quoting ?
    */

    const needQuote =

        s.includes(
            delimiter
        )

        ||

        s.includes('"')

        ||

        s.includes('\n')

        ||

        s.includes('\t')

        ||

        /^\s|\s$/.test(
            s
        );

    if (
        needQuote
    ) {

        s = `"${s}"`;
    }

    return s;
}

function downloadCSV() {

    const delimiter = ',';

    const csvContent =

        currentData

            .map(

                row =>

                    row.map(

                        cell =>

                            escapeCSV(
                                cell,
                                delimiter
                            )

                    )

                        .join(
                            delimiter
                        )

            )

            .join('\r\n');

    const mode =
        encodingSelect.value;

    let bytes;

    switch (mode) {

        case 'UTF8':

            bytes =

                new TextEncoder()

                    .encode(
                        csvContent
                    );

            break;

        case 'UTF8_BOM':

            {

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

            break;

        case 'SJIS':

        case 'EUCJP':

            {

                const encoded =

                    Encoding.convert(

                        Encoding
                            .stringToCode(
                                csvContent
                            ),

                        {
                            to: mode,

                            from: 'UNICODE'
                        }
                    );

                bytes =

                    new Uint8Array(
                        encoded
                    );
            }

            break;

        default:

            alert(
                'Unsupported encoding'
            );

            return;
    }

    const blob =

        new Blob(

            [bytes],

            {
                type:
                    `text/csv;charset=${mode}`
            }
        );

    const url =

        URL.createObjectURL(
            blob
        );

    const a =
        document.createElement(
            'a'
        );

    a.href = url;

    a.download =

        `csv_${Date.now()
        }.csv`;

    document.body
        .appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(
        url
    );
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