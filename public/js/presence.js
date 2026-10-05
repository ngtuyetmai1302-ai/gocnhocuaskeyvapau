(() => {
  let db, role = '', connected = false, connection = null, epoch = 0;
  let states = {}, offset = 0, listening = false;
  window.isRoleOnline = state => !!state?.connections && Object.values(state.connections).some(value => value === true);

  function render() {
    ['Skey', 'Pâu'].forEach(name => {
      const element = document.getElementById(name === 'Skey' ? 'statusSkey' : 'statusPau');
      if (!element) return;
      const state = states[name] || {};
      const online = connected && window.isRoleOnline(state);
      element.className = `status-item ${online ? 'online' : 'offline'}`;
      const text = element.querySelector('.status-text');
      const last = element.querySelector('.status-last-seen');
      const timestamp = Number(state.lastSeen);
      text.textContent = !connected ? 'đang mất kết nối' : online ? 'đang online' : 'đang offline';
      let description = '';
      if (!online && Number.isFinite(timestamp) && timestamp > 0) {
        const minutes = Math.floor(Math.max(0, Date.now() + offset - timestamp) / 60000);
        description = minutes < 1 ? 'Hoạt động: vừa xong' : minutes < 60 ? `Hoạt động: ${minutes} phút trước` : minutes < 1440 ? `Hoạt động: ${Math.floor(minutes / 60)} giờ trước` : `Hoạt động: ${new Date(timestamp).toLocaleDateString('vi-VN')}`;
        element.title = `Hoạt động lần cuối: ${new Date(timestamp).toLocaleString('vi-VN')}`;
      } else element.title = text.textContent;
      if (last) { last.textContent = description; last.hidden = !description; }
    });
  }

  async function register() {
    if (!connected || !role) return;
    const token = ++epoch;
    const currentRole = role;
    const statusRef = db.ref(`status/${currentRole}`);
    const ref = statusRef.child('connections').push();
    const disconnect = statusRef.onDisconnect();
    // Each database connection removes only its own entry, using server time.
    const cleanup = { [`connections/${ref.key}`]: null, lastSeen: firebase.database.ServerValue.TIMESTAMP };
    connection = { statusRef, ref, disconnect, cleanup };
    try {
      await disconnect.update(cleanup);
      if (token !== epoch || !connected || role !== currentRole) return;
      await statusRef.update({ [`connections/${ref.key}`]: true, online: null });
      // A role change can remove this entry while the online write is pending.
      // Remove it again if that write completes after the session has changed.
      if (token !== epoch || !connected || role !== currentRole) {
        await statusRef.update(cleanup);
      }
    } catch (error) {
      console.error('Không thể cập nhật trạng thái:', error);
      if (token === epoch) { connected = false; render(); }
    }
  }

  window.startPresence = async activeRole => {
    if (!['Skey', 'Pâu'].includes(activeRole) || typeof firebase === 'undefined' || !firebase.apps.length) return;
    db = firebase.database();
    if (role === activeRole && listening) return;
    const switchToken = ++epoch;
    const previous = connection;
    connection = null;
    role = activeRole;
    if (previous) {
      // Retain the disconnect cleanup until the old entry is removed successfully.
      try { await previous.statusRef.update(previous.cleanup); await previous.disconnect.cancel(); }
      catch (error) { console.error('Không thể đóng trạng thái cũ:', error); }
    }
    if (role !== activeRole || switchToken !== epoch) return;
    if (!listening) {
      listening = true;
      db.ref('status').on('value', snapshot => { states = snapshot.val() || {}; render(); }, error => { console.error(error); connected = false; render(); });
      db.ref('.info/serverTimeOffset').on('value', snapshot => { offset = Number(snapshot.val()) || 0; render(); });
      db.ref('.info/connected').on('value', snapshot => {
        connected = snapshot.val() === true;
        ++epoch;
        connection = null;
        render();
        if (connected) register();
      });
      setInterval(render, 60000);
    } else if (connected) register();
  };
  document.addEventListener('DOMContentLoaded', () => window.startPresence(sessionStorage.getItem('active_user_role')));
})();
