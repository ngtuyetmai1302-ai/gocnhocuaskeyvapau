// ==========================================
// CẤU HÌNH FIREBASE (BỌC AN TOÀN CHỐNG LỖI TRÙNG)
// ==========================================
if (typeof firebaseConfig === 'undefined') {
    var firebaseConfig = {
        apiKey: "AIzaSyAY3Aq2xwfJrvjzu4pefEUsAcBJ6EuUbhQ",
        authDomain: "gocnhocuaskeyvapau.firebaseapp.com",
        databaseURL: "https://gocnhocuaskeyvapau-default-rtdb.firebaseio.com",
        projectId: "gocnhocuaskeyvapau",
        storageBucket: "gocnhocuaskeyvapau.firebasestorage.app",
        messagingSenderId: "704493790067",
        appId: "1:704493790067:web:8dd2d35a20fe72c2d91b06"
    };
}

if (typeof database === 'undefined') {
    var database = null;
}

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        console.log("🔥 Đã kết nối Firebase thành công!");
    } else {
        console.warn("⚠️ Chưa tải xong Firebase SDK.");
    }
} catch (e) {
    console.error("Lỗi khởi tạo Firebase:", e);
}
// Ngày bắt đầu yêu nhau của Skey & Pâu: 16/03/2021
const startDate = new Date(2021, 2, 16, 0, 0, 0);

function updateLoveCounter() {
    const now = new Date();
    const diff = now - startDate;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const dElem = document.getElementById('days');
    const hElem = document.getElementById('hours');
    const mElem = document.getElementById('minutes');
    const sElem = document.getElementById('seconds');

    if (dElem) dElem.innerText = days;
    if (hElem) hElem.innerText = hours;
    if (mElem) mElem.innerText = minutes;
    if (sElem) sElem.innerText = seconds;
}

setInterval(updateLoveCounter, 1000);
updateLoveCounter();

// ==========================================
// 0. CANVAS PHÁO HOA KHI CHIẾN THẮNG
// ==========================================
function triggerFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const colors = ['#ff4d6d', '#52b788', '#ffbe0b', '#3a86ff', '#ff0054', '#70e000', '#ff9e00', '#9d4edd'];

    function createExplosion(x, y) {
        const count = 70;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.2;
            const speed = Math.random() * 7 + 2;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                size: Math.random() * 4 + 2,
                decay: Math.random() * 0.02 + 0.015
            });
        }
    }

    const startTime = Date.now();
    let burstInterval = setInterval(() => {
        if (Date.now() - startTime > 3200) {
            clearInterval(burstInterval);
            return;
        }
        createExplosion(
            Math.random() * (canvas.width * 0.8) + canvas.width * 0.1,
            Math.random() * (canvas.height * 0.5) + canvas.height * 0.1
        );
    }, 350);

    createExplosion(canvas.width / 2, canvas.height * 0.3);

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.09;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (particles.length > 0 || Date.now() - startTime < 3800) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    requestAnimationFrame(animate);
}

// ==========================================
// 1. ĐỒNG HỒ NGÀY GIỜ & HOA ĐỔI MÀU TƯƠNG TÁC
// ==========================================
const flowerList = ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌿', '🍃', '💐', '🍀'];
const CLOCK_ICON_STATE_PATH = 'clock_icon_state';
let flowerIndex = 0;
let flowerFloatTimer = null;
let clockIconListenerAttached = false;
let clockIconStateInitialized = false;

function showFloatingFlowerEffect(icon) {
    let effectLayer = document.getElementById('floatingFlowerEffect');
    if (!effectLayer) {
        const slideshowArea = document.querySelector('.photo-wrapper');
        if (!slideshowArea) return;

        effectLayer = document.createElement('div');
        effectLayer.id = 'floatingFlowerEffect';
        effectLayer.className = 'floating-flower-effect';
        slideshowArea.appendChild(effectLayer);
    }

    effectLayer.replaceChildren();
    if (flowerFloatTimer) clearTimeout(flowerFloatTimer);

    // Mưa icon nhẹ trong khoảng 10 giây, mật độ vừa phải để không rối mắt.
    for (let i = 0; i < 10; i++) {
        const flower = document.createElement('span');
        flower.className = 'floating-flower';
        flower.innerText = icon;
        flower.style.left = `${4 + Math.random() * 92}%`;
        flower.style.setProperty('--rain-drift', `${-18 + Math.random() * 36}px`);
        flower.style.setProperty('--rain-rotate', `${-22 + Math.random() * 44}deg`);
        flower.style.animationDelay = `${i * 0.65}s`;
        effectLayer.appendChild(flower);
    }

    flowerFloatTimer = setTimeout(() => {
        effectLayer?.remove();
        flowerFloatTimer = null;
    }, 10000);
}

function applyClockIcon(index, playEffect = false) {
    if (!Number.isInteger(index) || index < 0 || index >= flowerList.length) return;

    flowerIndex = index;
    const selectedFlower = flowerList[index];

    const leftFlower = document.getElementById('flowerLeft');
    const rightFlower = document.getElementById('flowerRight');
    if (leftFlower) leftFlower.innerText = selectedFlower;
    if (rightFlower) rightFlower.innerText = selectedFlower;

    if (playEffect) showFloatingFlowerEffect(selectedFlower);
}

function syncClockIconState() {
    if (typeof database === 'undefined' || !database) return;

    database.ref(CLOCK_ICON_STATE_PATH).set({
        iconIndex: flowerIndex,
        updatedAt: Date.now(),
        updatedBy: sessionStorage.getItem('active_user_role') || 'unknown'
    }).catch(error => {
        console.error('Không thể đồng bộ icon đồng hồ:', error);
    });
}

function listenForRealtimeClockIcon() {
    if (clockIconListenerAttached || typeof database === 'undefined' || !database) return;
    clockIconListenerAttached = true;

    database.ref(CLOCK_ICON_STATE_PATH).on('value', (snapshot) => {
        const state = snapshot.val();
        if (!state) {
            syncClockIconState();
            clockIconStateInitialized = true;
            return;
        }

        const remoteIndex = Number(state.iconIndex);
        if (Number.isInteger(remoteIndex) && remoteIndex >= 0 && remoteIndex < flowerList.length && remoteIndex !== flowerIndex) {
            // Khi người kia đổi icon, cập nhật cả icon lẫn hiệu ứng mưa ở máy này.
            applyClockIcon(remoteIndex, clockIconStateInitialized);
        }
        clockIconStateInitialized = true;
    });
}

function changeFlower() {
    const nextIndex = (flowerIndex + 1) % flowerList.length;
    applyClockIcon(nextIndex, true);
    syncClockIconState();
}

