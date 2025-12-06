# THAM KHẢO TẤT CẢ LỆNH (COMMANDS REFERENCE)

Gõ `help` trong client để xem danh sách lệnh.

---

## 1. AUTHENTICATION (XÁC THỰC)

### Đăng ký tài khoản mới
```
register <username> <password> <email>
```

Ví dụ:
```
register alice password123 alice@email.com
register bob mypassword bob@gmail.com
register john_doe secure123 john@example.com
```

Lưu ý:
- Username: không có khoảng trắng
- Password: tối thiểu 6 ký tự
- Email: định dạng email hợp lệ

---

### Đăng nhập
```
login <username> <password>
```

Ví dụ:
```
login alice password123
login bob mypassword
```

---

### Đăng xuất (disconnect từ server)
```
logout
```

---

### Thoát ứng dụng
```
quit
```

---

## 2. FRIENDS (BẠN BÈ)

### Gửi lời mời kết bạn
```
friend add <username>
```

Ví dụ:
```
friend add bob
friend add charlie
```

---

### Chấp nhận lời mời kết bạn
```
friend accept <user_id>
```

Ví dụ:
```
friend accept 1
friend accept 2
```

Lưu ý: `user_id` là ID của người gửi lời mời

---

### Từ chối lời mời kết bạn
```
friend reject <user_id>
```

Ví dụ:
```
friend reject 3
```

---

### Xóa bạn bè
```
friend remove <user_id>
```

Ví dụ:
```
friend remove 2
```

---

### Xem danh sách bạn bè
```
friend list
```

Kết quả hiển thị ví dụ:
```
=== Friends List (2) ===
  bob (ID: 2) - online
  charlie (ID: 3) - offline
=======================
```

---

## 3. MESSAGING (NHẮN TIN)

### Gửi tin nhắn trực tiếp (1-1)
```
msg <user_id> <message>
```

Ví dụ:
```
msg 2 Xin chào Bob!
msg 1 Hello Alice, how are you?
msg 3 Tin nhắn dài có thể chứa nhiều từ và ký tự đặc biệt!
```

Lưu ý:
- Chỉ gửi được tin nhắn cho bạn bè
- `user_id` là ID của người nhận
- Message có thể chứa khoảng trắng

---

### Nhận tin nhắn
Tin nhắn tự động hiển thị khi có người gửi:
```
[MESSAGE from bob]: Nội dung tin nhắn
```

---

## 4. GROUPS (NHÓM CHAT)

### Tạo nhóm mới
```
group create <name> [description]
```

Ví dụ:
```
group create StudyGroup Nhóm học tập
group create TeamA
group create ProjectX Dự án cuối kỳ 2025
```

Lưu ý:
- `name`: tên nhóm (không khoảng trắng)
- `description`: mô tả (tùy chọn, có thể có khoảng trắng)

---

### Mời thành viên vào nhóm
```
group invite <group_id> <user_id>
```

Ví dụ:
```
group invite 1 2    # Mời user 2 vào nhóm 1
group invite 1 3    # Mời user 3 vào nhóm 1
```

Lưu ý: Chỉ thành viên nhóm mới có thể mời

---

### Xóa thành viên khỏi nhóm (chỉ Admin)
```
group remove <group_id> <user_id>
```

Ví dụ:
```
group remove 1 3    # Xóa user 3 khỏi nhóm 1
```

Lưu ý:
- Chỉ admin (người tạo nhóm) mới có thể xóa thành viên
- Không thể tự xóa chính mình (dùng `group leave`)

---

### Tham gia nhóm (sau khi được mời)
```
group join <group_id>
```

Ví dụ:
```
group join 1
group join 2
```

---

### Rời khỏi nhóm
```
group leave <group_id>
```

Ví dụ:
```
group leave 1
```

---

### Gửi tin nhắn vào nhóm
```
group msg <group_id> <message>
```

Ví dụ:
```
group msg 1 Xin chào mọi người!
group msg 2 Tin nhắn trong nhóm 2
```

---

### Nhận tin nhắn nhóm
Tin nhắn tự động hiển thị:
```
[GROUP StudyGroup - alice]: Nội dung tin nhắn
```

---

## 5. OTHER (KHÁC)

### Xem trợ giúp
```
help
```

### Thoát
```
quit
```

---

## 6. THÔNG BÁO TỰ ĐỘNG (NOTIFICATIONS)

### Lời mời kết bạn
```
[FRIEND NOTIFICATION] alice wants to be your friend
```

### Chấp nhận kết bạn
```
[FRIEND NOTIFICATION] bob accepted your friend request
```

### Trạng thái online/offline
```
[STATUS] alice is now online
[STATUS] bob is now offline
```

### Lời mời vào nhóm
```
[GROUP INVITE] alice invited you to join 'StudyGroup' (ID: 1)
Use 'group join 1' to accept
```

### Tin nhắn lỗi
```
[ERROR] Not friends
[ERROR] Not logged in
```

---

## 7. MẸO SỬ DỤNG

1. Gõ `help` bất cứ lúc nào để xem danh sách lệnh
2. User ID bắt đầu từ 1, tăng dần theo thứ tự đăng ký
3. Group ID bắt đầu từ 1, tăng dần theo thứ tự tạo
4. Để biết User ID của bạn bè, dùng `friend list`
5. Tin nhắn offline sẽ được gửi khi người nhận đăng nhập lại
6. Bạn có thể tham gia nhiều nhóm cùng lúc
7. Chỉ có thể chat 1-1 với người trong danh sách bạn bè

---

## 8. TROUBLESHOOTING (XỬ LÝ LỖI)

**Lỗi: "Not logged in"**
→ Chưa đăng nhập. Dùng:
```
login <username> <password>
```

**Lỗi: "Not friends"**
→ Phải kết bạn trước khi gửi tin nhắn

**Lỗi: "User not found"**
→ Username không tồn tại

**Lỗi: "Invalid password"**
→ Sai mật khẩu

**Lỗi: "Username already exists"**
→ Tên đăng nhập đã được sử dụng

**Lỗi: "Password too short"**
→ Mật khẩu phải có ít nhất 6 ký tự

**Lỗi: "Connection lost"**
→ Mất kết nối với server. Khởi động lại client

---
