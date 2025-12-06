# TEST 03: NHẮN TIN TRỰC TIẾP

Test chức năng chat 1-1 giữa 2 người dùng

Yêu cầu: Alice (ID=1) và Bob (ID=2) đã là bạn bè


> Run these commands from the repository root (where you ran `git clone` or `git pull`).
> Example: `cd /path/to/tcp-chat-socket`

---

## CHUẨN BỊ: Kết bạn trước nếu chưa có

### Terminal 1 - Alice:
```
register alice password123 alice@email.com
login alice password123
```

### Terminal 2 - Bob:
```
register bob password456 bob@email.com
login bob password456
friend add alice
```

### Terminal 1 (Alice) chấp nhận:
```
friend accept 2
```

---

## KỊCH BẢN 1: Gửi tin nhắn khi cả 2 online

### Terminal 1 (Alice) - Gửi tin nhắn cho Bob (ID=2):
```
msg 2 Xin chào Bob! Đây là tin nhắn từ Alice.
```

# Bob nhận được: "[MESSAGE from alice]: Xin chào Bob! Đây là tin nhắn từ Alice."

### Terminal 2 (Bob) - Trả lời Alice (ID=1):
```
msg 1 Chào Alice! Mình là Bob. Rất vui được gặp bạn!
```

# Alice nhận được: "[MESSAGE from bob]: Chào Alice! Mình là Bob. Rất vui được gặp bạn!"

---

## KỊCH BẢN 2: Tin nhắn dài

### Terminal 1 (Alice):
```
msg 2 Đây là một tin nhắn rất dài để test khả năng xử lý tin nhắn lớn của hệ thống. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
```

---

## KỊCH BẢN 3: Tin nhắn tiếng Việt có dấu

### Terminal 1 (Alice):
```
msg 2 Xin chào! Đây là tin nhắn tiếng Việt có đầy đủ dấu.
```

### Terminal 2 (Bob):
```
msg 1 Cảm ơn bạn! Tiếng Việt hoạt động tốt.
```

---

## KỊCH BẢN 4: Kiểm tra lỗi - Gửi tin cho người không phải bạn bè

### Terminal 1 (Alice) - Gửi tin cho Charlie (ID=3, không phải bạn):
```
msg 3 Test tin nhắn
```

# Lỗi: "Failed to send message: Not friends"

---

## KỊCH BẢN 5: Tin nhắn offline (Offline Messages)

### Terminal 2 (Bob) - Đăng xuất:
```
logout
```

### Terminal 1 (Alice) - Gửi tin nhắn khi Bob offline:
```
msg 2 Tin nhắn này gửi khi Bob offline. Bạn sẽ nhận được khi đăng nhập lại!
msg 2 Đây là tin nhắn thứ 2 gửi offline.
```

### Terminal 2 (Bob) - Đăng nhập lại:
```
login bob password456
```

# Bob sẽ nhận được tất cả tin nhắn offline từ Alice

---

### KẾT QUẢ MONG ĐỢI:

- Gửi tin nhắn thành công: "Message sent successfully"
- Nhận tin nhắn: "[MESSAGE from <username>]: <content>"
- Gửi cho người không phải bạn: "Failed to send message: Not friends"
- Tin nhắn offline được lưu và gửi khi user đăng nhập lại