function updateLiveClock() {
    const now = new Date();

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `📅 ${day}/${month}/${year}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;

    const clockDateElem = document.getElementById('clockDate');
    const clockTimeElem = document.getElementById('clockTime');

    if (clockDateElem) clockDateElem.innerText = dateStr;
    if (clockTimeElem) clockTimeElem.innerText = timeStr;
}

setInterval(updateLiveClock, 1000);
updateLiveClock();

// ==========================================
// 2. DỰ BÁO THỜI TIẾT KHÍ TƯỢNG VÀ LỜI NHẮN
// ==========================================
async function fetchWeatherData() {
    let lat = 20.8449;
    let lon = 106.6881;
    let locationName = "📍 Hải Phòng";

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const weatherCode = data.current_weather.weathercode;

            const { statusText, icon, careMsg } = parseWeatherCondition(weatherCode, temp);

            document.getElementById('weatherTemp').innerText = `${temp}°C`;
            document.getElementById('weatherStatus').innerText = statusText;
            document.getElementById('weatherIcon').innerText = icon;
            document.getElementById('weatherLocation').innerText = locationName;
            document.getElementById('weatherCareMessage').innerText = `"${careMsg}"`;
        }
    } catch (error) {
        document.getElementById('weatherTemp').innerText = `26°C`;
        document.getElementById('weatherStatus').innerText = "Trời mát mẻ 🌤️";
        document.getElementById('weatherIcon').innerText = "🌤️";
        document.getElementById('weatherCareMessage').innerText = '"Hôm nay thời tiết rất đẹp, Skey & Pâu cùng nắm tay nhau đi dạo nhé! 💕"';
    }
}

function parseWeatherCondition(code, temp) {
    let statusText = "Trời đẹp 🌤️";
    let icon = "🌤️";
    let careMsg = "Skey & Pâu nhớ giữ gìn sức khỏe và luôn vui vẻ nhé! 💕";

    const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95];

    if (rainCodes.includes(code)) {
        statusText = "Đang có mưa 🌧️";
        icon = "🌧️";
        careMsg = "Trời đang mưa ☔ Skey & Pâu ra ngoài nhớ mang ô, áo mưa và đi chậm giữ an toàn nhé!";
    } else if (temp >= 30) {
        statusText = "Trời nắng nóng ☀️";
        icon = "☀️";
        careMsg = "Trời nắng nóng ☀️ Skey & Pâu nhớ uống nhiều nước và che chắn cẩn thận khi ra ngoài nha!";
    } else if (temp < 20) {
        statusText = "Trời se lạnh 🧥";
        icon = "❄️";
        careMsg = "Trời lạnh rồi 🧥 Skey & Pâu nhớ mặc ấm, giữ cổ ấm kẻo cảm lạnh nhé!";
    } else {
        statusText = "Thời tiết mát mẻ 🍃";
        icon = "🌤️";
        careMsg = "Thời tiết hôm nay cực kỳ đẹp 🌤️ Rất thích hợp để Skey & Pâu nắm tay nhau đi dạo nè!";
    }

    return { statusText, icon, careMsg };
}

fetchWeatherData();
setInterval(fetchWeatherData, 1800000);

// ==========================================
// 3. ĐỔI ẢNH VÀ THÔNG ĐIỆP TÌNH YÊU MỖI 2 PHÚT
// ==========================================
const photos = [
    'assets/images/photo1.jpg',
    'assets/images/photo2.jpg',
    'assets/images/photo3.jpg',
    'assets/images/photo4.jpg',
    'assets/images/photo5.jpg'
];

const loveQuotes = [
    '"Tình yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng."',
    '"Gặp được em là điều may mắn và tuyệt vời nhất trong cuộc đời anh."',
    '"Cùng nhau đi qua bão giông, cùng nhau tận hưởng những phút giây bình yên."',
    '"Tình yêu giản đơn là mỗi ngày trôi qua đều có em ở bên cạnh."',
    '"Cảm ơn em đã cùng anh viết nên hành trình hạnh phúc của Skey & Pâu."'
];

let photoIndex = 0;
let quoteIndex = 0;
const slideshowImg = document.getElementById('slideshowImg');
const loveQuoteElem = document.getElementById('loveQuote');

function changePhotoAndQuote() {
    photoIndex = (photoIndex + 1) % photos.length;
    quoteIndex = (quoteIndex + 1) % loveQuotes.length;

    if (slideshowImg) slideshowImg.style.opacity = '0';
    if (loveQuoteElem) loveQuoteElem.style.opacity = '0';

    setTimeout(() => {
        if (slideshowImg) slideshowImg.src = photos[photoIndex];
        if (loveQuoteElem) loveQuoteElem.innerText = loveQuotes[quoteIndex];

        if (slideshowImg) slideshowImg.style.opacity = '1';
        if (loveQuoteElem) loveQuoteElem.style.opacity = '1';
    }, 1200);
}

setInterval(changePhotoAndQuote, 120000);

// ==========================================
// 4. GÓC TÂM TÌNH - CHAT THỜI GIAN THỰC
// ==========================================
const DAILY_CHAT_PATH = 'daily_chat';
const DAILY_CHAT_LOCAL_KEY = 'daily_chat_messages';
let dailyChatMessages = [];
let dailyChatListenerAttached = false;
let envelopeChatOpen = false;
let envelopeChatBubbleTimer = null;
let knownDailyChatMessageIds = new Set();

try {
    const cachedMessages = JSON.parse(localStorage.getItem(DAILY_CHAT_LOCAL_KEY) || '[]');
    if (Array.isArray(cachedMessages)) dailyChatMessages = cachedMessages;
} catch (error) {
    console.warn('Không thể đọc lịch sử chat đã lưu:', error);
}

function getDailyChatRole() {
    return sessionStorage.getItem('active_user_role') || '';
}

function getDailyChatPartnerRole() {
    return getDailyChatRole() === 'Skey' ? 'Pâu' : 'Skey';
}

function getChatNicknameStorageKey() {
    return `daily_chat_nickname_${getDailyChatPartnerRole()}`;
}

function getChatPartnerNickname() {
    return localStorage.getItem(getChatNicknameStorageKey()) || getDailyChatPartnerRole();
}

function updateChatPartnerNicknameInput() {
    const input = document.getElementById('chatPartnerNickname');
    if (input) input.value = getChatPartnerNickname();
}

function saveChatPartnerNickname() {
    const input = document.getElementById('chatPartnerNickname');
    if (!input) return;

    const nickname = input.value.trim().slice(0, 30) || getDailyChatPartnerRole();
    localStorage.setItem(getChatNicknameStorageKey(), nickname);
    input.value = nickname;
}

function handleChatNicknameKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();
    }
}

function handleEnvelopeWidgetKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleEnvelopeChat();
    }
}

function getUnreadDailyChatMessages() {
    const activeRole = getDailyChatRole();
    if (!activeRole) return [];
    return dailyChatMessages.filter(message =>
        message.sender !== activeRole && message.readBy?.[activeRole] !== true
    );
}

function updateEnvelopeBadge() {
    const badge = document.getElementById('envelopeBadge');
    if (!badge) return;

    const unreadCount = getUnreadDailyChatMessages().length;
    badge.innerText = unreadCount > 99 ? '99+' : unreadCount;
    badge.classList.toggle('hidden', unreadCount === 0);
}

function formatDailyChatTime(timestamp) {
    if (!timestamp) return 'Vừa xong';
    return new Date(timestamp).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
    });
}

function renderEnvelopeChatHistory() {
    const history = document.getElementById('envelopeChatHistory');
    if (!history) return;

    history.innerHTML = '';
    if (dailyChatMessages.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'envelope-chat-empty';
        emptyState.innerText = 'Chưa có tin nhắn nào. Hãy bắt đầu một cuộc trò chuyện thật ngọt ngào nhé! 💌';
        history.appendChild(emptyState);
        return;
    }

    const activeRole = getDailyChatRole();
    const fragment = document.createDocumentFragment();
    dailyChatMessages.forEach((message) => {
        const isMine = message.sender === activeRole;
        const wrapper = document.createElement('div');
        wrapper.className = `envelope-chat-message ${isMine ? 'mine' : 'theirs'}`;

        const text = document.createElement('div');
        text.className = 'envelope-chat-message-text';
        text.innerText = message.text || '';

        const meta = document.createElement('div');
        meta.className = 'envelope-chat-message-meta';
        meta.innerText = `${isMine ? 'Bạn' : message.sender || getDailyChatPartnerRole()} · ${formatDailyChatTime(message.sentAt)}`;

        wrapper.append(text, meta);
        fragment.appendChild(wrapper);
    });

    history.appendChild(fragment);
    history.scrollTop = history.scrollHeight;
}

function saveDailyChatMessagesLocally() {
    localStorage.setItem(DAILY_CHAT_LOCAL_KEY, JSON.stringify(dailyChatMessages));
}

function hideEnvelopeChatBubble() {
    const bubble = document.getElementById('envelopeChatBubble');
    if (bubble) bubble.classList.add('hidden');
    if (envelopeChatBubbleTimer) clearTimeout(envelopeChatBubbleTimer);
    envelopeChatBubbleTimer = null;
}

function showEnvelopeChatBubble(message) {
    if (envelopeChatOpen || !message) return;

    const bubble = document.getElementById('envelopeChatBubble');
    if (!bubble) return;

    bubble.innerText = `${message.sender || getDailyChatPartnerRole()}: ${message.text || ''}`;
    bubble.classList.remove('hidden');
    document.getElementById('envelopeBadge')?.classList.add('hidden');
    if (envelopeChatBubbleTimer) clearTimeout(envelopeChatBubbleTimer);
    envelopeChatBubbleTimer = setTimeout(() => {
        if (bubble) bubble.classList.add('hidden');
        updateEnvelopeBadge();
    }, 6000);
}

function markIncomingDailyChatMessagesAsRead() {
    const activeRole = getDailyChatRole();
    const unreadMessages = getUnreadDailyChatMessages();
    if (!activeRole || unreadMessages.length === 0) {
        updateEnvelopeBadge();
        return;
    }

    const updates = {};
    unreadMessages.forEach(message => {
        if (message.id) updates[`messages/${message.id}/readBy/${activeRole}`] = true;
        message.readBy = { ...(message.readBy || {}), [activeRole]: true };
    });
    saveDailyChatMessagesLocally();
    updateEnvelopeBadge();

    if (typeof database !== 'undefined' && database) {
        database.ref(DAILY_CHAT_PATH).update(updates).catch(error => {
            console.error('Không thể đánh dấu tin nhắn đã đọc:', error);
        });
    }
}

function openEnvelopeChat() {
    if (!getDailyChatRole()) return;

    const panel = document.getElementById('envelopeChatPanel');
    if (panel) panel.classList.remove('hidden');
    envelopeChatOpen = true;
    hideEnvelopeChatBubble();
    updateChatPartnerNicknameInput();
    renderEnvelopeChatHistory();
    markIncomingDailyChatMessagesAsRead();
}

function closeEnvelopeChat() {
    const panel = document.getElementById('envelopeChatPanel');
    if (panel) panel.classList.add('hidden');
    envelopeChatOpen = false;
}

function toggleEnvelopeChat() {
    if (envelopeChatOpen) {
        closeEnvelopeChat();
    } else {
        openEnvelopeChat();
    }
}

// Giữ tên hàm cũ để các nơi gọi trước đây vẫn hoạt động.
function openEnvelopeModal() { openEnvelopeChat(); }
function closeEnvelopeModal() { closeEnvelopeChat(); }
function readAndClearMessage() { closeEnvelopeChat(); }

function handleEnvelopeChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendEnvelopeMessage();
    }
}

function sendEnvelopeMessage() {
    const textarea = document.getElementById('envelopeText');
    const text = textarea ? textarea.value.trim() : '';
    const activeRole = getDailyChatRole();
    if (!text || !activeRole) return;

    const message = {
        text: text.slice(0, 1000),
        sender: activeRole,
        sentAt: Date.now(),
        readBy: { [activeRole]: true }
    };

    if (typeof database !== 'undefined' && database) {
        const messageRef = database.ref(`${DAILY_CHAT_PATH}/messages`).push();
        messageRef.set(message).then(() => {
            if (textarea) textarea.value = '';
        }).catch(error => {
            console.error('Không thể gửi tin nhắn:', error);
            alert('Chưa thể gửi tin nhắn. Bạn thử lại nhé!');
        });
        return;
    }

    message.id = `local_${message.sentAt}`;
    dailyChatMessages.push(message);
    saveDailyChatMessagesLocally();
    renderEnvelopeChatHistory();
    if (textarea) textarea.value = '';
}

function listenForRealtimeChat() {
    if (dailyChatListenerAttached || typeof database === 'undefined' || !database || !getDailyChatRole()) return;
    dailyChatListenerAttached = true;

    database.ref(`${DAILY_CHAT_PATH}/messages`).limitToLast(100).on('value', (snapshot) => {
        const nextMessages = [];
        snapshot.forEach(child => {
            const message = child.val();
            if (message && typeof message.text === 'string') nextMessages.push({ ...message, id: child.key });
        });
        nextMessages.sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0));

        const activeRole = getDailyChatRole();
        const newIncomingMessages = nextMessages.filter(message =>
            message.sender !== activeRole && !knownDailyChatMessageIds.has(message.id)
        );
        knownDailyChatMessageIds = new Set(nextMessages.map(message => message.id));
        dailyChatMessages = nextMessages;
        saveDailyChatMessagesLocally();
        renderEnvelopeChatHistory();
        updateEnvelopeBadge();

        if (envelopeChatOpen) {
            markIncomingDailyChatMessagesAsRead();
        } else if (newIncomingMessages.length > 0) {
            showEnvelopeChatBubble(newIncomingMessages[newIncomingMessages.length - 1]);
        }
    });
}

// Tên cũ được giữ cho phần khởi tạo Firebase đang dùng trong trang.
function listenForRealtimeLetters() {
    listenForRealtimeChat();
}

// Hiệu ứng thả tim bay
function createHeartEffect() {
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.classList.add('floating-heart');
            heart.innerText = ['❤️', '💖', '💕', '🌿', '✨'][Math.floor(Math.random() * 5)];
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.animationDuration = (Math.random() * 2 + 2) + 's';

            document.body.appendChild(heart);
            setTimeout(() => { heart.remove(); }, 3000);
        }, i * 150);
    }
}

// ==========================================
// 5. THÊM KỶ NIỆM MỚI (TẠO CỘT MỐC TRÊN TIMELINE)
// ==========================================
function openAddMemoryModal() {
    const modal = document.getElementById('addMemoryModal');
    if (modal) modal.classList.remove('hidden');
}

function closeAddMemoryModal() {
    const modal = document.getElementById('addMemoryModal');
    if (modal) modal.classList.add('hidden');
    document.getElementById('memoryDateInput').value = '';
    document.getElementById('memoryTitleInput').value = '';
    document.getElementById('memoryContentInput').value = '';
}

function saveNewMemory() {
    const dateVal = document.getElementById('memoryDateInput').value.trim();
    const titleVal = document.getElementById('memoryTitleInput').value.trim();
    const contentVal = document.getElementById('memoryContentInput').value.trim();

    if (!dateVal || !titleVal) {
        alert("Vui lòng nhập ngày và tiêu đề kỷ niệm nhé!");
        return;
    }

    let customMemories = JSON.parse(localStorage.getItem('custom_memories') || '[]');
    customMemories.push({
        date: dateVal,
        title: titleVal,
        content: contentVal || "Kỷ niệm ngọt ngào của Skey & Pâu."
    });

    localStorage.setItem('custom_memories', JSON.stringify(customMemories));
    closeAddMemoryModal();
    renderTimeline();
    alert("Kỷ niệm mới đã được thêm vào hành trình yêu thương! 📸❤️");
}

function editCustomMemory(index) {
    let customMemories = JSON.parse(localStorage.getItem('custom_memories') || '[]');
    if (!customMemories[index]) return;

    const item = customMemories[index];
    const newDate = prompt("Sửa thời gian / ngày kỷ niệm:", item.date);
    if (newDate === null) return;

    const newTitle = prompt("Sửa tiêu đề cột mốc:", item.title);
    if (newTitle === null) return;

    const newContent = prompt("Sửa cảm xúc / nội dung:", item.content);
    if (newContent === null) return;

    customMemories[index] = {
        date: newDate.trim() || item.date,
        title: newTitle.trim() || item.title,
        content: newContent.trim() || item.content
    };

    localStorage.setItem('custom_memories', JSON.stringify(customMemories));
    renderTimeline();
}

function deleteCustomMemory(index) {
    let customMemories = JSON.parse(localStorage.getItem('custom_memories') || '[]');
    if (!customMemories[index]) return;

    if (confirm("Bạn có chắc chắn muốn xóa cột mốc kỷ niệm này không?")) {
        customMemories.splice(index, 1);
        localStorage.setItem('custom_memories', JSON.stringify(customMemories));
        renderTimeline();
    }
}

function renderTimeline() {
    const listContainer = document.getElementById('timelineList');
    if (!listContainer) return;

    const defaultMemories = [
        {
            date: '16/03/2021',
            title: 'Ngày Chính Thức Yêu Nhau',
            content: 'Mốc thời gian đặc biệt khởi đầu cho hành trình tình yêu ngọt ngào của Skey và Pâu.'
        },
        {
            date: '30/04 - 02/05/2026',
            title: 'Du Lịch Cát Bà 🏝️',
            content: 'Chuyến đi vi vu biển đảo tuyệt đẹp cùng nhau, lưu giữ ngàn khoảnh khắc đẹp.'
        },
        {
            date: '15 - 16/08/2026',
            title: 'Du Lịch Đồ Sơn 🌊',
            content: 'Kỳ nghỉ đong đầy niềm vui, tiếng cười và những phút giây bình yên bên nhau.'
        }
    ];

    let customMemories = JSON.parse(localStorage.getItem('custom_memories') || '[]');

    listContainer.innerHTML = '';

    defaultMemories.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item';
        itemDiv.onclick = () => openDiary(item.date, item.title);

        itemDiv.innerHTML = `
            <div class="date">${item.date} 📖</div>
            <div class="content">
                <h3>${item.title}</h3>
                <p>${item.content}</p>
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });

    customMemories.forEach((item, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item custom-timeline-item';

        itemDiv.innerHTML = `
            <div class="timeline-header-row">
                <div class="date">${item.date} 📖</div>
                <div class="timeline-item-actions">
                    <button class="timeline-action-btn edit-btn" onclick="event.stopPropagation(); editCustomMemory(${idx})" title="Sửa cột mốc">✏️ Sửa</button>
                    <button class="timeline-action-btn delete-btn" onclick="event.stopPropagation(); deleteCustomMemory(${idx})" title="Xóa cột mốc">🗑️ Xóa</button>
                </div>
            </div>
            <div class="content" onclick="openDiary('${item.date}', '${item.title}')">
                <h3>${item.title}</h3>
                <p>${item.content}</p>
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });
}

renderTimeline();

// ==========================================
// 6. PLAYLIST 6 BÀI HÁT
// ==========================================
const playlist = [
    { title: "1. Yêu em rất nhiều - Hoàng Tôn", src: "assets/audio/music1.mp3" },
    { title: "2. Một đời - Casper, Bon Nghiêm", src: "assets/audio/music2.mp3" },
    { title: "3. Rồi ta sẽ ngắm pháo hoa cùng nhau - O.lew", src: "assets/audio/music3.mp3" },
    { title: "4. Muốn ôm lấy em - Kha", src: "assets/audio/music4.mp3" },
    { title: "5. Ai ngoài anh - VSTRA", src: "assets/audio/music5.mp3" },
    { title: "6. Vườn hoa con cá - O.lew feat Ngan", src: "assets/audio/music6.mp3" }
];

let currentSongIndex = 0;
let isPlaying = false;
const music = document.getElementById('bgMusic');
const musicSource = document.getElementById('musicSource');
const songTitleDisplay = document.getElementById('songTitle');
const musicToggleBtn = document.getElementById('musicToggleBtn');

function loadSong(index, continuePlaying = isPlaying) {
    currentSongIndex = index;
    if (musicSource) musicSource.src = playlist[index].src;
    if (songTitleDisplay) songTitleDisplay.innerText = "🎵 " + playlist[index].title;
    if (music) {
        music.load();
        if (continuePlaying) {
            music.play().catch(() => { });
        }
    }
}

function syncSongSelection() {
    if (typeof database === 'undefined' || !database) return;

    database.ref('music_state').set({
        songIndex: currentSongIndex,
        updatedAt: Date.now()
    }).catch((error) => {
        console.error("Không thể đồng bộ bài hát:", error);
    });
}

function listenForRealtimeMusic() {
    if (typeof database === 'undefined' || !database) return;

    database.ref('music_state').on('value', (snapshot) => {
        if (!snapshot.exists()) {
            syncSongSelection();
            return;
        }

        const songIndex = Number(snapshot.val().songIndex);
        if (!Number.isInteger(songIndex) || songIndex < 0 || songIndex >= playlist.length) return;

        // Chỉ nhận bài hát từ Firebase; không ghi ngược lại nên không tạo vòng lặp đồng bộ.
        if (songIndex !== currentSongIndex) {
            loadSong(songIndex, isPlaying);
        }
    });
}

function toggleMusic() {
    if (!music) return;
    if (isPlaying) {
        music.pause();
        if (musicToggleBtn) musicToggleBtn.innerText = '▶️';
        isPlaying = false;
    } else {
        music.play().then(() => {
            if (musicToggleBtn) musicToggleBtn.innerText = '⏸️';
            isPlaying = true;
        }).catch(() => { });
    }
}

function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    loadSong(currentSongIndex);
    if (isPlaying && musicToggleBtn) musicToggleBtn.innerText = '⏸️';
    syncSongSelection();
}

function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentSongIndex);
    if (isPlaying && musicToggleBtn) musicToggleBtn.innerText = '⏸️';
    syncSongSelection();
}

if (music) {
    music.onended = function () { nextSong(); };
}

listenForRealtimeMusic();

document.addEventListener('click', function autoPlayMusic() {
    if (!isPlaying && music) {
        music.play().then(() => {
            isPlaying = true;
            if (musicToggleBtn) musicToggleBtn.innerText = '⏸️';
        }).catch(() => { });
    }
}, { once: true });

// ==========================================
// 7. NHẬT KÝ KỶ NIỆM (RỘNG TO 1000PX)
// ==========================================
let currentDiaryKey = '';

function openDiary(key, title) {
    currentDiaryKey = key;
    document.getElementById('diaryTitle').innerText = "📖 CẢM XÚC & KỶ NIỆM CỦA SKEY VÀ PÂU";
    document.getElementById('diaryDate').innerText = "📌 Cột mốc: " + title + " (" + key + ")";
    document.getElementById('diaryModal').classList.remove('hidden');
    renderDiaryList();
}

function closeDiary() {
    document.getElementById('diaryModal').classList.add('hidden');
    document.getElementById('diaryText').value = '';
}

function saveDiaryEntry() {
    const textInput = document.getElementById('diaryText');
    const content = textInput.value.trim();
    const authorSelect = document.getElementById('diaryAuthorSelect');
    const author = authorSelect ? authorSelect.value : 'Skey & Pâu';

    if (!content) {
        alert("Bạn chưa viết cảm xúc nào cả nè!");
        return;
    }

    const savedData = JSON.parse(localStorage.getItem('love_diaries') || '{}');
    if (!savedData[currentDiaryKey]) savedData[currentDiaryKey] = [];

    savedData[currentDiaryKey].push({
        author: author,
        text: content,
        time: new Date().toLocaleString('vi-VN')
    });

    localStorage.setItem('love_diaries', JSON.stringify(savedData));
    textInput.value = '';
    renderDiaryList();
}

function editDiaryEntry(index) {
    const savedData = JSON.parse(localStorage.getItem('love_diaries') || '{}');
    const entries = savedData[currentDiaryKey] || [];
    if (!entries[index]) return;

    const currentText = entries[index].text;
    const newText = prompt("Chỉnh sửa nội dung cảm xúc & kỷ niệm:", currentText);

    if (newText !== null && newText.trim() !== '') {
        entries[index].text = newText.trim();
        entries[index].time = new Date().toLocaleString('vi-VN') + " (Đã sửa)";
        savedData[currentDiaryKey] = entries;
        localStorage.setItem('love_diaries', JSON.stringify(savedData));
        renderDiaryList();
    }
}

function deleteDiaryEntry(index) {
    const savedData = JSON.parse(localStorage.getItem('love_diaries') || '{}');
    const entries = savedData[currentDiaryKey] || [];
    if (!entries[index]) return;

    if (confirm("Bạn có chắc chắn muốn xóa bài cảm xúc kỷ niệm này không?")) {
        entries.splice(index, 1);
        savedData[currentDiaryKey] = entries;
        localStorage.setItem('love_diaries', JSON.stringify(savedData));
        renderDiaryList();
    }
}

function renderDiaryList() {
    const listContainer = document.getElementById('diaryList');
    const savedData = JSON.parse(localStorage.getItem('love_diaries') || '{}');
    const entries = savedData[currentDiaryKey] || [];

    listContainer.innerHTML = '';

    if (entries.length === 0) {
        listContainer.innerHTML = '<div class="empty-diary">Chưa có bài viết cảm xúc nào. Hãy gửi gắm kỷ niệm đầu tiên tại đây nhé! 💚</div>';
        return;
    }

    entries.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'diary-card-item';
        itemDiv.innerHTML = `
            <div class="diary-card-header">
                <div class="diary-header-left">
                    <span class="diary-author-tag">${item.author || 'Skey & Pâu'}</span>
                    <span class="diary-card-time">🕒 ${item.time}</span>
                </div>
                <div class="diary-card-actions">
                    <button class="diary-action-btn edit-btn" onclick="editDiaryEntry(${index})">✏️ Sửa</button>
                    <button class="diary-action-btn delete-btn" onclick="deleteDiaryEntry(${index})">🗑️ Xóa</button>
                </div>
            </div>
            <div class="diary-card-body">${item.text}</div>
        `;
        listContainer.appendChild(itemDiv);
    });

    listContainer.scrollTop = listContainer.scrollHeight;
}
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

// ==========================================
// 10. GAME CARO (BẢNG 10X10 + ĐỔI ICON + PHÁO HOA + LỊCH SỬ ĐẤU)
// ==========================================
const availableIcons = ['🌸', '🌺', '🌻', '🌹', '🐶', '🐱', '🐰', '🦊', '🍓', '🍀', '❤️', '💚'];
const XO_GAME_PATH = 'xo_game';
const XO_REACTION_DURATION_MS = 8000;
const XO_REACTION_EMOJIS = new Set(['❤️', '💖', '😂', '😭', '👏', '🎉', '🔥', '💩', '🌸', '💣', '🌟', '👻', '🥰', '🥳', '😜', '💪']);

let p1Icon = null;
let p2Icon = null;
let p1Score = 0;
let p2Score = 0;
let xoCurrentPlayer = 1;
let xoBoard = Array(10).fill(null).map(() => Array(10).fill(null));
let xoGameOver = false;
let xoGameState = null;
let xoGameListener = null;
let xoJoinedRole = '';
let xoProcessedFinishedGameId = '';
let xoDismissedNoticeId = '';
let xoStartRecoveryGameId = '';
let xoSeenReactionIds = new Set();

function createXOBoard() {
    return Array(10).fill(null).map(() => Array(10).fill(null));
}

// Realtime Database bỏ các phần tử null khi lưu mảng, nên khi đọc lại bàn cờ
// có thể là object thưa như { "4": { "5": 2 } }. Chuẩn hóa lại thành bảng 10x10.
function normalizeXOBoard(board) {
    const normalizedBoard = createXOBoard();
    if (!board || typeof board !== 'object') return normalizedBoard;

    Object.entries(board).forEach(([rowKey, row]) => {
        const rowIndex = Number(rowKey);
        if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= 10 || !row || typeof row !== 'object') return;

        Object.entries(row).forEach(([columnKey, value]) => {
            const columnIndex = Number(columnKey);
            if (Number.isInteger(columnIndex) && columnIndex >= 0 && columnIndex < 10 && (value === 1 || value === 2)) {
                normalizedBoard[rowIndex][columnIndex] = value;
            }
        });
    });

    return normalizedBoard;
}

function normalizeXOLastMove(lastMove) {
    if (!lastMove || typeof lastMove !== 'object') return null;

    const row = Number(lastMove.row);
    const col = Number(lastMove.col);
    const player = Number(lastMove.player);
    const role = lastMove.role;

    if (!Number.isInteger(row) || row < 0 || row >= 10 ||
        !Number.isInteger(col) || col < 0 || col >= 10 ||
        (player !== 1 && player !== 2) ||
        (role !== 'Skey' && role !== 'Pâu')) {
        return null;
    }

    return { row, col, player, role, at: Number(lastMove.at) || 0 };
}

function getXORole() {
    const role = sessionStorage.getItem('active_user_role') || '';
    return role === 'Skey' || role === 'Pâu' ? role : '';
}

function hasBothXOPlayers(game) {
    return Boolean(game?.players?.Skey && game?.players?.Pâu);
}

function hasBothXOIcons(game) {
    return Boolean(game?.icons?.Skey && game?.icons?.Pâu);
}

function startXOGameWhenReady(game) {
    if (!hasBothXOPlayers(game) || !hasBothXOIcons(game)) return false;

    game.phase = 'playing';
    game.currentPlayer = getXOStartingPlayer(game.roundNumber);
    game.startedAt = Date.now();
    return true;
}

function recoverStalledXOGame(game) {
    if (!game || !hasBothXOPlayers(game) || !hasBothXOIcons(game)) return;
    if (game.phase !== 'waiting' && game.phase !== 'selecting') return;
    if (xoStartRecoveryGameId === game.gameId || typeof database === 'undefined' || !database) return;

    xoStartRecoveryGameId = game.gameId;
    database.ref(XO_GAME_PATH).transaction((currentGame) => {
        const current = normalizeXOGame(currentGame);
        if ((current.phase === 'waiting' || current.phase === 'selecting') && hasBothXOPlayers(current) && hasBothXOIcons(current)) {
            startXOGameWhenReady(current);
        }
        return current;
    }).catch((error) => {
        xoStartRecoveryGameId = '';
        console.error('Không thể khởi động lại ván Caro đang chờ:', error);
    });
}

function normalizeXORematchResponses(responses) {
    return {
        Skey: typeof responses?.Skey === 'boolean' ? responses.Skey : null,
        Pâu: typeof responses?.Pâu === 'boolean' ? responses.Pâu : null
    };
}

function normalizeXOGame(game) {
    const state = game || {};
    state.players = state.players || {};
    state.icons = state.icons || {};
    state.scores = state.scores || { Skey: 0, Pâu: 0 };
    state.scores.Skey = Number(state.scores.Skey) || 0;
    state.scores.Pâu = Number(state.scores.Pâu) || 0;
    state.board = normalizeXOBoard(state.board);
    state.lastMove = normalizeXOLastMove(state.lastMove);
    state.history = state.history && typeof state.history === 'object' ? state.history : {};
    state.chat = state.chat && typeof state.chat === 'object' ? state.chat : {};
    state.reactions = state.reactions && typeof state.reactions === 'object' ? state.reactions : {};
    state.rematchResponses = normalizeXORematchResponses(state.rematchResponses);
    state.roundNumber = Number(state.roundNumber) || 1;
    state.phase = state.phase || 'waiting';
    state.gameId = state.gameId || `xo_${Date.now()}`;
    return state;
}

function getXOStartingPlayer(roundNumber) {
    return roundNumber % 2 === 1 ? 'Skey' : 'Pâu';
}

function resetXOGameState(state, keepIcons = false) {
    state.board = createXOBoard();
    state.lastMove = null;
    state.winningCells = [];
    state.winner = '';
    state.rematchResponses = { Skey: null, Pâu: null };
    state.chat = {};
    state.reactions = {};
    delete state.matchEndedAt;
    delete state.finishedAt;
    delete state.endReason;
    delete state.endedBy;
    delete state.cancelledBy;
    delete state.cancelledAt;
    state.gameId = `xo_${Date.now()}`;
    state.currentPlayer = keepIcons ? getXOStartingPlayer(state.roundNumber) : '';
    state.phase = keepIcons ? 'playing' : 'selecting';
    if (!keepIcons) state.icons = {};
    return state;
}

function isXOActivePhase(phase) {
    return phase === 'playing' || phase === 'finished';
}

function clearXOBoardAfterGameEnd(game) {
    game.board = createXOBoard();
    game.lastMove = null;
    game.winningCells = [];
    game.currentPlayer = '';
}

function cancelXOGameForDeparture(departingRole, onlyIfPlayerIsMissing = false) {
    if (!departingRole || typeof database === 'undefined' || !database) return;

    database.ref(XO_GAME_PATH).transaction((currentGame) => {
        const game = normalizeXOGame(currentGame);
        if (!isXOActivePhase(game.phase)) return game;
        if (onlyIfPlayerIsMissing && hasBothXOPlayers(game)) return game;

        const missingRole = game.players?.Skey ? 'Pâu' : game.players?.Pâu ? 'Skey' : departingRole;
        game.phase = 'cancelled';
        game.cancelledBy = onlyIfPlayerIsMissing ? missingRole : departingRole;
        game.cancelledAt = Date.now();
        clearXOBoardAfterGameEnd(game);
        return game;
    }).catch((error) => console.error('Không thể hủy ván Caro khi người chơi rời phòng:', error));
}

function openGameXOModal() {
    document.getElementById('gameXOModal').classList.remove('hidden');
    updateGameInviteButton('xo');
    const role = getXORole();

    if (!role || typeof database === 'undefined' || !database) {
        alert('Hãy chọn vai Skey hoặc Pâu và kết nối Firebase trước khi vào phòng Caro nhé!');
        closeGameXOModal();
        return;
    }

    joinXOGame(role);
}

function closeGameXOModal() {
    document.getElementById('gameXOModal').classList.add('hidden');
    document.getElementById('xoRematchModal')?.classList.add('hidden');
    leaveXOGame();
}

function joinXOGame(role) {
    xoJoinedRole = role;
    const gameRef = database.ref(XO_GAME_PATH);
    const playerRef = gameRef.child(`players/${role}`);

    playerRef.onDisconnect().remove();
    listenForXOGame();

    gameRef.transaction((currentGame) => {
        const game = normalizeXOGame(currentGame);
        const hadBothPlayers = hasBothXOPlayers(game);
        game.players[role] = { joinedAt: Date.now() };

        if (!hasBothXOPlayers(game)) {
            game.phase = 'waiting';
        } else if (!hadBothPlayers || game.phase === 'waiting') {
            if (!startXOGameWhenReady(game)) {
                resetXOGameState(game, false);
            }
        }

        return game;
    }).catch((error) => {
        console.error('Không thể vào phòng Caro:', error);
        alert('Chưa thể vào phòng Caro lúc này. Bạn thử lại nhé!');
    });
}

function leaveXOGame() {
    if (!xoJoinedRole || typeof database === 'undefined' || !database) return;

    if (isXOActivePhase(xoGameState?.phase)) {
        cancelXOGameForDeparture(xoJoinedRole);
    }

    const playerRef = database.ref(`${XO_GAME_PATH}/players/${xoJoinedRole}`);
    playerRef.onDisconnect().cancel();
    playerRef.remove().catch((error) => console.error('Không thể rời phòng Caro:', error));
    xoJoinedRole = '';

    if (xoGameListener) {
        database.ref(XO_GAME_PATH).off('value', xoGameListener);
        xoGameListener = null;
    }
}

function listenForXOGame() {
    if (xoGameListener) return;

    xoGameListener = (snapshot) => {
        syncXOGameUI(snapshot.val());
    };
    database.ref(XO_GAME_PATH).on('value', xoGameListener);
}

function syncXOGameUI(game) {
    xoGameState = game ? normalizeXOGame(game) : null;

    p1Icon = xoGameState?.icons?.Skey || null;
    p2Icon = xoGameState?.icons?.Pâu || null;
    p1Score = xoGameState?.scores?.Skey || 0;
    p2Score = xoGameState?.scores?.Pâu || 0;
    xoBoard = xoGameState?.board || createXOBoard();
    xoCurrentPlayer = xoGameState?.currentPlayer === 'Pâu' ? 2 : 1;
    xoGameOver = ['finished', 'ended', 'cancelled'].includes(xoGameState?.phase);

    const setXOText = (id, text) => {
        const element = document.getElementById(id);
        if (element) element.innerText = text;
    };
    setXOText('scoreP1Val', p1Score);
    setXOText('scoreP2Val', p2Score);
    setXOText('scoreP1Icon', p1Icon || '👤');
    setXOText('scoreP2Icon', p2Icon || '👤');
    setXOText('p1SelectedIconDisplay', p1Icon || '--');
    setXOText('p2SelectedIconDisplay', p2Icon || '--');

    const p1SelectBox = document.getElementById('p1IconSelectBox');
    const p1ReactionBox = document.getElementById('p1ReactionBox');
    const p2SelectBox = document.getElementById('p2IconSelectBox');
    const p2ChatBox = document.getElementById('p2ChatBox');
    const canUseXOExtras = hasBothXOIcons(xoGameState) && ['playing', 'finished'].includes(xoGameState?.phase);
    if (p1SelectBox) p1SelectBox.classList.toggle('hidden', Boolean(p1Icon));
    if (p1ReactionBox) p1ReactionBox.classList.toggle('hidden', !canUseXOExtras);
    if (p2SelectBox) p2SelectBox.classList.toggle('hidden', Boolean(p2Icon));
    if (p2ChatBox) p2ChatBox.classList.toggle('hidden', !canUseXOExtras);

    initXOPalettes();
    renderXOBoard();
    updateXOTurnStatus();
    renderXOHistory();
    renderXOChat();
    syncXOReactions(xoGameState);
    syncXORematchModal();

    // Khắc phục trạng thái phòng cũ bị kẹt ở "đang chọn" dù cả hai đã chọn icon.
    recoverStalledXOGame(xoGameState);

    if (isXOActivePhase(xoGameState?.phase) && !hasBothXOPlayers(xoGameState)) {
        cancelXOGameForDeparture('', true);
    }

    if (xoGameState?.phase === 'finished' && xoGameState.gameId !== xoProcessedFinishedGameId) {
        xoProcessedFinishedGameId = xoGameState.gameId;
        if (xoGameState.winningCells?.length) highlightWinningCells(xoGameState.winningCells);
        if (xoGameState.winner && xoGameState.winner !== 'Hòa cờ') triggerFireworks();
    }
}

function syncXORematchModal() {
    const modal = document.getElementById('xoRematchModal');
    if (!modal) return;

    const winner = xoGameState?.winner;
    const role = getXORole();
    const canOfferRematch = xoGameState?.phase === 'finished' && (winner === 'Skey' || winner === 'Pâu');
    const surrenderNotice = xoGameState?.phase === 'ended' && xoGameState?.endReason === 'declined-rematch' && role && role !== xoGameState.endedBy;
    const departureNotice = xoGameState?.phase === 'cancelled' && role && role !== xoGameState.cancelledBy;
    const noticeId = surrenderNotice
        ? `surrender_${xoGameState.gameId}_${xoGameState.matchEndedAt}`
        : departureNotice ? `departure_${xoGameState.gameId}_${xoGameState.cancelledAt}` : '';

    if (!canOfferRematch && (!noticeId || xoDismissedNoticeId === noticeId)) {
        modal.classList.add('hidden');
        return;
    }

    const responses = normalizeXORematchResponses(xoGameState.rematchResponses);
    const myResponse = role ? responses[role] : null;
    const otherRole = role === 'Skey' ? 'Pâu' : 'Skey';
    const winnerIcon = winner === 'Skey' ? p1Icon : p2Icon;
    const title = document.getElementById('xoRematchTitle');
    const message = document.getElementById('xoRematchMessage');
    const yesButton = document.getElementById('xoRematchYesBtn');
    const noButton = document.getElementById('xoRematchNoBtn');
    const voteStatus = document.getElementById('xoRematchVoteStatus');
    const actions = document.getElementById('xoRematchActions');
    const dismissButton = document.getElementById('xoRematchDismissBtn');

    if (surrenderNotice || departureNotice) {
        const departedRole = surrenderNotice ? xoGameState.endedBy : xoGameState.cancelledBy;
        if (title) title.innerText = surrenderNotice ? '💌 Lần sau cùng chơi tiếp nhé!' : 'Úi!!! Đối phương đã trốn mất rồi.';
        if (message) message.innerText = surrenderNotice
            ? `${departedRole} đã chọn kết thúc ván này.`
            : `Úi!!! ${departedRole} đã trốn mất rồi. Ván này đã bị hủy.`;
        if (actions) actions.classList.add('hidden');
        if (dismissButton) dismissButton.classList.remove('hidden');
        if (voteStatus) voteStatus.innerText = surrenderNotice
            ? 'Bàn cờ đã được xóa và kết quả trận đấu đã lưu vào lịch sử.'
            : 'Bàn cờ đã được xóa. Lịch sử các trận trước vẫn được giữ nguyên.';
        modal.classList.remove('hidden');
        return;
    }

    if (title) title.innerText = `🎉 Chúc mừng ${winner} đã chiến thắng!`;
    if (message) {
        message.innerText = myResponse === true
            ? `Bạn đã chọn chơi lại. Đang chờ ${otherRole} phản hồi...`
            : `${winner} (${winnerIcon}) đã chiến thắng ván ${xoGameState.roundNumber}. Bạn có muốn chơi lại không?`;
    }
    if (yesButton) yesButton.disabled = myResponse !== null;
    if (noButton) noButton.disabled = myResponse !== null;
    if (actions) actions.classList.remove('hidden');
    if (dismissButton) dismissButton.classList.add('hidden');
    if (voteStatus) {
        const describeResponse = (response) => response === true
            ? 'đã chọn chơi lại'
            : response === false ? 'đã chọn kết thúc' : 'đang chờ chọn';
        voteStatus.innerHTML = `<div>Skey: ${describeResponse(responses.Skey)}</div><div>Pâu: ${describeResponse(responses.Pâu)}</div>`;
    }
    modal.classList.remove('hidden');
}

function dismissXORematchNotice() {
    const game = xoGameState;
    const timestamp = game?.phase === 'ended' ? game.matchEndedAt : game?.cancelledAt;
    xoDismissedNoticeId = `${game?.phase === 'ended' ? 'surrender' : 'departure'}_${game?.gameId}_${timestamp}`;
    document.getElementById('xoRematchModal')?.classList.add('hidden');
}

function respondXORematch(wantsReplay) {
    const role = getXORole();
    if (!role || typeof database === 'undefined' || !database) return;

    database.ref(XO_GAME_PATH).transaction((currentGame) => {
        const game = normalizeXOGame(currentGame);
        if (!hasBothXOPlayers(game) || game.phase !== 'finished' || (game.winner !== 'Skey' && game.winner !== 'Pâu')) return game;

        const responses = normalizeXORematchResponses(game.rematchResponses);
        if (responses[role] !== null) return game;

        responses[role] = Boolean(wantsReplay);
        game.rematchResponses = responses;

        if (responses.Skey === false || responses.Pâu === false) {
            saveXOHistoryToGame(game);
            game.phase = 'ended';
            game.matchEndedAt = Date.now();
            game.endReason = 'declined-rematch';
            game.endedBy = role;
            clearXOBoardAfterGameEnd(game);
        } else if (responses.Skey === true && responses.Pâu === true) {
            game.roundNumber += 1;
            resetXOGameState(game, true);
            game.startedAt = Date.now();
        }
        return game;
    }).catch((error) => console.error('Không thể lưu lựa chọn chơi lại:', error));
}

function initXOPalettes() {
    const p1Container = document.getElementById('p1IconPalette');
    const p2Container = document.getElementById('p2IconPalette');

    if (!p1Container || !p2Container) return;
    p1Container.innerHTML = '';
    p2Container.innerHTML = '';

    const activeRole = getXORole();
    const canSkeyChoose = hasBothXOPlayers(xoGameState) && xoGameState?.phase === 'selecting' && activeRole === 'Skey' && !p1Icon;
    const canPauChoose = hasBothXOPlayers(xoGameState) && xoGameState?.phase === 'selecting' && activeRole === 'Pâu' && !p2Icon;

    availableIcons.forEach(icon => {
        const btn1 = document.createElement('button');
        btn1.className = 'icon-opt-btn';
        btn1.disabled = !canSkeyChoose || icon === p2Icon;
        if (btn1.disabled) btn1.classList.add('disabled');
        btn1.innerText = icon;
        btn1.onclick = () => selectP1Icon(icon);
        p1Container.appendChild(btn1);

        const btn2 = document.createElement('button');
        btn2.className = 'icon-opt-btn';
        btn2.disabled = !canPauChoose || icon === p1Icon;
        if (btn2.disabled) btn2.classList.add('disabled');
        btn2.innerText = icon;
        btn2.onclick = () => selectP2Icon(icon);
        p2Container.appendChild(btn2);
    });
}

function selectP1Icon(icon) {
    chooseXOIcon('Skey', icon);
}

function selectP2Icon(icon) {
    chooseXOIcon('Pâu', icon);
}

function chooseXOIcon(role, icon) {
    if (getXORole() !== role) {
        alert(`Chỉ ${role} mới có thể chọn icon này nhé!`);
        return;
    }
    if (!hasBothXOPlayers(xoGameState) || (xoGameState?.phase !== 'selecting' && xoGameState?.phase !== 'waiting')) {
        alert('Hãy chờ cả Skey và Pâu cùng vào phòng Caro trước nhé!');
        return;
    }
    if (xoGameState.icons?.[role === 'Skey' ? 'Pâu' : 'Skey'] === icon) {
        alert('Icon này đã được người kia chọn rồi, hãy chọn icon khác nhé!');
        return;
    }

    database.ref(XO_GAME_PATH).transaction((currentGame) => {
        const game = normalizeXOGame(currentGame);
        const otherRole = role === 'Skey' ? 'Pâu' : 'Skey';
        if (!hasBothXOPlayers(game) || (game.phase !== 'selecting' && game.phase !== 'waiting') || game.icons[otherRole] === icon) return game;

        game.icons[role] = icon;
        startXOGameWhenReady(game);
        return game;
    }).catch((error) => {
        console.error('Không thể chọn icon Caro:', error);
        alert('Chưa thể lưu icon. Bạn thử lại nhé!');
    });
}

function renderXOBoard() {
    const boardElem = document.getElementById('xoGridBoard');
    if (!boardElem) return;
    boardElem.innerHTML = '';

    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'xo-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;

            const cellVal = xoBoard[r][c];
            if (cellVal === 1) cell.innerText = p1Icon || '❌';
            else if (cellVal === 2) cell.innerText = p2Icon || '⭕';

            const isLastMove = xoGameState?.lastMove?.row === r && xoGameState?.lastMove?.col === c;
            if (isLastMove) cell.classList.add('last-move-cell');

            const canPlayCell = Boolean(
                getXORole() &&
                xoGameState?.phase === 'playing' &&
                xoGameState.currentPlayer === getXORole() &&
                cellVal === null
            );
            cell.disabled = !canPlayCell;
            cell.setAttribute('aria-label', cellVal === null
                ? `Hàng ${r + 1}, cột ${c + 1}`
                : `Hàng ${r + 1}, cột ${c + 1}: ${cell.innerText}`);

            cell.onclick = () => handleXOCellClick(r, c);
            boardElem.appendChild(cell);
        }
    }
}

function handleXOCellClick(r, c) {
    const role = getXORole();
    if (!hasBothXOPlayers(xoGameState) || xoGameState?.phase !== 'playing') {
        alert('Hãy chờ cả hai chọn icon xong để bắt đầu ván Caro nhé!');
        return;
    }
    if (xoGameState.currentPlayer !== role) {
        alert(`Chưa tới lượt bạn, đang là lượt ${xoGameState.currentPlayer} nhé!`);
        return;
    }

    database.ref(XO_GAME_PATH).transaction((currentGame) => {
        const game = normalizeXOGame(currentGame);
        if (!hasBothXOPlayers(game) || game.phase !== 'playing' || game.currentPlayer !== role || game.board[r]?.[c] !== null) return game;

        const playerNumber = role === 'Skey' ? 1 : 2;
        game.board[r][c] = playerNumber;
        game.lastMove = { row: r, col: c, player: playerNumber, role, at: Date.now() };
        const winResult = checkXOWinOnBoard(game.board, r, c, playerNumber);

        if (winResult.win) {
            game.phase = 'finished';
            game.winner = role;
            game.winningCells = winResult.cells;
            game.scores[role] = (Number(game.scores[role]) || 0) + 1;
            game.finishedAt = Date.now();
            game.rematchResponses = { Skey: null, Pâu: null };
            saveXOHistoryToGame(game);
        } else if (game.board.every(row => row.every(value => value !== null))) {
            game.phase = 'finished';
            game.winner = 'Hòa cờ';
            game.winningCells = [];
            game.finishedAt = Date.now();
            game.rematchResponses = { Skey: null, Pâu: null };
            saveXOHistoryToGame(game);
        } else {
            game.currentPlayer = role === 'Skey' ? 'Pâu' : 'Skey';
        }
        return game;
    }).catch((error) => console.error('Không thể đồng bộ nước đi Caro:', error));
}

function updateXOTurnStatus() {
    const statusElem = document.getElementById('gameTurnStatus');
    if (!statusElem) return;

    if (!hasBothXOPlayers(xoGameState)) {
        statusElem.innerText = '⏳ Đang chờ người kia vào phòng Caro...';
    } else if (xoGameState?.phase === 'selecting') {
        const role = getXORole();
        if (role === 'Skey' && !p1Icon) statusElem.innerText = '🔔 Cả hai đã vào phòng! Skey hãy chọn icon của mình.';
        else if (role === 'Pâu' && !p2Icon) statusElem.innerText = '🔔 Cả hai đã vào phòng! Pâu hãy chọn icon của mình.';
        else if (!p1Icon) statusElem.innerText = '🔔 Đang chờ Skey chọn icon...';
        else statusElem.innerText = '🔔 Đang chờ Pâu chọn icon...';
    } else if (xoGameState?.phase === 'playing') {
        const icon = xoGameState.currentPlayer === 'Skey' ? p1Icon : p2Icon;
        const lastMove = xoGameState.lastMove;
        const lastMoveText = lastMove
            ? ` · Nước gần nhất: ${lastMove.role} (${lastMove.role === 'Skey' ? p1Icon : p2Icon}) ở hàng ${lastMove.row + 1}, cột ${lastMove.col + 1}`
            : '';
        statusElem.innerText = `🎮 Ván ${xoGameState.roundNumber} đã bắt đầu — lượt ${xoGameState.currentPlayer} (${icon})${lastMoveText}`;
    } else if (xoGameState?.phase === 'finished') {
        statusElem.innerText = xoGameState.winner === 'Hòa cờ'
            ? '🤝 Ván đấu hòa cờ!'
            : `🎉 ${xoGameState.winner} (${xoGameState.winner === 'Skey' ? p1Icon : p2Icon}) đã chiến thắng ván này! 🎉`;
    } else if (xoGameState?.phase === 'ended') {
        statusElem.innerText = xoGameState.endReason === 'declined-rematch'
            ? `🏳️ ${xoGameState.endedBy} đã kết thúc trận. Lịch sử đấu đã được lưu lại.`
            : '🏁 Trận Caro đã kết thúc. Lịch sử đấu đã được lưu lại.';
    } else if (xoGameState?.phase === 'cancelled') {
        statusElem.innerText = `💨 Úi!!! ${xoGameState.cancelledBy} đã trốn mất rồi. Ván này đã bị hủy.`;
    }
}

function checkXOWin(row, col, player) {
    return checkXOWinOnBoard(xoBoard, row, col, player);
}

function checkXOWinOnBoard(board, row, col, player) {
    const directions = [
        [[0, 1], [0, -1]],
        [[1, 0], [-1, 0]],
        [[1, 1], [-1, -1]],
        [[1, -1], [-1, 1]]
    ];

    for (let d = 0; d < directions.length; d++) {
        const dir = directions[d];
        let winningCells = [{ r: row, c: col }];

        for (let i = 0; i < 2; i++) {
            let dr = dir[i][0];
            let dc = dir[i][1];
            let r = row + dr;
            let c = col + dc;

            while (r >= 0 && r < 10 && c >= 0 && c < 10 && board[r][c] === player) {
                winningCells.push({ r, c });
                r += dr;
                c += dc;
            }
        }

        if (winningCells.length >= 5) {
            return { win: true, cells: winningCells };
        }
    }

    return { win: false, cells: [] };
}

function highlightWinningCells(cells) {
    const cellElems = document.querySelectorAll('.xo-cell');
    cells.forEach(cell => {
        const index = cell.r * 10 + cell.c;
        if (cellElems[index]) {
            cellElems[index].classList.add('win-cell');
        }
    });
}

function resetXOGame(reselectIcons = false) {
    if (!hasBothXOPlayers(xoGameState)) {
        alert('Cần có cả Skey và Pâu trong phòng để tạo ván mới nhé!');
        return;
    }

    if (xoGameState?.phase === 'playing') {
        alert('Ván Caro đang diễn ra. Hãy chơi xong ván này trước khi tạo ván mới hoặc đổi icon nhé!');
        return;
    }

    if (xoGameState?.phase === 'finished' && (xoGameState.winner === 'Skey' || xoGameState.winner === 'Pâu')) {
        alert('Hãy để cả Skey và Pâu trả lời trong bảng hỏi chơi lại trước nhé!');
        return;
    }

    database.ref(XO_GAME_PATH).transaction((currentGame) => {
        const game = normalizeXOGame(currentGame);
        if (!hasBothXOPlayers(game)) return game;
        if (reselectIcons) {
            resetXOGameState(game, false);
        } else {
            game.roundNumber += 1;
            resetXOGameState(game, Boolean(game.icons.Skey && game.icons.Pâu));
        }
        return game;
    }).catch((error) => console.error('Không thể tạo ván Caro mới:', error));
}

function resetXOScore() {
    if (!hasBothXOPlayers(xoGameState)) {
        alert('Cần có cả Skey và Pâu trong phòng để reset tỷ số nhé!');
        return;
    }

    if (xoGameState?.phase === 'playing') {
        alert('Không thể reset tỷ số khi ván Caro đang diễn ra nhé!');
        return;
    }

    if (xoGameState?.phase === 'finished' && (xoGameState.winner === 'Skey' || xoGameState.winner === 'Pâu')) {
        alert('Hãy để cả Skey và Pâu trả lời trong bảng hỏi chơi lại trước nhé!');
        return;
    }

    database.ref(XO_GAME_PATH).transaction((currentGame) => {
        const game = normalizeXOGame(currentGame);
        if (!hasBothXOPlayers(game)) return game;
        game.scores = { Skey: 0, Pâu: 0 };
        game.roundNumber = 1;
        resetXOGameState(game, false);
        return game;
    }).catch((error) => console.error('Không thể reset tỷ số Caro:', error));
}

function saveXOHistoryToGame(game) {
    game.history = game.history && typeof game.history === 'object' ? game.history : {};
    if (game.history[game.gameId]) return;

    const winner = game.winner || 'Hòa cờ';
    game.history[game.gameId] = {
        gameId: game.gameId,
        roundNumber: game.roundNumber,
        winner,
        icon: winner === 'Skey' ? game.icons.Skey : winner === 'Pâu' ? game.icons.Pâu : '🤝',
        scoreSkey: Number(game.scores.Skey) || 0,
        scorePau: Number(game.scores.Pâu) || 0,
        finishedAt: game.finishedAt || Date.now()
    };
}

function renderXOHistory() {
    const list = document.getElementById('xoHistoryList');
    if (!list) return;

    const history = Object.values(xoGameState?.history || {})
        .filter(item => item && typeof item === 'object' && item.finishedAt)
        .sort((a, b) => Number(b.finishedAt) - Number(a.finishedAt));
    list.innerHTML = '';

    if (history.length === 0) {
        list.innerHTML = '<div style="color:#aaa; font-style:italic; font-size:0.75rem; text-align:center;">Chưa có ván đấu nào được lưu.</div>';
        return;
    }

    history.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'history-item-row';
        const time = new Date(Number(item.finishedAt)).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const round = Number(item.roundNumber) || history.length - idx;
        const resultText = item.winner === 'Hòa cờ' ? 'Hòa cờ' : `${item.icon || '🏆'} ${item.winner} thắng`;
        row.innerHTML = `<span>🕒 ${time} (Ván ${round})</span><span class="winner-tag"></span><span>Tỷ số: ${Number(item.scoreSkey) || 0} - ${Number(item.scorePau) || 0}</span>`;
        row.querySelector('.winner-tag').innerText = resultText;
        list.appendChild(row);
    });
}

function toggleXOHistory() {
    const historyBox = document.getElementById('xoHistoryBox');
    if (historyBox) historyBox.classList.toggle('hidden');
}

function playGameFloatingEmoji(emoji) {
    const modalContent = document.querySelector('.game-xo-modal-content');
    if (!modalContent) return;

    const elem = document.createElement('div');
    elem.className = 'floating-game-emoji';
    elem.innerText = emoji;
    elem.style.left = (Math.random() * 70 + 15) + '%';

    modalContent.appendChild(elem);
    setTimeout(() => { elem.remove(); }, 2500);
}

function syncXOReactions(game) {
    const now = Date.now();
    const reactions = Object.entries(game?.reactions || {})
        .map(([id, reaction]) => ({ id, ...reaction }))
        .filter(reaction => XO_REACTION_EMOJIS.has(reaction.emoji) && now - Number(reaction.createdAt) <= XO_REACTION_DURATION_MS)
        .sort((a, b) => Number(a.createdAt) - Number(b.createdAt));

    reactions.forEach(reaction => {
        if (xoSeenReactionIds.has(reaction.id)) return;
        xoSeenReactionIds.add(reaction.id);
        playGameFloatingEmoji(reaction.emoji);
    });

    // Chỉ giữ mã sự kiện mới để bộ nhớ không tăng theo thời gian.
    const activeIds = new Set(reactions.map(reaction => reaction.id));
    xoSeenReactionIds = new Set([...xoSeenReactionIds].filter(id => activeIds.has(id)));
}

function spawnGameFloatingEmoji(emoji) {
    const role = getXORole();
    if (!role || !hasBothXOIcons(xoGameState) || !['playing', 'finished'].includes(xoGameState?.phase) ||
        !XO_REACTION_EMOJIS.has(emoji) || typeof database === 'undefined' || !database) return;

    const reactionRef = database.ref(`${XO_GAME_PATH}/reactions`).push();
    reactionRef.set({ emoji, sender: role, createdAt: Date.now() }).then(() => {
        // Sự kiện chỉ có giá trị tức thời; tự dọn sau khi cả hai đã thấy hiệu ứng.
        setTimeout(() => reactionRef.remove().catch(() => { }), XO_REACTION_DURATION_MS);
    }).catch(error => {
        console.error('Không thể đồng bộ cảm xúc Caro:', error);
    });
}

function sendP2Chat() {
    const input = document.getElementById('p2InputMsg');
    const msg = input ? input.value.trim() : '';
    const role = getXORole();
    if (!msg || !role || typeof database === 'undefined' || !database) return;

    database.ref(XO_GAME_PATH).transaction((currentGame) => {
        const game = normalizeXOGame(currentGame);
        if (!hasBothXOPlayers(game) || !hasBothXOIcons(game) || !['playing', 'finished'].includes(game.phase)) return game;

        const chatId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        game.chat[chatId] = {
            sender: role,
            icon: game.icons?.[role] || '👤',
            text: msg.slice(0, 300),
            sentAt: Date.now()
        };

        const chatEntries = Object.entries(game.chat).sort(([, a], [, b]) => Number(a.sentAt) - Number(b.sentAt));
        while (chatEntries.length > 50) {
            const [oldestId] = chatEntries.shift();
            delete game.chat[oldestId];
        }
        return game;
    }).then(() => {
        if (input) input.value = '';
    }).catch(error => {
        console.error('Không thể gửi chat Caro:', error);
    });
}

function handleP2ChatEnter(e) {
    if (e.key === 'Enter') sendP2Chat();
}

function renderXOChat() {
    const container = document.getElementById('p2ChatMessages');
    if (!container) return;

    const messages = Object.values(xoGameState?.chat || {})
        .filter(message => message && typeof message.text === 'string')
        .sort((a, b) => Number(a.sentAt) - Number(b.sentAt));
    container.innerHTML = '';

    if (messages.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'system-chat-msg';
        hint.innerText = '💬 Trò chuyện cùng nhau trong ván Caro này';
        container.appendChild(hint);
    } else {
        messages.forEach(message => {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble-item ${message.sender === 'Skey' ? 'p1-bubble' : 'p2-bubble'}`;
            const sender = document.createElement('strong');
            sender.innerText = `${message.icon || '👤'} ${message.sender || 'Người chơi'}: `;
            bubble.append(sender, document.createTextNode(message.text));
            container.appendChild(bubble);
        });
    }

    container.scrollTop = container.scrollHeight;
}

