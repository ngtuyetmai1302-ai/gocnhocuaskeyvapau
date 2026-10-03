(() => {
  const storageKey = 'skey_pau_memory_corner';
  const labels = { food: '?? M?n ?n', object: '?? ?? v?t', place: '?? ??a ?i?m', moment: '?? Kho?nh kh?c' };
  const $ = id => document.getElementById(id);
  const saveButton = document.querySelector('.save-button');
  let memories = [], activeFilter = 'all', selectedImage = '', imageVersion = 0;
  let connected = false, loaded = false, busy = false, migrating = false, readFailed = false;
  const ref = typeof database !== 'undefined' && database ? database.ref('memory_corner') : null;
  function legacy() {
    try { const value = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(value) ? value : []; }
    catch (_) { return []; }
  }
  function controls() {
    saveButton.disabled = busy || migrating || !connected || !loaded || readFailed;
    document.querySelectorAll('[data-delete]').forEach(button => { button.disabled = busy || migrating || !connected || !loaded || readFailed; });
  }
  function status(text) { $('memorySyncStatus').textContent = text; controls(); }
  function connectionStatus() {
    status(readFailed ? 'Kh?ng th? ??c d? li?u. H?y tri?n khai Firebase rules m?i v? t?i l?i trang.' : !ref ? 'Kh?ng t?i ???c Firebase. H?y t?i l?i trang.' : !connected ? 'M?t k?t n?i. K? ni?m s? ??ng b? l?i khi c? m?ng.' : !loaded ? '?ang t?i k? ni?m?' : migrating ? '?ang chuy?n k? ni?m c? l?n Firebase?' : '?? k?t n?i ? k? ni?m ???c l?u chung tr?n Firebase.');
  }
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); setTimeout(() => $('toast').classList.remove('show'), 4000); }
  function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
  function formatDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return 'Ch?a ghi ng?y'; const [y,m,d] = value.split('-'); return d + '/' + m + '/' + y; }
  function validImage(value) { return typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= 3000000; }
  function render() {
    const query = $('searchInput').value.trim().toLowerCase();
    const list = memories.filter(item => (activeFilter === 'all' || item.category === activeFilter) && (!query || (item.title + ' ' + item.note).toLowerCase().includes(query)));
    $('memoryGrid').innerHTML = list.map(item => '<article class="memory-card"><div class="memory-image-wrap"><img src="' + escapeHtml(validImage(item.image) ? item.image : '') + '" alt="' + escapeHtml(item.title) + '" loading="lazy"><span class="memory-type">' + (labels[item.category] || '') + '</span><button class="delete-memory" data-delete="' + escapeHtml(item.id) + '" type="button" aria-label="X?a k? ni?m">x</button></div><div class="memory-info"><h3>' + escapeHtml(item.title) + '</h3><div class="memory-date">' + formatDate(item.date) + '</div><p class="memory-note">' + escapeHtml(item.note || 'M?t ?i?u nh? b? nh?ng th?t ??ng nh?.') + '</p></div></article>').join('');
    $('emptyState').classList.toggle('hidden', !loaded || list.length > 0);
    $('memoryGrid').classList.toggle('hidden', list.length === 0);
    document.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => remove(button.dataset.delete)));
    controls();
  }
  function openModal() { $('memoryModal').classList.remove('hidden'); $('titleInput').focus(); }
  function closeModal() { if (busy) return; imageVersion++; $('memoryModal').classList.add('hidden'); $('memoryForm').reset(); selectedImage = ''; $('uploadPreview').textContent = '??'; $('uploadText').textContent = 'Ch?n m?t b?c ?nh'; }
  async function remove(id) {
    if (!connected || !loaded || busy || migrating || readFailed || !ref) return;
    if (!confirm('X?a k? ni?m n?y tr?n c? hai thi?t b??')) return;
    busy = true; controls();
    try { await ref.child(id).remove(); toast('?? x?a k? ni?m tr?n Firebase.'); }
    catch(error) { toast('Kh?ng x?a ???c k? ni?m. H?y th? l?i.'); console.error(error); }
    finally { busy = false; controls(); }
  }
  // Deterministic content keys let interrupted imports retry without duplicating
  // records or overwriting a different memory with the same legacy timestamp ID.
  async function migrateLegacy() {
    if (!ref || !connected || !loaded || migrating || readFailed) return;
    const items = legacy(); if (!items.length) return;
    migrating = true; connectionStatus();
    let failed = 0;
    try {
      for (const item of items) {
        try {
          const data = {title: String(item.title || '').trim(), note: String(item.note || ''), date: String(item.date || ''), category: item.category, image: item.image, createdAt: Number(String(item.id || '').replace('memory_', '')) || 0};
          if (!data.title || data.title.length > 70 || data.note.length > 220 || !labels[data.category] || !validImage(data.image) || (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date))) throw Error('Invalid legacy memory');
          const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(data)));
          const id = 'legacy_' + Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
          await ref.child(id).transaction(current => current === null ? data : undefined, undefined, false);
          // Remove only the confirmed item; failed imports stay locally for retry.
          const remaining = legacy(); const index = remaining.findIndex(value => JSON.stringify(value) === JSON.stringify(item));
          if (index !== -1) remaining.splice(index, 1);
          localStorage.setItem(storageKey, JSON.stringify(remaining));
        } catch(error) { failed++; console.error('Memory migration:', error); }
      }
    } finally { migrating = false; connectionStatus(); }
    if (failed) status('M?t s? k? ni?m c? ch?a chuy?n ???c; v?n gi? trong tr?nh duy?t. T?i l?i trang ?? th? l?i.');
    else toast('?? chuy?n k? ni?m c? l?n Firebase.');
  }
  function compressImage(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const img = new Image(); img.onload = () => { const max = 1280; const ratio = Math.min(1, max / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * ratio); canvas.height = Math.round(img.height * ratio); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .82)); }; img.onerror = reject; img.src = reader.result; }; reader.onerror = reject; reader.readAsDataURL(file); }); }

  $('addMemoryTop').addEventListener('click', openModal);
  $('emptyAdd').addEventListener('click', openModal);
  $('closeModal').addEventListener('click', closeModal);
  $('memoryModal').addEventListener('click', event => { if (event.target === $('memoryModal')) closeModal(); });
  $('searchInput').addEventListener('input', render);
  $('filters').addEventListener('click', event => { const button = event.target.closest('[data-filter]'); if (!button) return; activeFilter = button.dataset.filter; document.querySelectorAll('.filter').forEach(item => item.classList.toggle('active', item === button)); render(); });
  $('imageInput').addEventListener('change', async event => {
    const version = ++imageVersion; selectedImage = ''; const file = event.target.files[0];
    $('uploadPreview').textContent = '??';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) return toast('Ch?n ?nh JPG, PNG ho?c WEBP kh?ng qu? 5MB.');
    try { const image = await compressImage(file); if (version !== imageVersion) return; if (!validImage(image)) return toast('?nh sau n?n v?n qu? l?n. H?y ch?n ?nh nh? h?n.'); selectedImage = image; $('uploadPreview').innerHTML = '<img src="' + image + '" alt="?nh xem tr??c" style="width:100px;height:75px;object-fit:cover;border-radius:10px">'; $('uploadText').textContent = file.name; }
    catch (_) { if (version === imageVersion) toast('Kh?ng th? ??c ?nh n?y.'); }
  });
  $('memoryForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || migrating || !connected || !loaded || readFailed || !ref) return toast('Ch? k?t n?i Firebase r?i th? l?i.');
    const title = $('titleInput').value.trim();
    if (!title || !selectedImage) return toast('H?y nh?p t?n k? ni?m v? ch?n ?nh.');
    const data = { title, image: selectedImage, date: $('dateInput').value, category: $('categoryInput').value, note: $('noteInput').value.trim(), createdAt: firebase.database.ServerValue.TIMESTAMP };
    busy = true; controls();
    try { await ref.push().set(data); busy = false; closeModal(); toast('?? l?u k? ni?m l?n Firebase.'); }
    catch(error) { toast('Kh?ng l?u ???c. N?i dung v?n gi? trong bi?u m?u ?? th? l?i.'); console.error(error); }
    finally { busy = false; controls(); }
  });
  if (ref) {
    ref.on('value', snapshot => {
      memories = []; snapshot.forEach(child => { const value = child.val(); if (value && typeof value.title === 'string') memories.push({...value, id: child.key}); });
      memories.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0) || b.id.localeCompare(a.id));
      loaded = true; readFailed = false; render(); connectionStatus(); migrateLegacy();
    }, error => { readFailed = true; connectionStatus(); console.error(error); });
    database.ref('.info/connected').on('value', snapshot => { connected = snapshot.val() === true; connectionStatus(); if (connected) migrateLegacy(); });
  }
  connectionStatus(); render();
})();
