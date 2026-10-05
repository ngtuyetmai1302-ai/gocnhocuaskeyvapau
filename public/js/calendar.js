// ==========================================
// BẢNG LỊCH THEO THÁNG TỰ ĐỘNG
// ==========================================
let calCurrentDate = new Date();

const holidayDict = {
    "01-01": "🎉 Tết Dương Lịch",
    "13-02": "🎂 Sinh nhật Pâu 💕",
    "14-02": "💕 Valentine - Lễ Tình Yêu",
    "08-03": "🌸 Quốc tế Phụ nữ",
    "16-03": "❤️ Kỷ Niệm Yêu Skey & Pâu",
    "30-03": "🎂 Sinh nhật Skey 👦",
    "30-04": "🇻🇳 Giải phóng Miền Nam",
    "01-05": "🛠️ Quốc tế Lao động",
    "02-09": "🇻🇳 Quốc Khánh Việt Nam",
    "20-10": "🌺 Ngày Phụ nữ Việt Nam",
    "20-11": "👨‍🏫 Ngày Nhà giáo Việt Nam",
    "24-12": "🎄 Lễ Giáng Sinh"
};

function renderMonthCalendar() {
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();

    const titleElem = document.getElementById('calMonthTitle');
    if (titleElem) titleElem.innerText = `Tháng ${month + 1}/${year}`;

    const gridElem = document.getElementById('calDaysGrid');
    if (!gridElem) return;
    gridElem.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const realToday = new Date();
    const isCurrentMonth = realToday.getFullYear() === year && realToday.getMonth() === month;

    for (let i = 0; i < offset; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-day-cell empty';
        gridElem.appendChild(emptyCell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'cal-day-cell';
        dayCell.innerText = d;

        const dayStr = String(d).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        const keyDDMM = `${dayStr}-${monthStr}`;

        if (isCurrentMonth && d === realToday.getDate()) {
            dayCell.classList.add('today');
        }

        let holidayName = holidayDict[keyDDMM] || "";
        if (holidayName) {
            dayCell.classList.add('holiday');
            dayCell.setAttribute('data-tooltip', `${dayStr}/${monthStr}: ${holidayName}`);
            dayCell.onclick = () => alert(`📅 Ngày ${dayStr}/${monthStr}/${year}: ${holidayName}`);
        }

        gridElem.appendChild(dayCell);
    }
}

function prevCalendarMonth() {
    calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
    renderMonthCalendar();
}

function nextCalendarMonth() {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
    renderMonthCalendar();
}

renderMonthCalendar();
