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
