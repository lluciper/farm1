# Làng Mây – Bộ câu lệnh vẽ ảnh bằng Gemini

Cập nhật: 02/10/2026 · 110 câu lệnh riêng + 1 câu lệnh dùng chung cho 282 lớp nhân vật

File này dùng để tạo lại toàn bộ hình của game bằng Gemini (hoặc công cụ AI tạo ảnh khác). **Không dán cả file vào Gemini.** Mỗi lần chỉ gửi **một** khối câu lệnh, kèm ảnh tham khảo nếu có, và nhận về **một** ảnh.

> **Cập nhật 04/10/2026:** nhân vật, trang phục và động vật **dùng lại ảnh vẽ tay** (đẹp hơn bản vẽ bằng code). Ảnh được cắt thành chân, thân, tay, tóc theo `rig-joints.js` / `critter-joints.js` và cử động bằng `public/avatar-world.js`, nên các mục nhân vật, vật nuôi, thú cưng bên dưới vẫn dùng được như cũ. Riêng **con heo** (thay cho trâu) chưa có ảnh vẽ tay và đang tạm vẽ bằng code: làm mục "Làm ngay: Heo Hồng" ngay dưới đây.

## Làm ngay: Heo Hồng (thay cho trâu trong chuồng)

- **Ảnh tham khảo cần tải lên:** `art-ref/cow.png` hoặc `public/pens/cow-animal.png` (để cùng phong cách)
- **Lưu thành:** `art-new/pens/pig-animal.png`
- **Khung:** ngang khoảng 345 × 300 · **Nền:** xanh lá #00FF00
- **Kiểm tra trước khi lưu:** heo đứng trên 4 chân, nhìn nghiêng quay sang **phải**, giữa các chân có **khe hở thấy nền xanh** (để cắt chân cho heo bước đi).

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: about 345 x 300 (slightly wider than tall).

REFERENCE: I attached a picture of a cute cow from the same game. Draw a PIG in EXACTLY THE SAME ART STYLE (same line work, same soft painted shading, same big glossy eyes, same pink blush, same chibi proportions and size on the canvas).

SUBJECT: one cute chibi pink pig standing on all four short legs, side view turned slightly towards the viewer, head and body facing RIGHT. Round pink body, big round snout with two nostrils, small floppy ears, curly tail, little darker pink hooves. All four legs clearly visible and spread apart with clear gaps between every leg so the background shows between them; all hooves on one flat line at the bottom.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas. No ground, no shadow, no gradient. Do not use this green on the pig. Keep about 8% empty margin around the pig.

DO NOT include any text, letters, logos, watermarks or signatures. No photorealism, no 3D render look, no other animals.
```

Lưu xong thì nhắn Claude "xử lý ảnh heo": Claude sẽ xóa nền, đo chân và cho heo bước đi như các con khác.

## Cách làm, từng bước

1. Mở [gemini.google.com](https://gemini.google.com), bắt đầu cuộc trò chuyện mới, chọn công cụ tạo ảnh (biểu tượng ảnh / "Tạo hình ảnh"). Hoặc mở [Google AI Studio](https://aistudio.google.com) và chọn một mô hình có chữ **Image** trong tên (mô hình tạo ảnh); ở đó chỉnh được tỉ lệ khung.
2. Tìm mục của ảnh cần vẽ bên dưới. Nếu mục ghi **"Ảnh tham khảo cần tải lên"**, tải đúng file đó từ thư mục `art-ref/` của dự án lên Gemini (nút dấu +).
3. Bấm nút sao chép ở góc khối câu lệnh (khối chữ tiếng Anh), dán vào ô chat, gửi.
4. Tải ảnh Gemini trả về, đổi tên và đặt đúng chỗ ghi ở **"Lưu thành"** (thư mục `art-new/` trong dự án, tạo nếu chưa có).
5. Chưa ưng thì gõ tiếp yêu cầu sửa ngắn bằng tiếng Anh, ví dụ: `Same image, but make the lawn bigger and emptier.` hoặc `Same image, softer colours, thinner outlines.`
6. Khi xong một nhóm, nhắn Claude: "xử lý ảnh trong art-new". Claude sẽ tách nền, thu nhỏ về đúng kích thước, ghép các ô thành ảnh ghép, chép vào game và kiểm tra.

**Gemini chỉ trả lời bằng chữ, không ra ảnh?**
- Kiểm tra đã bật công cụ tạo ảnh, hoặc đang dùng mô hình có chữ Image.
- Mở cuộc trò chuyện mới; mỗi câu lệnh đã bắt đầu bằng "Generate exactly one image now".
- Không dán nhiều khối cùng lúc.
- Nếu bị giới hạn số ảnh mỗi ngày, chờ hôm sau hoặc dùng AI Studio.

**Vì sao nền lại là màu xanh lá / hồng tím / xanh dương?** Gemini không xuất được nền trong suốt. Mỗi câu lệnh dặn vẽ trên một màu phẳng không có trong vật (xanh lá cho vật không có màu xanh lá, hồng tím cho rau củ lá xanh, xanh dương cho hoa sen hồng). Claude sẽ xóa màu nền đó. Nếu Gemini vẽ nền khác (trắng, có bóng đổ, có sàn), yêu cầu lại: `Same image, but on a flat solid #00FF00 background with no shadow.`

**Không cần đúng kích thước pixel.** Chỉ cần đúng tỉ lệ khung (ngang, dọc, vuông) như ghi ở mỗi mục; Claude sẽ thu nhỏ.

**Giữ mọi ảnh cùng một phong cách:**
- Vẽ ảnh **số 1 (Nền Vườn rau)** trước và chỉnh tới khi ưng. Từ đó trở đi, tải thêm ảnh này lên cùng mỗi câu lệnh và dán thêm dòng: `Also attached: an approved image. Match its art style exactly.`
- Một nhóm ảnh nên làm trong cùng một cuộc trò chuyện.

