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
