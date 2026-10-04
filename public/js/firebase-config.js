var firebaseConfig = {
  apiKey: "AIzaSyAY3Aq2xwfJrvjzu4pefEUsAcBJ6EuUbhQ",
  authDomain: "gocnhocuaskeyvapau.firebaseapp.com",
  databaseURL: "https://gocnhocuaskeyvapau-default-rtdb.firebaseio.com",
  projectId: "gocnhocuaskeyvapau",
  storageBucket: "gocnhocuaskeyvapau.firebasestorage.app",
  messagingSenderId: "704493790067",
  appId: "1:704493790067:web:8dd2d35a20fe72c2d91b06"
};
// ==========================================
// CẤU HÌNH FIREBASE (BỌC AN TOÀN CHỐNG LỖI TRÙNG)
// ==========================================
if (typeof firebaseConfig === 'undefined') {
    var firebaseConfig = {
        apiKey: "AIzaSyAY3Aq2xwfJrvjzu4pefEUsAcBJ6EuUbhQ",
        authDomain: "gocnhocuaskeyvapau.firebaseapp.com",
        databaseURL: "https://gocnhocuaskeyvapau-default-rtdb.firebaseio.com",
        projectId: "gocnhocuaskeyvapau",
        storageBucket: "gocnhocuaskeyvapau.firebasestorage.app",
        messagingSenderId: "704493790067",
        appId: "1:704493790067:web:8dd2d35a20fe72c2d91b06"
    };
}

if (typeof database === 'undefined') {
    var database = null;
}

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        console.log("🔥 Đã kết nối Firebase thành công!");
    } else {
        console.warn("⚠️ Chưa tải xong Firebase SDK.");
    }
} catch (e) {
    console.error("Lỗi khởi tạo Firebase:", e);
}
