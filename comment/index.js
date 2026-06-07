const packageEl =
    document.getElementById(
        "package"
    );

const actionEl =
    document.getElementById(
        "action"
    );

const ticketEl =
    document.getElementById(
        "ticket"
    );

const sourceEl =
    document.getElementById(
        "sourceCode"
    );

const resultEl =
    document.getElementById(
        "result"
    );

document
    .getElementById(
        "generateBtn"
    )
    .addEventListener(
        "click",
        generate
    );

document
    .getElementById(
        "copyBtn"
    )
    .addEventListener(
        "click",
        copyResult
    );

document
    .getElementById(
        "clearBtn"
    )
    .addEventListener(
        "click",
        clearAll
    );

function generate() {

    const pkg =
        packageEl.value;

    const action =
        actionEl.value;

    const ticket =
        ticketEl.value.trim();

    let source =
        sourceEl.value;

    const start =
        `// ${pkg} ${action} ${ticket} START`;

    const end =
        `// ${pkg} ${action} ${ticket} END`;

    /*
     * DEL
     */

    if (action === "DEL") {

        const commentedCode =

            source
                .split("\n")
                .map(line => `// ${line}`)
                .join("\n");

        resultEl.value =
            `${start}
${commentedCode}
${end}`;
    } else {
        /*
         * ADD / MOD
         */

        resultEl.value =
            `${start}
${source || ""}
${end}`;
    }



    /*
     * Auto Copy
     */

    try {

        navigator
            .clipboard
            .writeText(
                result.value
            );

        showToast(
            "✅ Generated & Copied"
        );
    }
    catch {

        showToast(
            "⚠ Copy failed"
        );
    }
    return;
}

async function copyResult() {

    if (
        !resultEl.value
    ) {
        return;
    }

    await navigator
        .clipboard
        .writeText(
            resultEl.value
        );
}

function clearAll() {

    packageEl.value =
        "p2fsa";

    actionEl.value =
        "ADD";

    ticketEl.value = "";

    sourceEl.value = "";

    resultEl.value = "";
}
sourceEl.addEventListener(
    "input",
    generate
);

function enableTabIndent(textarea) {

    textarea.addEventListener(
        'keydown',
        function (e) {

            if (
                e.key !== 'Tab'
            ) {
                return;
            }

            e.preventDefault();

            const value =
                this.value;

            const start =
                this.selectionStart;

            const end =
                this.selectionEnd;

            /*
             * No selection
             */

            if (start === end) {

                if (e.shiftKey) {

                    const before =
                        value.substring(
                            0,
                            start
                        );

                    if (
                        before.endsWith(
                            '    '
                        )
                    ) {

                        this.value =

                            value.substring(
                                0,
                                start - 4
                            )

                            +

                            value.substring(
                                start
                            );

                        this.selectionStart =
                            this.selectionEnd =
                            start - 4;
                    }

                    return;
                }

                const tab =
                    '    ';

                this.value =

                    value.substring(
                        0,
                        start
                    )

                    +

                    tab

                    +

                    value.substring(
                        end
                    );

                this.selectionStart =
                    this.selectionEnd =
                    start + 4;

                return;
            }

            /*
             * Multi line selection
             */

            const lineStart =

                value.lastIndexOf(
                    '\n',
                    start - 1
                ) + 1;

            const selectedText =

                value.substring(
                    lineStart,
                    end
                );

            const lines =
                selectedText.split(
                    '\n'
                );

            let processed;

            if (e.shiftKey) {

                processed =

                    lines.map(
                        line => {

                            if (
                                line.startsWith(
                                    '    '
                                )
                            ) {
                                return line.substring(
                                    4
                                );
                            }

                            if (
                                line.startsWith(
                                    '\t'
                                )
                            ) {
                                return line.substring(
                                    1
                                );
                            }

                            return line;
                        }
                    );
            }
            else {

                processed =

                    lines.map(
                        line =>
                            '    ' + line
                    );
            }

            const replacement =

                processed.join(
                    '\n'
                );

            this.value =

                value.substring(
                    0,
                    lineStart
                )

                +

                replacement

                +

                value.substring(
                    end
                );

            this.selectionStart =
                lineStart;

            this.selectionEnd =
                lineStart +
                replacement.length;
        }
    );
}
enableTabIndent(sourceEl);

enableTabIndent(resultEl);
function showToast(message) {

    const oldToast =
        document.getElementById(
            "toolToast"
        );

    if (oldToast) {

        oldToast.remove();
    }

    const toast =
        document.createElement(
            "div"
        );

    toast.id =
        "toolToast";

    toast.innerText =
        message;

    toast.style.cssText = `
        position:fixed;
        right:20px;
        bottom:20px;
        z-index:9999;
        background:#198754;
        color:white;
        padding:10px 18px;
        border-radius:8px;
        font-weight:bold;
        box-shadow:0 2px 8px rgba(0,0,0,.3);
    `;

    document.body
        .appendChild(
            toast
        );

    setTimeout(
        () => toast.remove(),
        2000
    );
}