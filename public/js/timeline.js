// ==========================================
// 5. THÊM KỶ NIỆM MỚI (TẠO CỘT MỐC TRÊN TIMELINE)
// ==========================================
function openAddMemoryModal() {
    const modal = document.getElementById('addMemoryModal');
    if (modal) modal.classList.remove('hidden');
}

function closeAddMemoryModal() {
    const modal = document.getElementById('addMemoryModal');
    if (modal) modal.classList.add('hidden');
    document.getElementById('memoryDateInput').value = '';
    document.getElementById('memoryTitleInput').value = '';
    document.getElementById('memoryContentInput').value = '';
}

function saveNewMemory() {
    const dateVal = document.getElementById('memoryDateInput').value.trim();
    const titleVal = document.getElementById('memoryTitleInput').value.trim();
    const contentVal = document.getElementById('memoryContentInput').value.trim();

    if (!dateVal || !titleVal) {
        alert("Vui lòng nhập ngày và tiêu đề kỷ niệm nhé!");
        return;
    }

    let customMemories = JSON.parse(localStorage.getItem('custom_memories') || '[]');
    customMemories.push({
        date: dateVal,
        title: titleVal,
        content: contentVal || "Kỷ niệm ngọt ngào của Skey & Pâu."
    });

    localStorage.setItem('custom_memories', JSON.stringify(customMemories));
    closeAddMemoryModal();
    renderTimeline();
    alert("Kỷ niệm mới đã được thêm vào hành trình yêu thương! 📸❤️");
}

function editCustomMemory(index) {
    let customMemories = JSON.parse(localStorage.getItem('custom_memories') || '[]');
    if (!customMemories[index]) return;

    const item = customMemories[index];
    const newDate = prompt("Sửa thời gian / ngày kỷ niệm:", item.date);
    if (newDate === null) return;

    const newTitle = prompt("Sửa tiêu đề cột mốc:", item.title);
    if (newTitle === null) return;

    const newContent = prompt("Sửa cảm xúc / nội dung:", item.content);
    if (newContent === null) return;

    customMemories[index] = {
        date: newDate.trim() || item.date,
        title: newTitle.trim() || item.title,
        content: newContent.trim() || item.content
    };

    localStorage.setItem('custom_memories', JSON.stringify(customMemories));
    renderTimeline();
}

function deleteCustomMemory(index) {
    let customMemories = JSON.parse(localStorage.getItem('custom_memories') || '[]');
    if (!customMemories[index]) return;

    if (confirm("Bạn có chắc chắn muốn xóa cột mốc kỷ niệm này không?")) {
        customMemories.splice(index, 1);
        localStorage.setItem('custom_memories', JSON.stringify(customMemories));
        renderTimeline();
    }
}

function renderTimeline() {
    const listContainer = document.getElementById('timelineList');
    if (!listContainer) return;

    const defaultMemories = [
        {
            date: '16/03/2021',
            title: 'Ngày Chính Thức Yêu Nhau',
            content: 'Mốc thời gian đặc biệt khởi đầu cho hành trình tình yêu ngọt ngào của Skey và Pâu.'
        },
        {
            date: '30/04 - 02/05/2026',
            title: 'Du Lịch Cát Bà 🏝️',
            content: 'Chuyến đi vi vu biển đảo tuyệt đẹp cùng nhau, lưu giữ ngàn khoảnh khắc đẹp.'
        },
        {
            date: '15 - 16/08/2026',
            title: 'Du Lịch Đồ Sơn 🌊',
            content: 'Kỳ nghỉ đong đầy niềm vui, tiếng cười và những phút giây bình yên bên nhau.'
        }
    ];

    let customMemories = JSON.parse(localStorage.getItem('custom_memories') || '[]');

    listContainer.innerHTML = '';

    defaultMemories.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item';
        itemDiv.onclick = () => openDiary(item.date, item.title);

        itemDiv.innerHTML = `
            <div class="date">${item.date} 📖</div>
            <div class="content">
                <h3>${item.title}</h3>
                <p>${item.content}</p>
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });

    customMemories.forEach((item, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item custom-timeline-item';

        itemDiv.innerHTML = `
            <div class="timeline-header-row">
                <div class="date">${item.date} 📖</div>
                <div class="timeline-item-actions">
                    <button class="timeline-action-btn edit-btn" onclick="event.stopPropagation(); editCustomMemory(${idx})" title="Sửa cột mốc">✏️ Sửa</button>
                    <button class="timeline-action-btn delete-btn" onclick="event.stopPropagation(); deleteCustomMemory(${idx})" title="Xóa cột mốc">🗑️ Xóa</button>
                </div>
            </div>
            <div class="content" onclick="openDiary('${item.date}', '${item.title}')">
                <h3>${item.title}</h3>
                <p>${item.content}</p>
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });
}

renderTimeline();
