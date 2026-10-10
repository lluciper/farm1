# SPEC — Khu chuồng trại: chia lối đi rõ ràng, nhân vật đi lại giữa các chuồng

## Mục tiêu
- Khu "Chăn nuôi" dễ nhìn hơn: mỗi chuồng nằm trên bãi cỏ riêng, có viền màu riêng, giữa các chuồng là lối đi đất.
- Nhân vật (đã vẽ 3D bằng World3D) đứng và đi lại trên lối đi trong khu chuồng: bấm nền để đi, phím mũi tên/WASD, bấm chuồng thì nhân vật đi tới cửa chuồng rồi mới mở bảng chăm sóc.

## Không làm (non-goals)
- Không dựng cảnh Three.js 3D hoàn toàn mới cho chuồng (camera, mô hình chuồng): trùng ảnh vẽ tay sẵn có, nặng cho điện thoại. Nhân vật và vật nuôi vẫn là 3D như hiện tại.
- Không đổi logic game, định dạng bản lưu, `core.js` / engine phía server.

## Tiêu chí nghiệm thu
1. Vào khu Chăn nuôi: nhân vật hiện ra, không đứng đè lên chuồng (kiểm bằng script trình duyệt).
2. Bấm một chuồng ở xa: nhân vật đi tới chuồng đó theo lối đi, sau đó bảng chuồng mở ra.
3. Bấm nền lối đi / phím mũi tên: nhân vật di chuyển, không đi xuyên qua chuồng.
4. Desktop 1280×800 và điện thoại 390×844: đủ 6 chuồng, lối đi thấy rõ, không tràn khung (ảnh chụp).
5. `node tests/work-pens.cjs` và các test liên quan đang qua vẫn qua; `app/game-html.ts` đồng bộ với `public/index.html`.

## Ràng buộc (từ MAP)
- `public/game.js`: `barnScene()`, `render()` (danh sách khu ẩn nhân vật), `movePlayer`, click trên `#world`, action `pen`.
- `public/avatar-world.js`: `OUTDOOR`, `obstacles()` dùng `.real-pen`, khối snap khi đổi khu.
- `public/theme.css`: giao diện `.barn-yard`.
- Đổi file nào thì tăng `?v=` trong `public/index.html` rồi tạo lại `app/game-html.ts`.

---

# SPEC v2 — Chuồng 3D, bỏ nền cỏ

## Mục tiêu
- Chuồng vẽ bằng mô hình 3D toon cùng kiểu với các con vật (World3D): bục đất viền màu của chuồng, hàng rào gỗ, lán mái rạ, đồ riêng từng loài (máng thóc gà, ao vịt, máng cỏ bò/dê, bó rơm cừu, máng nước heo).
- Bỏ nền cỏ: cả sân là đất cát, lối đi giữ nguyên để nhân vật đi lại.
- Hai lớp như ảnh vẽ: sân + lán + rào sau nằm dưới đàn vật, rào trước nằm trên đàn vật.

## Không làm
- Không gộp vật nuôi vào cùng cảnh 3D với chuồng (logic đi lang thang/bong bóng của đàn giữ nguyên).
- Máy không có WebGL: giữ ảnh chuồng vẽ tay như cũ.

## Tiêu chí nghiệm thu
1. Có WebGL: 6 chuồng hiện mô hình 3D, ảnh vẽ tay ẩn; con vật đứng trong sân chuồng, rào trước che chân hàng vật phía trước (ảnh chụp desktop + điện thoại).
2. Không còn nền cỏ ở khu chuồng.
3. Đi lại / bấm chuồng vẫn như v1 (script CDP).
4. Bảng chi tiết chuồng (pen-portrait) vẫn hiển thị đúng.
5. Test liên quan không hỏng thêm; `app/game-html.ts` đồng bộ.

---

# SPEC v3 — Chuồng to hơn, mỗi loài một kiểu chuồng

## Mục tiêu
- Chuồng 3D to hơn trong ô: điện thoại ~+18%, desktop ~+6% (khung 3D cho phép tỉ lệ tới 1:1, nhãn trạng thái đè lên mép bục, lối giữa hai hàng hẹp lại vừa đủ đi).
- Mỗi loài một kiểu: gà (chuồng sàn đỏ + cầu thang, rào lưới, máng thóc), vịt (ao lớn có sen/lau, lều chữ A, rào thấp), bò (kho đỏ cửa chữ X, máng cỏ, can sữa), dê (lán rạ, đống đá, rào cao), cừu (lán rạ, chồng kiện rơm, rào trắng), heo (chuồng mái nghiêng, vũng bùn, máng nước, rào ván).