## Làm ngay: Mèo mun tư thế đứng (để mèo bước chân như sư tử, bò)


- **Ảnh tham khảo cần tải lên:** `art-ref/pets/black-cat.png` (con mèo đang ngồi hiện tại)
- **Lưu thành:** `art-new/pets/black-cat-standing.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00
- **Kiểm tra trước khi lưu:** mèo đứng trên 4 chân, nhìn nghiêng quay sang **phải**, giữa 4 chân có **khe hở thấy nền xanh**, đuôi không che chân. Nếu chân dính nhau, gửi thêm: `Same cat, but spread the four legs apart so green background shows between every leg.`

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a picture of a cute black cat sitting. Draw THE SAME CAT in the SAME ART STYLE as the attached picture (same line work, same fur shading, same big yellow eyes, same pink inner ears, same proportions and colours), but now STANDING.

SUBJECT: the same cute chibi black cat standing on all four legs, walking pose, side view turned slightly towards the viewer (three-quarter side view), head and body facing RIGHT, head turned a little to look at the viewer. All four legs straight and clearly visible, spread apart with clear gaps between every leg so the background shows between them; front legs under the chest, back legs under the hips, all four paws on one flat line at the bottom. Tail curving up behind the back, NOT touching or covering any leg. Full body visible, filling about 75% of the canvas width.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the cat. No ground, no floor, no cast shadow, no gradient, no vignette. Do not use this bright green anywhere on the cat. Keep about 8% empty margin around the cat so nothing touches the edges.

DO NOT include any text, letters, numbers, logos, watermarks or signatures. No photorealism, no 3D render look, no other animals, no objects.
```

Lưu xong thì nhắn Claude "xử lý ảnh mèo". Claude sẽ xóa nền, căn khung, đo chân và cho mèo bước đi trong game.

## Thứ tự làm

Các mục bên dưới đã xếp đúng thứ tự nên làm: cái người chơi nhìn thấy nhiều nhất làm trước.

| Đợt | Nhóm | Mục |
| --- | --- | --- |
| 1 | Cảnh nền chính: Vườn rau, bản đồ Làng, hồ câu, bờ ao | 1–4 |
| 2 | Ô đất, cây trồng, vật phẩm, 12 món ăn, 32 biểu tượng mới | 5–71 |
| 3 | Chuồng, vật nuôi, thú cưng, người câu cá | 72–90 |
| 4 | Phòng chơi bài, quán, nhà riêng, nội thất, nhân viên quán | 91–108 |
| 5 | Nhân vật và trang phục | 109–111 |

## Đợt 1 – Cảnh nền chính

### 1. Nền Vườn rau

- **Lưu thành:** `art-new/farm.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/farm.png`
- **Khung:** ngang 3:2 · **Nền:** cảnh kín khung

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 3:2 landscape (for example 1536 x 1024).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cozy Vietnamese countryside farmyard seen from above at a 35-degree three-quarter angle. Top-left: a small cream lime-washed house with a terracotta tiled roof and a tiled porch, banana trees with yellow banana bunches, brown clay water jars, a pot of pink flowers. Top-right: a thatched chicken coop inside a bamboo fence with a few hens and yellow chicks, and a big golden haystack at the right edge. Bottom edge: wooden picket fences, round flowering hedges and banana plants. Centre: one large, completely empty, flat green grass lawn shaped like a rounded rectangle, with a sandy dirt path looping all around it.

MUST KEEP: the central lawn must stay completely empty (no plants, rocks, animals or objects on it) and cover roughly 12% to 90% of the width and 20% to 87% of the height, because the game places up to 48 vegetable plots on it; the sandy path must run along the bottom edge so a character can walk there; the four corners of the lawn stay open sand so street lamps can stand there.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: the scene fills the whole canvas edge to edge. No border, no frame, no rounded corners, no transparency.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 2. Bản đồ Làng

- **Lưu thành:** `art-new/village-map.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/village-map.png`
- **Khung:** ngang 16:9 · **Nền:** cảnh kín khung

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 16:9 landscape (for example 1672 x 941).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a top-down three-quarter (35-degree) map of a small Vietnamese village. Centre: a round plaza with a big old banyan tree, flower beds and wooden benches. Sandy paths connect five places: top-left, a vegetable farm with a thatched barn, a haystack and a wooden gate with a small tiled roof; top-centre-right, a grocery shop with a red-and-white striped awning, fruit crates and an umbrella table; right, a café house with a terracotta roof, a cream umbrella and outdoor wooden tables; bottom-left, a pink hair salon with a pink striped awning and a hair silhouette sign (no letters); bottom-right, a purple karaoke house decorated with gold stars. A blue river with lotus leaves runs along the bottom with an arched stone bridge, and a small wooden bridge at the top-right corner. Lots of round green trees and flowering bushes fill the gaps.

MUST KEEP: every building must stay where it is in the reference because the game puts clickable door buttons on them: farm about 23% across and 28% down, grocery shop 58% across 22% down, café 62% across 34% down, hair salon 22% across 70% down, karaoke 60% across 74% down; the paths must stay open sand at 30%/40%, 45%/27%, 36%/54%, 64%/50%, 33%/77% and 72%/84% (across/down) where street lamps stand.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: the scene fills the whole canvas edge to edge. No border, no frame, no rounded corners, no transparency.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 3. Hồ câu cá

