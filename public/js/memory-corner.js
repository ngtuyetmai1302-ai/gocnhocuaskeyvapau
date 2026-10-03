(() => {
  const $ = id => document.getElementById(id);
  const labels = { food: '🍜 Món ăn', object: '🎁 Đồ vật', place: '📍 Địa điểm', moment: '💌 Khoảnh khắc' };
  const storageKey = 'skey_pau_memory_corner';
  let memories = [], selectedImages = [], activeFilter = 'all', editingId = null;
  let memoryRef = null, saving = false, uploading = false, uploadVersion = 0;
  let viewerId = null, viewerIndex = 0, modalTrigger, viewerTrigger, toastTimer;
  try { const cached = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(cached)) memories = cached; } catch (_) {}
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const imagesOf = item => Array.isArray(item.images) && item.images.length ? item.images : item.image ? [item.image] : [];
  function formatDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return 'Chưa ghi ngày'; const [y, m, d] = value.split('-'); return `${d}/${m}/${y}`; }
  function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('show'); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 4000); }
  async function connect() {
    try {
      if (typeof firebase === 'undefined') throw new Error('Firebase SDK unavailable');
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const ref = firebase.database().ref('memoryCorner');
      const snapshot = await ref.once('value');
      const updates = {};
      memories.forEach(item => { if (item && /^memory_[\w-]+$/.test(item.id) && !snapshot.hasChild(item.id)) updates[item.id] = item; });
      if (Object.keys(updates).length) await ref.update(updates);
      // Local storage can be blocked independently of the Firebase connection.
      try { localStorage.removeItem(storageKey); } catch (error) { console.error(error); }
      memoryRef = ref;
      ref.on('value', data => {
        memories = Object.entries(data.val() || {}).filter(([, item]) => item && typeof item === 'object').map(([id, item]) => ({ ...item, id }));
        memories.sort((a, b) => (b.createdAt || Number(b.id.replace('memory_', '')) || 0) - (a.createdAt || Number(a.id.replace('memory_', '')) || 0));
        render();
        if (viewerId) { if (memories.some(item => item.id === viewerId)) renderViewer(); else closeViewer(); }
      }, error => { console.error(error); toast('Không thể tải kỷ niệm từ Firebase. Hãy tải lại trang.'); });
    } catch (error) { console.error(error); toast('Không thể kết nối Firebase. Hãy kiểm tra mạng và tải lại trang.'); }
  }
  function render() {
    const year = $('yearFilter').value;
    const years = [...new Set(memories.map(item => /^\d{4}-\d{2}-\d{2}$/.test(item.date || '') ? item.date.slice(0, 4) : '').filter(Boolean))].sort().reverse();
    if (year && !years.includes(year)) years.push(year);
    $('yearFilter').innerHTML = '<option value="">Tất cả năm</option>' + years.map(value => `<option value="${value}">${value}</option>`).join('');
    $('yearFilter').value = year;
    const month = $('monthFilter').value, query = $('searchInput').value.trim().toLowerCase();
    const list = memories.filter(item => (activeFilter === 'all' || item.category === activeFilter) && (!query || `${item.title || ''} ${item.note || ''}`.toLowerCase().includes(query)) && (!year || (item.date || '').slice(0, 4) === year) && (!month || (item.date || '').slice(5, 7) === month));
    $('memoryGrid').innerHTML = list.map(item => {
      const images = imagesOf(item), id = escapeHtml(item.id);
      return `<article class="memory-card"><div class="memory-image-wrap"><button class="open-memory-image" data-view="${id}" type="button" aria-label="Xem ảnh ${escapeHtml(item.title)}"><img src="${escapeHtml(images[0])}" alt="${escapeHtml(item.title)}" loading="lazy"></button><span class="memory-type">${labels[item.category] || labels.moment}</span>${images.length > 1 ? `<span class="image-count">📷 ${images.length} ảnh</span>` : ''}<button class="delete-memory" data-delete="${id}" type="button" aria-label="Xóa kỷ niệm">×</button></div><div class="memory-info"><h3>${escapeHtml(item.title)}</h3><div class="memory-date">${formatDate(item.date)}</div><p class="memory-note">${escapeHtml(item.note || 'Một điều nhỏ bé nhưng thật đáng nhớ.')}</p><button class="edit-memory" data-edit="${id}" type="button">✎ Sửa kỷ niệm</button></div></article>`;
    }).join('');
    $('emptyState').classList.toggle('hidden', list.length > 0); $('memoryGrid').classList.toggle('hidden', list.length === 0);
    $('emptyState').querySelector('h2').textContent = memories.length ? 'Không tìm thấy kỷ niệm phù hợp' : 'Góc này còn đang chờ kỷ niệm';
    $('emptyState').querySelector('p').textContent = memories.length ? 'Thử đổi từ khóa, loại kỷ niệm hoặc bộ lọc tháng/năm nhé.' : 'Hãy thêm những bức ảnh đầu tiên để bắt đầu lưu giữ câu chuyện của hai bạn.';
  }
  function renderSelected() {
    $('selectedImages').innerHTML = selectedImages.map((src, index) => `<div class="selected-photo"><img src="${escapeHtml(src)}" alt="Ảnh đã chọn ${index + 1}"><button type="button" data-remove-photo="${index}" aria-label="Bỏ ảnh ${index + 1}" ${saving || uploading ? 'disabled' : ''}>×</button></div>`).join('');
    $('uploadText').textContent = selectedImages.length ? `${selectedImages.length}/10 ảnh · Bấm để thêm ảnh` : 'Chọn hoặc thêm ảnh';
    document.querySelector('.save-button').disabled = saving || uploading; $('imageInput').disabled = saving || uploading;
  }
  function openModal(id = null) {
    if (saving) return;
    const item = id ? memories.find(entry => entry.id === id) : null;
    if (id && !item) return;
    modalTrigger = document.activeElement; editingId = item ? item.id : null;
    $('memoryForm').reset(); selectedImages = item ? [...imagesOf(item)] : [];
    $('memoryModalTitle').textContent = item ? 'Sửa kỷ niệm' : 'Thêm kỷ niệm mới';
    document.querySelector('.save-button').textContent = item ? 'Lưu thay đổi ♡' : 'Lưu vào góc kỷ niệm ♡';
    if (item) { $('titleInput').value = item.title || ''; $('dateInput').value = item.date || ''; $('categoryInput').value = item.category || 'moment'; $('noteInput').value = item.note || ''; }
    renderSelected(); $('memoryModal').classList.remove('hidden'); $('titleInput').focus();
  }
  function closeModal() {
    if (saving) return;
    ++uploadVersion; uploading = false;
    $('memoryModal').classList.add('hidden'); $('memoryForm').reset(); selectedImages = []; editingId = null; renderSelected();
    if (modalTrigger?.isConnected) modalTrigger.focus(); else $('addMemoryTop').focus();
  }
  async function remove(id) {
    if (!memoryRef) return toast('Chưa kết nối Firebase, hãy thử lại sau');
    if (!confirm('Xóa kỷ niệm này khỏi góc lưu giữ?')) return;
    try { await memoryRef.child(id).remove(); toast('Đã xóa kỷ niệm'); }
    catch (error) { console.error(error); toast('Chưa xóa được kỷ niệm. Hãy thử lại.'); }
  }
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const ratio = Math.min(1, 1280 / Math.max(img.width, img.height)), canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * ratio)); canvas.height = Math.max(1, Math.round(img.height * ratio));
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .82));
          } catch (error) { reject(error); }
        };
        img.onerror = reject; img.src = reader.result;
      };
      reader.onerror = reject; reader.readAsDataURL(file);
    });
  }
  function renderViewer() {
    const item = memories.find(entry => entry.id === viewerId); if (!item) return;
    const images = imagesOf(item); if (!images.length) return closeViewer();
    viewerIndex = Math.max(0, Math.min(viewerIndex, images.length - 1));
    $('viewerImage').src = images[viewerIndex]; $('viewerImage').alt = `${item.title || 'Kỷ niệm'} · ảnh ${viewerIndex + 1}`;
    $('viewerTitle').textContent = item.title || 'Kỷ niệm'; $('viewerCount').textContent = `${viewerIndex + 1}/${images.length}`;
    $('prevImage').disabled = images.length < 2; $('nextImage').disabled = images.length < 2;
  }
  function openViewer(id) { viewerTrigger = document.activeElement; viewerId = id; viewerIndex = 0; $('imageViewer').classList.remove('hidden'); renderViewer(); $('closeViewer').focus(); }
  function closeViewer() { viewerId = null; $('imageViewer').classList.add('hidden'); $('viewerImage').removeAttribute('src'); if (viewerTrigger?.isConnected) viewerTrigger.focus(); else $('addMemoryTop').focus(); }
  function stepImage(delta) { const item = memories.find(entry => entry.id === viewerId), count = item ? imagesOf(item).length : 0; if (count) { viewerIndex = (viewerIndex + delta + count) % count; renderViewer(); } }
  $('addMemoryTop').addEventListener('click', () => openModal()); $('emptyAdd').addEventListener('click', () => openModal()); $('closeModal').addEventListener('click', closeModal);
  $('memoryModal').addEventListener('click', event => { if (event.target === $('memoryModal')) closeModal(); });
  $('memoryGrid').addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.delete) remove(button.dataset.delete); if (button.dataset.edit) openModal(button.dataset.edit); if (button.dataset.view) openViewer(button.dataset.view);
  });
  $('selectedImages').addEventListener('click', event => { const button = event.target.closest('[data-remove-photo]'); if (!button || saving || uploading) return; selectedImages.splice(Number(button.dataset.removePhoto), 1); renderSelected(); });
  $('searchInput').addEventListener('input', render); $('yearFilter').addEventListener('change', render); $('monthFilter').addEventListener('change', render);
  for (let month = 1; month <= 12; month++) { const option = document.createElement('option'); option.value = String(month).padStart(2, '0'); option.textContent = `Tháng ${month}`; $('monthFilter').appendChild(option); }
  $('clearDateFilters').addEventListener('click', () => { $('yearFilter').value = ''; $('monthFilter').value = ''; render(); });
  $('filters').addEventListener('click', event => { const button = event.target.closest('[data-filter]'); if (!button) return; activeFilter = button.dataset.filter; document.querySelectorAll('.filter[data-filter]').forEach(item => item.classList.toggle('active', item === button)); render(); });
  $('imageInput').addEventListener('change', async event => {
    const files = Array.from(event.target.files || []); event.target.value = '';
    if (!files.length || saving || uploading) return;
    if (selectedImages.length + files.length > 10) return toast('Mỗi kỷ niệm tối đa 10 ảnh nhé');
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) return toast('Hãy chọn JPG, PNG hoặc WEBP không quá 5MB mỗi ảnh');
    const version = ++uploadVersion; uploading = true; renderSelected(); $('uploadText').textContent = 'Đang chuẩn bị ảnh…';
    try {
      const added = []; for (const file of files) { added.push(await compressImage(file)); if (version !== uploadVersion) return; }
      const next = [...selectedImages, ...added];
      if (next.reduce((size, image) => size + image.length, 0) > 8 * 1024 * 1024) return toast('Album ảnh hơi lớn. Hãy chọn ít ảnh hơn nhé');
      selectedImages = next;
    } catch (error) { console.error(error); if (version === uploadVersion) toast('Không thể đọc ảnh. Các ảnh đã chọn vẫn được giữ.'); }
    finally { if (version === uploadVersion) { uploading = false; renderSelected(); } }
  });
  $('memoryForm').addEventListener('submit', async event => {
    event.preventDefault(); if (saving || uploading) return;
    if (!memoryRef) return toast('Chưa kết nối Firebase, hãy thử lại sau');
    if (!selectedImages.length) return toast('Bạn hãy chọn ít nhất một bức ảnh nhé');
    const title = $('titleInput').value.trim(); if (!title) return toast('Bạn hãy nhập tên kỷ niệm nhé');
    const fields = { images: [...selectedImages], image: selectedImages[0], title, date: $('dateInput').value, category: $('categoryInput').value, note: $('noteInput').value.trim(), updatedAt: firebase.database.ServerValue.TIMESTAMP };
    const id = editingId, button = document.querySelector('.save-button'), label = button.textContent;
    saving = true; renderSelected(); button.textContent = 'Đang lưu lên Firebase…';
    try {
      if (id) {
        const result = await memoryRef.child(id).transaction(current => current ? { ...current, ...fields } : undefined);
        if (!result.committed) throw new Error('Kỷ niệm đã bị xóa trên thiết bị khác');
      } else await memoryRef.push().set({ ...fields, createdAt: firebase.database.ServerValue.TIMESTAMP });
      saving = false; closeModal(); toast(id ? 'Đã cập nhật kỷ niệm ♡' : 'Đã lưu kỷ niệm trên Firebase ♡');
    } catch (error) { console.error(error); toast(error.message === 'Kỷ niệm đã bị xóa trên thiết bị khác' ? error.message : 'Chưa lưu được. Nội dung vẫn được giữ để thử lại.'); }
    finally { saving = false; button.textContent = label; renderSelected(); }
  });
  $('closeViewer').addEventListener('click', closeViewer); $('prevImage').addEventListener('click', () => stepImage(-1)); $('nextImage').addEventListener('click', () => stepImage(1));
  $('imageViewer').addEventListener('click', event => { if (event.target === $('imageViewer')) closeViewer(); });
  document.addEventListener('keydown', event => {
    const dialog = viewerId ? $('imageViewer') : !$('memoryModal').classList.contains('hidden') ? $('memoryModal') : null; if (!dialog) return;
    if (event.key === 'Escape') viewerId ? closeViewer() : closeModal();
    if (viewerId && event.key === 'ArrowLeft') { event.preventDefault(); stepImage(-1); } if (viewerId && event.key === 'ArrowRight') { event.preventDefault(); stepImage(1); }
    if (event.key === 'Tab') {
      const items = Array.from(dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea, select')).filter(item => item.getClientRects().length), first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  render(); connect();
})();
