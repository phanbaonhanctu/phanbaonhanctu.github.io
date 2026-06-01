const inputText = document.getElementById("inputText");
const result = document.getElementById("result");
const copyBtn = document.getElementById("copyBtn");
const status = document.getElementById("status");

inputText.addEventListener("input", generateMD5);

copyBtn.addEventListener("click", copyResult);

async function generateMD5() {

    const value = inputText.value;

    if (!value) {
        result.value = "";
        status.innerText = "";
        return;
    }

    const md5 = CryptoJS.MD5(value).toString();

    result.value = md5;

    await navigator.clipboard.writeText(md5);

    status.innerText = "✓ Auto copied to clipboard";
}

async function copyResult() {

    if (!result.value) return;

    await navigator.clipboard.writeText(result.value);

    status.innerText = "✓ Copied!";
}