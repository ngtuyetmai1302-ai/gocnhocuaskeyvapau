// ==========================================
// 8. HỆ THỐNG NUÔI CÚN CHIHUAHUA (ĐÃ SỬA LỖI ĐÈ DỮ LIỆU FIREBASE)
// ==========================================
let petBubbleTimeout = null;
// Mốc reset được lưu riêng, để các phiên bản trang cũ không thể ghi đè nó.
const PET_PROGRESS_RESET_VERSION = 1;
let hasResetPetProgress = Number(localStorage.getItem('pet_progress_reset_version')) === PET_PROGRESS_RESET_VERSION;
let petState = {
    name: '',
    level: 1,
    xp: 0,
    fullness: 80,
    happiness: 80,
    selectedOutfit: 0
};

// Đọc dữ liệu cún đã lưu trong máy
const savedPet = localStorage.getItem('pet_state');
if (savedPet) {
    try {
        const parsed = JSON.parse(savedPet);
        petState.name = parsed.name || '';
        petState.fullness = parsed.fullness !== undefined ? parsed.fullness : 80;
        petState.happiness = parsed.happiness !== undefined ? parsed.happiness : 80;
        const needsProgressReset = !hasResetPetProgress;
        // Chỉ đưa tiến độ level về đầu; các chỉ số và tính năng khác vẫn được giữ lại.
        petState.level = needsProgressReset ? 1 : (parsed.level || 1);
        petState.xp = needsProgressReset ? 0 : (parsed.xp || 0);
        petState.selectedOutfit = parsed.selectedOutfit || 0;
    } catch (e) { }
}

// Reset ngay khi trang tải, tránh việc lượt cho ăn đầu tiên bị đồng bộ cũ ghi đè.
if (!hasResetPetProgress) resetPetProgress();

function resetPetProgress() {
    petState.level = 1;
    petState.xp = 0;
    hasResetPetProgress = true;
    localStorage.setItem('pet_progress_reset_version', PET_PROGRESS_RESET_VERSION);
}

// 🟢 1. CẬP NHẬT GIAO DIỆN & LƯU DỮ LIỆU
function savePetState(syncToFirebase = true) {
    localStorage.setItem('pet_state', JSON.stringify(petState));
    updatePetUI();

    // Chỉ đẩy lên đám mây khi syncToFirebase = true (khi bấm Cho ăn, Xoa đầu, Đổi tên...)
    if (syncToFirebase && typeof database !== 'undefined' && database !== null) {
        try {
            database.ref('pet_state').set(petState);
        } catch (e) {
            console.error("Lỗi lưu trạng thái Cún lên Firebase:", e);
        }
    }
}

// 🟢 2. LẮNG NGHE ĐỒNG BỘ CÚN THỜI GIAN THỰC TỪ FIREBASE
let isPetRealtimeSyncStarting = false;
let isPetRealtimeListenerAttached = false;

function applyRealtimePetState(data) {
    petState.name = data.name || '';
    petState.level = data.level || 1;
    petState.xp = data.xp || 0;
    petState.fullness = data.fullness !== undefined ? data.fullness : 80;
    petState.happiness = data.happiness !== undefined ? data.happiness : 80;
    petState.selectedOutfit = data.selectedOutfit || 0;
    savePetState(false);
}

function attachRealtimePetListener() {
    if (isPetRealtimeListenerAttached || typeof database === 'undefined' || !database) return;
    isPetRealtimeListenerAttached = true;

    database.ref('pet_state').on('value', (snapshot) => {
        if (!snapshot.exists()) {
            savePetState(true);
            return;
        }

        const data = snapshot.val();
        if (data) applyRealtimePetState(data);
    });
}

function listenForRealtimePet() {
    if (typeof database === 'undefined' || !database || isPetRealtimeSyncStarting || isPetRealtimeListenerAttached) return;
    isPetRealtimeSyncStarting = true;

    // Đặt mốc reset ngoài pet_state để bản trang cũ không thể xóa mốc khi lưu cún.
    database.ref('pet_progress_reset_version').once('value').then((snapshot) => {
        const needsProgressReset = Number(snapshot.val()) !== PET_PROGRESS_RESET_VERSION;
        if (needsProgressReset) {
            savePetState(false);
            return database.ref().update({
                pet_state: petState,
                pet_progress_reset_version: PET_PROGRESS_RESET_VERSION
            });
        }
    }).catch((error) => {
        console.error("Không thể kiểm tra mốc reset tiến độ cún:", error);
    }).finally(() => {
        isPetRealtimeSyncStarting = false;
        attachRealtimePetListener();
    });
}

