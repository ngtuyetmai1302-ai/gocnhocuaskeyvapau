(() => {
  const storageKey = 'skey_pau_memory_corner';
  const labels = { food: '🍜 Món ăn', object: '🎁 Đồ vật', place: '📍 Địa điểm', moment: '💌 Khoảnh khắc' };
  const $ = id => document.getElementById(id);
  let memories = [];
  let activeFilter = 'all';
  let selectedImage = '';
  try { memories = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { memories = []; }

  function save() { localStorage.setItem(storageKey, JSON.stringify(memories)); }
  function formatDate(value) { if (!value) return 'Chưa ghi ngày'; const [y, m, d] = value.split('-'); return `${d}/${m}/${y}`; }
  function render() {
    const query = $('searchInput').value.trim().toLowerCase();
    const list = memories.filter(item => (activeFilter === 'all' || item.category === activeFilter) && (!query || `${item.title} ${item.note}`.toLowerCase().includes(query)));
    $('memoryGrid').innerHTML = list.map(item => `<article class="memory-card"><div class="memory-image-wrap"><img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy"><span class="memory-type">${labels[item.category]}</span><button class="delete-memory" data-delete="${item.id}" type="button" aria-label="Xóa kỷ niệm">×</button></div><div class="memory-info"><h3>${escapeHtml(item.title)}</h3><div class="memory-date">${formatDate(item.date)}</div><p class="memory-note">${escapeHtml(item.note || 'Một điều nhỏ bé nhưng thật đáng nhớ.')}</p></div></article>`).join('');
    $('emptyState').classList.toggle('hidden', list.length > 0); $('memoryGrid').classList.toggle('hidden', list.length === 0);
    document.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => remove(button.dataset.delete)));
  }
  function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
  function openModal() { $('memoryModal').classList.remove('hidden'); $('titleInput').focus(); }
  function closeModal() { $('memoryModal').classList.add('hidden'); $('memoryForm').reset(); selectedImage = ''; $('uploadPreview').textContent = '📸'; $('uploadText').textContent = 'Chọn một bức ảnh'; }
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); setTimeout(() => $('toast').classList.remove('show'), 2400); }
  function remove(id) { if (!confirm('Xóa kỷ niệm này khỏi góc lưu giữ?')) return; memories = memories.filter(item => item.id !== id); save(); render(); toast('Đã xóa kỷ niệm'); }
  function compressImage(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const max = 1280; const ratio = Math.min(1, max / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * ratio); canvas.height = Math.round(img.height * ratio); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .82)); }; img.onerror = reject; img.src = reader.result; }; reader.onerror = reject; reader.readAsDataURL(file); }); }
  $('addMemoryTop').addEventListener('click', openModal); $('emptyAdd').addEventListener('click', openModal); $('closeModal').addEventListener('click', closeModal);
  $('memoryModal').addEventListener('click', event => { if (event.target === $('memoryModal')) closeModal(); });
  $('searchInput').addEventListener('input', render);
  $('filters').addEventListener('click', event => { const button = event.target.closest('[data-filter]'); if (!button) return; activeFilter = button.dataset.filter; document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button)); render(); });
  $('imageInput').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) return toast('Ảnh vượt quá 5MB, hãy chọn ảnh nhỏ hơn nhé'); try { selectedImage = await compressImage(file); $('uploadPreview').innerHTML = `<img src="${selectedImage}" alt="Ảnh xem trước" style="width:100px;height:75px;object-fit:cover;border-radius:10px">`; $('uploadText').textContent = file.name; } catch (_) { toast('Không thể đọc ảnh này'); } });
  $('memoryForm').addEventListener('submit', event => { event.preventDefault(); if (!selectedImage) return toast('Bạn hãy chọn một bức ảnh trước nhé'); memories.unshift({ id: `memory_${Date.now()}`, image: selectedImage, title: $('titleInput').value.trim(), date: $('dateInput').value, category: $('categoryInput').value, note: $('noteInput').value.trim() }); save(); closeModal(); render(); toast('Đã lưu vào góc kỷ niệm ♡'); });
  render();
})();
