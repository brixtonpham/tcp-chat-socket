# TEST 04: NHÓM CHAT (GROUP CHAT)

Test chức năng tạo và quản lý nhóm chat

> Run these commands from the repository root (where you ran `git clone` or `git pull`).
> Example: `cd /path/to/tcp-chat-socket`

---

## CHUẨN BỊ: Mở 3 terminal client

### Terminal 1 - Alice:
```
register alice password123 alice@email.com
login alice password123
```

### Terminal 2 - Bob:
```
register bob password456 bob@email.com
login bob password456
```

### Terminal 3 - Charlie:
```
register charlie pass789 charlie@email.com
login charlie pass789
```

---

## KỊCH BẢN 1: Tạo nhóm mới

### Terminal 1 (Alice) - Tạo nhóm:
```
group create TeamA Nhóm học tập Network Programming
```

# Kết quả: "Group created successfully! Group ID: 1"

### Tạo thêm nhóm:
```
group create ProjectX Dự án cuối kỳ
```

# Kết quả: "Group created successfully! Group ID: 2"

---

## KỊCH BẢN 2: Mời thành viên vào nhóm

### Terminal 1 (Alice) - Mời Bob (ID=2) vào nhóm TeamA (ID=1):
```
group invite 1 2
```

# Bob nhận được: "[GROUP INVITE] alice invited you to join 'TeamA' (ID: 1)"

### Terminal 1 (Alice) - Mời Charlie (ID=3) vào nhóm TeamA:
```
group invite 1 3
```

# Charlie nhận được thông báo mời

---

## KỊCH BẢN 3: Tham gia nhóm

### Terminal 2 (Bob) - Tham gia nhóm TeamA (ID=1):
```
group join 1
```

# Kết quả: "Joining group..."

### Terminal 3 (Charlie) - Tham gia nhóm TeamA:
```
group join 1
```

---

## KỊCH BẢN 4: Gửi tin nhắn nhóm

### Terminal 1 (Alice) - Gửi tin nhắn vào nhóm TeamA (ID=1):
```
group msg 1 Xin chào các thành viên TeamA! Đây là tin nhắn đầu tiên.
```

# Bob và Charlie nhận được: "[GROUP TeamA - alice]: Xin chào các thành viên TeamA!"

### Terminal 2 (Bob) - Trả lời trong nhóm:
```
group msg 1 Chào Alice! Bob đã vào nhóm.
```

# Alice và Charlie nhận được tin nhắn

### Terminal 3 (Charlie) - Gửi tin nhắn:
```
group msg 1 Hello mọi người! Charlie here.
```

# Alice và Bob nhận được tin nhắn

---

## KỊCH BẢN 5: Xóa thành viên khỏi nhóm (Admin only)

### Terminal 1 (Alice - Admin nhóm) - Xóa Charlie (ID=3) khỏi nhóm TeamA (ID=1):
```
group remove 1 3
```

# Kết quả: "Removing user from group..."
# Charlie sẽ nhận thông báo bị xóa khỏi nhóm

### Kiểm tra: Charlie gửi tin vào nhóm sau khi bị xóa:
```
# Terminal 3 (Charlie):
group msg 1 Test tin nhắn sau khi bị xóa
```

# Lỗi: Không thể gửi (không còn là thành viên)

### Kiểm tra lỗi: Bob (không phải admin) cố xóa Alice:
```
# Terminal 2 (Bob):
group remove 1 1
```

# Lỗi: "Not admin"

---

## KỊCH BẢN 6: Rời khỏi nhóm

### Terminal 2 (Bob) - Rời nhóm TeamA (ID=1):
```
group leave 1
```

# Kết quả: "Leaving group..."

### Kiểm tra: Bob gửi tin vào nhóm sau khi rời:
```
group msg 1 Test tin nhắn sau khi rời nhóm
```

# Lỗi: Không thể gửi (không còn là thành viên)

---

## KỊCH BẢN 7: Test nhiều nhóm

### Terminal 2 (Bob) - Tạo nhóm riêng:
```
group create BobGroup Nhóm của Bob
```

### Terminal 2 (Bob) - Mời Alice (ID=1) vào nhóm:
```
group invite 3 1
```

### Terminal 1 (Alice) - Tham gia nhóm BobGroup:
```
group join 3
```

### Gửi tin nhắn qua lại:
```
# Terminal 1 (Alice):
group msg 3 Alice đã vào nhóm của Bob!

# Terminal 2 (Bob):
group msg 3 Chào mừng Alice!
```

---

## KỊCH BẢN 8: Kiểm tra lỗi

```
# Gửi tin vào nhóm không tồn tại:
group msg 999 Test tin nhắn

# Tham gia nhóm không tồn tại:
group join 999

# Mời user không tồn tại:
group invite 1 999

# Mời khi không phải thành viên:
# (Dùng Charlie, đã rời nhóm 1)
group invite 1 2
```

---

### KẾT QUẢ MONG ĐỢI:

- Tạo nhóm thành công: "Group created successfully! Group ID: X"
- Mời thành viên: "Invitation sent"
- Tham gia nhóm: "Joining group..."
- Gửi tin nhóm: "Group message sent successfully"
- Nhận tin nhóm: "[GROUP <name> - <sender>]: <message>"
- Xóa thành viên (admin): "Removing user from group..."
- Rời nhóm: "Leaving group..."
