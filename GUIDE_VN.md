# Hướng Dẫn Sử Dụng Ứng Dụng Chat TCP

## Tổng Quan

Ứng dụng chat TCP hoàn chỉnh được viết bằng C, triển khai đầy đủ 17 yêu cầu của đề bài.

## Cài Đặt và Biên Dịch

### Biên dịch dự án

```bash
# Biên dịch cả server và client
make

# Biên dịch riêng server
make server

# Biên dịch riêng client
make client

# Xóa các file đã biên dịch
make clean
```

## Chạy Ứng Dụng

### 1. Khởi động Server

Mở một terminal và chạy:

```bash
./bin/server
```

Hoặc chỉ định cổng tùy chỉnh:

```bash
./bin/server 9999
```

Bạn sẽ thấy:
```
===========================================
  TCP Chat Server
===========================================

Server listening on port 8888

Server ready. Press Ctrl+C to stop.
```

### 2. Khởi động Client

Mở terminal khác và chạy:

```bash
./bin/client
```

Hoặc kết nối đến server khác:

```bash
./bin/client 192.168.1.100 9999
```

## Hướng Dẫn Sử Dụng Chi Tiết

### Bước 1: Đăng ký tài khoản

```
> register alice password123 alice@example.com
Registration successful! User ID: 1
```

**Lưu ý:**
- Tên đăng nhập phải duy nhất
- Mật khẩu tối thiểu 6 ký tự
- Email để nhận thông báo (tính năng mở rộng)

### Bước 2: Đăng nhập

```
> login alice password123
Login successful! Welcome, alice
```

Sau khi đăng nhập thành công:
- Bạn sẽ nhận được danh sách bạn bè đang online
- Các tin nhắn offline sẽ được gửi đến
- Bạn bè sẽ nhận thông báo bạn đã online

### Bước 3: Quản lý bạn bè

#### Gửi lời mời kết bạn

```
> friend add bob
Request sent
```

Người nhận (bob) sẽ thấy:
```
[FRIEND NOTIFICATION] alice wants to be your friend
```

#### Chấp nhận lời mời kết bạn

Trên client của Bob:
```
> friend accept 1
Friend request accepted
```

Alice sẽ nhận được thông báo:
```
[FRIEND NOTIFICATION] bob accepted your friend request
```

#### Từ chối lời mời

```
> friend reject 1
Friend request rejected
```

#### Xem danh sách bạn bè

```
> friend list

=== Friends List (2) ===
  bob (ID: 2) - online
  charlie (ID: 3) - offline
=======================
```

#### Hủy kết bạn

```
> friend remove 2
Friend removed
```

### Bước 4: Nhắn tin trực tiếp

```
> msg 2 Chào Bob!
Message sent successfully
```

Bob sẽ nhận được:
```
[MESSAGE from alice]: Chào Bob!
```

Bob có thể trả lời:
```
> msg 1 Chào Alice! Khỏe không?
```

### Bước 5: Tạo và sử dụng nhóm chat

#### Tạo nhóm mới

```
> group create NhomHocTap Nhóm học lập trình mạng
Group created successfully! Group ID: 1
```

Người tạo sẽ tự động trở thành admin của nhóm.

#### Mời người vào nhóm

```
> group invite 1 2
Invitation sent
```

Bob sẽ nhận được:
```
[GROUP INVITE] alice invited you to join 'NhomHocTap' (ID: 1)
Use 'group join 1' to accept
```

#### Tham gia nhóm

Bob chấp nhận lời mời:
```
> group join 1
Joining group...
```

#### Gửi tin nhắn nhóm

```
> group msg 1 Xin chào mọi người!
Group message sent successfully
```

Tất cả thành viên sẽ nhận được:
```
[GROUP NhomHocTap - alice]: Xin chào mọi người!
```

#### Rời khỏi nhóm

```
> group leave 1
Leaving group...
```

#### Xóa người khỏi nhóm (chỉ admin)

```
> group remove 1 3
User removed
```

### Bước 6: Đăng xuất

```
> logout
```

Hoặc:
```
> quit
```

Bạn bè online sẽ nhận thông báo:
```
[STATUS] alice is now offline
```

## Các Tính Năng Nâng Cao

### Tin nhắn Offline

Nếu bạn gửi tin nhắn cho người đang offline:
1. Tin nhắn được lưu vào hàng đợi
2. Khi người đó đăng nhập lại, họ sẽ nhận tất cả tin nhắn

### Thông báo trạng thái

Khi bạn bè online/offline, bạn nhận thông báo tự động:
```
[STATUS] bob is now online
[STATUS] charlie is now offline
```

### Session timeout

Nếu không hoạt động trong 5 phút, session sẽ hết hạn và bạn phải đăng nhập lại.

## Ví Dụ Hoàn Chỉnh

### Kịch bản: Alice và Bob trò chuyện

**Terminal 1 - Server:**
```bash
$ ./bin/server
Server listening on port 8888
```

**Terminal 2 - Alice:**
```bash
$ ./bin/client
> register alice pass123 alice@email.com
Registration successful! User ID: 1

> login alice pass123
Login successful! Welcome, alice
```

**Terminal 3 - Bob:**
```bash
$ ./bin/client
> register bob pass456 bob@email.com
Registration successful! User ID: 2

> login bob pass456
Login successful! Welcome, bob

> friend add alice
Request sent
```