// Hàm hiển thị bong bóng thoại của cún
function showPetBubble(msg, duration = 4000) {
    const bubble = document.getElementById('petBubble');
    if (!bubble) return;
    if (petBubbleTimeout) {
        clearTimeout(petBubbleTimeout);
        petBubbleTimeout = null;
    }
    bubble.innerText = msg;
    bubble.classList.remove('hidden');
    if (duration > 0) {
        petBubbleTimeout = setTimeout(() => {
            petBubbleTimeout = null;
            updatePetUI();
        }, duration);
    }
}

// Hàm cập nhật giao diện cún
function updatePetUI() {
    const nameDisplay = document.getElementById('petNameDisplay');
    if (nameDisplay) {
        if (petState.name && petState.name !== 'Bé Cún' && petState.name !== 'Đặt tên cún') {
            nameDisplay.innerText = `🐶 ${petState.name}`;
            nameDisplay.title = "Bấm vào đây để đổi tên cho cún";
        } else {
            nameDisplay.innerText = `🐶 Đặt tên cún ✏️️`;
            nameDisplay.title = "Bấm vào đây để đặt tên cho cún nhé!";
        }
    }

    const lvlElem = document.getElementById('petLevelDisplay');
    if (lvlElem) lvlElem.innerText = `Lv.${petState.level}`;
    const xpBar = document.getElementById('xpBar');
    if (xpBar) xpBar.style.width = `${petState.xp}%`;
    const fullnessBar = document.getElementById('fullnessBar');
    if (fullnessBar) fullnessBar.style.width = `${petState.fullness}%`;
    const happinessBar = document.getElementById('happinessBar');
    if (happinessBar) happinessBar.style.width = `${petState.happiness}%`;

    const closetBtn = document.getElementById('closetBtn');
    if (closetBtn) {
        if (petState.level >= 4) {
            closetBtn.classList.remove('hidden');
        } else {
            closetBtn.classList.add('hidden');
        }
    }

    if (typeof updatePetImage === 'function') {
        updatePetImage('normal');
    }

    if (!petBubbleTimeout) {
        const bubble = document.getElementById('petBubble');
        if (bubble) {
            if (petState.fullness < 30 && petState.happiness < 30) {
                bubble.innerText = "Quan tâm tui xíu đi màaa.";
                bubble.classList.remove('hidden');
            } else if (petState.fullness < 30) {
                bubble.innerText = "Tui đói nhắm òiiii .";
                bubble.classList.remove('hidden');
            } else if (petState.happiness < 30) {
                bubble.innerText = "Chán quá trời quá đất rồi nha! .";
                bubble.classList.remove('hidden');
            } else {
                bubble.classList.add('hidden');
            }
        }
    }
}

// 🟢 3. KHỞI CHẠY (CHỈ CẬP NHẬT GIAO DIỆN CỤC BỘ & LẮNG NGHE FIREBASE - TUYỆT ĐỐI KHÔNG ĐẨY ĐÈ FIREBASE)
updatePetUI();
listenForRealtimePet();

function updatePetImage(actionState) {
    const petImg = document.getElementById('petImg');
    const petOutfitImg = document.getElementById('petOutfitImg');
    if (!petImg) return;

    // Kiểm tra cún rơm rớm khóc nếu độ no hoặc độ vui dưới 30%
    const isCrying = petState.fullness < 30 || petState.happiness < 30;

    // Level 1-2: Dạng Cún Nhỏ
    if (petState.level < 3) {
        if (isCrying) petImg.src = 'assets/images/dog-crying.png';
        else if (actionState === 'eating') petImg.src = 'assets/images/dog-eating.png';
        else if (actionState === 'happy') petImg.src = 'assets/images/dog-happy.png';
        else petImg.src = 'assets/images/dog-normal.png';

        // Cún nhỏ KHÔNG mặc trang phục
        if (petOutfitImg) petOutfitImg.classList.add('hidden');
    }
    // Level >= 3: Dạng Cún Lớn
    else {
        if (isCrying) petImg.src = 'assets/images/dog-big-crying.png';
        else if (actionState === 'eating') petImg.src = 'assets/images/dog-big-eating.png';
        else if (actionState === 'happy') petImg.src = 'assets/images/dog-big-happy.png';
        else petImg.src = 'assets/images/dog-big-normal.png';

        // Level 4-10: Khoác trang phục người dùng chọn (mọi trạng thái)
        if (petOutfitImg) {
            if (petState.level >= 4 && petState.selectedOutfit > 0) {
                petOutfitImg.src = `assets/images/dog-outfit${petState.selectedOutfit}.png`;
                petOutfitImg.classList.remove('hidden');
            } else {
                petOutfitImg.classList.add('hidden');
            }
        }
    }
}

