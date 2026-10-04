# Sửa giao diện

- `src/index.html`: bố cục chính và thứ tự tải JavaScript.
- `src/partials/`: các khung chức năng (thiệp, trò chơi, thú cưng, cài đặt…).
- `public/js/`: logic chia theo chức năng; `script.js` khởi chạy sau các file này.
- `public/index.html`: bản được ghép để chạy và deploy Firebase.

Sửa HTML trong `src/`, rồi chạy từ thư mục dự án:

```sh
node scripts/build.cjs
```

Không cần cài thư viện. Sau khi build, mở web bằng cách hiện tại.
Các script dùng chung phạm vi toàn cục để giữ các nút `onclick` hiện có.
Giữ thứ tự tải trong `src/index.html`, với `core.js` đầu tiên và `script.js` cuối các file chức năng.

Kiểm tra:

```sh
node scripts/build.cjs --check
node --test tests/*.test.cjs
```