## Không làm
- Không đổi ảnh vẽ tay dự phòng (không WebGL) và kích thước của nó.

## Tiêu chí nghiệm thu
1. Khung chuồng 3D lớn hơn số đo hiện tại (desktop 363×210, điện thoại 149×126) — đo bằng script.
2. 6 chuồng khác nhau rõ theo loài (ảnh chụp desktop + điện thoại).
3. Nhân vật vẫn đi được giữa các chuồng, bấm chuồng → đi tới → mở bảng (script CDP).
4. Không WebGL: ảnh vẽ tay như cũ. Test không hỏng thêm.

---

# SPEC v4 — Chuyển động phụ có quán tính cho nhân vật 3D

## Mục tiêu
Quần áo, tóc, nón chuyển động như thật (lò xo có quán tính, `World3D.Character.update`):
- Áo dài: mỗi tà 2 đoạn (gấp ở giữa) — tà sau bay ra sau theo gió khi đi/chạy, tà trước bị đầu gối hất lên; dừng lại thì vạt đánh tới trước rồi lắc dần; rẽ thì vạt văng ra ngoài; đứng yên thì phất phơ nhẹ trong gió.
- Tóc đuôi ngựa / tóc tết: bay ra sau khi chạy, nảy theo bước, đánh tới khi dừng. Tóc ngang vai/dài (bob, wave, side): đung đưa nhẹ.
- Nón lá: hơi nảy trễ theo đầu, vành trước hếch lên khi đi nhanh, chúi xuống khi dừng.
- Váy: xoè nhẹ khi bước/rẽ, lắc trễ khi dừng.
- Thân: nghiêng vào khúc cua, chúi nhẹ tới trước khi dừng gấp.

## Không làm
- Không mô phỏng vải thật (cloth sim); không đổi puppet ảnh vẽ (máy không WebGL), không đổi bản lưu.

## Tiêu chí nghiệm thu
1. Script trình duyệt đo góc tà áo dài: đứng yên ≠ hằng số (gió), đang chạy: tà sau lệch ra sau rõ (> 0.25 rad), ngay sau khi dừng: tà đánh tới trước (góc giảm dưới mức đứng yên) rồi về lại.
2. Ảnh chụp áo dài khi chạy cho thấy vạt bay.
3. Tóc đuôi ngựa: góc gốc đuôi khi chạy lớn hơn khi đứng.
4. Test không hỏng thêm; `app/game-html.ts` đồng bộ.

---

# SPEC v5 — Tóc hiện đại, quần áo & giày chân thực hơn (nhân vật 3D)

## Mục tiêu
- Tóc: texture sợi tóc + vệt bóng (halo) cho mọi kiểu; dựng lại 8 kiểu theo xu hướng hiện đại, giữ nguyên 8 mã (bản lưu, ảnh vẽ dự phòng không đổi):
  short → nam Two-block / nữ Pixie · bob → Bob Hàn mái thưa · pony → Đuôi ngựa cao mái bay · wave → Layer dài mái bay (butterfly) ·
  curly → Xoăn sóng lơi · buns → Búi đôi mái thưa · braid → Tết lệch vai · side → nam Dấu phẩy / nữ Rẽ ngôi lệch.
- Đội nón lá vẫn thấy kiểu tóc đã chọn (đuôi ngựa, tết, tóc dài lòi dưới vành).
- Quần áo: cổ đứng áo dài, viền cổ áo thun, viền tay áo ngắn, gấu quần dài, thắt lưng quần jean, nếp vải trên thân áo.
- Giày: sneaker có đế dày + mũi + dây + gót; sandal có đế + quai chéo + quai hậu; ủng có cổ gập + đế + gót; giày lười có đế, gót, quai ngang, ánh bóng.
- Đổi tên hiển thị kiểu tóc trong `core.js` + `legacy-core.js`, sinh lại `lib/farm-engine.ts`.

## Không làm
- Không thêm mã kiểu tóc mới (cần ảnh vẽ + đổi kiểm tra bản lưu). Không đổi ảnh vẽ tay dự phòng.

