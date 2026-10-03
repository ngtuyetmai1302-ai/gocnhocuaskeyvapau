(() => {
  const $ = id => document.getElementById(id);
  let player, ready = false, room = null, ref = null;
  let connected = false, offset = 0, loadedId = '', opened = false;
  let blocked = false, playerError = false, writing = false, dragging = false;
  let initialized = false, apiLoading = false, apiTimer;
  const status = message => { $('watchStatus').textContent = message; };
  const envelope = document.querySelector('.envelope-section');
  const envelopeHome = document.createComment('Góc tâm tình');
  if (envelope) envelope.before(envelopeHome);

  function parseVideo(value) {
    const input = value.trim();
    if (/^[\w-]{11}$/.test(input)) return input;
    try {
      const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      const host = url.hostname.toLowerCase();
      let id;
      if (host === 'youtu.be') id = url.pathname.split('/')[1];
      else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
        id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:shorts|embed|live)\/([^/]+)/.exec(url.pathname)?.[1];
      }
      return /^[\w-]{11}$/.test(id || '') ? id : null;
    } catch (_) { return null; }
  }
  function targetPosition() {
    if (!room) return 0;
    const elapsed = room.playing ? Math.max(0, (Date.now() + offset - room.updatedAt) / 1000) : 0;
    const position = room.position + elapsed;
    const duration = loadedId === room.videoId && ready ? player.getDuration() : 0;
    return duration > 0 ? Math.min(position, duration) : position;
  }
  function controls() {
    $('watchLoad').disabled = !connected || writing;
    ['watchPlay', 'watchPause', 'watchJoin', 'watchSeek'].forEach(id => {
      $(id).disabled = !connected || !ready || !room || writing;
    });
  }
  function quietMusic() {
    const music = $('bgMusic');
    if (music) music.pause();
    if (typeof isPlaying !== 'undefined') isPlaying = false;
    if ($('musicToggleBtn')) $('musicToggleBtn').textContent = '▶️';
  }
  function apply(force = false) {
    controls();
    if (!ready || !room || !opened || !connected) return;
    const position = targetPosition();
    if (loadedId !== room.videoId) {
      loadedId = room.videoId;
      blocked = false;
      playerError = false;
      const options = { videoId: room.videoId, startSeconds: position };
      if (room.playing) { quietMusic(); player.loadVideoById(options); }
      else player.cueVideoById(options);
      return;
    }
    if (playerError) return;
    const duration = player.getDuration();
    const state = player.getPlayerState();
    // Do not restart a video that has reached its end.
    if (duration > 0 && position >= duration && state === YT.PlayerState.ENDED) return;
    const seeking = force || Math.abs(player.getCurrentTime() - position) > 2;
    if (seeking) player.seekTo(position, true);
    if (room.playing && !blocked && state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
      quietMusic(); player.playVideo();
    } else if (!room.playing && (seeking || (state !== YT.PlayerState.PAUSED && state !== YT.PlayerState.CUED))) player.pauseVideo();
  }
  function initializeRoom() {
    if (initialized) return;
    initialized = true;
    if (typeof database === 'undefined' || !database) return status('Chưa kết nối được Firebase. Hãy tải lại trang.');
    ref = database.ref('youtube_room');
    database.ref('.info/serverTimeOffset').on('value', snapshot => { offset = Number(snapshot.val()) || 0; });
    database.ref('.info/connected').on('value', snapshot => {
      connected = snapshot.val() === true;
      controls();
      status(connected ? (room ? 'Đã kết nối phòng xem ♡' : 'Dán link để chọn video đầu tiên nhé!') : 'Mất kết nối. Đang chờ kết nối lại…');
      if (connected) apply(true);
    });
    ref.on('value', snapshot => {
      const value = snapshot.val();
      if (!value) { room = null; if (ready) { player.stopVideo(); loadedId = ''; } controls(); return; }
      if (!/^[\w-]{11}$/.test(value.videoId) || typeof value.playing !== 'boolean' || !Number.isFinite(value.position) || value.position < 0 || !Number.isFinite(value.updatedAt)) return;
      room = value;
      if (document.activeElement !== $('watchUrl')) $('watchUrl').value = `https://www.youtube.com/watch?v=${value.videoId}`;
      status(value.playing ? 'Cả hai đang xem cùng nhau ♡' : 'Video đang tạm dừng cho cả hai');
      apply(true);
    }, error => { connected = false; controls(); console.error(error); status('Không thể truy cập phòng xem. Hãy kiểm tra Firebase rules và tải lại trang.'); });
  }
  function createPlayer() {
    if (player || !opened) return;
    clearTimeout(apiTimer);
    player = new YT.Player('watchPlayer', {
      width: '100%', height: '100%',
      playerVars: { playsinline: 1, controls: 0, disablekb: 1, origin: location.origin },
      events: {
        onReady: () => { ready = true; if ($('watchMute').checked) player.mute(); controls(); apply(true); },
        onStateChange: event => { if (event.data === YT.PlayerState.PLAYING) { blocked = false; quietMusic(); } },
        onAutoplayBlocked: () => { blocked = true; status('Bấm “Bắt kịp phòng xem” để cho phép phát trên máy này.'); },
        onError: event => {
          playerError = true;
          status([101, 150].includes(event.data) ? 'Video này không cho phép xem nhúng. Hãy chọn video khác nhé.' : 'Không thể phát video này. Hãy kiểm tra link hoặc chọn video khác.');
        }
      }
    });
  }
  function loadApi() {
    if (window.YT?.Player) return createPlayer();
    if (apiLoading) return;
    apiLoading = true;
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (previous) previous(); createPlayer(); };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { apiLoading = false; script.remove(); clearTimeout(apiTimer); status('Không tải được YouTube. Đóng và mở lại phòng để thử lại.'); };
    document.head.appendChild(script);
    apiTimer = setTimeout(() => { if (!ready) status('YouTube tải chậm hoặc bị chặn. Hãy kiểm tra mạng và tải lại trang.'); }, 15000);
  }
  async function publish(videoId, playing, position) {
    if (!ref || !connected || writing) return status('Chưa kết nối phòng xem. Hãy thử lại sau.');
    writing = true;
    controls();
    try {
      await ref.set({ videoId, playing, position: Math.max(0, position), updatedAt: firebase.database.ServerValue.TIMESTAMP });
    } catch (error) { console.error(error); status('Không lưu được thao tác. Hãy kiểm tra kết nối và thử lại.'); }
    finally { writing = false; controls(); }
  }
  function close() {
    opened = false;
    if (envelope) envelopeHome.after(envelope);
    $('watchModal').classList.add('hidden');
    if (ready) player.pauseVideo();
    $('watchOpen').focus();
  }
  $('watchOpen').addEventListener('click', () => {
    opened = true;
    $('watchModal').classList.remove('hidden');
    if (envelope) $('watchModal').appendChild(envelope);
    quietMusic();
    initializeRoom(); loadApi(); apply(true);
    $('watchUrl').focus();
  });
  $('watchClose').addEventListener('click', close);
  $('watchModal').addEventListener('click', event => { if (event.target === $('watchModal')) close(); });
  document.addEventListener('keydown', event => {
    if (!opened) return;
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') {
      const items = Array.from($('watchModal').querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), iframe, [tabindex="0"]')).filter(item => item.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  $('watchForm').addEventListener('submit', event => {
    event.preventDefault();
    const id = parseVideo($('watchUrl').value);
    if (!id) return status('Link chưa hợp lệ. Hãy dán link video YouTube, youtu.be hoặc Shorts.');
    publish(id, false, 0);
  });
  $('watchPlay').addEventListener('click', () => {
    if (!ready || !room) return;
    blocked = false; quietMusic(); player.playVideo();
    const duration = player.getDuration();
    const position = targetPosition();
    publish(room.videoId, true, duration > 0 && position >= duration ? 0 : position);
  });
  $('watchPause').addEventListener('click', () => { if (room) publish(room.videoId, false, targetPosition()); });
  $('watchJoin').addEventListener('click', () => { blocked = false; playerError = false; if (room?.playing) { quietMusic(); player.playVideo(); } apply(true); });
  $('watchMute').addEventListener('change', () => { if (ready) $('watchMute').checked ? player.mute() : player.unMute(); });
  $('watchSeek').addEventListener('input', () => { dragging = true; });
  $('watchSeek').addEventListener('change', () => { dragging = false; if (room) publish(room.videoId, room.playing, Number($('watchSeek').value)); });
  function clock(seconds) { const value = Math.floor(Math.max(0, seconds || 0)); return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`; }
  setInterval(() => {
    if (!opened || !ready || !room) return;
    apply();
    const duration = player.getDuration();
    const position = player.getCurrentTime();
    $('watchSeek').max = Math.floor(duration || 0);
    if (!dragging) $('watchSeek').value = Math.floor(position || 0);
    $('watchTime').textContent = `${clock(position)} / ${clock(duration)}`;
  }, 2000);
})();