- **Lưu thành:** `art-new/pond/lake-v44.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pond/lake-v44.png`
- **Khung:** ngang 3:2 · **Nền:** cảnh kín khung

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 3:2 landscape (for example 1536 x 1024).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a calm, wide blue countryside lake seen from a gentle three-quarter angle, a small wooden fishing jetty at the bottom-left corner, grassy banks with reeds, round trees, a few water lilies near the shore and soft green hills far away under a light blue sky.

MUST KEEP: open water with no objects must cover the area from about 15% to 85% of the width and 25% to 70% of the height, because the game places 8 fishing floats at 20%, 40%, 60% and 80% across and 35% and 58% down; the jetty must stay at the bottom-left where the seated fisher is drawn.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: the scene fills the whole canvas edge to edge. No border, no frame, no rounded corners, no transparency.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 4. Bờ ao (nền sau khu Ao cá)

- **Lưu thành:** `art-new/pond.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pond.png`
- **Khung:** ngang 3:2 · **Nền:** cảnh kín khung

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 3:2 landscape (for example 1536 x 1024).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a peaceful pond bank: grassy edges, smooth stones, reeds, lotus leaves with pink lotus flowers, a few bamboo stakes, calm water in the middle.

MUST KEEP: only the edges are visible in the game (a panel covers the centre), so keep the middle simple calm water.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: the scene fills the whole canvas edge to edge. No border, no frame, no rounded corners, no transparency.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

## Đợt 2 – Ô đất, cây trồng, vật phẩm, món ăn, biểu tượng

### 5. Ô đất – khô

- **Lưu thành:** `art-new/cells/soil-1-dry.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/soil-1-dry.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: one square farm plot of dry, light brown tilled soil with 4 neat ridges, seen from above at 35 degrees, a thin darker earth rim. The plot fills about 90% of the square.

MUST KEEP: all four soil images must have the same size, angle and outline so they can swap in place.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 6. Ô đất – đã tưới

- **Lưu thành:** `art-new/cells/soil-2-watered.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/soil-2-watered.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: the same farm plot but freshly watered: darker, moist brown soil with a slight shine and a few tiny puddle glints. The plot fills about 90% of the square.

MUST KEEP: all four soil images must have the same size, angle and outline so they can swap in place.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 7. Ô đất – chín

- **Lưu thành:** `art-new/cells/soil-3-ready.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/soil-3-ready.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: the same dry farm plot with a soft warm golden glow along its rim showing the crop is ready to harvest. The plot fills about 90% of the square.

MUST KEEP: all four soil images must have the same size, angle and outline so they can swap in place.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 8. Ô đất – tưới và chín

- **Lưu thành:** `art-new/cells/soil-4-watered-ready.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/soil-4-watered-ready.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: the same watered dark moist plot with a soft warm golden glow along its rim. The plot fills about 90% of the square.

MUST KEEP: all four soil images must have the same size, angle and outline so they can swap in place.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 9. Mầm cây

- **Lưu thành:** `art-new/sprout.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/sprout.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a tiny two-leaf green seedling sprouting from a small mound of soil, game item icon, front three-quarter view, centred, bold readable silhouette (it is also shown tiny, about 40 pixels, growing in the field).

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 10. Cà rốt

- **Lưu thành:** `art-new/carrot.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/carrot.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: two bright orange carrots with leafy green tops, game item icon, front three-quarter view, centred, bold readable silhouette (it is also shown tiny, about 40 pixels, growing in the field).

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 11. Bắp ngọt

- **Lưu thành:** `art-new/corn.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/corn.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a sweet corn cob with yellow kernels, green husk leaves peeled back, game item icon, front three-quarter view, centred, bold readable silhouette (it is also shown tiny, about 40 pixels, growing in the field).

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 12. Cà chua

- **Lưu thành:** `art-new/tomato.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/tomato.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a cluster of three glossy red tomatoes on a green vine, game item icon, front three-quarter view, centred, bold readable silhouette (it is also shown tiny, about 40 pixels, growing in the field).

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 13. Dâu tây

- **Lưu thành:** `art-new/strawberry.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/strawberry.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: three red strawberries with green caps and a small leaf, game item icon, front three-quarter view, centred, bold readable silhouette (it is also shown tiny, about 40 pixels, growing in the field).

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 14. Bắp cải

- **Lưu thành:** `art-new/cabbage.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cabbage.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a round fresh green cabbage head with outer leaves, game item icon, front three-quarter view, centred, bold readable silhouette (it is also shown tiny, about 40 pixels, growing in the field).

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 15. Bí ngô

- **Lưu thành:** `art-new/pumpkin.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pumpkin.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a round orange pumpkin with a curly green stem and a leaf, game item icon, front three-quarter view, centred, bold readable silhouette (it is also shown tiny, about 40 pixels, growing in the field).

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 16. Lúa vàng

- **Lưu thành:** `art-new/rice.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/rice.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a bundle of ripe golden rice stalks tied with straw, game item icon, front three-quarter view, centred, bold readable silhouette (it is also shown tiny, about 40 pixels, growing in the field).

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 17. Nho tím

- **Lưu thành:** `art-new/cells/crop-grape.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/crop-grape.png`
- **Khung:** dọc 4:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 4:5 portrait (for example 320 x 400).

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a small grape vine on a bamboo trellis with hanging bunches of purple grapes, growing from a small mound of soil, full plant visible, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 18. Việt quất

- **Lưu thành:** `art-new/cells/crop-blueberry.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/crop-blueberry.png`
- **Khung:** dọc 4:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 4:5 portrait (for example 320 x 400).

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a small round blueberry bush covered with blue berries, growing from a small mound of soil, full plant visible, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 19. Dưa hấu

- **Lưu thành:** `art-new/cells/crop-watermelon.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/crop-watermelon.png`
- **Khung:** dọc 4:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 4:5 portrait (for example 320 x 400).

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a striped green watermelon resting among leafy vines, growing from a small mound of soil, full plant visible, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 20. Dứa

