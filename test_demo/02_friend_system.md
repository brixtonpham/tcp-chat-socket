# TEST 02: HỆ THỐNG KẾT BẠN

Test chức năng quản lý bạn bè (Friend System)

Yêu cầu: Đã có 2 user alice (ID=1) và bob (ID=2) được đăng ký từ Test 01

> Run these commands from the repository root (where you ran `git clone` or `git pull`).
> Example: `cd /path/to/tcp-chat-socket`

---

## CHUẨN BỊ: Mở 2 terminal client

### Terminal 1 - Alice:
```
login alice password123
```

### Terminal 2 - Bob:
```
login bob password456
```

---

## KỊCH BẢN 1: Gửi lời mời kết bạn

### Terminal 1 (Alice) - Gửi lời mời kết bạn cho Bob:
```
friend add bob
```

# Bob sẽ nhận được thông báo: "[FRIEND NOTIFICATION] alice wants to be your friend"

# Kiểm tra lỗi: Gửi lời mời cho chính mình
```
friend add alice
```

# Kiểm tra lỗi: Gửi lại khi đã gửi
```
friend add bob
```

# Kiểm tra lỗi: User không tồn tại
```
friend add unknownuser
```

---

## KỊCH BẢN 2: Chấp nhận lời mời kết bạn

### Terminal 2 (Bob) - Chấp nhận lời mời từ Alice (User ID = 1):
```
friend accept 1
```

# Alice sẽ nhận được thông báo: "[FRIEND NOTIFICATION] bob accepted your friend request"

---

## KỊCH BẢN 3: Từ chối lời mời kết bạn

### Terminal 1 (Alice) - Đăng ký user mới để test từ chối:
```
# (Mở terminal mới, đăng ký charlie nếu chưa có)
register charlie pass789 charlie@email.com
login charlie pass789
```

### Terminal 3 (Charlie) - Gửi lời mời kết bạn cho Alice:
```
friend add alice
```

### Terminal 1 (Alice) - Từ chối lời mời từ Charlie (User ID = 3):
```
friend reject 3
```

---

## KỊCH BẢN 4: Xem danh sách bạn bè

### Terminal 1 (Alice):
```
friend list
```

# Kết quả: Hiển thị Bob với trạng thái online/offline

### Terminal 2 (Bob):
```
friend list
```

# Kết quả: Hiển thị Alice với trạng thái online

---

## KỊCH BẢN 5: Xóa bạn bè

### Terminal 1 (Alice) - Xóa Bob khỏi danh sách bạn (User ID = 2):
```
friend remove 2
```

# Bob sẽ nhận thông báo bị xóa khỏi danh sách bạn

### Kiểm tra lại danh sách bạn:
```
friend list
```

# Kết quả: Danh sách rỗng

---

### KẾT QUẢ MONG ĐỢI:

- Gửi lời mời thành công: "Request sent"
- Chấp nhận thành công: "Friend request accepted"
- Từ chối thành công: "Friend request rejected"
- Xóa bạn thành công: "Friend removed"
- Danh sách bạn: Hiển thị ID, username và status (online/offline)