## Tiêu chí nghiệm thu
1. Ảnh chụp trước/sau: 8 kiểu tóc (nam + nữ, trước + sau), 7 đôi giày, 10 bộ đồ — khác biệt rõ.
2. Chuyển động phụ v4 vẫn chạy (tóc đuôi ngựa/tết/tóc dài, tà áo dài) — script đo lại.
3. Engine server đồng bộ (`sync-card-engine.mjs`), test không hỏng thêm, `app/game-html.ts` đồng bộ.

---

# SPEC v6 — Khớp tay chân liền mạch (skinning)

## Mục tiêu
- Mỗi tay / chân là một ống liền (lathe), gắn 2 xương (vai→khuỷu, hông→gối) bằng `THREE.SkinnedMesh`; trọng số pha trộn mềm quanh khớp → khuỷu tay, đầu gối cong tròn như người thật, không còn hai khúc capsule gặp nhau thành góc gãy + đường viền cắt ngang.
- Viền mực (outline) cũng uốn theo xương (shader viền có skinning).
- Giữ nguyên toàn bộ hoạt ảnh: node khớp cũ trở thành `Bone` nên code dáng đi / IK / vung tay / ngồi câu cá không đổi.

## Không làm
- Không đổi puppet ảnh vẽ (máy không WebGL), không đổi con vật.

## Tiêu chí nghiệm thu
1. Ảnh trước/sau cận cảnh khi đi, chạy, cổ vũ: khuỷu và gối cong liền, không có đường gãy.
2. Đo trong trình duyệt: mỗi nhân vật có SkinnedMesh cho 4 chi; khi gối gập ~1 rad, đỉnh lưới quanh khớp nằm trên cung trơn (khoảng cách tới trục xương không nhảy bậc).
3. Chuyển động phụ v4 + quần áo v5 vẫn đúng (đo lại tà áo dài), test không hỏng thêm.

---

# SPEC v7 — Hiệu năng cho máy yếu / điện thoại

## Số đo mốc (Chrome headless, 390×844, giả lập điện thoại)
- GPU thật (Metal) + CPU chậm 6×: mọi cảnh ~60 FPS; khu chuồng tốn ~950 ms tính style / 5 s (19% CPU), do bong bóng con vật chạy hoạt ảnh vô hạn; tải trang 4,7 MB (soil-avatar.png 1,6 MB), 553 ms tác vụ dài lúc tải.
- GPU phần mềm (SwiftShader) + CPU 4×: chuồng khi đi bộ 12 FPS; 6,3 s tác vụ dài lúc tải (tạo WebGL + chờ biên dịch shader đồng bộ).

## Mục tiêu
1. Low-power (điện thoại): bong bóng con vật chỉ hiện ra (pop) không nhún vô hạn; chip "sẵn sàng" của chuồng không nhấp nháy box-shadow.
2. WebGL: tắt `checkShaderErrors` (không chờ biên dịch shader đồng bộ), tắt antialias trên điện thoại; điện thoại bắt đầu ở chất lượng 1 (máy yếu: 2) và không lên mức 0.
3. Canvas nhân vật tối đa 2× DPR.
4. soil-avatar.png → WebP.

## Tiêu chí nghiệm thu
- Khu chuồng đứng yên (GPU thật, CPU 6×): thời gian tính style giảm ≥ 50%.
- Dung lượng tải giảm ≥ 1 MB; tác vụ dài lúc tải giảm (cả hai cấu hình GPU).
- SwiftShader: FPS khu chuồng khi đi bộ tăng; các cảnh khác không tụt.
- Hình ảnh không đổi rõ (ảnh chụp so sánh), test không hỏng thêm.

---

# SPEC v8 — Sửa tóc bị lẹm / mất mảng

## Nguyên nhân (đo trên ảnh 8 kiểu × 4 góc)
1. `hairCap`: chân tóc từ mang tai xuống gáy đi theo đường thẳng → cắt chữ V, hói sau đầu/sau tai.
2. `hairCurtain`: mép trước thẳng đứng → nhìn như bị xén ở má.
3. Bán kính lớp tóc (1,035–1,07 × đầu) nhỏ hơn đầu (1,05 ngang) + viền mực → da/viền xuyên qua tóc ở thái dương; mặt tóc một mặt → nhìn vào mặt trong thì mất.