- **Lưu thành:** `art-new/cells/crop-pineapple.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/crop-pineapple.png`
- **Khung:** dọc 4:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 4:5 portrait (for example 320 x 400).

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a pineapple plant with a golden pineapple growing in the middle of spiky leaves, growing from a small mound of soil, full plant visible, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 21. Hướng dương

- **Lưu thành:** `art-new/cells/crop-sunflower.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/crop-sunflower.png`
- **Khung:** dọc 4:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 4:5 portrait (for example 320 x 400).

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a tall sunflower with a big yellow flower and broad leaves, growing from a small mound of soil, full plant visible, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 22. Bông vải

- **Lưu thành:** `art-new/cells/crop-cotton.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/crop-cotton.png`
- **Khung:** dọc 4:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 4:5 portrait (for example 320 x 400).

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a cotton plant with fluffy white cotton bolls, growing from a small mound of soil, full plant visible, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 23. Cá ao

- **Lưu thành:** `art-new/fish.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/fish.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a plump silver-grey freshwater fish, game icon, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 24. Hũ mứt

- **Lưu thành:** `art-new/jam.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/jam.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a glass jar of strawberry jam with a red gingham cloth lid tied with string, game icon, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 25. Thúng tre

- **Lưu thành:** `art-new/basket.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/basket.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a round woven bamboo basket full of fresh vegetables, game icon, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 26. Bình tưới

- **Lưu thành:** `art-new/watering.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/watering.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a metal watering can with a long spout, a few water drops falling, game icon, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 27. Xưởng bánh mứt

- **Lưu thành:** `art-new/workshop.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/workshop.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a tiny countryside bakery workshop building with a terracotta tiled roof, a brick oven chimney, jars and bread on a wooden counter, game icon, front three-quarter view, centred.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

**12 món ăn.** Hình món ăn hiện tại rất đơn giản, nên vẽ mới hoàn toàn từ mô tả.

### 28. Bánh chưng

- **Lưu thành:** `art-new/food/banhchung.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a square Vietnamese sticky rice cake wrapped in green dong leaves tied with bamboo strings, one piece cut showing green bean and pork filling, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 29. Phở bò

- **Lưu thành:** `art-new/food/pho.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a ceramic bowl of Vietnamese beef pho with rice noodles, slices of beef, herbs, a lime wedge and chopsticks resting on the rim, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 30. Bánh xèo

- **Lưu thành:** `art-new/food/banhxeo.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a crispy golden Vietnamese sizzling pancake folded in half with shrimp and bean sprouts, lettuce leaves on the side, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 31. Cơm tấm

- **Lưu thành:** `art-new/food/comtam.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a plate of broken rice with a grilled pork chop, a fried egg, pickled vegetables and cucumber slices, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 32. Bún bò Huế

- **Lưu thành:** `art-new/food/bunbo.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a bowl of spicy Hue beef noodle soup with round noodles, beef slices, red chili oil and herbs, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 33. Gỏi cuốn

- **Lưu thành:** `art-new/food/goicuon.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: three translucent fresh spring rolls with shrimp and herbs on a plate with a small bowl of dipping sauce, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 34. Cá kho tộ

- **Lưu thành:** `art-new/food/cakho.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: caramelised braised fish in a small brown clay pot with black pepper and sliced chili, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 35. Canh chua cá

- **Lưu thành:** `art-new/food/canhchua.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a bowl of Vietnamese sweet and sour fish soup with pineapple, tomato, bean sprouts and herbs, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 36. Chè đậu xanh

- **Lưu thành:** `art-new/food/che.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a glass of Vietnamese mung bean sweet dessert with coconut milk and crushed ice, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 37. Xôi gấc

- **Lưu thành:** `art-new/food/xoigac.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a round mound of bright red-orange gac sticky rice on a banana leaf, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 38. Bánh mì

- **Lưu thành:** `art-new/food/banhmi.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a Vietnamese baguette sandwich filled with pork, pickled carrots, cucumber and herbs, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 39. Nem rán

- **Lưu thành:** `art-new/food/nemran.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: golden crispy fried spring rolls on a plate with lettuce, herbs and a small bowl of dipping sauce, game food icon, front three-quarter view, centred, appetising and simple.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

**32 biểu tượng mới thay emoji.** Hiện game hiển thị các loại hàng này bằng emoji. Vẽ đủ 32 ảnh, Claude sẽ ghép thành một ảnh và sửa code để dùng.

### 40. Rau thơm (ô 1)

- **Lưu thành:** `art-new/goods/herbs.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a small bundle of fresh Vietnamese herbs (mint, basil, perilla) tied with a straw string, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 41. Xà lách (ô 2)

- **Lưu thành:** `art-new/goods/lettuce.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a fresh round head of green leaf lettuce, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 42. Dưa leo (ô 3)

- **Lưu thành:** `art-new/goods/cucumber.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: two fresh green cucumbers, one cut showing pale green slices, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 43. Đậu xanh (ô 4)

- **Lưu thành:** `art-new/goods/greenbean.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a small woven bamboo bowl of green mung beans with a few beans spilled, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 44. Khoai lang (ô 5)

- **Lưu thành:** `art-new/goods/sweetpotato.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: two purple-skinned sweet potatoes, one broken open showing yellow flesh, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 45. Sen (ô 6)

- **Lưu thành:** `art-new/goods/lotus.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh dương #0000FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a pink lotus flower with a lotus seed pod and a round green lotus leaf, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure blue colour #0000FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this blue anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 46. Ớt đỏ (ô 7)

- **Lưu thành:** `art-new/goods/chili.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: three glossy red chili peppers with green stems, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 47. Dừa (ô 8)

