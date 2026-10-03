const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const flush = () => new Promise(setImmediate);

function dom() {
  const nodes = new Map(), handlers = {};
  const make = id => {
    if (nodes.has(id)) return nodes.get(id);
    const classes = new Set(['hidden']);
    const node = { id, value: '', textContent: '', innerHTML: '', children: [], disabled: false, isConnected: true,
      classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle(x, enabled) { enabled ? classes.add(x) : classes.delete(x); } },
      addEventListener(type, callback) { handlers[`${id}:${type}`] = callback; },
      appendChild(child) { this.children.push(child); },
      querySelector: selector => make(`${id}:${selector}`),
      querySelectorAll: () => [], focus() {}, reset() {}, removeAttribute(key) { delete this[key]; }, getClientRects: () => [1]
    };
    nodes.set(id, node); return node;
  };
  return { nodes, handlers, make, document: { getElementById: make, querySelector: make, querySelectorAll: () => [], createElement: () => make(`element${nodes.size}`), addEventListener(type, callback) { handlers[`document:${type}`] = callback; }, activeElement: null } };
}

test('presence keeps other tabs online, rearms disconnect on reconnect, and uses server last-seen', async () => {
  const state = {}, clients = [], log = []; let nextKey = 0, now = 1000;
  const read = path => path.split('/').reduce((value, key) => value?.[key], state) ?? null;
  function write(path, value) {
    const parts = path.split('/'); let target = state;
    for (const key of parts.slice(0, -1)) target = target[key] ||= {};
    if (value === null) delete target[parts.at(-1)]; else target[parts.at(-1)] = value === 'SERVER_TIME' ? now : value;
  }
  const broadcast = () => clients.forEach(client => client.status?.({ val: () => state.status || null }));
  function client() {
    const ui = dom(), hooks = new Map(); const endpoint = { connected: true }; clients.push(endpoint);
    let pendingWrite = null;
    const db = { ref(path) {
      return { key: path.split('/').at(-1), child: child => db.ref(`${path}/${child}`), push: () => db.ref(`${path}/tab${++nextKey}`),
        on(type, callback) {
          if (path === 'status') { endpoint.status = callback; callback({ val: () => state.status || null }); }
          if (path === '.info/connected') { endpoint.connection = callback; callback({ val: () => endpoint.connected }); }
          if (path === '.info/serverTimeOffset') callback({ val: () => 0 });
        },
        onDisconnect() { return { async update(values) { log.push('cleanup'); hooks.set(path, values); }, async cancel() { hooks.delete(path); } }; },
        async update(values) {
          log.push('write');
          if (pendingWrite && Object.values(values).includes(true)) {
            const wait = pendingWrite; pendingWrite = null; await wait;
          }
          for (const [key, value] of Object.entries(values)) write(`${path}/${key}`, value); broadcast();
        }
      };
    } };
    const context = { ...ui, window: {}, firebase: { apps: [1], database: Object.assign(() => db, { ServerValue: { TIMESTAMP: 'SERVER_TIME' } }) }, sessionStorage: { getItem: () => null }, console, setInterval() {} };
    vm.runInNewContext(fs.readFileSync('public/js/presence.js', 'utf8'), context);
    return { ...ui, context,
      delayOnlineWrite() { let release; pendingWrite = new Promise(resolve => { release = resolve; }); return release; },
      async start(role) { await context.window.startPresence(role); await flush(); },
      disconnect() { endpoint.connected = false; endpoint.connection({ val: () => false }); for (const [path, values] of hooks) for (const [key, value] of Object.entries(values)) write(`${path}/${key}`, value); hooks.clear(); broadcast(); },
      reconnect() { endpoint.connected = true; endpoint.connection({ val: () => true }); }
    };
  }
  const a = client(), b = client(); await a.start('Skey'); await b.start('Skey');
  assert.deepEqual(log.slice(0, 2), ['cleanup', 'write']);
  assert.equal(Object.keys(read('status/Skey/connections')).length, 2);
  await a.start('Skey'); assert.equal(Object.keys(read('status/Skey/connections')).length, 2, 'idempotent startup');
  now = 2000; a.disconnect(); assert.equal(b.context.window.isRoleOnline(read('status/Skey')), true);
  a.reconnect(); await flush(); assert.equal(Object.keys(read('status/Skey/connections')).length, 2);
  now = 3000; a.disconnect(); b.disconnect();
  assert.equal(b.context.window.isRoleOnline(read('status/Skey')), false);
  assert.equal(read('status/Skey/lastSeen'), 3000);
  b.reconnect(); await flush(); assert.equal(b.context.window.isRoleOnline(read('status/Skey')), true);
  await b.start('Pâu'); assert.equal(b.context.window.isRoleOnline(read('status/Skey')), false);
  assert.equal(b.context.window.isRoleOnline(read('status/Pâu')), true);
  const c = client(), release = c.delayOnlineWrite();
  await c.start('Skey');
  await c.start('Pâu');
  release(); await flush();
  assert.equal(c.context.window.isRoleOnline(read('status/Skey')), false, 'late online write must not restore the previous role');
  assert.equal(c.context.window.isRoleOnline(read('status/Pâu')), true);
});

