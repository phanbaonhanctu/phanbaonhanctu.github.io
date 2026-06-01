const input =
    document.getElementById(
        "inputSql"
    );

const output =
    document.getElementById(
        "outputSql"
    );

const copyBtn =
    document.getElementById(
        "copyBtn"
    );

const minifyBtn =
    document.getElementById(
        "minifyBtn"
    );

const clearBtn =
    document.getElementById(
        "clearBtn"
    );

const status =
    document.getElementById(
        "status"
    );

/* ---------- Auto Format ---------- */

input.addEventListener(
    "input",
    formatSQL
);

function formatSQL() {

    const value =
        input.value.trim();

    if (!value) {

        output.value = "";
        status.innerHTML = "";
        return;
    }

    try {

        output.value =
            sqlFormatter.format(
                value,
                {
                    language: 'sql'
                }
            );

        status.innerHTML =
            "✅ SQL formatted";

        status.className =
            "mt-3 text-success fw-bold";
    }
    catch (err) {

        output.value = "";

        status.innerHTML =
            "❌ Invalid SQL";

        status.className =
            "mt-3 text-danger fw-bold";
    }
}

/* ---------- Copy ---------- */

copyBtn.addEventListener(
    "click",
    async () => {

        if (!output.value) return;

        await navigator
            .clipboard
            .writeText(
                output.value
            );

        status.innerHTML =
            "✅ Copied";
    }
);

/* ---------- Minify ---------- */

minifyBtn.addEventListener(
    "click",
    () => {

        try {

            output.value =
                input.value
                    .replace(/\n/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

            status.innerHTML =
                "⚡ Minified";
        }
        catch { }
    }
);

/* ---------- Clear ---------- */

clearBtn.addEventListener(
    "click",
    () => {

        input.value = "";
        output.value = "";
        status.innerHTML = "";
    }
);