- **Lưu thành:** `art-new/goods/coconut.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a green coconut with the top cut open and a straw, next to a half brown coconut, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 48. Gấc (ô 9)

- **Lưu thành:** `art-new/goods/gac.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a spiky red-orange gac fruit, one half cut open showing deep red seeds, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 49. Cà phê (ô 10)

- **Lưu thành:** `art-new/goods/coffee.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a small burlap sack of roasted coffee beans with a wooden scoop, a few beans spilled, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 50. Trứng gà (ô 11)

- **Lưu thành:** `art-new/goods/egg.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: three light-brown chicken eggs in a little straw nest, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 51. Sữa tươi (ô 12)

- **Lưu thành:** `art-new/goods/milk.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a glass milk bottle with a cream paper cap next to a small glass of milk, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 52. Lông cừu (ô 13)

- **Lưu thành:** `art-new/goods/wool.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a fluffy ball of cream sheep wool next to a skein of yarn, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 53. Tôm càng (ô 14)

- **Lưu thành:** `art-new/goods/shrimp.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a freshwater giant river prawn with long blue-tinted claws, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 54. Cua đồng (ô 15)

- **Lưu thành:** `art-new/goods/crab.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a small brown rice-paddy crab, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 55. Bánh bắp (ô 16)

- **Lưu thành:** `art-new/goods/bread.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a golden square of baked Vietnamese corn cake on a piece of banana leaf, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 56. Phô mai (ô 17)

- **Lưu thành:** `art-new/goods/cheese.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a wedge of yellow cheese with holes and a small slice beside it, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 57. Bánh gạo (ô 18)

- **Lưu thành:** `art-new/goods/ricecake.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a small stack of round crispy puffed rice crackers, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 58. Thịt heo (ô 19)

- **Lưu thành:** `art-new/goods/pork.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a fresh cut of pork belly with layers of fat and meat on a small wooden board, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 59. Thịt bò (ô 20)

- **Lưu thành:** `art-new/goods/beef.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a fresh red beef steak on a small wooden board, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 60. Gia vị (ô 21)

- **Lưu thành:** `art-new/goods/sauce.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: three small ceramic spice jars: a fish sauce bottle, a salt jar and a pepper jar, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 61. Trứng vịt (ô 22)

- **Lưu thành:** `art-new/goods/duckegg.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: three pale blue-white duck eggs in a small bamboo basket, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 62. Sữa dê (ô 23)

- **Lưu thành:** `art-new/goods/goatmilk.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a small metal milk can of goat milk with a white cloth tied around the lid, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 63. Cá rô phi (ô 24)

- **Lưu thành:** `art-new/goods/tilapia.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a grey-silver tilapia fish with a striped back fin, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 64. Lươn (ô 25)

- **Lưu thành:** `art-new/goods/eel.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a golden-brown rice-field eel curled in an S shape, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 65. Tôm sú (ô 26)

- **Lưu thành:** `art-new/goods/prawn.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a large black tiger prawn with dark stripes, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 66. Nghêu (ô 27)

- **Lưu thành:** `art-new/goods/clam.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: three white-and-brown patterned clams, one slightly open, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 67. Cá chép vàng (ô 28)

- **Lưu thành:** `art-new/goods/lotusfish.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a golden-orange koi carp, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 68. Súp bắp (ô 29)

- **Lưu thành:** `art-new/goods/cornsoup.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a ceramic bowl of creamy corn soup with corn kernels and chopped spring onion, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 69. Bánh bí ngô (ô 30)

- **Lưu thành:** `art-new/goods/pumpkinbread.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a loaf of orange pumpkin bread with one slice cut, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 70. Mứt nho (ô 31)

- **Lưu thành:** `art-new/goods/grapejam.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a glass jar of purple grape jam with a gingham cloth lid and a few grapes beside it, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 71. Kem cà phê (ô 32)

- **Lưu thành:** `art-new/goods/coffeecream.png`
- **Ảnh tham khảo cần tải lên:** không có, vẽ mới hoàn toàn
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

SUBJECT: a glass cup of coffee ice cream topped with whipped cream and coffee beans, game item icon, front three-quarter view, centred, bold readable silhouette at small size.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

## Đợt 3 – Chuồng, vật nuôi, thú cưng

### 72. Chuồng gà

- **Lưu thành:** `art-new/pens/chicken-pen.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/chicken-pen.png`
- **Khung:** ngang 6:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 6:5 landscape (for example 340 x 290).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an empty chicken pen: thatched straw roof on wooden posts, bamboo fence, straw nests, a feed tray, seen from above at 35 degrees, no animals inside.

MUST KEEP: the pen is drawn empty because the game places the animals on top of it.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 73. Chuồng vịt

- **Lưu thành:** `art-new/pens/duck-pen.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/duck-pen.png`
- **Khung:** ngang 6:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 6:5 landscape (for example 340 x 290).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an empty duck pen: bamboo fence, a small wooden shelter, a little blue water pool, seen from above at 35 degrees, no animals inside.

MUST KEEP: the pen is drawn empty because the game places the animals on top of it.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 74. Chuồng bò

- **Lưu thành:** `art-new/pens/cow-pen.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/cow-pen.png`
- **Khung:** ngang 6:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 6:5 landscape (for example 340 x 290).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an empty cow pen: wooden fence, a small barn roof, a hay feeding trough, seen from above at 35 degrees, no animals inside.

MUST KEEP: the pen is drawn empty because the game places the animals on top of it.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 75. Chuồng trâu

- **Lưu thành:** `art-new/pens/buffalo-pen.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/buffalo-pen.png`
- **Khung:** ngang 6:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 6:5 landscape (for example 340 x 290).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an empty water buffalo pen: wooden fence, a muddy wallow, a small thatched shelter, seen from above at 35 degrees, no animals inside.

