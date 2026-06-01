const input =
    document.getElementById(
        "inputJson"
    );

const output =
    document.getElementById(
        "outputJson"
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
    formatJson
);

function formatJson() {

    const value =
        input.value.trim();

    if (!value) {

        output.value = "";
        status.innerText = "";
        return;
    }

    try {

        const parsed =
            JSON.parse(value);

        output.value =
            JSON.stringify(
                parsed,
                null,
                2
            );

        status.innerHTML =
            "✅ Valid JSON";

        status.className =
            "mt-3 text-success fw-bold";
    }
    catch (err) {

        output.value = "";

        status.innerHTML =
            "❌ Invalid JSON";

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

            const parsed =
                JSON.parse(
                    input.value
                );

            output.value =
                JSON.stringify(
                    parsed
                );

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