## Sửa
- `hairCap`: tham số `ear` (chân tóc ngay trên tai) + cung cos từ tai xuống gáy; gáy mặc định .86π; bán kính mặc định 1,09.
- `hairCurtain`: mép trước vát dần về sau theo chiều dài (`taper`); bán kính 1,1.
- Mặt tóc (chỏm, rèm) hiển thị hai mặt.
- Chỉnh lại tham số 8 kiểu (nam + nữ).

## Tiêu chí
- Ảnh 8 kiểu × 4 góc (nữ + nam): không còn mảng hói chữ V ở sau/hông, không mép cắt thẳng, không lộ da ở thái dương.
- Chuyển động phụ (đuôi ngựa, tóc dài) vẫn chạy; test không hỏng thêm.

---

# SPEC v9 — Nhà riêng 3D

## Hiện trạng
Nhà búp bê 2D: ảnh nhà vẽ nhỏ giữa khung, 9 vị trí đặt đồ tính theo % cả khung → giường nằm trên nóc, cây/sofa thò ra ngoài tường, đèn/tranh treo ngoài nhà.

## Mục tiêu
- Căn phòng 3D toon hai tầng mở mặt trước (`house:<kiểu>:<màu sơn>` qua `data-c3d`), lấp đầy khung vuông; sàn tầng trên/dưới nằm đúng dải y của 9 vị trí đặt đồ (trên ≈ 44–58%, dưới ≈ 80–95%), tường x ≈ 10–90%. Tường, sàn, cửa sổ, mái, thảm theo phong cách (hiện đại / cổ điển / châu Âu; các mẫu nhà riêng dùng bảng màu gần nhất); màu sơn pha vào tường.
- Mỗi món đồ là mô hình 3D toon (`furniture:<loại>:<phong cách>:<mã>`): giường, sofa, bàn ăn + ghế, đèn cây, chậu cây, tranh treo tường; cùng góc nhìn và tỉ lệ với căn phòng khi đặt trong nhà; trong kho đồ / cửa hàng thì vừa khung.
- Giữ nguyên dữ liệu và thao tác: `placed`, `positions` (kéo thả), `facing` (xoay), mua/cất đồ — không đổi bản lưu, không đổi `core.js`.
- Không WebGL: ảnh 2D như cũ.

## Tiêu chí
1. Ảnh chụp desktop + điện thoại: căn phòng 3D, mọi món đồ đứng trên sàn / treo trên tường bên trong nhà.
2. Kéo thả + xoay + đặt/cất vẫn chạy (script trình duyệt), món đồ 3D đi theo.
3. Kho đồ và cửa hàng hiện mô hình 3D. Test liên quan không hỏng thêm.

---

# SPEC v10 — Nhà 3D theo đúng 7 mẫu vẽ

Ảnh mẫu vẽ tay (housing/v56/house-*.png) đã đẹp và mỗi mẫu một kiểu; nhà 3D thì chỉ là một khối hộp. Dựng lại `roomModel` cho 7 mẫu theo ảnh: chất liệu tường/sàn (texture vẽ bằng canvas: ván sàn, ván gỗ, ô phào, bê tông, gạch, ngói đá, đá), mái (bằng / Pháp + cửa mái / chữ A + kèo), cột góc, kiểu cửa sổ (chữ nhật / vòm / lưới), ống khói, cây leo, đèn lồng, đèn thả, lan can. Giữ nguyên kích thước sàn/tường (vị trí đặt đồ + chế độ xoay không đổi), màu sơn vẫn pha vào tường.
Tiêu chí: ảnh chụp 7 mẫu (chính diện + xoay 45°) giống ảnh vẽ tương ứng; đồ vẫn đứng trên sàn; chế độ xoay + bố trí vẫn chạy; test không hỏng thêm.

---

# SPEC v11 — Tiệm nón riêng trong Siêu thị (T3 · chờ duyệt)

## Hiện trạng (MAP)
- Nón không phải món đồ: 14/18 bộ đồ có cờ `hat:1` (avatar-rig.js) → nón lá gắn cứng vào bộ quần áo. Ảnh vẽ tay của bộ đồ (fashion/rig-*.png) vẽ dính nón lá.
- Giày dép là hệ riêng: `s.footwear {owned, equipped}` + kiểm tra hợp lệ + `buyShoes` / `equipShoes` + "Tiệm giày dép" trong Siêu thị → nón làm y khuôn này.

