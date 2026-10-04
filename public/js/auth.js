// ==========================================
// MẬT KHẨU & CHỌN VAI TRÒ SKEY HAY PÂU
// ==========================================
const CORRECT_PASSWORD = "16032021";

function checkSitePassword() {
    const input = document.getElementById('sitePasswordInput');
    const errorMsg = document.getElementById('passErrorMsg');
    const card = document.querySelector('.pass-lock-card');

    if (!input) return;
    const userPass = input.value.trim();

    if (userPass === CORRECT_PASSWORD) {
        if (errorMsg) errorMsg.classList.add('hidden');

        // Mật khẩu đúng -> Chuyển sang bước chọn "Bạn là Skey hay Pâu?"
        const passStep = document.getElementById('passStep');
        const roleStep = document.getElementById('roleStep');
        if (passStep) passStep.classList.add('hidden');
        if (roleStep) roleStep.classList.remove('hidden');
    } else {
        // Sai mật khẩu
        if (errorMsg) {
            errorMsg.innerText = "❌ Mật khẩu không đúng rồi nè! Vui lòng thử lại nhé 💕";
            errorMsg.classList.remove('hidden');
        }
        if (card) {
            card.classList.add('shake-card');
            setTimeout(() => card.classList.remove('shake-card'), 500);
        }
    }
}

function handlePassEnter(e) {
    if (e.key === 'Enter') checkSitePassword();
}
