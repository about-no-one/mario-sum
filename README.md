# Super Mario – Vue 3 (Vite, chỉ frontend)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # xuất ra dist/ – host tĩnh ở đâu cũng được
```

## Cấu trúc
```
src/
  App.vue / main.js / style.css
  components/    Hud.vue · Overlay.vue · TouchPad.vue · GameCanvas.vue (gắn engine vào <canvas>)
  game/
    constants.js   kích thước NES 256x224, ô 16px
    save.js        đọc/ghi localStorage, kiểm tra & làm sạch dữ liệu lưu
    state.js       `hud` reactive (điểm, xu, mạng, giờ, trạng thái) – Vue đọc, engine ghi
    input.js       bàn phím + nút cảm ứng, "edge" cho nhảy/bắn
    audio.js       hiệu ứng âm thanh WebAudio
    physics.js     va chạm AABB theo ô, moveX/moveY
    levels.js      danh sách 32 màn (8 thế giới x 4 màn)
    levelgen.js    bộ sinh màn theo hạt giống: x-1 mặt đất, x-2 hầm ngầm, x-3 ngọn cây, x-4 lâu đài + Bowser
    rng.js         bộ sinh số ngẫu nhiên có hạt giống
    level1-1.js    World 1-1 (lưới ký tự, kẻ địch, ống cống vào được)
    level1-2.js    World 1-2 (hầm ngầm, Buzzy Beetle)
    level1-4.js    World 1-4 (lâu đài: dung nham, thanh lửa, cầu, Bowser, rìu, Toad)
    level-warp.js  phòng Warp Zone (3 ống dẫn tới 3 thế giới)
    level-under.js phòng thưởng xu: Mario rơi từ ống trên trần, thoát bằng ống nằm ngang
    music.js       nhạc nền chiptune (over / under / star), sáng tác gốc
    sprites.js     sprite pixel-art dạng chuỗi ký tự -> canvas
    player.js      Mario: nhỏ / lớn / lửa, trượt phanh, nhảy biến thiên
    enemies.js     Goomba, Koopa xanh/đỏ, Buzzy Beetle, Piranha Plant, Bowser, Hammer Bro, Bullet Bill + súng thần công, Lakitu + Spiny, Cheep Cheep, Blooper
    items.js       Nấm, Hoa lửa, Cầu lửa, 1-Up, Starman, Xu, Thanh lửa, Rìu, Toad, Lửa Bowser
    fx.js          gạch vỡ, xu bật, điểm bay
    renderer.js    vẽ nền, tile, cột cờ, lâu đài
    engine.js      vòng lặp 60 FPS, luật chơi, kết thúc màn
```

## Mở rộng
- **Màn mới:** viết `buildLevelX()` trả về `{ grid, cols, enemies, coins, things, theme, music, flagCol, castleCol }` rồi thêm vào mảng `LEVELS` trong `engine.js`. `theme`: `over` | `under` | `castle`.
- **Kẻ địch mới:** viết class kế thừa `Enemy` trong `enemies.js` (cài `stomp`, `touch`, `draw`), thêm vào `ENEMIES` ở `engine.js`, rồi đặt `{ kind: 'tên', c, r }` trong màn chơi.
- **Power-up mới (Starman, 1-Up…):** kế thừa `Rising` trong `items.js`, thêm sprite, xử lý trong `Game.powerUp()`, và đặt vào hộp ở `bumpBlocks()`.
- **Sprite thật:** thay `getSprites()` bằng spritesheet – phần còn lại chỉ dùng `drawSprite()`.

## Tính năng bổ sung
- **Ngồi** (↓) với Mario lớn/lửa; chỉ đứng dậy khi phía trên còn chỗ.
- **Starman** (hộp `T`): bất tử ~10 giây, húc kẻ địch là hạ, đổi nhạc sang bản `star`.
- **1-Up**: khối ẩn `H` (cột 64) chỉ hiện khi đội đầu từ dưới lên; cũng cộng mạng khi giẫm chuỗi 8+ kẻ địch hoặc đủ 100 xu.
- **Ống cống vào được:** thêm `{ c, r, to: 'under' }` vào `pipes` của màn; đứng giữa miệng ống rồi bấm ↓.
- **Hầm ngầm:** `level-under.js`; ống nằm ngang bên phải (bấm →) đưa về ống cột 163. Trạng thái 1-1 được lưu và khôi phục.
- **Nhạc nền:** sửa `TRACKS` trong `music.js` (cú pháp `NỐT:SỐ_PHÁCH`) hoặc thay bằng file âm thanh của bạn. Phím M tắt/bật âm thanh.
- **Màn 1-2 / 1-4:** qua màn bằng cột cờ (1-1, 1-2); ở 1-4 hạ Bowser bằng 5 cầu lửa hoặc chạm rìu cuối cầu (cầu sập, Bowser rơi), rồi chạm Toad để thắng.
- **Gạch 10 xu `C`**, **khối ẩn `H`**, **hộp Starman `T`** theo vị trí trong World 1-1 gốc.
- **Sprite Mario lớn/ngồi** vẽ tay 16×32 (không còn kéo giãn); chỉnh trong `sprites.js` (`HEAD_B`, `TORSO_B`, `LEGS_B`, `CROUCH_B`).

## 32 màn
- **Chọn màn** ở màn hình đầu: 8 thế giới × 4 màn, mở khóa dần theo tiến độ (lưu trong `localStorage`). Mở thẳng một màn để thử: `http://localhost:5173/?level=5-2`.
- 1-1, 1-2, 1-4 thiết kế tay; các màn còn lại do `levelgen.js` sinh ra, **cố định** theo số màn (cùng hạt giống). Độ khó tăng dần: nhiều kẻ địch hơn, hố rộng hơn, Piranha Plant, Koopa đỏ, Buzzy, thanh lửa nhiều hơn, Bowser nhiều máu và phun lửa nhanh hơn; trời đêm ở một số màn.
- Cuối mỗi lâu đài (x-4): hạ Bowser bằng 5+ cầu lửa hoặc chạm rìu, chạm Toad để sang thế giới kế. Cuối 8-4 cứu Peach để thắng.
- Muốn chỉnh một màn sinh tự động: đổi hạt giống/tham số trong `levelgen.js`, hoặc thay mục tương ứng trong `levels.js` bằng hàm `buildLevel` tự viết.