function promptPetName() {
    if (petState.name && petState.name !== 'Bé Cún') {
        alert("Tên cún đã được đặt và không thể thay đổi nữa nhé!");
        return;
    }
    document.getElementById('petNameInput').value = '';
    document.getElementById('petNameModal').classList.remove('hidden');
}

function closePetNameModal() {
    document.getElementById('petNameModal').classList.add('hidden');
}

function savePetName() {
    const input = document.getElementById('petNameInput');
    const inputName = input ? input.value.trim() : '';

    if (!inputName) {
        alert("Bạn chưa nhập tên cho bé cún kìa!");
        return;
    }

    petState.name = inputName;
    savePetState();
    closePetNameModal();
    showPetBubble(`Gâu gâu! Cảm ơn Skey & Pâu, từ nay tên tớ là ${petState.name} nhé! ❤️`);
}

function feedPet() {
    if (syncPetInteraction('feed')) return;

    if (petState.fullness >= 100) {
        showPetBubble("Gâu! Tớ no căng bụng rồi không ăn nổi nữa đâu! 🦴");
        return;
    }

    petState.fullness = Math.min(100, petState.fullness + 25);
    addXP(getPetInteractionXPGain());

    const nameStr = petState.name || 'Skey & Pâu';
    showPetBubble(`Măm măm... Xương ngon quá! Cảm ơn ${nameStr}! 🦴🥰`);
    updatePetImage('eating');

    spawnFloatingEmoji('🦴', 5);

    setTimeout(() => { updatePetImage('normal'); }, 3000);
}

function patPet() {
    if (syncPetInteraction('pat')) return;

    if (petState.happiness >= 100) {
        showPetBubble("Gâu gâu~ Tớ đang vui lắm rồi nè! 💕");
        return;
    }

    petState.happiness = Math.min(100, petState.happiness + 25);
    addXP(getPetInteractionXPGain());

    showPetBubble("Gâu gâu~ Thích quá đi! Tớ yêu Skey & Pâu nhất! 💕");
    updatePetImage('happy');

    spawnFloatingEmoji('💖', 6);

    setTimeout(() => { updatePetImage('normal'); }, 3000);
}

// Mỗi lần cho ăn hoặc xoa đầu sẽ nhận XP theo level hiện tại của cún.
function getPetInteractionXPGain(level = petState.level) {
    if (level <= 3) return 10;
    if (level <= 6) return 7;
    return 3;
}

function showPetLevelUp(level) {
    showPetBubble(`🎉 BÉ CÚN ĐÃ LÊN LEVEL ${level} RỒI! 🎉`);

    if (level === 3) {
        alert("🌟 Chúc mừng! Bé cún đã đủ lớn và tiến hóa thành Dạng Cún Lớn rồi nè! 🐶✨");
    } else if (level === 4) {
        alert("👗 Tuyệt vời! Bé cún đã đạt Level 4 và mở khóa TỦ ĐỒ cùng bộ trang phục đầu tiên! 🎁");
    } else if (level > 4 && level <= 10) {
        alert(`🎁 Chúc mừng! Đạt Level ${level} đã mở khóa thêm 1 bộ trang phục mới trong Tủ Đồ!`);
    }
}

function showPetInteractionFeedback(action) {
    if (action === 'feed') {
        const nameStr = petState.name || 'Skey & Pâu';
        showPetBubble(`Măm măm... Xương ngon quá! Cảm ơn ${nameStr}! 🦴🥰`);
        updatePetImage('eating');
        spawnFloatingEmoji('🦴', 5);
    } else {
        showPetBubble("Gâu gâu~ Thích quá đi! Tớ yêu Skey & Pâu nhất! 💕");
        updatePetImage('happy');
        spawnFloatingEmoji('💖', 6);
    }

    setTimeout(() => { updatePetImage('normal'); }, 3000);
}

