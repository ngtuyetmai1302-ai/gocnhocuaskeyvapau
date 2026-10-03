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
