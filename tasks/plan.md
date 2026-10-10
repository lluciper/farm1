# Plan — chuồng trại

1. **Lối đi + màu chuồng (CSS)** — `public/theme.css`: nền lối đi đất cho `.paddock-grid`, bãi cỏ + viền màu `--pen-accent` cho từng `.paddock-button`, khoảng cách đủ rộng cho nhân vật. Kiểm: ảnh chụp desktop + điện thoại.
2. **Cho nhân vật đi trong khu chuồng** — `public/avatar-world.js` (`OUTDOOR` thêm `barn`, đổi khu thì đẩy nhân vật ra khỏi chuồng gần nhất), `public/game.js` (hiện nhân vật ở `barn`, chuồng là vật cản `.real-pen`, click nền đi được, bấm chuồng → đi tới rồi mở bảng). Kiểm: script CDP bấm chuồng xa, đo vị trí + modal mở.
3. **Đồng bộ + test** — tăng `?v=`, tạo lại `app/game-html.ts`, chạy test liên quan.

Ponytail: dùng lại A*/World3D/obstacles sẵn có thay vì cảnh 3D mới (rung 2). Không đụng `core.js` → không cần sync engine server.

## v2 — chuồng 3D
1. `public/world3d.js`: `penModel()` + nhánh `pen:<loài>` trong `mountPreview` (dùng lại cơ chế `data-c3d`, `toon`/`mesh`/`G`). Kiểm: ảnh chụp.
2. `public/game.js` `penArt`: thêm `data-c3d="pen:<k>"`. `public/theme.css`: sân đất cát thay cỏ, bỏ thảm cỏ từng chuồng, lớp canvas chuồng dưới/ trên đàn, ẩn ảnh vẽ khi `c3d-on`. Kiểm: ảnh chụp + script đi lại.
3. Tăng `?v=`, tạo lại `app/game-html.ts`, chạy test.
Ponytail: dùng lại `data-c3d`/View/toon có sẵn, không thêm thư viện; màu viền đọc từ `--pen-accent` CSS (không lặp bảng màu).

## v11 — Tiệm nón (chờ duyệt)
1. core.js + legacy-core.js: danh mục `headwear`, `s.headwear` trong `initial()`/`migrate()` (tặng Nón lá nếu bộ đồ cũ có nón), kiểm tra hợp lệ, `buyHat`/`equipHat`. `node scripts/sync-card-engine.mjs`. Test mới `tests/headwear.cjs` (red → green).
2. avatar-rig.js: bỏ `hat:1`; world3d.js: `buildHat(head, kind)` 12 mô hình, `outfitSpec` đọc nón từ look; game.js/avatar-world.js: truyền nón vào look 3D + `c3dChar`.
3. game.js: ô "Tiệm nón" trong `shoppingScene`, `hatsDialog` theo khuôn `shoesDialog`.
4. Tăng `?v=`, tạo lại `app/game-html.ts`, build + built-smoke, ảnh chụp.
Ponytail: dùng lại khuôn footwear (dữ liệu, kiểm tra, hộp thoại), `buildHat` sẵn có; không thêm thư viện.
