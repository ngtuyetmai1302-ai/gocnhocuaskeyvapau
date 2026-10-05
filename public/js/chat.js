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