// ==========================================
// 11. GAME NỐI TỪ (15S - KHỞI ĐẦU RỒI MỚI ĐẾM GIỜ)
// ==========================================
// Đặt Nối từ bên trong nhánh Caro đã có quyền Firebase trên bản web đang chạy,
// tránh việc phòng chơi bị kẹt nếu rules cho nhánh mới chưa được deploy.
const WORD_GAME_PATH = 'xo_game/word_game';
const WORD_TURN_DURATION_MS = 15000;
let wordGameState = null;
let wordGameListener = null;
let wordJoinedRole = '';
let wordTimerInterval = null;
let wordProcessedFinishedGameId = '';

const vietnameseWordDict = new Set([
    "yêu thương", "thương nhớ", "nhớ nhung", "nhung nhớ", "ngọt ngào", "ngào ngạt", "ngạt thở",
    "bình yên", "yên vui", "vui vẻ", "vẻ đẹp", "đẹp đẽ", "đẽ đàng", "đàng hoàng", "hoàng gia",
    "gia đình", "đình chùa", "chùa chiền", "chiền chiện", "ngày mai", "mai sau", "sau này",
    "ngày lễ", "lễ hội", "hội họp", "họp hành", "hành trình", "trình bày", "bày tỏ", "tỏ tình",
    "tình yêu", "yêu mến", "mến thương", "thương yêu", "yêu đời", "đời sống", "sống động",
    "động viên", "viên ngọc", "ngọc ngà", "ngà ngọc", "mặt trời", "trời mây", "mây mưa",
    "mưa rào", "rào chắn", "chắn đường", "đường xá", "xá tội", "tội lỗi", "lỗi lầm", "lầm lỡ",
    "lỡ hẹn", "hẹn hò", "hò reo", "reo hò", "học tập", "tập luyện", "luyện tập", "tập tành",
    "thành công", "công ơn", "ơn nghĩa", "nghĩa tình", "tình nghĩa", "nghĩa hiệp", "hiệp sĩ",
    "hoa hồng", "hồng thắm", "thắm thiết", "thiết tha", "tha thiết", "tha thứ", "thứ thứ",
    "cây cối", "cối xay", "xay lúa", "lúa mì", "mì tôm", "tôm cá", "cá chim", "chim trĩ",
    "trí tuệ", "tuệ mẫn", "mẫn cảm", "cảm ơn", "ơn sâu", "sắc đẹp", "đẹp đẽ",
    "ăn uống", "uống nước", "nước mắt", "mắt mũi", "mũi mài", "mài dũa", "dũa mòn", "mòn mỏi",
    "mỏi mệt", "mệt mỏi", "mỏi mắt", "mắt xích", "xích đu", "đu quay", "quay quắt", "quắt queo"
]);

