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
