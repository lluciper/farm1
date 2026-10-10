# Nhật ký thay đổi · Làng Mây

Mỗi lần đẩy code lên, ghi thêm một mục theo ngày (dd/mm/yyyy), mới nhất ở trên cùng.

---

## 10/10/2026

### Chuồng trại
- Chia chuồng theo từng dãy. Nhân vật đi lại được giữa các chuồng.
- Chuồng dựng 3D, to hơn, mỗi loài một kiểu chuồng riêng. Bỏ nền cỏ.

### Nhân vật
- Thêm chuyển động phụ: tà áo dài, tóc và nón đung đưa khi đi.
- Làm lại tóc theo các kiểu hiện đại, cùng quần áo và giày.
- Khớp tay chân cong mượt, không còn gấp khúc.
- Sửa lỗi tóc bị lẹm hoặc mất khi gắn lên đầu, cho mọi mẫu tóc.

### Làng
- Vẽ lại lối đi: nhân vật không đi xuyên qua nhà, cây, nước hay ruộng.
- Đặt nhãn các khu đúng vị trí. Test: `village-paths`.

### Hiệu năng
- Tối ưu để máy yếu và điện thoại chạy mượt hơn.

### Siêu thị · Tiệm nón
- Tách nón khỏi tiệm may thành tiệm riêng, có hơn chục loại nón.
- Người chơi được tặng Nón lá và đang đội sẵn. Save cũ giữ nguyên ngoại hình. Test: `headwear`.

### Ao cá
- **Câu cá:** quăng cần, chờ cá cắn câu, giữ phím Space để giữ thanh lực. Có thể hụt cá. Test: `fishing-miss`.
- **Thả lưới:**
  - Thấy lưới trên mặt nước. Khi thu hoạch, hiện tấm lưới với cá tôm mắc trong đó.
  - Tối đa 4 lưới, lưới to hơn. Lưới cũ vượt quá 4 được dồn vào 4 ô, phần thừa thu luôn.
  - Mỗi mẻ được loại đã chọn ×1,5 cộng thêm 1–3 con ngẫu nhiên. Test: `nets-v13`.

### Khu giải trí
- **Phỏm:** người làm cái được bốc ngẫu nhiên mỗi ván; trước đây luôn là người chơi. Test: `phom-dealer`.
- **Cờ caro (trò mới, chơi với máy):**
  - Bàn 15×15, 5 quân liền nhau thì thắng. Ai đi trước được bốc ngẫu nhiên.
  - Thắng nhận gấp đôi tiền cược, hoà được hoàn tiền.
  - Chơi cẩn thận thắng được khoảng 1/3 số ván. Test: `caro`.

### Nhà riêng
- Giữ ảnh nhà vẽ tay ban đầu.
- Đo lại khung phòng của cả 7 mẫu nhà: đồ đứng đúng trên sàn, không lấn cột, cửa sổ hay ra ngoài nhà.
- Tranh treo phẳng trên tường sau. Kích thước đồ tính theo khung phòng.
- "Sắp xếp gọn" đặt đồ đúng công năng. Kéo thả luôn rơi vào trong nhà. Test: `house-fit`.

### Phố đi bộ · Công viên Mây
- **Toàn màn hình:** bản đồ phủ kín màn hình, camera đi theo nhân vật. Bảng trò chuyện bật/tắt được.
- **Thu phóng:** nút ＋/－ hoặc con lăn chuột. Mặc định thu nhỏ để thấy gần hết quảng trường.
- **Đi lại:** chạm lối đi thì nhân vật tự tìm đường, hoặc dùng phím mũi tên/WASD. Không đi xuyên ghế, bồn hoa, bãi cỏ hay đài nước. Test: `street-park`.
- **Tỉ lệ:** nhân vật cao gần bằng chiều dài ghế đá và co giãn theo bản đồ.
- **Hướng quay:**
  - Đi thì quay theo hướng đi.
  - Ngồi thì quay theo hướng ghế. Hai ghế dưới nhìn từ phía sau nên thấy lưng người ngồi.
  - Ước thì quay mặt vào đài nước.
- **Đồ trong quảng trường:**
  - 4 ghế đá: tự chọn chỗ trống, báo bận khi hết chỗ.
  - Xích đu: đung đưa.
  - Đài phun nước: thả xu ước, đồng xu bay vào và mặt nước gợn sóng.
  - Sân nhảy: nhảy.
- **Tương tác giữa người chơi:**
  - Tự đi lại gần người được chọn trước khi tương tác.
  - Hai người quay mặt vào nhau.
  - Đấm: hai tay thay nhau tung nắm đấm, người bị đấm giơ tay đỡ rồi bật lùi.
  - Nắm tay: đứng sát, đưa tay nắm và đung đưa.
  - Thơm má: nghiêng người lại gần, trái tim bay lên.
- **Nhân vật phụ Cô Hoa** (chỉ trên máy người chơi, không gửi lên server):
  - Tự đi dạo, ngồi ghế, đu xích đu, thả xu ước, nhảy.
  - Đáp lại nắm tay, thơm má, đấm (có đấm trả) và trả lời chat chung.
  - Thỉnh thoảng rủ nắm tay. Khi đang nắm tay thì đi theo bạn. Hay sang ngồi cạnh khi bạn ngồi ghế.
- **Server:**
  - Nhận vị trí ghế và xích đu (y từ 15).
  - Thêm kiểu tương tác `wish`.
  - Bỏ việc server tự dịch vị trí người đồng ý nắm tay.

### Kiểm thử
- Test mới: `caro`, `phom-dealer`, `house-fit`, `street-park`, `headwear`, `fishing-miss`, `nets-v13`, `village-paths`.
- Cập nhật:
  - `street.mjs`: biên vị trí mới, tương tác `wish`, vị trí ghế.
  - `ui-smoke`: bổ sung DOM giả lập cho nhân vật phụ.
  - `built-smoke`: số phiên bản file.
- Kết quả: 42 file test đạt, build đạt. 23 file test cũ vẫn lỗi như trước các thay đổi này (thiếu migration, API engine cũ).