## Mục tiêu
1. Dữ liệu: `s.headwear = {owned:['none'], equipped:'none'}` trong **core.js và legacy-core.js** (bản lưu mới + v58), kiểm tra hợp lệ, hành động `buyHat` / `equipHat` (phải ở Siêu thị, đủ cấp, đủ xu), danh mục `headwear` (tên, cấp, giá). Sinh lại `lib/farm-engine.ts`.
2. Tách nón khỏi bộ đồ: bỏ `hat:1` khỏi 14 bộ đồ; nhân vật 3D đội nón theo `s.headwear.equipped`.
3. Siêu thị: thêm ô **"Tiệm nón"** cạnh Tiệm may / Tiệm giày; hộp thoại mua & đội giống Tiệm giày (xem trước 3D, "Bỏ nón").
4. Nhiều loại nón (3D, mỗi loại một mô hình): Nón lá, Mũ lưỡi trai, Mũ bucket, Mũ rơm rộng vành, Mũ len, Mũ nồi (beret), Mũ phớt (fedora), Mũ cói đi biển, Mũ cao bồi, Vòng hoa, Mũ tai mèo, Mũ quả dưa (bowler).
5. Tương thích bản lưu: bản lưu cũ không có `headwear` → tự thêm khi tải; ai đang mặc bộ có nón lá thì **được tặng Nón lá và đang đội** (nhìn y như cũ). Không xoá / ghi đè dữ liệu nào khác.

## Không làm
- Ảnh vẽ tay 2D (máy không WebGL) vẫn vẽ dính nón lá theo bộ đồ — không vẽ lại 12 loại nón 2D.

## Tiêu chí nghiệm thu
- Test mới: bản lưu cũ (fixture v58 + bản lưu mới không có headwear) tải được, được tặng Nón lá đúng như trên; mua/đội/bỏ nón; từ chối khi thiếu cấp/xu/ngoài Siêu thị/nón không tồn tại; bản lưu sau khi mua qua `validate` của cả hai engine và `validPayload` phía server.
- Test sẵn có liên quan (core, save-compat, customization, ui-smoke, sync-client, built-smoke) vẫn qua; engine server đồng bộ.
- Ảnh chụp: Siêu thị có Tiệm nón; 12 loại nón trên nhân vật 3D; bộ áo dài không còn tự có nón.

---

# SPEC v12 — Câu cá & thả lưới có hình, minigame giữ Space

## Mục tiêu
- Câu: chạm chỗ trống → thấy quăng cần (phao bay theo đường cong từ cần câu ra chỗ câu, toé nước) → phao nổi dập dềnh; cá cắn → phao chìm + vòng sóng. Chạm phao đang cắn → minigame: giữ **Space** (hoặc giữ nút trên điện thoại) để đẩy vùng móc theo con cá đang vùng vẫy; giữ trong vùng thì thanh câu đầy → được cá; để trống quá lâu → cá sổng (phao vẫn còn, câu lại được).
- Lưới: thấy tấm lưới (mắt lưới + phao viền) nằm trên mặt nước ở từng vị trí; thả lưới → lưới quăng ra và xoè; lưới đầy → cá/tôm/cua nhảy trong lưới. Chạm lưới đầy (hoặc "Kéo lưới") → hiện **mẻ lưới**: tấm lưới kéo lên với từng con mắc trong lưới (đúng số lượng nhận được).
## Không làm
- Không đổi engine / bản lưu: dùng nguyên hành động `fish`, `castNet`, `collectNet`.
## Tiêu chí
- Script trình duyệt: quăng cần tạo phao + toé nước; minigame giữ Space thắng → `s.bag.fish` tăng đúng; thả tay → cá sổng, `s.fishing[i]` giữ nguyên; thả lưới hiện lưới; kéo lưới hiện mẻ lưới với đúng số con và kho tăng đúng.
- Test sẵn có (`pond-nets`, `fishing-redesign`, `decor-fishing`, `ui-smoke`) vẫn qua.

---

# SPEC · Phố đi bộ: công viên thành bản đồ đi lại & tương tác (2026-10-10)

**Mục tiêu.** Công viên Mây là một bản đồ đi lại được: nhân vật đi trên lối lát đá (không xuyên ghế, bồn hoa, bãi cỏ, đài phun nước), chạm để đi theo đường hoặc dùng phím mũi tên/WASD. Các thứ trong quảng trường dùng được: 4 ghế đá (ngồi), xích đu (đung đưa), đài phun nước (ước), sân nhảy (nhảy). Người khác nhìn thấy bạn ngồi, đu, ước, nhảy. Tương tác với người khác: tự đi lại gần người được chọn trước khi nắm tay/thơm má/đấm vui; người đồng ý nắm tay tự đi tới cạnh người mời.

