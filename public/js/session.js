// ==========================================
// ĐỒNG BỘ TRẠNG THÁI ONLINE VÀ LẮNG NGHE FIREBASE REALTIME
// ==========================================
function initFirebaseStatus() {
    const activeRole = sessionStorage.getItem('active_user_role');
    if (!activeRole) return;

    if (typeof database !== 'undefined' && database !== null) {
        try {
            // 1. Đặt trạng thái Online cho bản thân & tự chuyển Offline khi mất mạng / đóng tab
            window.startPresence(activeRole);
            if (window.presenceFeaturesRole === activeRole) return;
            window.presenceFeaturesRole = activeRole;

            if (typeof listenForRealtimeLetters === 'function') listenForRealtimeLetters();
            if (typeof listenForRealtimeCards === 'function') listenForRealtimeCards(activeRole);
            if (typeof listenForRealtimePet === 'function') listenForRealtimePet(); // 👈 Bổ sung dòng này vào đây!
            if (typeof listenForGameInvitations === 'function') listenForGameInvitations(activeRole);
            if (typeof listenForRealtimeSlideshow === 'function') listenForRealtimeSlideshow();
            if (typeof listenForRealtimeClockIcon === 'function') listenForRealtimeClockIcon();

        } catch (e) {
            console.error("Lỗi đồng bộ Firebase Status:", e);
        }
    }
}
// Hàm thay thế hàm cũ
function updateUserStatusWidget() {
    initFirebaseStatus();
}

// Cập nhật hàm chọn vai
function selectUserRole(roleName) {
    sessionStorage.setItem('active_user_role', roleName);
    sessionStorage.setItem('skey_pau_unlocked', 'true');

    const overlay = document.getElementById('passLockOverlay');
    if (overlay) overlay.classList.add('unlocked');
    if (typeof createHeartEffect === 'function') createHeartEffect();

    initFirebaseStatus();
}

// Cập nhật hàm kiểm tra khi tải trang
function checkSavedLockState() {
    const isUnlocked = sessionStorage.getItem('skey_pau_unlocked');
    const overlay = document.getElementById('passLockOverlay');
    if (isUnlocked === 'true' && overlay) {
        overlay.classList.add('unlocked');
    }
    // Tự động kết nối Firebase ngay khi tải hoặc F5 lại trang
    initFirebaseStatus();
}
