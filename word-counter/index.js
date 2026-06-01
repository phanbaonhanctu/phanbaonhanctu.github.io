const input =
    document.getElementById(
        "inputText"
    );

const stats =
    document.getElementById(
        "stats"
    );

const copyBtn =
    document.getElementById(
        "copyBtn"
    );

const clearBtn =
    document.getElementById(
        "clearBtn"
    );

function count(regex, text) {

    return (
        text.match(regex) || []
    ).length;
}

function render() {

    const text =
        input.value;

    const result = {

        "Characters":
            text.length,

        "No Space":
            text
                .replace(/\s/g, '')
                .length,

        "Words":
            text
                .trim()
                ? text.trim()
                    .split(/\s+/)
                    .length
                : 0,

        "Lines":
            text
                ? text.split('\n')
                    .length
                : 0,

        "1-byte":
            count(
                /[\u0000-\u00FF]/g,
                text
            ),

        "2-byte":
            count(
                /[^\u0000-\u00FF]/g,
                text
            ),

        "ASCII":
            count(
                /[\x00-\x7F]/g,
                text
            ),

        "Hiragana":
            count(
                /[\u3040-\u309F]/g,
                text
            ),

        "Katakana":
            count(
                /[\u30A0-\u30FF]/g,
                text
            ),

        "Kanji":
            count(
                /[\u4E00-\u9FFF]/g,
                text
            ),

        "Numbers":
            count(
                /[0-9０-９]/g,
                text
            ),

        "Halfwidth":
            count(
                /[\u0020-\u007E]/g,
                text
            ),

        "Fullwidth":
            count(
                /[^\u0020-\u007E]/g,
                text
            )
    };

    stats.innerHTML = '';

    Object.entries(result)
        .forEach(([k, v]) => {

            stats.innerHTML += `

        <div class="col-lg-3 col-md-4 col-sm-6">

            <div class="stat-card">

                <div class="stat-title">

                    ${k}

                </div>

                <div class="stat-value">

                    ${v}

                </div>

            </div>

        </div>
        `;
        });
}

input.addEventListener(
    "input",
    render
);

copyBtn.onclick =
    async () => {

        const txt =
            stats.innerText;

        await navigator
            .clipboard
            .writeText(txt);
    };

clearBtn.onclick =
    () => {

        input.value = '';

        render();
    };

render();