const input =
    document.getElementById(
        "inputText"
    );

const output =
    document.getElementById(
        "outputText"
    );

const grid =
    document.getElementById(
        "buttonGrid"
    );

const copyBtn =
    document.getElementById(
        "copyBtn"
    );

const clearBtn =
    document.getElementById(
        "clearBtn"
    );

const cases = {

    "lowercase": v =>
        v.toLowerCase(),

    "UPPERCASE": v =>
        v.toUpperCase(),

    "camelCase": v =>
        toWords(v)
            .map((x, i) =>
                i === 0
                    ? x.toLowerCase()
                    : capitalize(x)
            )
            .join(''),

    "Capital Case": v =>
        toWords(v)
            .map(capitalize)
            .join(' '),

    "CONSTANT_CASE": v =>
        toWords(v)
            .join('_')
            .toUpperCase(),

    "dot.case": v =>
        toWords(v)
            .join('.')
            .toLowerCase(),

    "kebab-case": v =>
        toWords(v)
            .join('-')
            .toLowerCase(),

    "no case": v =>
        toWords(v)
            .join(' '),

    "PascalCase": v =>
        toWords(v)
            .map(capitalize)
            .join(''),

    "Pascal_Snake_Case": v =>
        toWords(v)
            .map(capitalize)
            .join('_'),

    "path/case": v =>
        toWords(v)
            .join('/'),

    "Sentence case": v => {

        const s =
            toWords(v)
                .join(' ')
                .toLowerCase();

        return capitalize(s);
    },

    "snake_case": v =>
        toWords(v)
            .join('_')
            .toLowerCase(),

    "sWAP cASE": v =>
        [...v]
            .map(ch =>

                ch === ch.toUpperCase()

                    ? ch.toLowerCase()

                    : ch.toUpperCase()

            ).join(''),

    "Train-Case": v =>
        toWords(v)
            .map(capitalize)
            .join('-')
};

function toWords(v) {

    return v

        .replace(
            /([a-z])([A-Z])/g,
            '$1 $2'
        )

        .replace(
            /[_./-]/g,
            ' '
        )

        .trim()

        .split(/[ \t]+/)

        .filter(Boolean);
}

function capitalize(v) {

    return v.charAt(0)
        .toUpperCase()

        +

        v.slice(1)
            .toLowerCase();
}

Object.keys(cases)
    .forEach(name => {

        const btn =
            document.createElement(
                "button"
            );

        btn.className =
            "case-btn";

        btn.innerText =
            name;

        btn.onclick = () => {

            document
                .querySelectorAll(
                    ".case-btn"
                )
                .forEach(
                    b => b.classList
                        .remove(
                            "active"
                        )
                );

            btn.classList
                .add(
                    "active"
                );

            output.value =

                input.value

                    .split('\n')

                    .map(
                        line =>

                            line.trim()

                                ? cases[name](line)

                                : ''
                    )

                    .join('\n');
        };

        grid.appendChild(
            btn
        );
    });

input.addEventListener(
    "input",
    () => {

        const active =
            document.querySelector(
                ".case-btn.active"
            );

        if (active) {

            active.click();
        }
    }
);

copyBtn.onclick =
    async () => {

        if (!output.value)
            return;

        await navigator
            .clipboard
            .writeText(
                output.value
            );
    };

clearBtn.onclick =
    () => {

        input.value = '';

        output.value = '';
    };