MUST KEEP: the pen is drawn empty because the game places the animals on top of it.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 76. Chuồng dê

- **Lưu thành:** `art-new/pens/goat-pen.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/goat-pen.png`
- **Khung:** ngang 6:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 6:5 landscape (for example 340 x 290).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an empty goat pen: wooden fence, stacked stone steps to climb, a hay rack, seen from above at 35 degrees, no animals inside.

MUST KEEP: the pen is drawn empty because the game places the animals on top of it.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 77. Chuồng cừu

- **Lưu thành:** `art-new/pens/sheep-pen.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/sheep-pen.png`
- **Khung:** ngang 6:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 6:5 landscape (for example 340 x 290).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an empty sheep pen: low wooden fence, soft grass, a small wooden shelter, seen from above at 35 degrees, no animals inside.

MUST KEEP: the pen is drawn empty because the game places the animals on top of it.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 78. Gà Mơ

- **Lưu thành:** `art-new/pens/chicken-animal.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/chicken-animal.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a plump Vietnamese free-range hen with golden-brown feathers and a small red comb, full body, standing, three-quarter view facing right, feet touching the bottom of the subject area, cute chibi proportions.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 79. Vịt Bầu

- **Lưu thành:** `art-new/pens/duck-animal.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/duck-animal.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a round white Vietnamese duck with an orange bill and feet, full body, standing, three-quarter view facing right, feet touching the bottom of the subject area, cute chibi proportions.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 80. Bò Sữa

- **Lưu thành:** `art-new/pens/cow-animal.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/cow-animal.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a gentle black-and-white dairy cow with a small bell, full body, standing, three-quarter view facing right, feet touching the bottom of the subject area, cute chibi proportions.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 81. Trâu Đồng

- **Lưu thành:** `art-new/pens/buffalo-animal.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/buffalo-animal.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a friendly dark-grey Vietnamese water buffalo with big curved horns, full body, standing, three-quarter view facing right, feet touching the bottom of the subject area, cute chibi proportions.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 82. Dê Núi

- **Lưu thành:** `art-new/pens/goat-animal.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/goat-animal.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a small brown mountain goat with short horns and a little beard, full body, standing, three-quarter view facing right, feet touching the bottom of the subject area, cute chibi proportions.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 83. Cừu Bông

- **Lưu thành:** `art-new/pens/sheep-animal.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/sheep-animal.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a fluffy cream sheep with a cute face, full body, standing, three-quarter view facing right, feet touching the bottom of the subject area, cute chibi proportions.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 84. Biểu tượng gà (nút Chăn nuôi)

- **Lưu thành:** `art-new/chicken.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/chicken.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a cute plump golden-brown hen icon, full body, three-quarter view facing right.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 85. Người câu cá – nữ

- **Lưu thành:** `art-new/pens/fishing-female.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/fishing-female.png`
- **Khung:** ngang 3:2 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 3:2 landscape (for example 1536 x 1024).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cheerful chibi village girl in a conical leaf hat sitting on the end of a small wooden jetty, holding a bamboo fishing rod that points to the right over the water, a small bamboo basket beside her.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 86. Người câu cá – nam

- **Lưu thành:** `art-new/pens/fishing-male.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pens/fishing-male.png`
- **Khung:** ngang 3:2 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 3:2 landscape (for example 1536 x 1024).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cheerful chibi village boy in a conical leaf hat sitting on the end of a small wooden jetty, holding a bamboo fishing rod that points to the right over the water, a small bamboo basket beside him.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 87. Mèo mun

- **Lưu thành:** `art-new/pets/black-cat.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pets/black-cat.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cute black cat with yellow eyes, full body, sitting, three-quarter view, filling about 70% of the canvas.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 88. Chó mực

- **Lưu thành:** `art-new/pets/black-dog.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pets/black-dog.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cute black Vietnamese village dog with a small red collar, full body, sitting, three-quarter view, filling about 70% of the canvas.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 89. Sư tử con

- **Lưu thành:** `art-new/pets/lion.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pets/lion.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cute baby lion with a fluffy golden mane, full body, sitting, three-quarter view, filling about 70% of the canvas.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 90. Bồ câu

- **Lưu thành:** `art-new/pets/pigeon.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/pets/pigeon.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cute plump grey-white pigeon, full body, standing, three-quarter view, filling about 70% of the canvas.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

## Đợt 4 – Phòng chơi bài, quán, nhà riêng, nội thất

### 91. Phòng chơi bài

- **Lưu thành:** `art-new/leisure/room-v45.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/leisure/room-v45.png`
- **Khung:** ngang 16:9 · **Nền:** cảnh kín khung

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 16:9 landscape (for example 1672 x 941).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: the inside of a cosy Vietnamese village house seen from above at 35 degrees: a round wooden card table in the centre, four small wooden chairs around it, a ceiling fan, wooden window shutters with sunlight, potted plants, a wall clock and a woven mat.

MUST KEEP: the table top and the four seats must stay empty because the game draws the players and the cards on them; keep their positions as in the reference.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: the scene fills the whole canvas edge to edge. No border, no frame, no rounded corners, no transparency.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 92. Quán cà phê

- **Lưu thành:** `art-new/housing/venue-cafe.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/housing/venue-cafe.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an isometric cut-away room of an old-style Vietnamese neighbourhood coffee shop: a wooden counter with metal phin coffee filters and glasses, a glass cake cabinet, small wooden tables and low stools, hanging plants, warm lamps. No people.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 93. Khu làm đẹp

