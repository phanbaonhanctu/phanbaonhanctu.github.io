const secretInput = document.getElementById("secret");
const otpBox = document.getElementById("otp");
const countdown = document.getElementById("countdown");
const copyBtn = document.getElementById("copyBtn");
const status = document.getElementById("status");

let intervalID = null;

/* ---------- Base32 -> Bytes ---------- */

function base32toBytes(base32) {

    const alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    let bits = "";
    let result = [];

    base32 = base32
        .replace(/=+$/, '')
        .replace(/\s+/g, '')
        .toUpperCase();

    for (let i = 0; i < base32.length; i++) {

        const val =
            alphabet.indexOf(base32[i]);

        if (val === -1) continue;

        bits += val
            .toString(2)
            .padStart(5, '0');
    }

    for (let i = 0; i + 8 <= bits.length; i += 8) {

        result.push(
            parseInt(
                bits.substring(i, i + 8),
                2
            )
        );
    }

    return new Uint8Array(result);
}

/* ---------- HMAC SHA1 ---------- */

async function hmacSha1(
    keyBytes,
    messageBytes
) {

    const key =
        await crypto.subtle.importKey(

            "raw",

            keyBytes,

            {
                name: "HMAC",
                hash: "SHA-1"
            },

            false,

            ["sign"]
        );

    return await crypto.subtle.sign(

        "HMAC",

        key,

        messageBytes
    );
}

/* ---------- Generate TOTP ---------- */

async function generateTOTP(secret) {

    const keyBytes =
        base32toBytes(secret);

    const epoch =
        Math.floor(
            Date.now() / 1000
        );

    const timeStep =
        Math.floor(epoch / 30);

    const buffer =
        new ArrayBuffer(8);

    const view =
        new DataView(buffer);

    view.setUint32(
        4,
        timeStep
    );

    const hmac =
        await hmacSha1(
            keyBytes,
            new Uint8Array(buffer)
        );

    const hash =
        new Uint8Array(hmac);

    const offset =
        hash[19] & 0xf;

    const binCode = (

        ((hash[offset] & 0x7f) << 24) |

        ((hash[offset + 1] & 0xff) << 16) |

        ((hash[offset + 2] & 0xff) << 8) |

        (hash[offset + 3] & 0xff)

    );

    return (
        binCode % 1000000
    ).toString().padStart(
        6,
        '0'
    );
}

/* ---------- Update UI ---------- */

async function updateTOTP() {

    const secret =
        secretInput.value
            .trim()
            .replace(/\s+/g, '');

    if (!secret) {

        otpBox.value = "";
        countdown.innerText = "";
        return;
    }

    try {

        const code =
            await generateTOTP(
                secret
            );

        otpBox.value = code;

        const remain =
            30 -
            (Math.floor(
                Date.now() / 1000
            ) % 30);

        countdown.innerText =
            `Refresh in ${remain}s`;

    }
    catch (err) {

        console.error(err);

        otpBox.value = "";

        countdown.innerText =
            "Invalid Secret Key";
    }
}

/* ---------- Input Event ---------- */

secretInput.addEventListener(
    "input",
    () => {

        if (intervalID) {

            clearInterval(
                intervalID
            );
        }

        updateTOTP();

        intervalID =
            setInterval(
                updateTOTP,
                1000
            );
    }
);

/* ---------- Copy ---------- */

copyBtn.addEventListener(
    "click",
    async () => {

        if (!otpBox.value) return;

        await navigator
            .clipboard
            .writeText(
                otpBox.value
            );

        status.innerText =
            "✓ Copied";

        setTimeout(() => {

            status.innerText = "";

        }, 1500);
    }
);