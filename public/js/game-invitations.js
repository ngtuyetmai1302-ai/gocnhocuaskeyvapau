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
        if (!window.isRoleOnline(recipientStatus)) {
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
