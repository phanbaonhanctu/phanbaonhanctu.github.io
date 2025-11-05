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
    const secret = $("#myInput").val().trim().replace(/\s+/g, '');
    if (!secret) {
        alert("Vui lòng nhập secret.");
        return;
    }

    // 🧹 Reset trạng thái cũ
    if (intervalID) clearInterval(intervalID);
    $("#totp").text("------");
    $("#timeLeft").text("--");

    async function updateTOTP() {
        const now = Math.floor(Date.now() / 1000);
        const secondsRemaining = 30 - (now % 30);
        $("#timeLeft").text(secondsRemaining);

        // Cập nhật mã khi bước thời gian mới bắt đầu
        if (secondsRemaining === 30 || $("#totp").text() === "------") {
            const code = await generateTOTP(secret);
            $("#totp").text(code);
        }
    }

    updateTOTP();
    intervalID = setInterval(updateTOTP, 1000);
}

// 🧩 Tính năng copy vào clipboard + thông báo toast
$(document).ready(function () {
    $("#totp").css("cursor", "pointer");

    $("#totp").on("click", function () {
        const code = $(this).text().trim();
        if (!code || code === "------") return;

        navigator.clipboard.writeText(code).then(() => {
            // Xóa toast cũ nếu có
            $(".copy-toast").remove();

            // Tạo toast mới
            const toast = $("<div>")
                .addClass("copy-toast")
                .text("✅ Đã sao chép mã!")
                .css({
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    background: "#28a745",
                    color: "#fff",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    zIndex: 9999,
                    opacity: 0,
                    transition: "opacity 0.3s"
                })
                .appendTo("body");

            setTimeout(() => toast.css("opacity", 1), 50);
            setTimeout(() => {
                toast.fadeOut(500, () => toast.remove());
            }, 2000);
        });
    });
});