function getWordRole() {
    const role = sessionStorage.getItem('active_user_role') || '';
    return role === 'Skey' || role === 'Pâu' ? role : '';
}

function getOtherWordPlayer(role) {
    return role === 'Skey' ? 'Pâu' : 'Skey';
}

function hasBothWordPlayers(game) {
    return Boolean(game?.players?.Skey && game?.players?.Pâu);
}

function getWordStarter(roundNumber) {
    return Number(roundNumber) % 2 === 0 ? 'Pâu' : 'Skey';
}

function normalizeWordGame(game) {
    const state = game || {};
    state.players = state.players && typeof state.players === 'object' ? state.players : {};
    state.scores = state.scores && typeof state.scores === 'object' ? state.scores : { Skey: 0, Pâu: 0 };
    state.scores.Skey = Number(state.scores.Skey) || 0;
    state.scores.Pâu = Number(state.scores.Pâu) || 0;
    state.chain = state.chain && typeof state.chain === 'object' ? state.chain : {};
    state.history = state.history && typeof state.history === 'object' ? state.history : {};
    state.roundNumber = Math.max(1, Number(state.roundNumber) || 1);
    state.starter = state.starter === 'Pâu' ? 'Pâu' : 'Skey';
    state.currentPlayer = state.currentPlayer === 'Pâu' ? 'Pâu' : 'Skey';
    state.phase = state.phase || 'waiting';
    state.gameId = state.gameId || `word_${Date.now()}`;
    return state;
}

