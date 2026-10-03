// ==========================================
// 7. NHẬT KÝ KỶ NIỆM (RỘNG TO 1000PX)
// ==========================================
let currentDiaryKey = '';

function openDiary(key, title) {
    currentDiaryKey = key;
    document.getElementById('diaryTitle').innerText = "📖 CẢM XÚC & KỶ NIỆM CỦA SKEY VÀ PÂU";
    document.getElementById('diaryDate').innerText = "📌 Cột mốc: " + title + " (" + key + ")";
    document.getElementById('diaryModal').classList.remove('hidden');
    renderDiaryList();
}

function closeDiary() {
    document.getElementById('diaryModal').classList.add('hidden');
    document.getElementById('diaryText').value = '';
}

function saveDiaryEntry() {
    const textInput = document.getElementById('diaryText');
    const content = textInput.value.trim();
    const authorSelect = document.getElementById('diaryAuthorSelect');
    const author = authorSelect ? authorSelect.value : 'Skey & Pâu';

    if (!content) {
        alert("Bạn chưa viết cảm xúc nào cả nè!");
        return;
    }

    const savedData = JSON.parse(localStorage.getItem('love_diaries') || '{}');
    if (!savedData[currentDiaryKey]) savedData[currentDiaryKey] = [];

    savedData[currentDiaryKey].push({
        author: author,
        text: content,
        time: new Date().toLocaleString('vi-VN')
    });

    localStorage.setItem('love_diaries', JSON.stringify(savedData));
    textInput.value = '';
    renderDiaryList();
}

function editDiaryEntry(index) {
    const savedData = JSON.parse(localStorage.getItem('love_diaries') || '{}');
    const entries = savedData[currentDiaryKey] || [];
    if (!entries[index]) return;

    const currentText = entries[index].text;
    const newText = prompt("Chỉnh sửa nội dung cảm xúc & kỷ niệm:", currentText);

    if (newText !== null && newText.trim() !== '') {
        entries[index].text = newText.trim();
        entries[index].time = new Date().toLocaleString('vi-VN') + " (Đã sửa)";
        savedData[currentDiaryKey] = entries;
        localStorage.setItem('love_diaries', JSON.stringify(savedData));
        renderDiaryList();
    }
}

function deleteDiaryEntry(index) {
    const savedData = JSON.parse(localStorage.getItem('love_diaries') || '{}');
    const entries = savedData[currentDiaryKey] || [];
    if (!entries[index]) return;

    if (confirm("Bạn có chắc chắn muốn xóa bài cảm xúc kỷ niệm này không?")) {
        entries.splice(index, 1);
        savedData[currentDiaryKey] = entries;
        localStorage.setItem('love_diaries', JSON.stringify(savedData));
        renderDiaryList();
    }
}

function renderDiaryList() {
    const listContainer = document.getElementById('diaryList');
    const savedData = JSON.parse(localStorage.getItem('love_diaries') || '{}');
    const entries = savedData[currentDiaryKey] || [];

    listContainer.innerHTML = '';

    if (entries.length === 0) {
        listContainer.innerHTML = '<div class="empty-diary">Chưa có bài viết cảm xúc nào. Hãy gửi gắm kỷ niệm đầu tiên tại đây nhé! 💚</div>';
        return;
    }

    entries.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'diary-card-item';
        itemDiv.innerHTML = `
            <div class="diary-card-header">
                <div class="diary-header-left">
                    <span class="diary-author-tag">${item.author || 'Skey & Pâu'}</span>
                    <span class="diary-card-time">🕒 ${item.time}</span>
                </div>
                <div class="diary-card-actions">
                    <button class="diary-action-btn edit-btn" onclick="editDiaryEntry(${index})">✏️ Sửa</button>
                    <button class="diary-action-btn delete-btn" onclick="deleteDiaryEntry(${index})">🗑️ Xóa</button>
                </div>
            </div>
            <div class="diary-card-body">${item.text}</div>
        `;
        listContainer.appendChild(itemDiv);
    });

    listContainer.scrollTop = listContainer.scrollHeight;
}
