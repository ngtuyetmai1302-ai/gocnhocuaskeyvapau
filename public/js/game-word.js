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