function getWordChainEntries(game = wordGameState) {
    return Object.entries(game?.chain || {})
        .map(([id, entry]) => ({ id, ...entry }))
        .filter(entry => entry && typeof entry.text === 'string')
        .sort((a, b) => Number(a.sentAt) - Number(b.sentAt));
}

function prepareWordRound(game, incrementRound = false) {
    if (incrementRound) game.roundNumber = (Number(game.roundNumber) || 1) + 1;
    game.starter = getWordStarter(game.roundNumber);
    game.currentPlayer = game.starter;
    game.phase = 'setup';
    game.chain = {};
    game.turnStartedAt = 0;
    game.result = null;
    game.gameId = `word_${Date.now()}`;
}

function openWordGameModal() {
    const modal = document.getElementById('gameWordModal');
    if (modal) modal.classList.remove('hidden');
    updateGameInviteButton('word');

    const role = getWordRole();
    if (!role || typeof database === 'undefined' || !database) {
        alert('Hãy chọn vai Skey hoặc Pâu và kết nối Firebase trước khi vào game Nối từ nhé!');
        closeWordGameModal();
        return;
    }
    joinWordGame(role);
}

function closeWordGameModal() {
    const modal = document.getElementById('gameWordModal');
    if (modal) modal.classList.add('hidden');
    stopWordTimer();
    leaveWordGame();
}

function joinWordGame(role) {
    wordJoinedRole = role;
    const gameRef = database.ref(WORD_GAME_PATH);
    const playerRef = gameRef.child(`players/${role}`);
    playerRef.onDisconnect().remove();
    listenForWordGame();

    gameRef.transaction((currentGame) => {
        const game = normalizeWordGame(currentGame);
        const hadBothPlayers = hasBothWordPlayers(game);
        game.players[role] = { joinedAt: Date.now() };

        if (!hasBothWordPlayers(game)) {
            game.phase = 'waiting';
        } else if (!hadBothPlayers || game.phase === 'waiting') {
            prepareWordRound(game);
        }
        return game;
    }).catch(error => {
        console.error('Không thể vào phòng Nối từ:', error);
        alert('Chưa thể vào phòng Nối từ. Bạn hãy kiểm tra kết nối Firebase rồi thử lại nhé!');
    });
}

function leaveWordGame() {
    if (!wordJoinedRole || typeof database === 'undefined' || !database) return;

    const playerRef = database.ref(`${WORD_GAME_PATH}/players/${wordJoinedRole}`);
    playerRef.onDisconnect().cancel();
    playerRef.remove().catch(error => console.error('Không thể rời phòng Nối từ:', error));
    wordJoinedRole = '';
    if (wordGameListener) {
        database.ref(WORD_GAME_PATH).off('value', wordGameListener);
        wordGameListener = null;
    }
}

function listenForWordGame() {
    if (wordGameListener) return;
    wordGameListener = snapshot => syncWordGameUI(snapshot.val());
    database.ref(WORD_GAME_PATH).on('value', wordGameListener);
}

function syncWordGameUI(game) {
    wordGameState = game ? normalizeWordGame(game) : null;
    const state = wordGameState;
    const setText = (id, text) => {
        const element = document.getElementById(id);
        if (element) element.innerText = text;
    };
    setText('wordP1Score', state?.scores?.Skey || 0);
    setText('wordP2Score', state?.scores?.Pâu || 0);

    const bothPlayers = hasBothWordPlayers(state);
    const role = getWordRole();
    const isStarter = role === state?.starter;
    const isSetup = state?.phase === 'setup';
    const canSetOpeningPhrase = bothPlayers && isStarter && ['setup', 'waiting'].includes(state?.phase);
    const showSetup = !['playing', 'finished'].includes(state?.phase);
    const isActiveOrFinished = bothPlayers && ['playing', 'finished'].includes(state?.phase);
    const setupCard = document.getElementById('wordStartSetupCard');
    const activeArea = document.getElementById('wordActiveGameArea');
    const startInput = document.getElementById('startWordInput');
    const startButton = document.getElementById('startWordGameBtn');
    if (setupCard) setupCard.classList.toggle('hidden', !showSetup);
    if (activeArea) activeArea.classList.toggle('hidden', !isActiveOrFinished);
    if (startInput) startInput.disabled = !canSetOpeningPhrase;
    if (startButton) startButton.disabled = !canSetOpeningPhrase;

    setText('wordStartLabel', !bothPlayers
        ? '⏳ Đang chờ người kia vào phòng Nối từ...'
        : canSetOpeningPhrase ? `📌 ${role}, hãy nhập cụm từ mở đầu gồm 2 tiếng:` : `⏳ Đang chờ ${state?.starter} chọn cụm từ mở đầu...`);
    setText('wordStartHint', isStarter
        ? '💡 Bấm “Bắt Đầu” để cả hai cùng dùng chung đồng hồ 15 giây.'
        : '💡 Người mở đầu luân phiên theo từng ván để công bằng.');

    const entries = getWordChainEntries(state);
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
        const lastWords = lastEntry.text.trim().split(/\s+/);
        setText('lastWordDisplay', `“${lastEntry.text}”`);
        setText('requiredSyllableTag', (lastWords[1] || '--').toUpperCase());
    }
    renderWordChain(entries);
    updateWordTurnDisplay();

    const wordInput = document.getElementById('wordInput');
    const canSubmit = state?.phase === 'playing' && state.currentPlayer === role;
    if (wordInput) wordInput.disabled = !canSubmit;
    const submitButton = document.querySelector('.word-submit-btn');
    if (submitButton) submitButton.disabled = !canSubmit;

    if (state?.phase === 'finished' && state.result) {
        showWordError(state.result.message || 'Ván Nối từ đã kết thúc.');
    } else {
        hideWordError();
    }

    renderWordHistory();
    if (state?.phase === 'finished' && state.gameId !== wordProcessedFinishedGameId) {
        wordProcessedFinishedGameId = state.gameId;
        triggerFireworks();
    }
    if (state?.phase === 'playing' && bothPlayers) startWordTimer();
    else stopWordTimer();
}

function confirmStartWordGame() {
    const input = document.getElementById('startWordInput');
    const rawPhrase = input ? input.value.trim() : '';
    const role = getWordRole();
    const normalized = validateWordPhrase(rawPhrase);
    if (!normalized.valid) {
        showWordError(normalized.message);
        return;
    }

    database.ref(WORD_GAME_PATH).transaction((currentGame) => {
        const game = normalizeWordGame(currentGame);
        if (!hasBothWordPlayers(game)) return;
        if (game.phase === 'waiting') prepareWordRound(game);
        if (game.phase !== 'setup' || game.starter !== role) return;

        const moveId = `start_${Date.now()}_${role}`;
        game.chain[moveId] = { text: normalized.displayText, normalizedText: normalized.fullPhrase, sender: role, sentAt: Date.now() };
        game.phase = 'playing';
        game.currentPlayer = getOtherWordPlayer(role);
        game.turnStartedAt = Date.now();
        return game;
    }).catch(error => console.error('Không thể bắt đầu ván Nối từ:', error));
}

function validateWordPhrase(rawPhrase) {
    const words = String(rawPhrase || '').trim().split(/\s+/).filter(Boolean);
    if (words.length !== 2) return { valid: false, message: '❌ Hãy nhập đúng 2 tiếng, ví dụ: “Thương nhớ”.' };

    const firstWord = words[0].toLocaleLowerCase('vi-VN');
    const secondWord = words[1].toLocaleLowerCase('vi-VN');
    const fullPhrase = `${firstWord} ${secondWord}`;
    if (!checkVietnameseWordValidity(firstWord, secondWord, fullPhrase)) {
        return { valid: false, message: `❌ “${rawPhrase}” không hợp lệ.` };
    }
    return { valid: true, firstWord, secondWord, fullPhrase, displayText: words.join(' ') };
}

function startWordTimer() {
    if (wordTimerInterval) return;
    updateWordTimerUI();
    wordTimerInterval = setInterval(updateWordTimerUI, 250);
}

function stopWordTimer() {
    if (!wordTimerInterval) return;
    clearInterval(wordTimerInterval);
    wordTimerInterval = null;
}

function updateWordTimerUI() {
    const state = wordGameState;
    if (!state?.turnStartedAt || state.phase !== 'playing') return;

    const remainingMs = Math.max(0, WORD_TURN_DURATION_MS - (Date.now() - Number(state.turnStartedAt)));
    const seconds = Math.ceil(remainingMs / 1000);
    const timerNum = document.getElementById('wordTimerNum');
    const timerBar = document.getElementById('wordTimerBar');
    if (timerNum) timerNum.innerText = seconds;
    if (timerBar) timerBar.style.width = `${(remainingMs / WORD_TURN_DURATION_MS) * 100}%`;
    if (remainingMs <= 0) resolveWordTimeout();
}

function updateWordTurnDisplay() {
    const title = document.getElementById('wordTurnTitle');
    if (!title) return;
    if (!hasBothWordPlayers(wordGameState)) {
        title.innerText = '⏳ Đang chờ người kia vào phòng Nối từ...';
    } else if (wordGameState?.phase === 'playing') {
        const icon = wordGameState.currentPlayer === 'Skey' ? '👦' : '👧';
        title.innerText = `🎮 Lượt chơi: ${wordGameState.currentPlayer} (${icon})`;
    } else if (wordGameState?.phase === 'finished') {
        title.innerText = wordGameState.result?.message || '🏁 Ván Nối từ đã kết thúc.';
    } else {
        title.innerText = `📌 Chờ ${wordGameState?.starter || 'Skey'} mở đầu ván ${wordGameState?.roundNumber || 1}.`;
    }
}

function handleWordInputEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        submitWordChain();
    }
}

function submitWordChain() {
    const input = document.getElementById('wordInput');
    const rawPhrase = input ? input.value.trim() : '';
    const role = getWordRole();
    if (!hasBothWordPlayers(wordGameState) || wordGameState?.phase !== 'playing' || wordGameState.currentPlayer !== role) {
        showWordError('⏳ Chưa đến lượt bạn hoặc ván chơi chưa bắt đầu.');
        return;
    }
    const validated = validateWordPhrase(rawPhrase);
    if (!rawPhrase) {
        showWordError('⚠️ Bạn chưa nhập cụm từ nào cả!');
        return;
    }
    if (!validated.valid) {
        finishWordGameForInvalidPhrase(rawPhrase);
        if (input) input.value = '';
        return;
    }

    const localEntries = getWordChainEntries();
    const previousWords = localEntries[localEntries.length - 1]?.text?.trim().split(/\s+/) || [];
    const requiredSyllable = (previousWords[1] || '').toLocaleLowerCase('vi-VN');
    if (validated.firstWord !== requiredSyllable) {
        showWordError(`❌ Từ mới phải bắt đầu bằng tiếng “${requiredSyllable.toUpperCase()}”.`);
        return;
    }
    if (localEntries.some(entry => entry.normalizedText === validated.fullPhrase)) {
        showWordError(`❌ Cụm từ “${validated.displayText}” đã được dùng trong ván này.`);
        return;
    }

    database.ref(WORD_GAME_PATH).transaction((currentGame) => {
        const game = normalizeWordGame(currentGame);
        if (!hasBothWordPlayers(game) || game.phase !== 'playing' || game.currentPlayer !== role) return;

        const entries = getWordChainEntries(game);
        const previous = entries[entries.length - 1];
        const previousWords = previous?.text?.trim().split(/\s+/) || [];
        const requiredSyllable = (previousWords[1] || '').toLocaleLowerCase('vi-VN');
        const alreadyUsed = entries.some(entry => entry.normalizedText === validated.fullPhrase);
        if (validated.firstWord !== requiredSyllable || alreadyUsed) return;

        const moveId = `move_${Date.now()}_${role}`;
        game.chain[moveId] = { text: validated.displayText, normalizedText: validated.fullPhrase, sender: role, sentAt: Date.now() };
        game.currentPlayer = getOtherWordPlayer(role);
        game.turnStartedAt = Date.now();
        return game;
    }).then(() => {
        if (input) input.value = '';
    }).catch(error => console.error('Không thể gửi từ Nối từ:', error));
}