**Không làm.** Không vẽ ảnh mới, không đổi save, không thêm bảng D1, không đổi luật kết bạn/nhắn tin/chặn.

**Tiêu chí kiểm tra.**
1. Mọi điểm đi tới, chỗ đứng trước ghế/xích đu/đài nước đều trên lối đi; đường đi tìm được giữa mọi cặp điểm và không cắt qua chỗ cấm (test `street-park`).
2. Ngồi chỗ đang có người → chọn ghế còn trống; cả hai ghế có người → báo bận.
3. Server nhận vị trí ghế/xích đu (y tới 15) và tương tác `wish`; vẫn chặn kiểu lạ (test `street.mjs`).
4. Hai trình duyệt thật: thấy nhau ngồi ghế, ước ở đài nước; nắm tay → hai người đứng cạnh nhau; kết bạn, nhắn riêng, chat chung, chặn vẫn chạy.
5. Vào phố không còn đứng chồng lên nhau.

---

# SPEC · Phố đi bộ toàn màn hình, đúng hướng, nhân vật phụ (2026-10-10)

**Mục tiêu.** Phố đi bộ chiếm toàn bộ màn hình dưới thanh khu; bản đồ công viên (ảnh 2D có sẵn) phủ kín, camera đi theo nhân vật; khung trò chuyện thành bảng nổi bật/tắt được. Nhân vật quay mặt theo hướng đi, dừng lại thì giữ phía vừa đi; ngồi ghế quay mặt đúng hướng ghế (2 ghế trên quay ra quảng trường, 2 ghế dưới nhìn từ phía sau nên thấy lưng người ngồi, thân dưới khuất sau lưng ghế), xích đu quay ra trước, ước ở đài nước quay vào đài. Người chơi khác cũng đi/quay hướng khi đổi chỗ. Thêm nhân vật phụ "Cô Hoa" (chỉ trên máy mình, không gửi server) để thử tương tác: tự dạo, ngồi, đu, ước, nhảy; đáp lại nắm tay/thơm má/đấm vui, trả lời chat chung, thỉnh thoảng rủ nắm tay, ngồi cạnh khi bạn ngồi ghế.

**Không làm.** Không vẽ ảnh mới, không đổi server/save, nhân vật phụ không kết bạn/nhắn riêng.

**Tiêu chí.** (1) Bản đồ phủ kín khung phố ở 1280×800 và 390×844, nhân vật luôn trong khung nhìn. (2) Hướng ngồi/đi đúng như trên (test `street-park` + ảnh chụp). (3) Cô Hoa xuất hiện, đáp lại cả 3 kiểu tương tác, lời rủ nắm tay đồng ý/từ chối được, trả lời chat. (4) Không yêu cầu nào gửi mã của Cô Hoa lên server. (5) Hai người chơi thật vẫn thấy nhau như trước.

---

# SPEC · Phố đi bộ: đúng tỉ lệ & hành động thật (2026-10-10)

**Mục tiêu.** Nhân vật co giãn theo bản đồ: cao 12% bề ngang ảnh công viên (≈ dài ghế đá, thấp hơn xà xích đu một cái đầu) thay vì cố định 100px, nên ngồi vừa lên ghế/xích đu. Ghế nhìn từ phía sau: chỉ lộ thân trên phía sau lưng ghế. Tương tác thành động tác: hai người quay mặt vào nhau; đấm thì lao tới và người kia bật lùi; thơm má thì nghiêng sát; nắm tay thì đứng sát vai, đung đưa và Cô Hoa đi theo bạn 15 giây; nhảy thì nhún xoay; ước thì đồng xu bay vào đài nước, mặt nước gợn sóng; giơ tay vui khi nhảy/ước/đồng ý nắm tay.

**Tiêu chí.** Ảnh chụp 1280×800 và 390×844: người ≈ dài ghế, ngồi đúng chỗ; trong lúc đấm/thơm má hai người quay mặt vào nhau và có hoạt cảnh (`animationName` ≠ none); xu + gợn sóng xuất hiện; Cô Hoa đi theo khi nắm tay; test `street-park` (đứng cạnh 6%).