## Mở rộng: nước, trùm phụ, Warp Zone
- **Màn dưới nước (2-2, 7-2):** `theme: 'water'`, `water: true`, `dryFrom` (cột bắt đầu phần trên bờ). Bấm nhảy liên tục để bơi; rơi chậm, đi ngang tối đa 1.3. Cheep Cheep xanh (chậm) / đỏ (nhanh) bơi lượn sóng; giẫm được.
- **Cheep Cheep phóng vọt** từ vực ở 2-3, 5-3, 7-3 (`cheep: { c0, c1 }` trong dữ liệu màn).
- **Bullet Bill:** đặt ô `Y` (nòng) trên `y` (đế) trong lưới màn; súng chỉ bắn khi nằm trong màn hình và Mario cách ≥ 56px, tối đa 3 viên cùng lúc.
- **Hammer Bro** (từ thế giới 4): đi tuần, nhảy, ném búa vòng cung; giẫm = 1000 điểm.
- **Lakitu** (4-1, 6-1, 8-1): bám theo Mario, thả trứng nở thành Spiny (giẫm cũng bị thương); hạ Lakitu thì ~9 giây sau có con mới; rời đi khi Mario qua cột `to`.
- **Warp Zone:** đứng giữa miệng ống rồi bấm ↓. **1-2: ống ở cột 92** → ống tới thế giới 2, 3, 4. **4-2: ống ở cột 90** → thế giới 6, 7, 8. Thêm Warp Zone mới bằng `pipes: [{ c, r, to: 'warp', worlds: [..] }]`.
- Thêm kẻ địch: viết class trong `enemies.js`, đăng ký vào `ENEMIES` ở `engine.js`, dùng `{ kind, c, r }` trong màn chơi.

## Lưu & tải tiến độ
- **4 ô lưu:** *Tự động* + 3 ô thủ công. Mỗi ô là ảnh chụp **tại đầu màn**: thế giới–màn, điểm, xu, mạng, dạng Mario (nhỏ/lớn/lửa).
- **Tự động lưu** khi qua màn, chui ống Warp, và khi game over (cho phép "Tiếp tục" đúng màn vừa thua với 3 mạng, điểm 0). Thắng toàn bộ thì xóa bản tự động.
- **Lưu thủ công:** nhấn `P` (tạm dừng) → *Lưu game* → chọn ô 1/2/3. **Tải:** màn hình đầu → *Tải game đã lưu* (hoặc nút *Tiếp tục* cho ô tự động).
- **Xuất / nhập file JSON** để chuyển sang trình duyệt khác. Dữ liệu nhập luôn được kiểm tra và kẹp về khoảng hợp lệ; file hỏng bị từ chối và không ghi đè dữ liệu hiện có.
- Cũng lưu: điểm cao nhất, màn đã mở khóa, cài đặt (âm thanh, chế độ khám phá). Khóa lưu trữ: `mario-vue-save-v1` (tự chuyển dữ liệu từ khóa cũ `mario-vue-unlocked`).
- Mario giữ dạng (lớn/lửa) khi sang màn mới; chết thì về dạng nhỏ.

## Chế độ khám phá (bất tử)
Bật ở màn hình đầu, trong menu tạm dừng, hoặc phím `G`. Khi bật: không nhận sát thương, không tính giờ, rơi xuống hố/dung nham thì được đưa về chỗ đứng an toàn gần nhất; Mario hơi trong suốt và HUD hiện *MODE EXPLORE*. Ván chơi dùng chế độ này **không được tính vào điểm cao nhất**.