function syncPetInteraction(action) {
    if (typeof database === 'undefined' || !database) return false;

    const statKey = action === 'feed' ? 'fullness' : 'happiness';
    const fullMessage = action === 'feed'
        ? "Gâu! Tớ no căng bụng rồi không ăn nổi nữa đâu! 🦴"
        : "Gâu gâu~ Tớ đang vui lắm rồi nè! 💕";
    const levelBeforeInteraction = petState.level;

    database.ref('pet_state').transaction((currentState) => {
        const nextState = {
            ...petState,
            ...(currentState || {})
        };
        nextState.level = Math.min(10, Math.max(1, Number(nextState.level) || 1));
        nextState.xp = Math.max(0, Number(nextState.xp) || 0);
        nextState.fullness = Math.min(100, Math.max(0, Number(nextState.fullness) || 0));
        nextState.happiness = Math.min(100, Math.max(0, Number(nextState.happiness) || 0));

        if (nextState[statKey] >= 100) return;

        nextState[statKey] = Math.min(100, nextState[statKey] + 25);
        nextState.xp += getPetInteractionXPGain(nextState.level);
        if (nextState.xp >= 100) {
            nextState.xp -= 100;
            nextState.level = Math.min(10, nextState.level + 1);
        }
        return nextState;
    }, (error, committed, snapshot) => {
        if (error) {
            console.error("Không thể đồng bộ tương tác với cún:", error);
            showPetBubble("Tớ chưa nhận được lần tương tác này, thử lại giúp tớ nhé! 🐶");
            return;
        }
        if (!committed) {
            showPetBubble(fullMessage);
            return;
        }

        const updatedState = snapshot.val();
        const leveledUp = updatedState && updatedState.level > levelBeforeInteraction;
        if (updatedState) applyRealtimePetState(updatedState);
        if (leveledUp) showPetLevelUp(updatedState.level);
        showPetInteractionFeedback(action);
    });

    return true;
}

function addXP(amount) {
    petState.xp += amount;

    if (petState.xp >= 100) {
        petState.xp -= 100;
        petState.level = Math.min(10, petState.level + 1);
        showPetLevelUp(petState.level);
    }

    savePetState();
}

function showPetBubble(msg) {
    const bubble = document.getElementById('petBubble');
    if (!bubble) return;
    bubble.innerText = msg;
    bubble.classList.remove('hidden');
    setTimeout(() => { bubble.classList.add('hidden'); }, 4000);
}

function petBark() {
    const petQuotes = [
        "Gâu gâu! Chào Skey & Pâu! 🐶",
        "Gâu gâu! Hai bạn đáng yêu quá! ❤️",
        "Xoa đầu tớ nữa đi mừ! 🐾",
        "Skey ơi, nhớ yêu thương Pâu nhiều nhé! ✨",
        "Pâu xinh đẹp ơi, gâu gâu! 🌸"
    ];
    const randomQuote = petQuotes[Math.floor(Math.random() * petQuotes.length)];
    showPetBubble(randomQuote);
}

function spawnFloatingEmoji(emoji, count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const item = document.createElement('div');
            item.classList.add('floating-heart');
            item.innerText = emoji;
            item.style.right = (Math.random() * 60 + 10) + 'px';
            item.style.left = 'auto';
            item.style.animationDuration = '2.5s';
            document.body.appendChild(item);
            setTimeout(() => { item.remove(); }, 2500);
        }, i * 180);
    }
}

// Tự động giảm chỉ số theo thời gian (mỗi 1 phút giảm 2%)
setInterval(() => {
    petState.fullness = Math.max(0, petState.fullness - 2);
    petState.happiness = Math.max(0, petState.happiness - 2);
    savePetState();
}, 60000);

// ==========================================
// 9. QUẢN LÝ TỦ ĐỒ CÚN (LEVEL 4 -> 10)
// ==========================================
function openCloset() {
    if (petState.level < 4) {
        alert("Bé cún cần đạt Level 4 trở lên mới mở được Tủ Đồ nhé!");
        return;
    }

    const closetModal = document.getElementById('closetModal');
    if (closetModal) closetModal.classList.remove('hidden');

    for (let i = 1; i <= 7; i++) {
        const card = document.getElementById(`outfitCard${i}`);
        if (!card) continue;
        const unlockLevel = i + 3; // Lv 4 -> bộ 1, ..., Lv 10 -> bộ 7

        if (petState.level >= unlockLevel) {
            card.classList.remove('locked');
        } else {
            card.classList.add('locked');
        }

        if (petState.selectedOutfit === i) {
            card.classList.add('active-outfit');
        } else {
            card.classList.remove('active-outfit');
        }
    }
}

function closeCloset() {
    const closetModal = document.getElementById('closetModal');
    if (closetModal) closetModal.classList.add('hidden');
}

function selectOutfit(id) {
    const unlockLevel = id + 3;

    if (petState.level < unlockLevel) {
        alert(`Bộ trang phục này sẽ mở khóa khi cún đạt Level ${unlockLevel} nhé!`);
        return;
    }

    petState.selectedOutfit = id;
    savePetState();
    closeCloset();
    showPetBubble(`Gâu gâu! Tớ vừa khoác bộ quần áo số ${id} xịn xò chưa nè! ✨`);
}

function removeOutfit() {
    petState.selectedOutfit = 0;
    savePetState();
    closeCloset();
    showPetBubble("Tớ đã cởi đồ ra và quay về bộ lông tự nhiên rồi nè! 🐶");
}