**Back to Alice:**
```
[FRIEND NOTIFICATION] bob wants to be your friend

> friend accept 2
Friend request accepted

> msg 2 Chào Bob!
Message sent successfully
```

**Back to Bob:**
```
[MESSAGE from alice]: Chào Bob!

> msg 1 Chào Alice! Bạn khỏe không?
Message sent successfully
```

**Back to Alice:**
```
[MESSAGE from bob]: Chào Alice! Bạn khỏe không?

> msg 2 Mình khỏe. Làm bài tập mạng máy tính không?
```

**Alice tạo nhóm:**
```
> group create LapTrinhMang Nhóm học IT4062
Group created successfully! Group ID: 1

> group invite 1 2
Invitation sent
```

**Bob tham gia:**
```
[GROUP INVITE] alice invited you to join 'LapTrinhMang' (ID: 1)

> group join 1
Joined group

> group msg 1 Xin chào cả nhóm!
Group message sent successfully
```

**Alice nhận tin nhắn nhóm:**
```
[GROUP LapTrinhMang - bob]: Xin chào cả nhóm!

> group msg 1 Chào Bob! Cùng nhau hoàn thành bài tập nhé!
```

## Xử Lý Lỗi Thường Gặp

### Lỗi: "Failed to connect to server"

**Nguyên nhân:** Server chưa khởi động hoặc sai địa chỉ/cổng

**Giải pháp:**
1. Kiểm tra server đã chạy chưa
2. Kiểm tra địa chỉ IP và cổng
3. Kiểm tra firewall

### Lỗi: "Username already exists"

**Nguyên nhân:** Tên đăng nhập đã có người dùng

**Giải pháp:** Chọn tên khác

### Lỗi: "Not friends"

**Nguyên nhân:** Chưa kết bạn với người muốn nhắn tin

**Giải pháp:**
1. Gửi lời mời: `friend add <username>`
2. Đợi chấp nhận
3. Sau đó mới nhắn tin được

### Lỗi: "Not in group"

**Nguyên nhân:** Chưa tham gia nhóm

**Giải pháp:**
1. Đợi lời mời từ thành viên
2. Dùng `group join <group_id>`

## Cấu Trúc Dữ Liệu

### Thư mục data/

Chứa các file dữ liệu:
- `users.dat` - Thông tin tài khoản
- `friends.dat` - Quan hệ bạn bè
- `groups.dat` - Nhóm và thành viên
- `messages.dat` - Lịch sử tin nhắn

### Thư mục logs/

- `server.log` - Nhật ký hoạt động server

Ví dụ log:
```
[2025-12-05 10:30:15] User=1 Event=LOGIN Data=alice
[2025-12-05 10:30:22] User=1 Event=FRIEND_REQUEST Data=bob
[2025-12-05 10:30:45] User=1 Event=CHAT_SEND Data=Sent message
```

## Các Lệnh Tóm Tắt

### Xác thực
```
register <username> <password> <email>
login <username> <password>
logout
```

### Bạn bè
```
friend add <username>
friend accept <user_id>
friend reject <user_id>
friend remove <user_id>
friend list
```

### Tin nhắn
```
msg <user_id> <nội dung>
```

### Nhóm
```
group create <tên> [mô tả]
group join <group_id>
group leave <group_id>
group invite <group_id> <user_id>
group msg <group_id> <nội dung>
```

### Khác
```
help    - Hiển thị trợ giúp
quit    - Thoát
```

## Kiến Thức Kỹ Thuật Áp Dụng

### 1. Xử lý Truyền Dòng (TCP Stream)

TCP không đảm bảo ranh giới message. Giải pháp: **Length-prefixed framing**

```
+--------+--------+--------+--------+...+--------+
|   LENGTH (4 bytes)      | TYPE(2)|   PAYLOAD   |
+--------+--------+--------+--------+...+--------+
```

### 2. I/O Multiplexing với select()

Server sử dụng `select()` để xử lý nhiều client:

```c
fd_set read_fds;
select(max_fd + 1, &read_fds, NULL, NULL, &timeout);

// Kiểm tra listening socket
if (FD_ISSET(listen_fd, &read_fds)) {
    accept_new_client();
}

// Kiểm tra client sockets
for (int i = 0; i < MAX_CLIENTS; i++) {
    if (FD_ISSET(clients[i].fd, &read_fds)) {
        handle_client_data(i);
    }
}
```

### 3. Network Byte Order

Tất cả số nguyên trong protocol được chuyển sang network byte order:

```c
uint32_t length = htonl(total_len);    // Host to Network Long
uint16_t type = ntohs(received_type);  // Network to Host Short
```

## Đóng Góp và Mở Rộng

### Tính năng có thể thêm:

1. Mã hóa mật khẩu mạnh hơn (bcrypt, argon2)
2. Mã hóa kết nối (TLS/SSL)
3. Gửi file
4. Typing indicators
5. Read receipts
6. Lịch sử chat
7. Emoji support
8. Voice/video call (nâng cao)

## Liên Hệ và Hỗ Trợ

Dự án này được phát triển cho môn học IT4062 - Lập Trình Mạng tại HUST.

**Tài liệu tham khảo:**
- `docs/tcp_chat_plan_vn.md` - Kế hoạch kỹ thuật chi tiết
- `README.md` - Tài liệu tiếng Anh
- Lecture notes trong thư mục `docs/`

---

**Chúc bạn sử dụng thành công!**