- **Lưu thành:** `art-new/housing/venue-beauty.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/housing/venue-beauty.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an isometric cut-away room of a small friendly hair salon: round mirrors with wooden frames, two pink salon chairs, a hair-washing bed, a trolley with combs and bottles, potted plants. No people.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 94. Quán karaoke

- **Lưu thành:** `art-new/housing/venue-karaoke.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/housing/venue-karaoke.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an isometric cut-away room of a family karaoke room: a long red sofa with cushions, a low table with fruit and drinks, a big TV screen showing only colourful shapes (no words), two speakers, a microphone stand, string lights. No people.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 95. Khung nhà riêng (nhà búp bê)

- **Lưu thành:** `art-new/housing/dollhouse-shell.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/housing/dollhouse-shell.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: an empty two-storey house cut open like a dollhouse, seen from an isometric angle: wooden floors, a staircase, windows, a roof, no furniture at all. Walls in a light neutral cream colour (the game recolours the paint).

MUST KEEP: floors, staircase and walls exactly where they are in the reference, because players place furniture on 9 fixed spots.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 96. Mẫu nhà vườn mái chữ A

- **Lưu thành:** `art-new/cells/house-cottage.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/house-cottage.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cosy cottage with a steep A-shaped roof and a small garden porch, shown as a two-storey cut-away dollhouse model at an isometric angle, same size and angle as the reference.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 97. Mẫu nhà phố mái bằng

- **Lưu thành:** `art-new/cells/house-loft.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/house-loft.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a modern Vietnamese town house with a flat roof terrace and big windows, shown as a two-storey cut-away dollhouse model at an isometric angle, same size and angle as the reference.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 98. Mẫu biệt thự mái Pháp

- **Lưu thành:** `art-new/cells/house-mansard.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/house-mansard.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a small French colonial villa with a mansard roof and shutters, shown as a two-storey cut-away dollhouse model at an isometric angle, same size and angle as the reference.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 99. Mẫu nhà gỗ trên đồi

- **Lưu thành:** `art-new/cells/house-chalet.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/house-chalet.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a wooden hillside chalet with a wide balcony, shown as a two-storey cut-away dollhouse model at an isometric angle, same size and angle as the reference.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 100. Nội thất – Sofa

- **Lưu thành:** `art-new/cells/furniture-sofa.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/furniture-sofa.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a soft two-seat sofa with cushions, isometric three-quarter view, centred, simple shapes that look good when the game tints it in other colours.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 101. Nội thất – Bộ bàn ghế ăn

- **Lưu thành:** `art-new/cells/furniture-table.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/furniture-table.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a round wooden dining table with two chairs, isometric three-quarter view, centred, simple shapes that look good when the game tints it in other colours.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 102. Nội thất – Giường

- **Lưu thành:** `art-new/cells/furniture-bed.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/furniture-bed.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a double bed with a quilt and pillows, isometric three-quarter view, centred, simple shapes that look good when the game tints it in other colours.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 103. Nội thất – Đèn cây

- **Lưu thành:** `art-new/cells/furniture-lamp.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/furniture-lamp.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a tall floor lamp with a warm fabric shade, isometric three-quarter view, centred, simple shapes that look good when the game tints it in other colours.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 104. Nội thất – Chậu cây

- **Lưu thành:** `art-new/cells/furniture-plant.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/furniture-plant.png`
- **Khung:** vuông 1:1 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a leafy indoor plant in a ceramic pot, isometric three-quarter view, centred, simple shapes that look good when the game tints it in other colours.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 105. Nội thất – Tranh treo tường

- **Lưu thành:** `art-new/cells/furniture-art.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/furniture-art.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached the current version of this item. Use it only for what the object is and its rough shape; draw a brand-new, more polished version in the STYLE below.

SUBJECT: a framed painting of a flower, isometric three-quarter view, centred, simple shapes that look good when the game tints it in other colours.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 106. Nhân viên Mai (quán cà phê)

- **Lưu thành:** `art-new/cells/staff-mai.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/staff-mai.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a friendly chibi young woman shop assistant with short dark hair, holding a tray with a cup of coffee, wearing a brown apron, full body, standing, front view.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 107. Nhân viên Linh (khu làm đẹp)

- **Lưu thành:** `art-new/cells/staff-linh.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/staff-linh.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a friendly chibi young woman shop assistant with short dark hair, holding scissors and a comb, wearing a dark apron, full body, standing, front view.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 108. Nhân viên Hiền (karaoke)

- **Lưu thành:** `art-new/cells/staff-hien.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/cells/staff-hien.png`
- **Khung:** vuông 1:1 · **Nền:** xanh lá #00FF00

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 1:1 square.

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a friendly chibi young woman shop assistant with short dark hair, holding a microphone, wearing a smart vest and skirt, full body, standing, front view.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure green colour #00FF00 filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this bright green anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

## Đợt 5 – Nhân vật và trang phục


Nhân vật trong game được ghép từ nhiều lớp chồng lên nhau, mỗi lớp là một ảnh 320 × 400 px: tóc sau, thân và quần áo, tóc trước, giày. Các lớp phải khít nhau từng pixel, việc AI làm chưa tốt. **Nên làm thử một bộ trước**: `art-ref/fashion/rig-female-base.png`, `art-ref/fashion/hair-bob.png`, `art-ref/fashion/hair-bob-front.png`, `art-ref/fashion/feet/feet-female-base-sneakers.png`. Gửi Claude kiểm tra độ khít rồi mới làm tiếp.

### 109. Nhân vật nữ (màn tạo nhân vật)

- **Lưu thành:** `art-new/farmer.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/farmer.png`
- **Khung:** dọc 4:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 4:5 portrait (for example 320 x 400).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cheerful chibi village girl, head about 40-45% of the total height, dot eyes, rosy cheeks, wearing a conical leaf hat, a teal shirt and brown shorts, sandals, standing, front view.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 110. Nhân vật nam (màn tạo nhân vật)