function gallery(initial, { blockedStorage = false } = {}) {
  const ui = dom(); let data = structuredClone(initial), callback, fail = false, counter = 0;
  const emit = () => callback?.({ val: () => data });
  const reference = id => ({
    async once() { return { hasChild: key => !!data[key] }; },
    async update(values) { Object.assign(data, values); emit(); },
    on(type, cb) { callback = cb; emit(); },
    child: reference, push: () => reference(`new${++counter}`),
    async set(value) { if (fail) throw new Error('write failed'); data[id] = value; emit(); },
    async remove() { delete data[id]; emit(); },
    async transaction(updater) { if (fail) throw new Error('write failed'); const value = updater(data[id] || null); if (value === undefined) return { committed: false }; data[id] = value; emit(); return { committed: true }; }
  });
  ui.make('yearFilter').value = ''; ui.make('monthFilter').value = '';
  const context = { ...ui, firebaseConfig: {}, firebase: { apps: [1], database: Object.assign(() => ({ ref: () => reference() }), { ServerValue: { TIMESTAMP: 999 } }) }, localStorage: { getItem: () => null, removeItem() { if (blockedStorage) throw new Error('Storage blocked'); } }, console: { error() {} }, setTimeout() {}, clearTimeout() {}, confirm: () => true };
  context.FileReader = class { readAsDataURL(file) { this.result = file.name; queueMicrotask(() => this.onload()); } };
  context.Image = class { constructor() { this.width = 100; this.height = 100; } set src(value) { this.file = value; queueMicrotask(() => this.onload()); } };
  ui.document.createElement = tag => tag === 'canvas' ? { getContext: () => ({ drawImage() {} }), toDataURL: () => 'data:image/jpeg;base64,AA==' } : ui.make(`element${ui.nodes.size}`);
  vm.runInNewContext(fs.readFileSync('public/js/memory-corner.js', 'utf8'), context);
  return { ...ui, get data() { return data; }, fail() { fail = true; }, erase(id) { delete data[id]; emit(); },
    action(name, id) { ui.handlers['memoryGrid:click']({ target: { closest: () => ({ dataset: { [name]: id } }) } }); },
    async save() { await ui.handlers['memoryForm:submit']({ preventDefault() {} }); },
    async upload(files) { await ui.handlers['imageInput:change']({ target: { files, value: '' } }); },
    change(id, value) { ui.make(id).value = value; ui.handlers[`${id}:change`](); }
  };
}

test('gallery remains connected when local storage cleanup is blocked', async () => {
  const app = gallery({ old: { title: 'Old', image: 'legacy.jpg', category: 'food' } }, { blockedStorage: true });
  await flush();
  assert(app.make('memoryGrid').innerHTML.includes('Old'));
  app.action('edit', 'old'); app.make('titleInput').value = 'Updated'; await app.save();
  assert.equal(app.data.old.title, 'Updated');
});

test('gallery edits legacy images, preserves creation time, filters dates, and opens albums', async () => {
  const app = gallery({ old: { title: 'Old', image: 'legacy.jpg', date: '2025-02-10', category: 'food', createdAt: 12 }, album: { title: 'Album', images: ['first.jpg', 'second.jpg'], date: '2026-03-01', category: 'place', createdAt: 20 } });
  await flush();
  app.action('edit', 'old'); app.make('titleInput').value = 'Updated'; await app.save();
  assert.equal(app.data.old.title, 'Updated'); assert.equal(app.data.old.createdAt, 12);
  assert.deepEqual(Array.from(app.data.old.images), ['legacy.jpg']);
  app.change('yearFilter', '2026'); assert(!app.make('memoryGrid').innerHTML.includes('Updated')); assert(app.make('memoryGrid').innerHTML.includes('Album'));
  app.change('monthFilter', '02'); assert.equal(app.make('memoryGrid').innerHTML, '');
  app.action('view', 'album'); assert.equal(app.make('viewerImage').src, 'first.jpg');
  app.handlers['nextImage:click'](); assert.equal(app.make('viewerImage').src, 'second.jpg');
  app.handlers['nextImage:click'](); assert.equal(app.make('viewerImage').src, 'first.jpg');
  app.erase('album'); assert(app.make('imageViewer').classList.contains('hidden'));
});

test('gallery retains draft on failures and does not resurrect a concurrently deleted memory', async () => {
  const app = gallery({ old: { title: 'Old', image: 'legacy.jpg', category: 'food' } }); await flush();
  app.action('edit', 'old'); app.make('titleInput').value = 'Draft'; app.fail(); await app.save();
  assert.equal(app.data.old.title, 'Old'); assert.equal(app.make('titleInput').value, 'Draft'); assert(!app.make('memoryModal').classList.contains('hidden'));
  const other = gallery({ old: { title: 'Old', image: 'legacy.jpg', category: 'food' } }); await flush();
  other.action('edit', 'old'); other.erase('old'); await other.save();
  assert.equal(other.data.old, undefined); assert(!other.make('memoryModal').classList.contains('hidden'));
});

test('gallery creates multiple-photo memories and appends photos to existing memories', async () => {
  const file = { name: 'photo.jpg', type: 'image/jpeg', size: 1000 };
  const app = gallery({}); await flush(); app.handlers['addMemoryTop:click']();
  app.make('titleInput').value = 'New album'; app.make('categoryInput').value = 'moment';
  await app.upload([file, file]); assert(app.make('selectedImages').innerHTML.includes('Ảnh đã chọn 2'));
  await app.save(); assert.equal(app.data.new1.images.length, 2); assert.equal(app.data.new1.createdAt, 999);
  app.action('edit', 'new1'); await app.upload([file]); await app.save(); assert.equal(app.data.new1.images.length, 3);
  app.action('edit', 'new1'); await app.upload(Array(8).fill(file)); await app.save(); assert.equal(app.data.new1.images.length, 3, 'photo count limit preserves existing album');
  app.action('edit', 'new1'); await app.upload([{ ...file, size: 6 * 1024 * 1024 }]); await app.save(); assert.equal(app.data.new1.images.length, 3, 'oversized uploads preserve existing album');
});
