function base32toBytes(base32) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "", result = [];

    base32 = base32.replace(/=+$/, '').toUpperCase();

    for (let i = 0; i < base32.length; i++) {
        const val = alphabet.indexOf(base32[i]);
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
    }

    for (let i = 0; i + 8 <= bits.length; i += 8) {
        result.push(parseInt(bits.substring(i, i + 8), 2));
    }

    return new Uint8Array(result);
}

async function hmacSha1(keyBytes, messageBytes) {
    const key = await crypto.subtle.importKey(
        "raw", keyBytes,
        { name: "HMAC", hash: "SHA-1" },
        false, ["sign"]
    );
    return await crypto.subtle.sign("HMAC", key, messageBytes);
}

async function generateTOTP(secretBase32) {
    const keyBytes = base32toBytes(secretBase32);
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(4, timeStep); // only set the last 4 bytes (big-endian)

    const hmac = await hmacSha1(keyBytes, new Uint8Array(buffer));
    const offset = new Uint8Array(hmac)[19] & 0xf;
    const binCode = (
        ((new Uint8Array(hmac)[offset] & 0x7f) << 24) |
        ((new Uint8Array(hmac)[offset + 1] & 0xff) << 16) |
        ((new Uint8Array(hmac)[offset + 2] & 0xff) << 8) |
        (new Uint8Array(hmac)[offset + 3] & 0xff)
    );
    const code = binCode % 1000000;
    return code.toString().padStart(6, '0');
}

let intervalID = null;

function startTOTP() {
    const secret = $("#secret").val().trim().replace(/\s+/g, '');
    if (!secret) {
        alert("Vui lòng nhập secret.");
        return;
    }

    if (intervalID) clearInterval(intervalID); // clear old interval if any

    async function updateTOTP() {
        const now = Math.floor(Date.now() / 1000);
        const secondsRemaining = 30 - (now % 30);
        $("#timeLeft").text(secondsRemaining);

        if (secondsRemaining === 30 || $("#totp").text() === "------") {
            const code = await generateTOTP(secret);
            $("#totp").text(code);
        }
    }

    updateTOTP(); // initial call
    intervalID = setInterval(updateTOTP, 1000); // update every second
}