## Blooper, Bowser giả, xếp hạng thời gian
- **Blooper (mực)** – chỉ ở màn dưới nước (2 con ở 2-2, 7 con ở 7-2): phóng chéo về phía Mario rồi chìm xuống, lặp lại. Giẫm hoặc cầu lửa đều hạ được.
- **Bowser giả** – lâu đài thế giới 1–7 là *Bowser giả*: bị **2 cầu lửa** thì lộ nguyên hình (popup `FAKE!`, +1000) thành Goomba (1-4, 2-4), Koopa (3-4), Buzzy Beetle (4-4), Spiny (5-4), Hammer Bro (6-4), Koopa đỏ (7-4). Kẻ bị lộ vẫn đứng trên cầu; chạm rìu vẫn qua màn như thường. Chỉ **8-4 là Bowser thật** (xem mục *Bowser thật ở 8-4* bên dưới). Dữ liệu màn: `{ kind: 'bowser', fake: 'goomba', hp: 2 }`; bảng kẻ có thể bị lộ là `FAKES` trong `enemies.js`.
- **Xếp hạng thời gian** – mỗi màn lưu **top 5** thời gian nhanh nhất, xem ở màn hình đầu (*Xếp hạng thời gian*: top 5 của màn đang chọn + bảng kỷ lục cả 32 màn + tổng thời gian). Đồng hồ đếm theo khung hình (60 khung = 1 giây) nên không phụ thuộc tốc độ máy; **không tính** màn giới thiệu, lúc tạm dừng hay lúc bị mất mạng (màn chơi lại thì đếm lại từ 0). Thời gian dừng khi chạm cột cờ (hoặc cứu Toad/Peach ở lâu đài). Có hiện thông báo hạng/kỷ lục, thẻ giới thiệu màn hiện `BEST`, và menu tạm dừng hiện thời gian màn hiện tại.
- **Không xếp hạng** nếu đã bật chế độ khám phá ở bất kỳ lúc nào trong lượt chơi màn đó. Chui ống Warp bỏ qua màn nên không có thời gian cho các màn bị bỏ qua. Dữ liệu nằm trong bản lưu (`times`), được xuất/nhập cùng file lưu.

## Bowser thật ở 8-4
Bowser thật có **8 máu** (thanh máu hiện trên đầu màn hình), **2 giai đoạn**, và mọi đòn đều có **báo trước** để người chơi kịp phản ứng. Sau mỗi lần trúng cầu lửa, Bowser miễn nhiễm 24 khung (0.4 giây) nên không thể "ăn" 2 máu chỉ bằng 2 cầu lửa bắn cùng lúc.

| Đòn | Báo trước | Cách né | Giai đoạn |
|---|---|---|---|
| **Phun lửa** | mở miệng ~0.4 giây | nhảy qua / ngồi tránh | 1: 1 quả · 2: 3 quả liên tiếp (cao → thấp) |
| **Ném búa** | giơ búa lên | búa rơi quanh chỗ Mario *lúc ném*: đi chỗ khác | 1: 3 cây · 2: 4 cây, nhanh hơn |
| **Đập đất** | gập người, nhảy cao, chớp trắng | nhảy qua **sóng xung kích** chạy dọc cầu | 1: 1 cặp sóng · 2: thêm cặp sóng nhanh hơn |
| **Lao tới** | giậm chân + chớp trắng 0.6 giây | nhảy qua đầu Bowser rồi lùi ra xa (đừng đứng sát tường) | chỉ giai đoạn 2 |
| **Mưa đá** | vạch đỏ `!` trên sàn ~0.7 giây | bước ra khỏi vạch (viên đầu nhắm vào chỗ bạn đứng) | chỉ giai đoạn 2 |

- **Nổi điên** khi còn ≤ 4 máu: gầm (rung màn hình, mưa đá), đổi màu cam, mắt đỏ, đi và tấn công nhanh hơn, mở thêm 2 đòn mới và đổi nhạc (`rage`).
- **Rìu bị khóa** cho tới khi Bowser thật gục (chạm vào chỉ hiện `LOCKED!`), nên không thể chạy thẳng qua cầu. Để không bị kẹt: có 2 khối hoa lửa/nấm ngay trước đấu trường, và nếu Mario không ở dạng lửa thì sau ~2.5 giây một **Hoa Lửa** sẽ xuất hiện bên trái đấu trường.
- Hạ Bowser: mọi đòn đang bay bị xóa, rìu mở khóa → chạm rìu cầu sập → Peach.
- Starman, chế độ khám phá đều miễn nhiễm mọi đòn nhưng vẫn phải dùng cầu lửa để hạ Bowser.
- Thêm đòn mới: viết thêm `case` trong `realThink()` (`enemies.js`) và thêm tên đòn vào danh sách trong `startAttack()`.