function checkVietnameseWordValidity(w1, w2, fullPhrase) {
    if (vietnameseWordDict.has(fullPhrase)) return true;

    const vietnameseCharRegex = /^[a-zA-Zàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+$/u;
    if (!vietnameseCharRegex.test(w1) || !vietnameseCharRegex.test(w2)) {
        return false;
    }

    if (w1.length < 1 || w2.length < 1) return false;
    if (/^(.)\1+$/.test(w1) || /^(.)\1+$/.test(w2)) return false;

    return true;
}

function finishWordGame(game, winner, loser, reason) {
    if (game.phase === 'finished') return;
    game.scores[winner] = (Number(game.scores[winner]) || 0) + 1;
    game.phase = 'finished';
    game.finishedAt = Date.now();
    game.result = {
        winner,
        loser,
        reason,
        message: `🏆 ${winner} thắng — ${reason}`
    };
    saveWordHistoryMatch(game);
}

function finishWordGameForInvalidPhrase(invalidPhrase) {
    const role = getWordRole();
    if (!role || typeof database === 'undefined' || !database) return;

    database.ref(WORD_GAME_PATH).transaction((currentGame) => {
        const game = normalizeWordGame(currentGame);
        if (!hasBothWordPlayers(game) || game.phase !== 'playing' || game.currentPlayer !== role) return;
        finishWordGame(game, getOtherWordPlayer(role), role, `“${invalidPhrase}” không hợp lệ`);
        return game;
    }).catch(error => console.error('Không thể xử lý từ không hợp lệ:', error));
}

function resolveWordTimeout() {
    if (typeof database === 'undefined' || !database) return;

    database.ref(WORD_GAME_PATH).transaction((currentGame) => {
        const game = normalizeWordGame(currentGame);
        const expired = Date.now() - Number(game.turnStartedAt) >= WORD_TURN_DURATION_MS;
        if (!hasBothWordPlayers(game) || game.phase !== 'playing' || !expired) return;
        const loser = game.currentPlayer;
        finishWordGame(game, getOtherWordPlayer(loser), loser, `${loser} đã hết 15 giây`);
        return game;
    }).catch(error => console.error('Không thể xử lý hết giờ Nối từ:', error));
}

function renderWordChain(entries = getWordChainEntries()) {
    const container = document.getElementById('wordChainList');
    if (!container) return;
    container.innerHTML = '';
    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-chain-hint">Ván đấu chưa bắt đầu. Chờ người mở đầu chọn cụm từ nhé!</div>';
        return;
    }

    entries.forEach(entry => {
        const chip = document.createElement('div');
        chip.className = 'word-chip';
        const player = document.createElement('span');
        player.className = 'chip-player';
        player.innerText = `[${entry.sender || 'Người chơi'}]`;
        chip.append(player, document.createTextNode(` ${entry.text}`));
        container.appendChild(chip);
    });
    container.scrollTop = container.scrollHeight;
}

function showWordError(msg) {
    const errBox = document.getElementById('wordErrorMsg');
    if (errBox) {
        errBox.innerText = msg;
        errBox.classList.remove('hidden');
    }
}

function hideWordError() {
    const errBox = document.getElementById('wordErrorMsg');
    if (errBox) {
        errBox.innerText = '';
        errBox.classList.add('hidden');
    }
}

function requestNewWordRound() {
    if (!hasBothWordPlayers(wordGameState)) {
        alert('Cần có cả Skey và Pâu trong phòng để tạo ván Nối từ mới nhé!');
        return;
    }
    if (wordGameState?.phase === 'playing') {
        alert('Ván Nối từ đang diễn ra. Hãy chờ kết thúc ván rồi bắt đầu ván mới nhé!');
        return;
    }

    database.ref(WORD_GAME_PATH).transaction((currentGame) => {
        const game = normalizeWordGame(currentGame);
        if (!hasBothWordPlayers(game) || game.phase === 'playing') return;
        prepareWordRound(game, true);
        return game;
    }).catch(error => console.error('Không thể tạo ván Nối từ mới:', error));
}

// Giữ tên hàm cũ để tương thích các nút/đoạn mã đang gọi.
function startWordGameRound() { requestNewWordRound(); }

function resetWordScore() {
    if (!hasBothWordPlayers(wordGameState)) {
        alert('Cần có cả Skey và Pâu trong phòng để reset tỷ số nhé!');
        return;
    }
    if (wordGameState?.phase === 'playing') {
        alert('Không thể reset tỷ số khi ván Nối từ đang diễn ra nhé!');
        return;
    }

    database.ref(WORD_GAME_PATH).transaction((currentGame) => {
        const game = normalizeWordGame(currentGame);
        if (!hasBothWordPlayers(game) || game.phase === 'playing') return;
        game.scores = { Skey: 0, Pâu: 0 };
        game.roundNumber = 1;
        prepareWordRound(game);
        return game;
    }).catch(error => console.error('Không thể reset tỷ số Nối từ:', error));
}

function saveWordHistoryMatch(game) {
    game.history = game.history && typeof game.history === 'object' ? game.history : {};
    if (game.history[game.gameId]) return;
    game.history[game.gameId] = {
        gameId: game.gameId,
        roundNumber: game.roundNumber,
        winner: game.result?.winner || '',
        loser: game.result?.loser || '',
        reason: game.result?.reason || '',
        scoreSkey: Number(game.scores.Skey) || 0,
        scorePau: Number(game.scores.Pâu) || 0,
        finishedAt: game.finishedAt || Date.now()
    };
}

function renderWordHistory() {
    const list = document.getElementById('wordHistoryList');
    if (!list) return;

    const history = Object.values(wordGameState?.history || {})
        .filter(item => item && item.finishedAt)
        .sort((a, b) => Number(b.finishedAt) - Number(a.finishedAt));
    list.innerHTML = '';

    if (history.length === 0) {
        list.innerHTML = '<div style="color:#aaa; font-style:italic; font-size:0.75rem; text-align:center;">Chưa có ván đấu nào được lưu.</div>';
        return;
    }

    history.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'history-item-row';
        const time = new Date(Number(item.finishedAt)).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        row.innerHTML = `<span>🕒 ${time} (Ván ${Number(item.roundNumber) || history.length - idx})</span><span class="winner-tag"></span><span>Tỷ số: ${Number(item.scoreSkey) || 0} - ${Number(item.scorePau) || 0}</span>`;
        row.querySelector('.winner-tag').innerText = `🏆 ${item.winner} thắng (${item.reason})`;
        list.appendChild(row);
    });
}

function toggleWordHistory() {
    const historyBox = document.getElementById('wordHistoryBox');
    if (historyBox) historyBox.classList.toggle('hidden');
}
// ==========================================
// MẬT KHẨU & CHỌN VAI TRÒ SKEY HAY PÂU
// ==========================================
const CORRECT_PASSWORD = "16032021";

function checkSavedLockState() {
    const isUnlocked = sessionStorage.getItem('skey_pau_unlocked');
    const overlay = document.getElementById('passLockOverlay');
    if (isUnlocked === 'true' && overlay) {
        overlay.classList.add('unlocked');
    }
}

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

function selectUserRole(roleName) {
    sessionStorage.setItem('active_user_role', roleName);
    sessionStorage.setItem('skey_pau_unlocked', 'true');

    // 1. Mở khóa giao diện ngay lập tức
    const overlay = document.getElementById('passLockOverlay');
    if (overlay) overlay.classList.add('unlocked');
    if (typeof createHeartEffect === 'function') createHeartEffect();

    // 2. Cập nhật trạng thái Online lên Đám mây Firebase
    if (typeof database !== 'undefined' && database !== null) {
        try {
            // Đặt trạng thái online cho bản thân
            const myStatusRef = database.ref('status/' + roleName);
            myStatusRef.set({ online: true, lastSeen: Date.now() });
            myStatusRef.onDisconnect().set({ online: false, lastSeen: Date.now() });

            // Lắng nghe trạng thái Online/Offline của CẢ HAI
            database.ref('status').on('value', (snapshot) => {
                const data = snapshot.val();
                if (!data) return;

                // Cập nhật khung Skey
                const skeyElem = document.getElementById('statusSkey');
                if (skeyElem) {
                    if (data.Skey && data.Skey.online) {
                        skeyElem.className = 'status-item online';
                        skeyElem.querySelector('.status-text').innerText = 'đang online';
                    } else {
                        skeyElem.className = 'status-item offline';
                        skeyElem.querySelector('.status-text').innerText = 'đang offline';
                    }
                }

                // Cập nhật khung Pâu
                const pauElem = document.getElementById('statusPau');
                if (pauElem) {
                    if (data.Pâu && data.Pâu.online) {
                        pauElem.className = 'status-item online';
                        pauElem.querySelector('.status-text').innerText = 'đang online';
                    } else {
                        pauElem.className = 'status-item offline';
                        pauElem.querySelector('.status-text').innerText = 'đang offline';
                    }
                }
            });
        } catch (err) {
            console.error("Lỗi kết nối Firebase Status:", err);
        }
    }

    // 3. Lắng nghe Thiệp & Thư Góc Tâm Tình Realtime
    setTimeout(() => {
        if (typeof listenForRealtimeCards === 'function') listenForRealtimeCards(roleName);
        if (typeof listenForRealtimeLetters === 'function') listenForRealtimeLetters();
    }, 600);
}

function handlePassEnter(e) {
    if (e.key === 'Enter') checkSitePassword();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkSavedLockState);
} else {
    checkSavedLockState();
}
// ==========================================
// BẢNG TÙY CHỈNH GIAO DIỆN (THEME & 5 ẢNH SLIDE)
// ==========================================
let currentTheme = localStorage.getItem('site_theme') || 'green';
const defaultPhotos = ['assets/images/photo1.jpg', 'assets/images/photo2.jpg', 'assets/images/photo3.jpg', 'assets/images/photo4.jpg', 'assets/images/photo5.jpg'];

let customPhotos = null;
try {
    customPhotos = JSON.parse(localStorage.getItem('custom_photos') || 'null');
} catch (e) { }

let activePhotos = (customPhotos && Array.isArray(customPhotos) && customPhotos.length === 5)
    ? customPhotos
    : [...defaultPhotos];

const SLIDESHOW_STATE_PATH = 'slideshow_state';
let slideshowStateListenerAttached = false;

function getValidSlideshowPhotos(photosToValidate) {
    if (!Array.isArray(photosToValidate) || photosToValidate.length !== defaultPhotos.length) return null;
    return photosToValidate.every(photo => typeof photo === 'string' && photo.trim())
        ? photosToValidate
        : null;
}

function saveSlideshowPhotosLocally() {
    customPhotos = [...activePhotos];
    localStorage.setItem('custom_photos', JSON.stringify(activePhotos));
}

function updatePhotoSlotPreviews() {
    for (let i = 0; i < defaultPhotos.length; i++) {
        const previewImg = document.getElementById("slotPreview" + (i + 1));
        if (previewImg && activePhotos[i]) previewImg.src = activePhotos[i];
    }
}

function applySharedSlideshowPhotos(sharedPhotos) {
    const validPhotos = getValidSlideshowPhotos(sharedPhotos);
    if (!validPhotos) return;

    activePhotos = [...validPhotos];
    photoIndex = photoIndex % activePhotos.length;
    saveSlideshowPhotosLocally();
    updatePhotoSlotPreviews();

    const slideshow = document.getElementById('slideshowImg');
    if (slideshow && activePhotos[photoIndex]) slideshow.src = activePhotos[photoIndex];
}

function getSlideshowState() {
    return {
        photos: [...activePhotos],
        updatedAt: Date.now(),
        updatedBy: sessionStorage.getItem('active_user_role') || 'unknown'
    };
}

function syncAllSlideshowPhotos() {
    if (typeof database === 'undefined' || !database) return Promise.resolve();
    return database.ref(SLIDESHOW_STATE_PATH).set(getSlideshowState());
}

function syncSlideshowPhoto(index) {
    if (typeof database === 'undefined' || !database) return Promise.resolve();
    return database.ref(SLIDESHOW_STATE_PATH).update({
        [`photos/${index}`]: activePhotos[index],
        updatedAt: Date.now(),
        updatedBy: sessionStorage.getItem('active_user_role') || 'unknown'
    });
}

function listenForRealtimeSlideshow() {
    if (slideshowStateListenerAttached || typeof database === 'undefined' || !database) return;
    slideshowStateListenerAttached = true;

    database.ref(SLIDESHOW_STATE_PATH).on('value', (snapshot) => {
        const sharedPhotos = getValidSlideshowPhotos(snapshot.val()?.photos);
        if (sharedPhotos) {
            applySharedSlideshowPhotos(sharedPhotos);
        } else if (!snapshot.exists()) {
            // Lần đầu sử dụng: tạo danh sách ảnh chung từ bộ ảnh đang hiển thị.
            syncAllSlideshowPhotos().catch(error => {
                console.error('Không thể khởi tạo ảnh slide dùng chung:', error);
            });
        }
    });
}

function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('hidden');
    updateSettingsUI();
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
}

function setSiteTheme(themeName) {
    currentTheme = themeName;
    document.body.className = "theme-" + themeName;
    localStorage.setItem('site_theme', themeName);

    document.querySelectorAll('.theme-color-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(".theme-" + themeName + "-btn");
    if (activeBtn) activeBtn.classList.add('active');
}

function handlePhotoUpload(index, input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            const base64Img = e.target.result;
            activePhotos[index] = base64Img;
            saveSlideshowPhotosLocally();

            // Cập nhật ảnh xem trước
            const previewImg = document.getElementById("slotPreview" + (index + 1));
            if (previewImg) previewImg.src = base64Img;

            // Nếu slide đang chiếu đúng vị trí này thì đổi ảnh ngay lập tức
            if (photoIndex === index) {
                const slideshowImg = document.getElementById('slideshowImg');
                if (slideshowImg) slideshowImg.src = base64Img;
            }

            syncSlideshowPhoto(index).then(() => {
                alert("Đã cập nhật Ảnh " + (index + 1) + " thành công! 🖼️✨");
            }).catch((error) => {
                console.error('Không thể đồng bộ ảnh slide:', error);
                alert("Ảnh đã lưu trên thiết bị này, nhưng chưa thể đồng bộ cho người kia. Bạn thử lại nhé!");
            });
        };

        reader.readAsDataURL(file);
    }
}

function resetDefaultPhotos() {
    activePhotos = [...defaultPhotos];
    saveSlideshowPhotosLocally();
    updateSettingsUI();

    const slideshowImg = document.getElementById('slideshowImg');
    if (slideshowImg && activePhotos[photoIndex]) {
        slideshowImg.src = activePhotos[photoIndex];
    }

    syncAllSlideshowPhotos().then(() => {
        alert("Đã khôi phục lại 5 ảnh kỷ niệm mặc định ban đầu! 🔄");
    }).catch((error) => {
        console.error('Không thể đồng bộ bộ ảnh mặc định:', error);
        alert("Ảnh mặc định đã được khôi phục trên thiết bị này, nhưng chưa thể đồng bộ cho người kia. Bạn thử lại nhé!");
    });
}

function updateSettingsUI() {
    setSiteTheme(currentTheme);
    updatePhotoSlotPreviews();
}

// Cập nhật hàm phát slideshow bằng danh sách ảnh activePhotos
function changePhotoAndQuote() {
    photoIndex = (photoIndex + 1) % activePhotos.length;
    quoteIndex = (quoteIndex + 1) % loveQuotes.length;

    const slideshowImg = document.getElementById('slideshowImg');
    const loveQuoteElem = document.getElementById('loveQuote');

    if (slideshowImg) slideshowImg.style.opacity = '0';
    if (loveQuoteElem) loveQuoteElem.style.opacity = '0';

    setTimeout(() => {
        if (slideshowImg && activePhotos[photoIndex]) {
            slideshowImg.src = activePhotos[photoIndex];
        }
        if (loveQuoteElem && loveQuotes[quoteIndex]) {
            loveQuoteElem.innerText = loveQuotes[quoteIndex];
        }

        if (slideshowImg) slideshowImg.style.opacity = '1';
        if (loveQuoteElem) loveQuoteElem.style.opacity = '1';
    }, 1200);
}

// Khởi chạy màu nền & xem trước ngay khi mở trang
updateSettingsUI();

// ==========================================
// LỜI MỜI CHƠI GAME REALTIME (SKEY <-> PÂU)
// ==========================================
const GAME_INVITATION_PATH = 'game_invitations';
let gameInviteListener = null;
let gameInviteListeningRole = '';
let pendingGameInvite = null;
const handledGameInviteIds = new Set();

function getGameInviteInfo(gameType) {
    const games = {
        xo: { name: 'Cờ Caro', buttonId: 'inviteXoGameBtn' },
        word: { name: 'Game Nối Từ', buttonId: 'inviteWordGameBtn' }
    };
    return games[gameType] || null;
}

function getOtherGamePlayer(role) {
    if (role === 'Skey') return 'Pâu';
    if (role === 'Pâu') return 'Skey';
    return '';
}

function updateGameInviteButton(gameType) {
    const game = getGameInviteInfo(gameType);
    if (!game) return;

    const button = document.getElementById(game.buttonId);
    if (!button) return;

    const recipient = getOtherGamePlayer(sessionStorage.getItem('active_user_role') || '');
    button.disabled = !recipient;
    button.innerText = recipient ? `💌 Mời ${recipient} chơi` : '💌 Chọn vai để mời chơi';
}

