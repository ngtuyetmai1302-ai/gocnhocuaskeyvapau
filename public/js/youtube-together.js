// Shared YouTube room. Only explicit shared controls write to Firebase;
// player callbacks and drift correction never echo remote changes back.
(() => {
    const $ = id => document.getElementById(id);
    let player, ready = false, opened = false, connected = false;
    let state = null, loadedId = '', offset = 0, timer, roomRef;
    const clientId = 'watch_' + Math.random().toString(36).slice(2);
    const message = text => { $('youtubeStatus').textContent = text; };
    const now = () => Date.now() + offset;
    function parseVideo(value) {
        value = value.trim();
        if (/^[\w-]{11}$/.test(value)) return value;
        try {
            const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
            if (!['http:', 'https:'].includes(url.protocol)) return null;
            const host = url.hostname.toLowerCase();
            let id;
            if (host === 'youtu.be') id = url.pathname.split('/')[1];
            else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
                id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:embed|shorts|live)\/([^/]+)/.exec(url.pathname)?.[1];
            }
            return /^[\w-]{11}$/.test(id || '') ? id : null;
        } catch (_) { return null; }
    }
    function position() {
        if (!state) return 0;
        let time = state.position + (state.playing ? Math.max(0, now() - state.updatedAt) / 1000 : 0);
        const duration = ready && loadedId === state.videoId ? player.getDuration() : 0;
        return duration > 0 ? Math.min(duration, time) : time;
    }
    function controls() {
        document.querySelectorAll('[data-youtube-control]').forEach(button => {
            button.disabled = !ready || !state || !connected;
        });
        $('youtubeLoad').disabled = !connected;
    }
    function apply(force = false) {
        if (!opened || !ready || !state) return;
        const target = position();
        if (loadedId !== state.videoId) {
            loadedId = state.videoId;
            const video = { videoId: state.videoId, startSeconds: target };
            if (state.playing) player.loadVideoById(video);
            else player.cueVideoById(video);
        } else {
            if (force || Math.abs(player.getCurrentTime() - target) > 2) player.seekTo(target, true);
            if (state.playing && player.getPlayerState() !== 1 && player.getPlayerState() !== 3) player.playVideo();
            if (!state.playing && player.getPlayerState() !== 5) player.pauseVideo();
        }
        $('youtubeTime').textContent = format(target) + ' / ' + format(player.getDuration());
        if (document.activeElement !== $('youtubeSeek')) $('youtubeSeek').value = player.getDuration() ? target / player.getDuration() * 100 : 0;
    }
    function format(seconds) {
        seconds = Math.floor(seconds || 0);
        return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    }
    function write(videoId, playing, time) {
        if (!connected || !roomRef) { message('Mất kết nối. Hãy thử lại khi có mạng.'); return; }
        const previous = state;
        const next = { videoId, playing, position: Math.max(0, time), updatedAt: now(), updatedBy: sessionStorage.getItem('active_user_role'), clientId };
        state = next;
        apply(true);
        roomRef.set({ ...next, updatedAt: firebase.database.ServerValue.TIMESTAMP }).catch(error => {
            // Do not undo a newer command that has already arrived.
            if (state === next) { state = previous; apply(true); }
            message('Không thể đồng bộ. Kiểm tra kết nối và quyền Firebase.');
            console.error('YouTube sync:', error);
        });
    }
    function createPlayer() {
        if (player || !opened) return;
        player = new YT.Player('youtubePlayer', {
            width: '100%', height: '100%',
            playerVars: { playsinline: 1, controls: 0, disablekb: 1, origin: location.origin, rel: 0 },
            events: {
                onReady: () => { ready = true; controls(); apply(true); },
                onAutoplayBlocked: () => {
                    clearInterval(timer); timer = null;
                    message('Nhấn “Tham gia / Đồng bộ lại” để bật video trên thiết bị này.');
                },
                onError: event => {
                    clearInterval(timer); timer = null;
                    message('Không phát được video (' + event.data + '). Video có thể riêng tư hoặc không cho phép nhúng. Hãy chọn video khác.');
                },
                onStateChange: event => {
                    if (event.data === 1) {
                        const music = $('bgMusic');
                        if (music && !music.paused && typeof toggleMusic === 'function') toggleMusic();
                    }
                }
            }
        });
    }
    function startTimer() {
        clearInterval(timer);
        timer = setInterval(() => { if (connected) apply(); }, 4000);
    }
    window.openYoutubeModal = () => {
        if (!sessionStorage.getItem('active_user_role')) return;
        $('youtubeModal').classList.remove('hidden');
        opened = true;
        $('youtubeClose').focus();
        if (!database) { message('Cần kết nối Firebase để xem cùng nhau.'); return; }
        if (!roomRef) {
            roomRef = database.ref('youtube_state');
            database.ref('.info/serverTimeOffset').on('value', snapshot => { offset = snapshot.val() || 0; });
            database.ref('.info/connected').on('value', snapshot => {
                connected = snapshot.val() === true;
                controls();
                message(connected ? 'Đã kết nối. Cả hai có thể chọn video và điều khiển bên dưới.' : 'Đang kết nối lại…');
                if (connected) apply(true);
            });
        }
        roomRef.off('value', receive);
        roomRef.on('value', receive, error => { connected = false; controls(); message('Không có quyền đọc phòng YouTube. Cần triển khai Firebase rules mới.'); console.error(error); });
        if (window.YT && YT.Player) createPlayer();
        else if (!$('youtubeApi')) {
            window.onYouTubeIframeAPIReady = createPlayer;
            const script = document.createElement('script');
            script.id = 'youtubeApi'; script.src = 'https://www.youtube.com/iframe_api';
            script.onerror = () => { script.remove(); message('Không tải được YouTube. Đóng và mở lại để thử.'); };
            document.head.appendChild(script);
        }
        startTimer(); controls();
    };
    function receive(snapshot) {
        const value = snapshot.val();
        if (value && /^[\w-]{11}$/.test(value.videoId) && typeof value.playing === 'boolean' && Number.isFinite(value.position) && value.position >= 0 && Number.isFinite(value.updatedAt)) {
            state = value; startTimer(); controls(); apply(true);
        } else { state = null; if (ready) player.pauseVideo(); controls(); }
    }
    window.closeYoutubeModal = () => {
        opened = false; clearInterval(timer);
        if (roomRef) roomRef.off('value', receive);
        if (ready) player.pauseVideo();
        $('youtubeModal').classList.add('hidden');
        $('youtubeOpen').focus();
    };
    $('youtubeForm').addEventListener('submit', event => {
        event.preventDefault();
        const id = parseVideo($('youtubeUrl').value);
        if (!id) { message('Nhập liên kết YouTube hợp lệ (watch, youtu.be, Shorts) hoặc ID video.'); return; }
        loadedId = ''; startTimer(); write(id, false, 0);
    });
    $('youtubePlay').onclick = () => { if (state) { startTimer(); write(state.videoId, true, position()); } };
    $('youtubePause').onclick = () => { if (state) write(state.videoId, false, position()); };
    $('youtubeJoin').onclick = () => { startTimer(); apply(true); message('Đã đồng bộ với phòng xem chung.'); };
    $('youtubeSeek').addEventListener('change', () => {
        if (ready && state && player.getDuration() > 0) write(state.videoId, state.playing, Number($('youtubeSeek').value) / 100 * player.getDuration());
    });
    $('youtubeModal').addEventListener('click', event => { if (event.target === $('youtubeModal')) closeYoutubeModal(); });
    document.addEventListener('keydown', event => { if (opened && event.key === 'Escape') closeYoutubeModal(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && opened && connected) apply(true); });
    controls();
})();