- **Lưu thành:** `art-new/farmer-male.png`
- **Ảnh tham khảo cần tải lên:** `art-ref/farmer-male.png`
- **Khung:** dọc 4:5 · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 4:5 portrait (for example 320 x 400).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: a cheerful chibi village boy, head about 40-45% of the total height, dot eyes, rosy cheeks, wearing a conical leaf hat, a teal shirt and brown shorts, sandals, standing, front view.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

### 111. Câu lệnh dùng chung cho mọi lớp nhân vật

- **Dùng cho:** mọi file trong `art-ref/fashion/` (36 `rig-`, 8 `body-`, 16 `hair-`, 6 `preview-shoes-`) và `art-ref/fashion/feet/` (216 `feet-`), tổng 282 file.
- **Cách dùng:** mỗi lần tải lên **một** file trong các thư mục đó và gửi đúng câu lệnh này; không cần sửa chữ.
- **Lưu thành:** `art-new/fashion/` + đúng tên file đã tải lên (ví dụ tải `art-ref/fashion/rig-female-aodai.png` thì lưu `art-new/fashion/rig-female-aodai.png`).
- **Khung:** dọc 4:5 (riêng `preview-shoes-` có thể vuông) · **Nền:** hồng tím #FF00FF

```text
Generate exactly one image now (do not reply with text only).

ASPECT RATIO: 4:5 portrait (for example 320 x 400).

REFERENCE: I attached a reference image. Redraw it as a brand-new illustration in the STYLE below. Keep exactly the same composition, camera angle, framing, and the position, size and shape of every object, building, path and empty area. Change only the drawing style, colours and level of polish.

SUBJECT: the attached image is ONE LAYER of a paper-doll character (it may be the whole body, only the hair, or only the shoes). Redraw exactly that layer and nothing else: if it shows only hair, draw only the hair; if it shows only shoes and trouser hems, draw only those.

MUST KEEP: the exact same canvas size, the exact same position and size of every part, the exact same pose, so the layers still stack perfectly on top of each other. Do not add a body, face or background objects that are not in the reference.

STYLE: cozy hand-painted 2D cartoon art for a mobile farming game set in a nostalgic Vietnamese seaside countryside village of the 1995-2010 era. Flat colours with soft 2-3 tone cel shading. Warm dark-brown outlines (#5A3920), never pure black; inner detail lines thinner and lighter. Soft morning sunlight from the top-left, soft warm shadows falling to the bottom-right. Warm cheerful palette: cream #FFF8E8, wood brown #B9783C, dark wood #7A4620, terracotta roof red #D2603C, sunny yellow #F8CA4C, leaf green #7DB446, dark leaf #4E7F27, sea blue #4AA6CC. Cute rounded shapes, clean silhouettes, easy to read at small size.

BACKGROUND: one flat, solid, pure magenta colour #FF00FF filling the entire canvas behind the subject. No ground, no floor, no cast shadow on the background, no gradient, no vignette. Do not use this magenta anywhere on the subject. Keep about 8% empty margin around the subject so nothing touches the edges.

DO NOT include any text, letters, numbers, signs with writing, logos, watermarks or signatures. No photorealism, no 3D render look, no pure black outlines, no night lighting.
```

**Giảm khối lượng:** 216 file `feet-` là giày đã khớp sẵn với gấu quần của từng bộ đồ. Nếu muốn chỉ vẽ 12 lớp giày (2 giới tính × 6 đôi), báo Claude trước để sửa code; khi đó chỉ cần vẽ lại `feet-{giới}-base-{giày}.png`.

## Thông số đích (Claude dùng khi ghép)

| Ảnh trong game | Kích thước | Ghép từ |
| --- | --- | --- |
| `farm.png`, `pond.png`, `pond/lake-v44.png` | 1536 × 1024 | 1 ảnh |
| `village-map.png`, `leisure/room-v45.png` | 1672 × 941 | 1 ảnh; tạo lại `village-map-blur.png` rộng 48 px |
| `housing/venue-*.png` | 512 × 512 | 1 ảnh |
| `soil-avatar.png` | 1254 × 1254, lưới 2 × 2 | `cells/soil-1…4` |
| `crops-new.png` | 1254 × 1254, lưới 3 × 2 | `cells/crop-grape, blueberry, watermelon, pineapple, sunflower, cotton` |
| `vietnam-food-atlas.png` | 1448 × 1086, lưới 4 × 3 | `food/` theo thứ tự mục 4 |
| `goods-atlas.png` (mới) | 2048 × 1024, lưới 8 × 4 | `goods/` theo thứ tự ô 1–32 |
| `housing/house-models.png` | 1254 × 1254, lưới 2 × 2 | `cells/house-cottage, loft, mansard, chalet` |
| `housing/cartoon-furniture.png` | 1536 × 1024, lưới 3 × 2 | `cells/furniture-sofa, table, bed, lamp, plant, art` |
| `housing/service-staff.png` | 2172 × 724, lưới 3 × 1 | `cells/staff-mai, linh, hien` |
| `housing/dollhouse-shell.png` | 1254 × 1254 | 1 ảnh |
| `pens/*-pen.png` | khoảng 340 × 290 | 1 ảnh mỗi chuồng, giữ kích thước file cũ |
| `pens/*-animal.png`, `chicken.png`, cây trồng, vật phẩm | giữ kích thước file cũ | 1 ảnh |
| `pets/*.png` | 560 × 560 | 1 ảnh |
| `fashion/*.png` | 320 × 400 (preview-shoes giữ kích thước cũ) | 1 ảnh mỗi lớp |