function sendGameInvitation(gameType) {
    const sender = sessionStorage.getItem('active_user_role') || '';
    const recipient = getOtherGamePlayer(sender);
    const game = getGameInviteInfo(gameType);

    if (!sender || !recipient) {
        alert('Hãy chọn vai Skey hoặc Pâu trước khi mời chơi nhé!');
        return;
    }

    if (!game || typeof database === 'undefined' || !database) {
        alert('Chưa thể gửi lời mời vì Firebase chưa kết nối. Hãy thử lại sau ít phút nhé!');
        return;
    }

    const inviteButton = document.getElementById(game.buttonId);
    if (inviteButton) {
        inviteButton.disabled = true;
        inviteButton.innerText = '⏳ Đang kiểm tra trạng thái...';
    }

    // Chỉ gửi lời mời khi người kia đang online để tránh tạo lời mời không ai nhận được.
    database.ref(`status/${recipient}`).once('value').then((snapshot) => {
        const recipientStatus = snapshot.val();
        if (!recipientStatus || recipientStatus.online !== true) {
            return { sent: false };
        }

        const inviteRef = database.ref(GAME_INVITATION_PATH).push();
        return inviteRef.set({
            gameType: gameType,
            gameName: game.name,
            sender: sender,
            recipient: recipient,
            status: 'pending',
            createdAt: Date.now()
        }).then(() => ({ sent: true }));
    }).then((result) => {
        if (!result.sent) {
            if (inviteButton) updateGameInviteButton(gameType);
            alert(`${recipient} hiện không online, bạn chưa thể gửi lời mời chơi nhé!`);
            return;
        }

        if (inviteButton) {
            inviteButton.innerText = `💌 Đã mời ${recipient}`;
            setTimeout(() => updateGameInviteButton(gameType), 2500);
        }
        alert(`Đã gửi lời mời chơi ${game.name} đến ${recipient}! 💌`);
    }).catch((error) => {
        console.error('Không thể gửi lời mời chơi game:', error);
        if (inviteButton) updateGameInviteButton(gameType);
        alert('Không thể gửi lời mời lúc này. Bạn thử lại nhé!');
    });
}

function showIncomingGameInvite(inviteId, invite) {
    pendingGameInvite = { id: inviteId, ...invite };

    const title = document.getElementById('gameInviteTitle');
    const message = document.getElementById('gameInviteMessage');
    const modal = document.getElementById('gameInviteModal');
    const gameName = invite.gameName || getGameInviteInfo(invite.gameType)?.name || 'game này';

    if (title) title.innerText = `💌 ${invite.sender} mời bạn chơi!`;
    if (message) message.innerText = `${invite.sender} đang mời bạn chơi ${gameName}. Bạn có muốn tham gia không?`;
    if (modal) modal.classList.remove('hidden');
}

function closeGameInviteModal() {
    const modal = document.getElementById('gameInviteModal');
    if (modal) modal.classList.add('hidden');
}

function showGameInviteDeclinedModal() {
    const modal = document.getElementById('gameInviteDeclinedModal');
    if (modal) modal.classList.remove('hidden');
}

function closeGameInviteDeclinedModal() {
    const modal = document.getElementById('gameInviteDeclinedModal');
    if (modal) modal.classList.add('hidden');
}

function openInvitedGame(gameType) {
    if (gameType === 'xo') {
        closeWordGameModal();
        openGameXOModal();
    } else if (gameType === 'word') {
        closeGameXOModal();
        openWordGameModal();
    }
}

function acceptGameInvitation() {
    if (!pendingGameInvite || typeof database === 'undefined' || !database) return;

    const invite = pendingGameInvite;
    const actionButtons = document.querySelectorAll('#gameInviteModal button');
    actionButtons.forEach(button => { button.disabled = true; });

    database.ref(`${GAME_INVITATION_PATH}/${invite.id}`).update({
        status: 'accepted',
        respondedAt: Date.now()
    }).then(() => {
        pendingGameInvite = null;
        closeGameInviteModal();
        openInvitedGame(invite.gameType);
    }).catch((error) => {
        console.error('Không thể đồng ý lời mời chơi game:', error);
        actionButtons.forEach(button => { button.disabled = false; });
        alert('Chưa thể phản hồi lời mời. Bạn thử lại nhé!');
    });
}

function declineGameInvitation() {
    if (!pendingGameInvite || typeof database === 'undefined' || !database) return;

    const invite = pendingGameInvite;
    const actionButtons = document.querySelectorAll('#gameInviteModal button');
    actionButtons.forEach(button => { button.disabled = true; });

    database.ref(`${GAME_INVITATION_PATH}/${invite.id}`).update({
        status: 'declined',
        respondedAt: Date.now()
    }).then(() => {
        pendingGameInvite = null;
        closeGameInviteModal();
    }).catch((error) => {
        console.error('Không thể từ chối lời mời chơi game:', error);
        actionButtons.forEach(button => { button.disabled = false; });
        alert('Chưa thể phản hồi lời mời. Bạn thử lại nhé!');
    });
}

function handleGameInvitationUpdates(invitations, activeRole) {
    Object.entries(invitations || {}).forEach(([inviteId, invite]) => {
        if (!invite || !invite.status || handledGameInviteIds.has(inviteId)) return;

        if (invite.status === 'pending' && invite.recipient === activeRole) {
            if (!pendingGameInvite || pendingGameInvite.id !== inviteId) {
                showIncomingGameInvite(inviteId, invite);
            }
            return;
        }

        if (invite.sender !== activeRole) return;

        if (invite.status === 'accepted') {
            handledGameInviteIds.add(inviteId);
            openInvitedGame(invite.gameType);
            database.ref(`${GAME_INVITATION_PATH}/${inviteId}`).remove().catch(error => {
                console.error('Không thể dọn lời mời đã đồng ý:', error);
            });
        }

        if (invite.status === 'declined') {
            handledGameInviteIds.add(inviteId);
            showGameInviteDeclinedModal();
            database.ref(`${GAME_INVITATION_PATH}/${inviteId}`).remove().catch(error => {
                console.error('Không thể dọn lời mời đã từ chối:', error);
            });
        }
    });
}

function listenForGameInvitations(activeRole) {
    if (!activeRole || typeof database === 'undefined' || !database) return;
    if (gameInviteListener && gameInviteListeningRole === activeRole) return;

    const inviteRef = database.ref(GAME_INVITATION_PATH);
    if (gameInviteListener) inviteRef.off('value', gameInviteListener);

    gameInviteListeningRole = activeRole;
    gameInviteListener = (snapshot) => {
        handleGameInvitationUpdates(snapshot.val(), gameInviteListeningRole);
    };
    inviteRef.on('value', gameInviteListener);
}

