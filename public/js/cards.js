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