// ==========================================
// ĐỒNG BỘ TRẠNG THÁI ONLINE VÀ LẮNG NGHE FIREBASE REALTIME
// ==========================================
function initFirebaseStatus() {
    const activeRole = sessionStorage.getItem('active_user_role');
    if (!activeRole) return;

    if (typeof database !== 'undefined' && database !== null) {
        try {
            // 1. Đặt trạng thái Online cho bản thân & tự chuyển Offline khi mất mạng / đóng tab
            const myStatusRef = database.ref('status/' + activeRole);
            myStatusRef.set({ online: true, lastSeen: Date.now() });
            myStatusRef.onDisconnect().set({ online: false, lastSeen: Date.now() });

            // 2. Lắng nghe trạng thái thời gian thực của cả Skey & Pâu từ Firebase
            database.ref('status').on('value', (snapshot) => {
                const data = snapshot.val();
                if (!data) return;

                // Cập nhật giao diện Skey
                const skeyElem = document.getElementById('statusSkey');
                if (skeyElem) {
                    if (data.Skey && data.Skey.online) {
                        skeyElem.className = 'status-item online';
                        skeyElem.querySelector('.status-text').innerText = 'Skey đã online';
                    } else {
                        skeyElem.className = 'status-item offline';
                        skeyElem.querySelector('.status-text').innerText = 'Skey đã offline';
                    }
                }

                // Cập nhật giao diện Pâu
                const pauElem = document.getElementById('statusPau');
                if (pauElem) {
                    if (data.Pâu && data.Pâu.online) {
                        pauElem.className = 'status-item online';
                        pauElem.querySelector('.status-text').innerText = 'Pâu đã online';
                    } else {
                        pauElem.className = 'status-item offline';
                        pauElem.querySelector('.status-text').innerText = 'Pâu đã offline';
                    }
                }
            });

            // 3. Kích hoạt lắng nghe Bao thư hồng, Thiệp & Cún
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
// ==========================================
// BẢNG LỊCH THEO THÁNG TỰ ĐỘNG
// ==========================================
let calCurrentDate = new Date();

const holidayDict = {
    "01-01": "🎉 Tết Dương Lịch",
    "13-02": "🎂 Sinh nhật Pâu 💕",
    "14-02": "💕 Valentine - Lễ Tình Yêu",
    "08-03": "🌸 Quốc tế Phụ nữ",
    "16-03": "❤️ Kỷ Niệm Yêu Skey & Pâu",
    "30-03": "🎂 Sinh nhật Skey 👦",
    "30-04": "🇻🇳 Giải phóng Miền Nam",
    "01-05": "🛠️ Quốc tế Lao động",
    "02-09": "🇻🇳 Quốc Khánh Việt Nam",
    "20-10": "🌺 Ngày Phụ nữ Việt Nam",
    "20-11": "👨‍🏫 Ngày Nhà giáo Việt Nam",
    "24-12": "🎄 Lễ Giáng Sinh"
};

function renderMonthCalendar() {
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();

    const titleElem = document.getElementById('calMonthTitle');
    if (titleElem) titleElem.innerText = `Tháng ${month + 1}/${year}`;

    const gridElem = document.getElementById('calDaysGrid');
    if (!gridElem) return;
    gridElem.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const realToday = new Date();
    const isCurrentMonth = realToday.getFullYear() === year && realToday.getMonth() === month;

    for (let i = 0; i < offset; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-day-cell empty';
        gridElem.appendChild(emptyCell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'cal-day-cell';
        dayCell.innerText = d;

        const dayStr = String(d).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        const keyDDMM = `${dayStr}-${monthStr}`;

        if (isCurrentMonth && d === realToday.getDate()) {
            dayCell.classList.add('today');
        }

        let holidayName = holidayDict[keyDDMM] || "";
        if (holidayName) {
            dayCell.classList.add('holiday');
            dayCell.setAttribute('data-tooltip', `${dayStr}/${monthStr}: ${holidayName}`);
            dayCell.onclick = () => alert(`📅 Ngày ${dayStr}/${monthStr}/${year}: ${holidayName}`);
        }

        gridElem.appendChild(dayCell);
    }
}

function prevCalendarMonth() {
    calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
    renderMonthCalendar();
}

function nextCalendarMonth() {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
    renderMonthCalendar();
}

renderMonthCalendar();
// ==========================================
// TÍNH NĂNG THIỆP TÌNH YÊU & KHO LƯU TRỮ (ĐÃ LÀM SẠCH DỮ LIỆU & TỰ ĐỘNG CHUYỂN KHO REALTIME)
// ==========================================
let cardUploadedBase64Image = "";
let cardSelectedStickers = [];
let pendingScheduledCard = null;
let archivedCardsList = [];

// 1. Quản lý danh sách thiệp đã đọc (Chống bị hiện lại Popup khi F5)
function getReadCardIds() {
    try {
        return JSON.parse(localStorage.getItem('skey_pau_read_card_ids') || '[]');
    } catch (e) {
        return [];
    }
}

function markCardAsRead(cardId) {
    if (!cardId) return;
    const list = getReadCardIds();
    if (!list.includes(cardId)) {
        list.push(cardId);
        localStorage.setItem('skey_pau_read_card_ids', JSON.stringify(list));
    }
}

// 2. So sánh vai trò người dùng chuẩn xác (Tránh lệch phông Unicode Pâu / Skey)
function isMatchingRole(role1, role2) {
    if (!role1 || !role2) return false;
    const r1 = role1.toString().trim().toLowerCase().normalize('NFC');
    const r2 = role2.toString().trim().toLowerCase().normalize('NFC');
    if (r1 === r2) return true;
    if ((r1.includes('pau') || r1.includes('pâ')) && (r2.includes('pau') || r2.includes('pâ'))) return true;
    if (r1.includes('skey') && r2.includes('skey')) return true;
    return false;
}

// 3. Mở / Đóng Modal Tạo Thiệp
function openCardModal() {
    const modal = document.getElementById('cardModal');
    if (modal) {
        modal.classList.remove('hidden');
        initDefaultScheduleDate();
        updateCardSenderOptions();
        updateCardPreview();
        renderCardArchive();
    }
}

function closeCardModal() {
    const modal = document.getElementById('cardModal');
    if (modal) modal.classList.add('hidden');
}

// 4. Thiết lập Ngày hẹn mặc định là Ngày Hôm Nay
function initDefaultScheduleDate() {
    const dateInput = document.getElementById('cardScheduleDateInput');
    if (dateInput && !dateInput.value) {
        const now = new Date();
        dateInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
}

// 5. Tự động đổi Người Nhận ngược với Người Gửi
function updateCardSenderOptions() {
    const senderSelect = document.getElementById('cardSenderSelect');
    const recipientSelect = document.getElementById('cardRecipientSelect');
    if (senderSelect && recipientSelect) {
        recipientSelect.value = (senderSelect.value === 'Skey') ? 'Pâu' : 'Skey';
    }
    updateCardPreview();
}

// 6. Áp dụng Mẫu Thiệp Có Sẵn (Templates)
function applyCardTemplate() {
    const tmplSelect = document.getElementById('cardTemplateSelect');
    if (!tmplSelect) return;
    const tmpl = tmplSelect.value;
    const titleInput = document.getElementById('cardTitleInput');
    const contentInput = document.getElementById('cardContentInput');
    const themeSelect = document.getElementById('cardThemeSelect');

    const templates = {
        birthday: {
            theme: 'pink',
            title: '🎉 CHÚC MỪNG SINH NHẬT NGƯỜI THƯƠNG 🎂',
            content: 'Chúc Pâu/Skey tuổi mới thật nhiều niềm vui, luôn xinh đẹp/đẹp trai, tràn đầy năng lượng và mãi đồng hành cùng tớ nhé! Love you 3000! 💕',
            stickers: ['🎂', '🎁', '👑', '💖']
        },
        anniversary: {
            theme: 'gold',
            title: '💖 MỪNG KỶ NIỆM NGÀY YÊU NHAU 💕',
            content: 'Cảm ơn em/anh đã luôn bên cạnh, lắng nghe và sẻ chia cùng tớ trong suốt thời gian qua. Cùng nhau viết tiếp những chương thật đẹp nhé! ✨',
            stickers: ['💍', '💖', '🌸', '🐾']
        },
        thankyou: {
            theme: 'green',
            title: '🌸 CẢM ƠN NGƯỜI THƯƠNG VÌ TẤT CẢ 🌿',
            content: 'Cảm ơn vì những sự quan tâm nhỏ nhặt mỗi ngày, những bữa ăn ngon và cái ôm ấm áp. Có cậu bên cạnh là điều tuyệt vời nhất! 🥰',
            stickers: ['🌸', '🎁', '💖']
        },
        sorry: {
            theme: 'purple',
            title: '🥺 LỜI XIN LỖI TỪ ĐÁY LÒNG 💜',
            content: 'Tớ biết tớ chưa ngoan/làm cậu buồn. Đừng giận tớ nữa nhé, tớ hứa sẽ chú ý và thương cậu nhiều hơn mà! Thương thương 🥺💖',
            stickers: ['🧸', '🎀', '💖']
        },
        daily: {
            theme: 'pink',
            title: '☕ LỜI NHẮN YÊU THƯƠNG MỖI NGÀY ☀',
            content: 'Hôm nay cậu làm việc/học tập nhớ giữ gìn sức khỏe, uống đủ nước và luôn mỉm cười nhé! Tớ luôn ở đằng sau ủng hộ cậu nè! 🐾',
            stickers: ['🐱', '🐶', '💖']
        }
    };

    if (templates[tmpl]) {
        const t = templates[tmpl];
        if (themeSelect) themeSelect.value = t.theme;
        if (titleInput) titleInput.value = t.title;
        if (contentInput) contentInput.value = t.content;
        cardSelectedStickers = [...t.stickers];
    }
    updateCardPreview();
}

// 7. Tải ảnh cá nhân lên thiệp
function handleCardImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            cardUploadedBase64Image = e.target.result;
            const removeBtn = document.getElementById('removeCardImgBtn');
            if (removeBtn) removeBtn.classList.remove('hidden');
            updateCardPreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function removeCardImage() {
    cardUploadedBase64Image = "";
    const imgInput = document.getElementById('cardImageInput');
    const removeBtn = document.getElementById('removeCardImgBtn');
    if (imgInput) imgInput.value = "";
    if (removeBtn) removeBtn.classList.add('hidden');
    updateCardPreview();
}

// 8. Chọn / Bỏ chọn Sticker trang trí
function toggleCardSticker(sticker) {
    const idx = cardSelectedStickers.indexOf(sticker);
    if (idx > -1) {
        cardSelectedStickers.splice(idx, 1);
    } else {
        if (cardSelectedStickers.length >= 5) {
            alert("Tối đa chọn 5 sticker trang trí thôi nhé!");
            return;
        }
        cardSelectedStickers.push(sticker);
    }
    updateCardPreview();
}

// 9. Cập nhật Xem Trước Thiệp (Live Preview)
function updateCardPreview() {
    const senderElem = document.getElementById('cardSenderSelect');
    const recipientElem = document.getElementById('cardRecipientSelect');
    const themeElem = document.getElementById('cardThemeSelect');
    const dateElem = document.getElementById('cardScheduleDateInput');
    const titleElem = document.getElementById('cardTitleInput');
    const contentElem = document.getElementById('cardContentInput');

    const sender = senderElem ? senderElem.value : 'Skey';
    const recipient = recipientElem ? recipientElem.value : 'Pâu';
    const theme = themeElem ? themeElem.value : 'pink';
    const dateVal = dateElem ? dateElem.value : '';
    const title = (titleElem && titleElem.value.trim()) ? titleElem.value.trim() : `Gửi ${recipient} Yêu Dấu 💕`;
    const content = (contentElem && contentElem.value.trim()) ? contentElem.value.trim() : 'Chúc đối phương luôn vui vẻ, hạnh phúc mỗi ngày!';

    const previewPaper = document.getElementById('cardLivePreview');
    if (previewPaper) previewPaper.className = `card-paper theme-${theme}`;

    const pTitle = document.getElementById('previewCardTitle');
    const pBody = document.getElementById('previewCardBody');
    const pSender = document.getElementById('previewCardSender');
    const pDate = document.getElementById('previewCardScheduleDate');

    if (pTitle) pTitle.innerText = title;
    if (pBody) pBody.innerText = content;
    if (pSender) pSender.innerText = `~ Từ ${sender} gửi ${recipient} ~`;
    if (pDate) pDate.innerText = `⏰ Hẹn ngày: ${dateVal || 'Hôm nay'}`;

    const imgBox = document.getElementById('previewCardImgBox');
    const imgElem = document.getElementById('previewCardImg');
    if (imgBox && imgElem) {
        if (cardUploadedBase64Image) {
            imgElem.src = cardUploadedBase64Image;
            imgBox.classList.remove('hidden');
        } else {
            imgBox.classList.add('hidden');
        }
    }

    const stickerContainer = document.getElementById('previewCardStickers');
    if (stickerContainer) {
        stickerContainer.innerHTML = cardSelectedStickers.map(s => `<span>${s}</span>`).join('');
    }
}

// 10. Chuyển đổi Tab Tạo Thiệp & Kho Lưu Trữ
function switchCardTab(tabName) {
    const createView = document.getElementById('cardCreateView');
    const archiveView = document.getElementById('cardArchiveView');
    const tabBtnCreate = document.getElementById('tabBtnCreateCard');
    const tabBtnArchive = document.getElementById('tabBtnArchiveCard');

    if (tabName === 'create') {
        if (createView) createView.classList.remove('hidden');
        if (archiveView) archiveView.classList.add('hidden');
        if (tabBtnCreate) tabBtnCreate.classList.add('active');
        if (tabBtnArchive) tabBtnArchive.classList.remove('active');
    } else {
        if (createView) createView.classList.add('hidden');
        if (archiveView) archiveView.classList.remove('hidden');
        if (tabBtnCreate) tabBtnCreate.classList.remove('active');
        if (tabBtnArchive) tabBtnArchive.classList.add('active');
        renderCardArchive();
    }
}

// 11. Gửi Thiệp Bí Mật Lên Firebase (Đã chuẩn hóa dữ liệu an toàn)
function saveScheduledCard() {
    const sender = document.getElementById('cardSenderSelect').value || 'Skey';
    const recipient = document.getElementById('cardRecipientSelect').value || 'Pâu';
    const theme = document.getElementById('cardThemeSelect').value || 'pink';
    const targetDate = document.getElementById('cardScheduleDateInput').value;
    const title = document.getElementById('cardTitleInput').value.trim();
    const content = document.getElementById('cardContentInput').value.trim();

    if (!title || !content) {
        alert('Vui lòng nhập đầy đủ tiêu đề và nội dung thiệp nhé!');
        return;
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateObj = new Date(targetDate || todayStr);
    const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

    const uniqueCardId = 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    const newScheduledCard = {
        cardId: uniqueCardId,
        sender: sender,
        recipient: recipient,
        theme: theme,
        targetDate: targetDate || todayStr,
        title: title,
        content: content,
        image: cardUploadedBase64Image || "",
        stickers: (cardSelectedStickers && cardSelectedStickers.length > 0) ? [...cardSelectedStickers] : ["💌"],
        isRead: false,
        createdDate: formattedDate
    };

    if (typeof database !== 'undefined' && database !== null) {
        database.ref('pending_cards/' + uniqueCardId).set(newScheduledCard);
    } else {
        let pendingCards = JSON.parse(localStorage.getItem('skey_pau_pending_cards') || '[]');
        pendingCards.push(newScheduledCard);
        localStorage.setItem('skey_pau_pending_cards', JSON.stringify(pendingCards));
    }

    document.getElementById('cardTitleInput').value = '';
    document.getElementById('cardContentInput').value = '';
    removeCardImage();
    cardSelectedStickers = [];
    const tmplSelect = document.getElementById('cardTemplateSelect');
    if (tmplSelect) tmplSelect.value = 'custom';

    alert(`🎉 Đã gửi thiệp bí mật thành công!\nThiệp sẽ xuất hiện khi ${recipient} đăng nhập web! 💌`);
    closeCardModal();
}

// 12. Lắng nghe Thiệp Chờ Realtime (Lọc đúng người nhận)
function listenForRealtimeCards(activeRole) {
    if (typeof database === 'undefined' || !database) return;

    database.ref('pending_cards').on('value', (snapshot) => {
        const currentRole = activeRole || sessionStorage.getItem('active_user_role') || '';
        if (!currentRole) return;

        const data = snapshot.val();
        if (!data) return;

        const now = new Date();
        const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const readIds = getReadCardIds();

        let matchedCard = null;
        let matchedKey = null;

        const keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const card = data[key];
            const cId = card.cardId || card.id || key;

            const isForMe = isMatchingRole(card.recipient, currentRole);
            const isFromMe = isMatchingRole(card.sender, currentRole);

            if (!card.isRead &&
                isForMe &&
                !isFromMe &&
                (!card.targetDate || card.targetDate <= localTodayStr) &&
                !readIds.includes(cId) &&
                !readIds.includes(key)) {
                matchedCard = card;
                matchedKey = key;
                break;
            }
        }

        if (matchedCard && matchedKey) {
            pendingScheduledCard = { ...matchedCard, firebaseKey: matchedKey };

            const msgElem = document.getElementById('surpriseMessageText');
            if (msgElem) {
                msgElem.innerText = `Bạn vừa nhận được 1 tấm thiệp bí mật từ ${matchedCard.sender}! Bạn có muốn xem ngay không? 💕`;
            }

            const modal = document.getElementById('cardSurpriseModal');
            if (modal) modal.classList.remove('hidden');
        }
    });

    listenForRealtimeArchivedCards();
}

// 13. Lắng nghe Kho Thiệp Lưu Trữ Chung Realtime (Đồng bộ kho cả 2 máy)
function listenForRealtimeArchivedCards() {
    if (typeof database === 'undefined' || !database) return;

    database.ref('archived_cards').on('value', (snapshot) => {
        const data = snapshot.val();
        archivedCardsList = [];
        if (data) {
            Object.keys(data).forEach(key => {
                archivedCardsList.unshift({ ...data[key], firebaseKey: key });
            });
        }
        localStorage.setItem('skey_pau_cards', JSON.stringify(archivedCardsList));
        renderCardArchive();
    });
}

listenForRealtimeArchivedCards();

// 14. Mở Xem Thiệp ➔ Lưu Vào Kho Archived Chung (Làm sạch 100% dữ liệu tránh lỗi undefined)
function openScheduledCardViewer() {
    if (!pendingScheduledCard) return;

    const cardToProcess = { ...pendingScheduledCard };
    const keyToRemove = cardToProcess.firebaseKey;
    const cId = cardToProcess.cardId || cardToProcess.id || keyToRemove;

    // Đánh dấu đã đọc trên thiết bị
    markCardAsRead(cId);
    if (keyToRemove) markCardAsRead(keyToRemove);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Chuẩn hóa dữ liệu tuyệt đối: Thay thế toàn bộ trường undefined bằng chuỗi rỗng ""
    const cardToArchive = {
        cardId: cardToProcess.cardId || cId || ('card_' + Date.now()),
        sender: cardToProcess.sender || 'Người thương',
        recipient: cardToProcess.recipient || '',
        theme: cardToProcess.theme || 'pink',
        targetDate: cardToProcess.targetDate || todayStr,
        title: cardToProcess.title || 'Thiệp Yêu Thương',
        content: cardToProcess.content || '',
        image: cardToProcess.image || '',
        stickers: (Array.isArray(cardToProcess.stickers) && cardToProcess.stickers.length > 0)
            ? cardToProcess.stickers
            : (typeof cardToProcess.stickers === 'string' && cardToProcess.stickers ? [cardToProcess.stickers] : ['💌']),
        isRead: true,
        createdDate: cardToProcess.createdDate || cardToProcess.targetDate || todayStr,
        archivedAt: Date.now()
    };

    // Đẩy thiệp lên kho archived_cards
    if (typeof database !== 'undefined' && database !== null) {
        try {
            database.ref('archived_cards').push(cardToArchive).then(() => {
                if (keyToRemove) {
                    database.ref('pending_cards/' + keyToRemove).remove();
                }
            }).catch((err) => {
                console.error("Lỗi Firebase khi lưu thiệp vào kho:", err);
                saveArchiveFallback(cardToArchive);
            });
        } catch (e) {
            console.error("Lỗi ngoại lệ khi push Firebase:", e);
            saveArchiveFallback(cardToArchive);
        }
    } else {
        saveArchiveFallback(cardToArchive);
    }

    const surpriseModal = document.getElementById('cardSurpriseModal');
    if (surpriseModal) surpriseModal.classList.add('hidden');

    displayCardContentInViewer(cardToProcess, false);

    if (typeof triggerFireworks === 'function') triggerFireworks();
    if (typeof createHeartEffect === 'function') createHeartEffect();

    const viewerModal = document.getElementById('cardViewerModal');
    if (viewerModal) viewerModal.classList.remove('hidden');

    pendingScheduledCard = null;
}

// Lưu dự phòng vào bộ nhớ máy nếu Firebase mất kết nối
function saveArchiveFallback(cardObj) {
    let archiveCards = JSON.parse(localStorage.getItem('skey_pau_cards') || '[]');
    archiveCards.unshift(cardObj);
    localStorage.setItem('skey_pau_cards', JSON.stringify(archiveCards));
    archivedCardsList = archiveCards;
    renderCardArchive();
}

function closeSurpriseModal() {
    if (pendingScheduledCard) {
        const cId = pendingScheduledCard.cardId || pendingScheduledCard.firebaseKey;
        if (cId) markCardAsRead(cId);
    }
    const modal = document.getElementById('cardSurpriseModal');
    if (modal) modal.classList.add('hidden');
}

// 15. Hiển thị Nội Dung Thiệp Vào Cửa Sổ Đọc (Viewer Modal)
function displayCardContentInViewer(card, isFromArchive = false) {
    const paper = document.getElementById('viewerCardPaper');
    if (paper) paper.className = `card-paper theme-${card.theme || 'pink'}`;

    const titleElem = document.getElementById('viewerCardTitle');
    if (titleElem) titleElem.innerText = card.title || 'Thiệp Kỷ Niệm';

    const bodyElem = document.getElementById('viewerCardBody');
    if (bodyElem) bodyElem.innerText = card.content || '';

    const senderElem = document.getElementById('viewerCardSender');
    if (senderElem) senderElem.innerText = `~ Từ ${card.sender || 'Người thương'} gửi ${card.recipient || ''} ~`;

    const dateElem = document.getElementById('viewerCardDate');
    if (dateElem) dateElem.innerText = `🕒 Ngày: ${card.createdDate || card.targetDate || ''}`;

    const imgBox = document.getElementById('viewerCardImgBox');
    const imgElem = document.getElementById('viewerCardImg');
    if (imgBox && imgElem) {
        if (card.image) {
            imgElem.src = card.image;
            imgBox.classList.remove('hidden');
        } else {
            imgBox.classList.add('hidden');
        }
    }

    const stickerBox = document.getElementById('viewerCardStickers');
    if (stickerBox) {
        const stickerList = Array.isArray(card.stickers) ? card.stickers : (card.stickers ? [card.stickers] : ['💌']);
        stickerBox.innerHTML = stickerList.map(s => `<span>${s}</span>`).join('');
    }

    const finishBtn = document.querySelector('.finish-card-btn');
    if (finishBtn) {
        if (isFromArchive) {
            finishBtn.innerText = "Đóng ✕";
            finishBtn.onclick = () => {
                const modal = document.getElementById('cardViewerModal');
                if (modal) modal.classList.add('hidden');
            };
        } else {
            finishBtn.innerText = "Đã đọc xong & Lưu vào Kho Thiệp 💌";
            finishBtn.onclick = finishReadingScheduledCard;
        }
    }
}

// 16. Hoàn tất đọc thiệp
function finishReadingScheduledCard() {
    const modal = document.getElementById('cardViewerModal');
    if (modal) modal.classList.add('hidden');
}

// 17. Hiển thị Kho Thiệp Khung Nhỏ: Icon - Ngày - Người Gửi
function renderCardArchive() {
    const archiveGrid = document.getElementById('cardArchiveGrid');
    const countElem = document.getElementById('cardArchiveCount');

    let cards = (archivedCardsList && Array.isArray(archivedCardsList) && archivedCardsList.length > 0)
        ? archivedCardsList
        : JSON.parse(localStorage.getItem('skey_pau_cards') || '[]');

    if (countElem) countElem.innerText = cards.length;
    if (!archiveGrid) return;
    archiveGrid.innerHTML = '';

    if (cards.length === 0) {
        archiveGrid.innerHTML = `
      <div style="grid-column: 1/-1; color: #888; font-style: italic; padding: 20px; text-align: center; font-size: 0.9rem;">
        Chưa có tấm thiệp nào trong kho. 💌
      </div>
    `;
        return;
    }

    cards.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card-small-frame theme-${card.theme || 'pink'}`;

        let icon = '💌';
        if (Array.isArray(card.stickers) && card.stickers.length > 0) {
            icon = card.stickers[0];
        } else if (typeof card.stickers === 'string' && card.stickers.trim()) {
            icon = card.stickers;
        }

        const displayDate = card.createdDate || card.targetDate || 'Kỷ niệm';
        const sender = card.sender || 'Người thương';

        cardDiv.innerHTML = `
      <div class="card-small-content">
        <span class="card-small-icon">${icon}</span>
        <span class="card-small-text">${displayDate} - ${sender}</span>
      </div>
      <button class="delete-card-btn" onclick="deleteArchivedCard(event, ${index})" title="Xóa thiệp">✕</button>
    `;

        cardDiv.onclick = () => viewArchivedCardDetail(index);
        archiveGrid.appendChild(cardDiv);
    });
}

// 18. Xóa thiệp khỏi Kho Firebase
function deleteArchivedCard(event, index) {
    event.stopPropagation();

    if (!confirm("Bạn có chắc chắn muốn xóa tấm thiệp này khỏi Kho Lưu Trữ không?")) {
        return;
    }

    let cards = (archivedCardsList && archivedCardsList.length > 0)
        ? archivedCardsList
        : JSON.parse(localStorage.getItem('skey_pau_cards') || '[]');

    const card = cards[index];
    if (!card) return;

    const keyToDelete = card.firebaseKey;

    if (keyToDelete && typeof database !== 'undefined' && database !== null) {
        database.ref('archived_cards/' + keyToDelete).remove().then(() => {
            alert("Đã xóa tấm thiệp khỏi kho thành công! ✨");
        }).catch((e) => {
            console.error("Lỗi xóa thiệp trên Firebase:", e);
        });
    } else if (typeof database !== 'undefined' && database !== null) {
        database.ref('archived_cards').once('value', (snapshot) => {
            const data = snapshot.val();
            let hasDeleted = false;
            if (data) {
                Object.keys(data).forEach((key) => {
                    const item = data[key];
                    if ((card.cardId && item.cardId === card.cardId) ||
                        (card.id && item.id === card.id) ||
                        (item.title === card.title && item.sender === card.sender && item.createdDate === card.createdDate)) {
                        database.ref('archived_cards/' + key).remove();
                        hasDeleted = true;
                    }
                });
            }
            if (!hasDeleted) {
                cards.splice(index, 1);
                localStorage.setItem('skey_pau_cards', JSON.stringify(cards));
                archivedCardsList = cards;
                renderCardArchive();
            }
            alert("Đã xóa thiệp thành công! ✨");
        });
    } else {
        cards.splice(index, 1);
        localStorage.setItem('skey_pau_cards', JSON.stringify(cards));
        archivedCardsList = cards;
        renderCardArchive();
        alert("Đã xóa thiệp thành công!");
    }
}

// 19. Xem chi tiết thiệp từ Kho Lưu Trữ
function viewArchivedCardDetail(index) {
    let cards = (archivedCardsList && archivedCardsList.length > 0)
        ? archivedCardsList
        : JSON.parse(localStorage.getItem('skey_pau_cards') || '[]');

    const card = cards[index];
    if (!card) return;

    displayCardContentInViewer(card, true);

    const viewerModal = document.getElementById('cardViewerModal');
    if (viewerModal) viewerModal.classList.remove('hidden');
}
