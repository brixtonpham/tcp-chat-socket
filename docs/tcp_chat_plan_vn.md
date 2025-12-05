# 🎯 ĐÁNH GIÁ VÀ KẾ HOẠCH KỸ THUẬT CHI TIẾT
## Ứng Dụng Chat TCP Socket trong C

---

# PHẦN 1: ĐÁNH GIÁ PLAN HIỆN TẠI

## 1.1 Bảng Đối Chiếu Yêu Cầu

| STT | Yêu cầu | Điểm | Plan đã đề cập? | Đánh giá |
|-----|---------|------|-----------------|----------|
| 1 | Xử lý truyền dòng (Stream handling) | 1 | ✅ Có | Đầy đủ - có giải thích message framing |
| 2 | Cài đặt cơ chế vào/ra socket trên server | 2 | ✅ Có | Đầy đủ - sử dụng epoll |
| 3 | Đăng ký và quản lý tài khoản | 2 | ✅ Có | Đầy đủ - có Argon2id hashing |
| 4 | Đăng nhập và quản lý phiên | 2 | ✅ Có | Đầy đủ - session token |
| 5 | Gửi lời mời kết bạn | 1 | ✅ Có | Đầy đủ |
| 6 | Chấp nhận/Từ chối lời mời kết bạn | 1 | ✅ Có | Đầy đủ |
| 7 | Hủy kết bạn | 1 | ✅ Có | Đầy đủ |
| 8 | Lấy danh sách bạn bè và trạng thái | 1 | ✅ Có | Đầy đủ |
| 9 | Gửi nhận tin nhắn giữa 2 người dùng | 1 | ✅ Có | Đầy đủ |
| 10 | Ngắt kết nối | 1 | ✅ Có | Đầy đủ |
| 11 | Tạo nhóm chat | 1 | ✅ Có | Đầy đủ |
| 12 | Thêm người dùng khác vào nhóm chat | 1 | ✅ Có | Đầy đủ |
| 13 | Xóa người dùng ra khỏi nhóm chat | 1 | ✅ Có | Đầy đủ |
| 14 | Rời nhóm chat | 1 | ✅ Có | Đầy đủ |
| 15 | Gửi nhận thông điệp trong nhóm chat | 1 | ✅ Có | Đầy đủ |
| 16 | Gửi tin nhắn offline | 1 | ✅ Có | Đầy đủ |
| 17 | Ghi log hoạt động | 1 | ✅ Có | Đầy đủ |

## 1.2 Nhận Xét Tổng Quan

**Ưu điểm của plan hiện tại:**
- ✅ Đầy đủ 17/17 yêu cầu
- ✅ Kiến trúc rõ ràng, có sơ đồ
- ✅ Protocol được thiết kế chi tiết
- ✅ Database schema đầy đủ

**Điểm cần cải thiện:**
- ⚠️ Sử dụng epoll - phức tạp hơn mức cần thiết cho bài tập (nên dùng select/poll theo giáo trình)
- ⚠️ Thiếu giải thích tại sao chọn các kỹ thuật
- ⚠️ Chưa liên kết với kiến thức trong bài giảng
- ⚠️ Code ví dụ quá phức tạp, không phù hợp với trình độ môn học

---

# PHẦN 2: KẾ HOẠCH KỸ THUẬT CẢI TIẾN

## 2.1 Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHAT SERVER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   select()   │  │   Session    │  │   Message    │          │
│  │   I/O Loop   │──│   Manager    │──│   Router     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│          │                │                │                    │
│          └────────────────┴────────────────┘                    │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │ TCP Connections
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐
   │ Client A  │    │ Client B  │    │ Client C  │
   └───────────┘    └───────────┘    └───────────┘
```

### 💡 TẠI SAO CHỌN KIẾN TRÚC NÀY?

**Mô hình Client-Server tập trung** được chọn vì:
1. **Đơn giản**: Một server quản lý tất cả, dễ debug
2. **Phù hợp bài tập**: Không cần phân tán phức tạp
3. **Dễ quản lý state**: Tất cả dữ liệu ở một nơi

---

## 2.2 XỬ LÝ TRUYỀN DÒNG (Yêu cầu #1 - 1 điểm)

### 📚 KIẾN THỨC NỀN TẢNG

**TCP là gì và tại sao cần xử lý truyền dòng?**

Theo bài giảng Lec03 và Lec04, TCP (Transmission Control Protocol) có đặc điểm:

```
Stream Socket (TCP - SOCK_STREAM):
- Connection-oriented: Phải thiết lập kết nối trước
- Reliable: Đảm bảo dữ liệu đến đúng thứ tự, không mất
- Byte stream: KHÔNG CÓ RANH GIỚI MESSAGE ⚠️
- Full duplex: Truyền 2 chiều đồng thời
```

**VẤN ĐỀ QUAN TRỌNG NHẤT:**
TCP là "byte stream" - nó không biết đâu là bắt đầu và kết thúc của một message! Khi gửi "Hello" và "World", bên nhận có thể nhận được:
- "HelloWorld" (ghép lại)
- "Hel" rồi "loWorld" (bị cắt)
- "Hello" rồi "World" (đúng như mong đợi - nhưng không đảm bảo!)

### 🔧 GIẢI PHÁP: MESSAGE FRAMING

**Phương pháp 1: Length-Prefixed (Khuyến nghị)**

Gắn độ dài message vào đầu:
```
+--------+--------+--------+--------+...+--------+
|   LENGTH (4 bytes)      |       PAYLOAD        |
+--------+--------+--------+--------+...+--------+
```

```c
// Cấu trúc gói tin
typedef struct {
    uint32_t length;    // Độ dài toàn bộ gói (network byte order)
    uint16_t type;      // Loại message
    char payload[];     // Nội dung (flexible array member)
} ChatPacket;

#define HEADER_SIZE 6
#define MAX_PAYLOAD 4096
```

**Phương pháp 2: Delimiter-Based**

Dùng ký tự đặc biệt đánh dấu kết thúc (như "\r\n" trong HTTP):
```
Hello\r\n
World\r\n
```

### 📝 CODE MINH HỌA

```c
/**
 * Hàm nhận message hoàn chỉnh từ TCP stream
 * 
 * GIẢ THÍCH: 
 * - TCP có thể trả về ít bytes hơn yêu cầu (partial read)
 * - Phải đọc nhiều lần cho đến khi đủ dữ liệu
 */
int recv_message(int sockfd, char *buffer, int *msg_len) {
    // Bước 1: Đọc header (6 bytes) để biết độ dài message
    char header[HEADER_SIZE];
    int received = 0;
    
    // Đọc cho đến khi đủ header
    while (received < HEADER_SIZE) {
        int n = recv(sockfd, header + received, HEADER_SIZE - received, 0);
        if (n <= 0) return -1;  // Lỗi hoặc connection đóng
        received += n;
    }
    
    // Bước 2: Parse length từ header (chuyển từ network byte order)
    uint32_t length = ntohl(*(uint32_t*)header);
    
    // Kiểm tra length hợp lệ
    if (length > MAX_PAYLOAD + HEADER_SIZE) {
        return -1;  // Gói tin quá lớn - có thể là tấn công
    }
    
    // Bước 3: Đọc payload
    *msg_len = length - HEADER_SIZE;
    received = 0;
    
    while (received < *msg_len) {
        int n = recv(sockfd, buffer + received, *msg_len - received, 0);
        if (n <= 0) return -1;
        received += n;
    }
    
    return 0;  // Thành công
}

/**
 * Hàm gửi message với length prefix
 */
int send_message(int sockfd, uint16_t type, const char *data, int data_len) {
    // Tạo buffer chứa header + payload
    char buffer[MAX_PAYLOAD + HEADER_SIZE];
    
    // Điền header
    uint32_t total_len = HEADER_SIZE + data_len;
    *(uint32_t*)buffer = htonl(total_len);      // Length (network byte order)
    *(uint16_t*)(buffer + 4) = htons(type);     // Type (network byte order)
    
    // Copy payload
    memcpy(buffer + HEADER_SIZE, data, data_len);
    
    // Gửi toàn bộ
    int sent = 0;
    while (sent < total_len) {
        int n = send(sockfd, buffer + sent, total_len - sent, 0);
        if (n <= 0) return -1;
        sent += n;
    }
    
    return 0;
}
```

### 🎓 ĐIỂM QUAN TRỌNG CẦN NHỚ

```
□ TCP không đảm bảo ranh giới message
□ Luôn dùng length-prefix hoặc delimiter
□ Xử lý partial read/write
□ Dùng htonl/ntohl để chuyển byte order
```

---

## 2.3 CÀI ĐẶT CƠ CHẾ VÀO/RA SOCKET (Yêu cầu #2 - 2 điểm)

### 📚 KIẾN THỨC: 5 MÔ HÌNH I/O

Theo bài giảng Lec06, có 5 mô hình I/O:

```
1. Blocking I/O      - Đợi đến khi có data (mặc định)
2. Non-blocking I/O  - Return ngay, check lại sau  
3. I/O Multiplexing  - select/poll nhiều fd cùng lúc ⭐
4. Signal-driven I/O - Kernel báo signal khi ready
5. Asynchronous I/O  - Kernel hoàn thành và báo
```

### 💡 TẠI SAO CHỌN I/O MULTIPLEXING VỚI select()?

**Vấn đề với Blocking I/O:**
```c
// Iterative Server - CHỈ XỬ LÝ 1 CLIENT MỘT LÚC
while(1) {
    connfd = accept(listenfd, ...);  // Block đợi client
    process_request(connfd);          // Block xử lý (client khác phải ĐỢI!)
    close(connfd);
}
```

**Giải pháp: I/O Multiplexing với select()**
- Giám sát NHIỀU socket cùng lúc
- Chỉ xử lý socket nào có dữ liệu
- Không cần tạo nhiều process/thread

```
Application                              Kernel
    │                                      │
  select() ───────system call─────────►   │
    │ (blocked in select)                wait for any
    │                                    socket ready
    │◄─────────return readable────────    │
    │                                      │
 recv() ─────────system call──────────►  copy data
    │◄──────────return OK────────────     │
```

### 📝 CẤU TRÚC DỮ LIỆU SERVER

```c
#include <sys/select.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define MAX_CLIENTS FD_SETSIZE  // Thường là 1024
#define PORT 8888

typedef struct sockaddr SOCKADDR;
typedef struct sockaddr_in SOCKADDR_IN;

// Thông tin mỗi client
typedef struct {
    int fd;                     // Socket descriptor
    int user_id;                // ID user (0 nếu chưa đăng nhập)
    char username[50];          // Tên đăng nhập
    char recv_buffer[4096];     // Buffer nhận dữ liệu
    int recv_len;               // Số bytes trong buffer
    time_t last_activity;       // Thời gian hoạt động cuối
} ClientInfo;

// Server state
typedef struct {
    int listen_fd;              // Socket lắng nghe
    ClientInfo clients[MAX_CLIENTS];
    int client_count;
    fd_set master_set;          // Tập fd cần giám sát
    int max_fd;                 // Fd lớn nhất (cho select)
} ChatServer;
```

### 📝 CODE SERVER VỚI select()

```c
/**
 * Khởi tạo server
 * 
 * Các bước theo flow TCP Server:
 * socket() → bind() → listen()
 */
int server_init(ChatServer *server, int port) {
    // Bước 1: Tạo socket
    // AF_INET: IPv4, SOCK_STREAM: TCP
    server->listen_fd = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server->listen_fd < 0) {
        perror("socket() failed");
        return -1;
    }
    
    // Cho phép reuse địa chỉ (tránh lỗi "Address already in use")
    int opt = 1;
    setsockopt(server->listen_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    // Bước 2: Gán địa chỉ cho socket
    SOCKADDR_IN saddr;
    saddr.sin_family = AF_INET;
    saddr.sin_port = htons(port);           // Chuyển sang network byte order
    saddr.sin_addr.s_addr = INADDR_ANY;     // Chấp nhận mọi interface
    
    if (bind(server->listen_fd, (SOCKADDR*)&saddr, sizeof(saddr)) < 0) {
        perror("bind() failed");
        return -1;
    }
    
    // Bước 3: Chuyển sang chế độ lắng nghe
    if (listen(server->listen_fd, 10) < 0) {
        perror("listen() failed");
        return -1;
    }
    
    // Khởi tạo fd_set
    FD_ZERO(&server->master_set);
    FD_SET(server->listen_fd, &server->master_set);
    server->max_fd = server->listen_fd;
    server->client_count = 0;
    
    // Khởi tạo mảng clients
    for (int i = 0; i < MAX_CLIENTS; i++) {
        server->clients[i].fd = -1;
    }
    
    printf("Server listening on port %d\n", port);
    return 0;
}

/**
 * Vòng lặp chính của server sử dụng select()
 * 
 * GIẢ THÍCH select():
 * - Chờ cho đến khi có ít nhất 1 socket ready
 * - Return số socket ready
 * - Dùng FD_ISSET để kiểm tra socket nào ready
 */
void server_loop(ChatServer *server) {
    fd_set read_fds;
    struct timeval timeout;
    
    while (1) {
        // Copy master_set vì select() sẽ modify
        read_fds = server->master_set;
        
        // Timeout 30 giây (để check heartbeat)
        timeout.tv_sec = 30;
        timeout.tv_usec = 0;
        
        // select() chờ các socket ready
        int ready = select(server->max_fd + 1, &read_fds, NULL, NULL, &timeout);
        
        if (ready < 0) {
            perror("select() error");
            continue;
        }
        
        if (ready == 0) {
            // Timeout - kiểm tra heartbeat
            check_client_timeouts(server);
            continue;
        }
        
        // Kiểm tra có kết nối mới không
        if (FD_ISSET(server->listen_fd, &read_fds)) {
            handle_new_connection(server);
        }
        
        // Kiểm tra dữ liệu từ các client hiện có
        for (int i = 0; i < MAX_CLIENTS; i++) {
            int fd = server->clients[i].fd;
            if (fd > 0 && FD_ISSET(fd, &read_fds)) {
                handle_client_data(server, i);
            }
        }
    }
}

/**
 * Xử lý kết nối mới
 */
void handle_new_connection(ChatServer *server) {
    SOCKADDR_IN client_addr;
    socklen_t addr_len = sizeof(client_addr);
    
    // accept() trả về socket MỚI cho connection này
    int new_fd = accept(server->listen_fd, (SOCKADDR*)&client_addr, &addr_len);
    
    if (new_fd < 0) {
        perror("accept() failed");
        return;
    }
    
    printf("New connection from %s:%d\n", 
           inet_ntoa(client_addr.sin_addr),
           ntohs(client_addr.sin_port));
    
    // Tìm slot trống trong mảng clients
    int slot = -1;
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (server->clients[i].fd < 0) {
            slot = i;
            break;
        }
    }
    
    if (slot < 0) {
        printf("Server full, rejecting connection\n");
        close(new_fd);
        return;
    }
    
    // Thêm client mới
    server->clients[slot].fd = new_fd;
    server->clients[slot].user_id = 0;  // Chưa đăng nhập
    server->clients[slot].recv_len = 0;
    server->clients[slot].last_activity = time(NULL);
    
    // Thêm vào master_set để select() giám sát
    FD_SET(new_fd, &server->master_set);
    if (new_fd > server->max_fd) {
        server->max_fd = new_fd;
    }
    
    server->client_count++;
}

/**
 * Xử lý dữ liệu từ client
 */
void handle_client_data(ChatServer *server, int client_index) {
    ClientInfo *client = &server->clients[client_index];
    char buffer[1024];
    
    int n = recv(client->fd, buffer, sizeof(buffer) - 1, 0);
    
    if (n <= 0) {
        // Client đã đóng kết nối hoặc lỗi
        if (n == 0) {
            printf("Client %d disconnected\n", client_index);
        } else {
            perror("recv() error");
        }
        disconnect_client(server, client_index);
        return;
    }
    
    // Cập nhật thời gian hoạt động
    client->last_activity = time(NULL);
    
    // Xử lý dữ liệu nhận được
    // (Thêm vào buffer và parse message hoàn chỉnh)
    process_client_message(server, client_index, buffer, n);
}

/**
 * Ngắt kết nối client
 */
void disconnect_client(ChatServer *server, int client_index) {
    ClientInfo *client = &server->clients[client_index];
    
    if (client->fd > 0) {
        // Xóa khỏi master_set
        FD_CLR(client->fd, &server->master_set);
        close(client->fd);
        
        // Thông báo cho bạn bè (nếu đã đăng nhập)
        if (client->user_id > 0) {
            broadcast_status_change(server, client->user_id, "offline");
        }
        
        client->fd = -1;
        client->user_id = 0;
        server->client_count--;
    }
}
```

### 🎯 SO SÁNH CÁC PHƯƠNG PHÁP

| Phương pháp | Ưu điểm | Nhược điểm | Khi nào dùng |
|-------------|---------|------------|--------------|
| **select()** | Portable, đơn giản | Max 1024 fd | Bài tập, ứng dụng nhỏ |
| **poll()** | Không giới hạn fd | Kém portable hơn | Nhiều clients hơn |
| **fork()** | Isolation tốt | Tốn memory, IPC khó | Cần security cao |
| **pthread** | Nhẹ, share memory | Cần sync | Cần share state |

**Đề xuất cho bài tập: select()** vì:
1. Phù hợp với giáo trình (Lec06)
2. Đơn giản, dễ debug
3. Đủ cho vài trăm clients

---

## 2.4 ĐĂNG KÝ TÀI KHOẢN (Yêu cầu #3 - 2 điểm)

### 📚 KIẾN THỨC: QUẢN LÝ TÀI KHOẢN

**Tại sao cần hash password?**
- Không bao giờ lưu password dạng plain text
- Nếu database bị leak, attacker không thể đọc password
- Dùng hàm hash một chiều (không thể reverse)

### 📝 CẤU TRÚC DỮ LIỆU

```c
// Thông tin user
typedef struct {
    int user_id;
    char username[50];
    char email[100];
    char password_hash[128];    // Hash, không phải plain text!
    char status[20];            // "online", "offline", "away"
    time_t created_at;
    time_t last_login;
} User;

// Database đơn giản (dùng file)
#define USER_FILE "users.dat"
#define MAX_USERS 1000

User g_users[MAX_USERS];
int g_user_count = 0;
```

### 📝 PROTOCOL ĐĂNG KÝ

```c
// Message types
#define MSG_REGISTER        0x01
#define MSG_REGISTER_ACK    0x02

// Request format: username|password|email
// Response format: status|user_id|message

/**
 * Xử lý đăng ký tài khoản
 */
int handle_register(ChatServer *server, int client_idx, const char *payload) {
    char username[50], password[50], email[100];
    
    // Parse request
    if (sscanf(payload, "%49[^|]|%49[^|]|%99s", username, password, email) != 3) {
        send_response(server, client_idx, MSG_REGISTER_ACK, "FAIL|0|Invalid format");
        return -1;
    }
    
    // Kiểm tra username đã tồn tại chưa
    for (int i = 0; i < g_user_count; i++) {
        if (strcmp(g_users[i].username, username) == 0) {
            send_response(server, client_idx, MSG_REGISTER_ACK, "FAIL|0|Username exists");
            return -1;
        }
    }
    
    // Validate password (ít nhất 6 ký tự)
    if (strlen(password) < 6) {
        send_response(server, client_idx, MSG_REGISTER_ACK, "FAIL|0|Password too short");
        return -1;
    }
    
    // Tạo user mới
    User *new_user = &g_users[g_user_count];
    new_user->user_id = g_user_count + 1;
    strcpy(new_user->username, username);
    strcpy(new_user->email, email);
    strcpy(new_user->status, "offline");
    new_user->created_at = time(NULL);
    
    // Hash password (đơn giản - thực tế nên dùng bcrypt/argon2)
    hash_password(password, new_user->password_hash);
    
    g_user_count++;
    
    // Lưu vào file
    save_users_to_file();
    
    // Log hoạt động
    log_activity(new_user->user_id, "REGISTER", "New user registered");
    
    // Gửi phản hồi thành công
    char response[100];
    sprintf(response, "OK|%d|Registration successful", new_user->user_id);
    send_response(server, client_idx, MSG_REGISTER_ACK, response);
    
    return 0;
}

/**
 * Hash password đơn giản (cho bài tập)
 * 
 * NOTE: Trong thực tế, dùng bcrypt hoặc argon2id!
 * Đây chỉ là minh họa concept.
 */
void hash_password(const char *password, char *hash_out) {
    // Simple hash với salt (CHỈ CHO BÀI TẬP!)
    unsigned long hash = 5381;
    int c;
    
    while ((c = *password++)) {
        hash = ((hash << 5) + hash) + c;
    }
    
    sprintf(hash_out, "%016lx", hash);
}

/**
 * Verify password
 */
int verify_password(const char *password, const char *stored_hash) {
    char computed_hash[128];
    hash_password(password, computed_hash);
    return strcmp(computed_hash, stored_hash) == 0;
}
```

---

## 2.5 ĐĂNG NHẬP VÀ QUẢN LÝ PHIÊN (Yêu cầu #4 - 2 điểm)

### 📚 KIẾN THỨC: SESSION MANAGEMENT

**Session là gì?**
- Trạng thái kết nối của user sau khi đăng nhập
- Cho phép server biết ai đang gửi request
- Có thể hết hạn (timeout) để bảo mật

**Session Token:**
- Chuỗi ngẫu nhiên đại diện cho session
- Được tạo khi đăng nhập thành công
- Client gửi kèm mỗi request

### 📝 CẤU TRÚC SESSION

```c
typedef struct {
    int session_id;
    int user_id;
    char token[65];         // 64 hex chars + null
    int socket_fd;          // Socket của client
    time_t created_at;
    time_t last_activity;
    int is_valid;
} Session;

#define MAX_SESSIONS 1000
Session g_sessions[MAX_SESSIONS];
int g_session_count = 0;

#define SESSION_TIMEOUT 3600  // 1 giờ
```

### 📝 CODE ĐĂNG NHẬP

```c
#define MSG_LOGIN       0x03
#define MSG_LOGIN_ACK   0x04
#define MSG_LOGOUT      0x05
#define MSG_LOGOUT_ACK  0x06

/**
 * Xử lý đăng nhập
 */
int handle_login(ChatServer *server, int client_idx, const char *payload) {
    char username[50], password[50];
    
    // Parse request
    if (sscanf(payload, "%49[^|]|%49s", username, password) != 2) {
        send_response(server, client_idx, MSG_LOGIN_ACK, "FAIL||Invalid format");
        return -1;
    }
    
    // Tìm user
    User *user = NULL;
    for (int i = 0; i < g_user_count; i++) {
        if (strcmp(g_users[i].username, username) == 0) {
            user = &g_users[i];
            break;
        }
    }
    
    if (user == NULL) {
        send_response(server, client_idx, MSG_LOGIN_ACK, "FAIL||User not found");
        return -1;
    }
    
    // Verify password
    if (!verify_password(password, user->password_hash)) {
        log_activity(user->user_id, "LOGIN_FAIL", "Invalid password");
        send_response(server, client_idx, MSG_LOGIN_ACK, "FAIL||Invalid password");
        return -1;
    }
    
    // Kiểm tra user đã online chưa (cho phép hoặc không)
    for (int i = 0; i < g_session_count; i++) {
        if (g_sessions[i].user_id == user->user_id && g_sessions[i].is_valid) {
            // Có thể: từ chối, hoặc đăng xuất session cũ
            invalidate_session(&g_sessions[i]);
        }
    }
    
    // Tạo session mới
    Session *session = create_session(user->user_id, server->clients[client_idx].fd);
    if (session == NULL) {
        send_response(server, client_idx, MSG_LOGIN_ACK, "FAIL||Server full");
        return -1;
    }
    
    // Cập nhật client info
    server->clients[client_idx].user_id = user->user_id;
    strcpy(server->clients[client_idx].username, user->username);
    
    // Cập nhật user status
    strcpy(user->status, "online");
    user->last_login = time(NULL);
    
    // Log
    log_activity(user->user_id, "LOGIN", "User logged in");
    
    // Gửi phản hồi
    char response[200];
    sprintf(response, "OK|%s|%d|Login successful", session->token, user->user_id);
    send_response(server, client_idx, MSG_LOGIN_ACK, response);
    
    // QUAN TRỌNG: Gửi danh sách bạn bè online (Yêu cầu đề bài)
    send_online_friends_list(server, client_idx);
    
    // Thông báo cho bạn bè rằng user này đã online
    broadcast_status_change(server, user->user_id, "online");
    
    return 0;
}

/**
 * Tạo session mới
 */
Session* create_session(int user_id, int socket_fd) {
    if (g_session_count >= MAX_SESSIONS) {
        return NULL;
    }
    
    Session *session = &g_sessions[g_session_count++];
    session->session_id = g_session_count;
    session->user_id = user_id;
    session->socket_fd = socket_fd;
    session->created_at = time(NULL);
    session->last_activity = time(NULL);
    session->is_valid = 1;
    
    // Tạo token ngẫu nhiên
    generate_random_token(session->token);
    
    return session;
}

/**
 * Tạo token ngẫu nhiên
 */
void generate_random_token(char *token) {
    const char charset[] = "abcdef0123456789";
    
    srand(time(NULL) ^ getpid());
    
    for (int i = 0; i < 64; i++) {
        token[i] = charset[rand() % 16];
    }
    token[64] = '\0';
}

/**
 * Gửi danh sách bạn bè đang online
 * ĐÂY LÀ YÊU CẦU QUAN TRỌNG TRONG ĐỀ BÀI
 */
void send_online_friends_list(ChatServer *server, int client_idx) {
    int user_id = server->clients[client_idx].user_id;
    
    // Lấy danh sách bạn bè
    int friend_ids[100];
    int friend_count = get_friends(user_id, friend_ids, 100);
    
    // Lọc những người đang online
    char response[4096] = "ONLINE_FRIENDS|";
    int online_count = 0;
    
    for (int i = 0; i < friend_count; i++) {
        User *friend = get_user_by_id(friend_ids[i]);
        if (friend && strcmp(friend->status, "online") == 0) {
            char entry[100];
            sprintf(entry, "%d:%s,", friend->user_id, friend->username);
            strcat(response, entry);
            online_count++;
        }
    }
    
    // Gửi cho client
    send_response(server, client_idx, MSG_FRIEND_LIST_RSP, response);
}
```

---

## 2.6 QUẢN LÝ KẾT BẠN (Yêu cầu #5, #6, #7, #8)

### 📚 KIẾN THỨC: MỐI QUAN HỆ BẠN BÈ

**Trạng thái quan hệ bạn bè:**
```
pending   → Đã gửi lời mời, chờ chấp nhận
accepted  → Đã là bạn bè
rejected  → Đã từ chối
blocked   → Đã chặn
```

### 📝 CẤU TRÚC DỮ LIỆU

```c
typedef struct {
    int id;
    int user_id;        // Người gửi lời mời
    int friend_id;      // Người nhận lời mời
    char status[20];    // pending, accepted, rejected, blocked
    time_t created_at;
    time_t updated_at;
} Friendship;

#define MAX_FRIENDSHIPS 10000
Friendship g_friendships[MAX_FRIENDSHIPS];
int g_friendship_count = 0;

// Message types
#define MSG_FRIEND_REQUEST   0x20
#define MSG_FRIEND_ACCEPT    0x21
#define MSG_FRIEND_REJECT    0x22
#define MSG_FRIEND_REMOVE    0x23
#define MSG_FRIEND_LIST      0x24
#define MSG_FRIEND_LIST_RSP  0x25
#define MSG_FRIEND_NOTIFY    0x26
```

### 📝 CODE GỬI LỜI MỜI KẾT BẠN (Yêu cầu #5)

```c
/**
 * Xử lý gửi lời mời kết bạn
 * Payload format: target_username
 */
int handle_friend_request(ChatServer *server, int client_idx, const char *payload) {
    int sender_id = server->clients[client_idx].user_id;
    
    // Kiểm tra đã đăng nhập chưa
    if (sender_id == 0) {
        send_response(server, client_idx, MSG_ERROR, "Not logged in");
        return -1;
    }
    
    // Tìm user đích
    User *target = get_user_by_username(payload);
    if (target == NULL) {
        send_response(server, client_idx, MSG_ERROR, "User not found");
        return -1;
    }
    
    // Không thể kết bạn với chính mình
    if (target->user_id == sender_id) {
        send_response(server, client_idx, MSG_ERROR, "Cannot friend yourself");
        return -1;
    }
    
    // Kiểm tra đã có quan hệ chưa
    Friendship *existing = find_friendship(sender_id, target->user_id);
    if (existing != NULL) {
        if (strcmp(existing->status, "accepted") == 0) {
            send_response(server, client_idx, MSG_ERROR, "Already friends");
        } else if (strcmp(existing->status, "pending") == 0) {
            send_response(server, client_idx, MSG_ERROR, "Request already sent");
        } else if (strcmp(existing->status, "blocked") == 0) {
            send_response(server, client_idx, MSG_ERROR, "User blocked");
        }
        return -1;
    }
    
    // Tạo friendship mới
    Friendship *friendship = &g_friendships[g_friendship_count++];
    friendship->id = g_friendship_count;
    friendship->user_id = sender_id;
    friendship->friend_id = target->user_id;
    strcpy(friendship->status, "pending");
    friendship->created_at = time(NULL);
    
    // Log
    log_activity(sender_id, "FRIEND_REQUEST", target->username);
    
    // Gửi notification cho target nếu đang online
    int target_client = find_client_by_user_id(server, target->user_id);
    if (target_client >= 0) {
        char notify[200];
        User *sender = get_user_by_id(sender_id);
        sprintf(notify, "%d|%s|wants to be your friend", sender_id, sender->username);
        send_response(server, target_client, MSG_FRIEND_NOTIFY, notify);
    }
    
    send_response(server, client_idx, MSG_FRIEND_REQUEST, "OK|Request sent");
    return 0;
}
```

### 📝 CODE CHẤP NHẬN/TỪ CHỐI (Yêu cầu #6)

```c
/**
 * Chấp nhận lời mời kết bạn
 * Payload format: request_user_id
 */
int handle_friend_accept(ChatServer *server, int client_idx, const char *payload) {
    int user_id = server->clients[client_idx].user_id;
    int requester_id = atoi(payload);
    
    // Tìm friendship
    Friendship *friendship = find_friendship(requester_id, user_id);
    if (friendship == NULL || strcmp(friendship->status, "pending") != 0) {
        send_response(server, client_idx, MSG_ERROR, "No pending request");
        return -1;
    }
    
    // Cập nhật trạng thái
    strcpy(friendship->status, "accepted");
    friendship->updated_at = time(NULL);
    
    // Log
    log_activity(user_id, "FRIEND_ACCEPT", "Accepted friend request");
    
    // Thông báo cho người gửi request
    int requester_client = find_client_by_user_id(server, requester_id);
    if (requester_client >= 0) {
        char notify[100];
        sprintf(notify, "%d|%s|accepted your request", 
                user_id, server->clients[client_idx].username);
        send_response(server, requester_client, MSG_FRIEND_NOTIFY, notify);
    }
    
    send_response(server, client_idx, MSG_FRIEND_ACCEPT, "OK|Friend added");
    return 0;
}

/**
 * Từ chối lời mời kết bạn
 */
int handle_friend_reject(ChatServer *server, int client_idx, const char *payload) {
    int user_id = server->clients[client_idx].user_id;
    int requester_id = atoi(payload);
    
    Friendship *friendship = find_friendship(requester_id, user_id);
    if (friendship == NULL || strcmp(friendship->status, "pending") != 0) {
        send_response(server, client_idx, MSG_ERROR, "No pending request");
        return -1;
    }
    
    strcpy(friendship->status, "rejected");
    friendship->updated_at = time(NULL);
    
    log_activity(user_id, "FRIEND_REJECT", "Rejected friend request");
    
    send_response(server, client_idx, MSG_FRIEND_REJECT, "OK|Request rejected");
    return 0;
}
```

### 📝 CODE HỦY KẾT BẠN (Yêu cầu #7)

```c
/**
 * Hủy kết bạn
 */
int handle_friend_remove(ChatServer *server, int client_idx, const char *payload) {
    int user_id = server->clients[client_idx].user_id;
    int friend_id = atoi(payload);
    
    // Tìm friendship (có thể theo cả 2 chiều)
    Friendship *friendship = find_friendship_bidirectional(user_id, friend_id);
    if (friendship == NULL || strcmp(friendship->status, "accepted") != 0) {
        send_response(server, client_idx, MSG_ERROR, "Not friends");
        return -1;
    }
    
    // Xóa friendship (hoặc đánh dấu deleted)
    friendship->status[0] = '\0';  // Mark as deleted
    friendship->updated_at = time(NULL);
    
    log_activity(user_id, "FRIEND_REMOVE", "Removed friend");
    
    // Thông báo cho người bị unfriend (optional)
    int friend_client = find_client_by_user_id(server, friend_id);
    if (friend_client >= 0) {
        char notify[100];
        sprintf(notify, "%d|removed you from friends", user_id);
        send_response(server, friend_client, MSG_FRIEND_NOTIFY, notify);
    }
    
    send_response(server, client_idx, MSG_FRIEND_REMOVE, "OK|Friend removed");
    return 0;
}
```

### 📝 CODE LẤY DANH SÁCH BẠN BÈ (Yêu cầu #8)

```c
/**
 * Lấy danh sách bạn bè và trạng thái
 */
int handle_friend_list(ChatServer *server, int client_idx) {
    int user_id = server->clients[client_idx].user_id;
    
    if (user_id == 0) {
        send_response(server, client_idx, MSG_ERROR, "Not logged in");
        return -1;
    }
    
    // Xây dựng response
    char response[4096] = "";
    int count = 0;
    
    for (int i = 0; i < g_friendship_count; i++) {
        Friendship *f = &g_friendships[i];
        
        if (strcmp(f->status, "accepted") != 0) continue;
        
        int friend_id = 0;
        if (f->user_id == user_id) {
            friend_id = f->friend_id;
        } else if (f->friend_id == user_id) {
            friend_id = f->user_id;
        } else {
            continue;
        }
        
        User *friend = get_user_by_id(friend_id);
        if (friend) {
            char entry[100];
            sprintf(entry, "%d|%s|%s,", 
                    friend->user_id, 
                    friend->username, 
                    friend->status);  // online/offline
            strcat(response, entry);
            count++;
        }
    }
    
    // Gửi response
    char final_response[4200];
    sprintf(final_response, "%d|%s", count, response);
    send_response(server, client_idx, MSG_FRIEND_LIST_RSP, final_response);
    
    return 0;
}
```

---

## 2.7 GỬI NHẬN TIN NHẮN (Yêu cầu #9)

### 📚 KIẾN THỨC: MESSAGE ROUTING

**Flow gửi tin nhắn:**
```
Sender → Server → [Nếu recipient online] → Recipient
                → [Nếu offline] → Lưu vào queue
```

### 📝 CODE GỬI TIN NHẮN

```c
#define MSG_CHAT_SEND       0x30
#define MSG_CHAT_DELIVER    0x31
#define MSG_CHAT_ACK        0x32

typedef struct {
    int message_id;
    int sender_id;
    int recipient_id;
    char content[4000];
    time_t sent_at;
    int delivered;
    int read;
} Message;

#define MAX_MESSAGES 100000
Message g_messages[MAX_MESSAGES];
int g_message_count = 0;

/**
 * Xử lý gửi tin nhắn trực tiếp
 * Payload format: recipient_id|content
 */
int handle_chat_send(ChatServer *server, int client_idx, const char *payload) {
    int sender_id = server->clients[client_idx].user_id;
    
    if (sender_id == 0) {
        send_response(server, client_idx, MSG_ERROR, "Not logged in");
        return -1;
    }
    
    // Parse payload
    int recipient_id;
    char content[4000];
    
    char *delimiter = strchr(payload, '|');
    if (delimiter == NULL) {
        send_response(server, client_idx, MSG_ERROR, "Invalid format");
        return -1;
    }
    
    recipient_id = atoi(payload);
    strcpy(content, delimiter + 1);
    
    // Kiểm tra có phải bạn bè không (optional - tùy yêu cầu)
    if (!are_friends(sender_id, recipient_id)) {
        send_response(server, client_idx, MSG_ERROR, "Not friends");
        return -1;
    }
    
    // Lưu message
    Message *msg = &g_messages[g_message_count++];
    msg->message_id = g_message_count;
    msg->sender_id = sender_id;
    msg->recipient_id = recipient_id;
    strcpy(msg->content, content);
    msg->sent_at = time(NULL);
    msg->delivered = 0;
    msg->read = 0;
    
    // Log
    log_activity(sender_id, "CHAT_SEND", "Sent message");
    
    // Gửi ACK cho sender
    char ack[50];
    sprintf(ack, "OK|%d", msg->message_id);
    send_response(server, client_idx, MSG_CHAT_ACK, ack);
    
    // Tìm recipient
    int recipient_client = find_client_by_user_id(server, recipient_id);
    
    if (recipient_client >= 0) {
        // Recipient online → gửi ngay
        deliver_message(server, recipient_client, msg);
        msg->delivered = 1;
    } else {
        // Recipient offline → lưu vào queue (Yêu cầu #16)
        queue_offline_message(msg);
    }
    
    return 0;
}

/**
 * Gửi tin nhắn đến client
 */
void deliver_message(ChatServer *server, int client_idx, Message *msg) {
    User *sender = get_user_by_id(msg->sender_id);
    
    char payload[4200];
    sprintf(payload, "%d|%s|%d|%s|%ld",
            msg->message_id,
            sender->username,
            msg->sender_id,
            msg->content,
            msg->sent_at);
    
    send_response(server, client_idx, MSG_CHAT_DELIVER, payload);
}
```

---

## 2.8 NGẮT KẾT NỐI (Yêu cầu #10)

### 📚 KIẾN THỨC: CONNECTION TERMINATION

**Các trường hợp ngắt kết nối:**
1. Client gửi MSG_LOGOUT (graceful)
2. Client đóng socket (TCP FIN)
3. Client crash/mất mạng (TCP timeout hoặc heartbeat fail)
4. Server kick client

### 📝 CODE XỬ LÝ NGẮT KẾT NỐI

```c
/**
 * Xử lý logout chủ động
 */
int handle_logout(ChatServer *server, int client_idx) {
    ClientInfo *client = &server->clients[client_idx];
    
    if (client->user_id == 0) {
        send_response(server, client_idx, MSG_LOGOUT_ACK, "OK");
        disconnect_client(server, client_idx);
        return 0;
    }
    
    // Cập nhật user status
    User *user = get_user_by_id(client->user_id);
    if (user) {
        strcpy(user->status, "offline");
    }
    
    // Hủy session
    invalidate_session_by_user(client->user_id);
    
    // Log
    log_activity(client->user_id, "LOGOUT", "User logged out");
    
    // QUAN TRỌNG: Thông báo cho bạn bè (Yêu cầu đề bài)
    broadcast_status_change(server, client->user_id, "offline");
    
    // Gửi ACK trước khi đóng
    send_response(server, client_idx, MSG_LOGOUT_ACK, "OK|Goodbye");
    
    // Đóng connection
    disconnect_client(server, client_idx);
    
    return 0;
}

/**
 * Thông báo trạng thái cho bạn bè
 * ĐÂY LÀ YÊU CẦU QUAN TRỌNG: "thông báo cho bên còn lại biết"
 */
void broadcast_status_change(ChatServer *server, int user_id, const char *status) {
    // Lấy danh sách bạn bè
    int friend_ids[100];
    int friend_count = get_friends(user_id, friend_ids, 100);
    
    User *user = get_user_by_id(user_id);
    
    for (int i = 0; i < friend_count; i++) {
        int friend_client = find_client_by_user_id(server, friend_ids[i]);
        
        if (friend_client >= 0) {
            // Bạn đang online → gửi notification
            char notify[100];
            sprintf(notify, "%d|%s|%s", user_id, user->username, status);
            send_response(server, friend_client, MSG_STATUS_NOTIFY, notify);
        }
    }
}
```

---

## 2.9 QUẢN LÝ NHÓM CHAT (Yêu cầu #11-#15)

### 📚 KIẾN THỨC: GROUP MESSAGING

**Đặc điểm group chat:**
- Một message gửi đến nhiều người
- Cần quản lý membership (ai trong nhóm)
- Phân quyền (admin/member)

### 📝 CẤU TRÚC DỮ LIỆU

```c
typedef struct {
    int group_id;
    char name[100];
    char description[256];
    int created_by;
    time_t created_at;
} Group;

typedef struct {
    int group_id;
    int user_id;
    char role[20];      // "admin", "member"
    time_t joined_at;
} GroupMember;

#define MAX_GROUPS 1000
#define MAX_GROUP_MEMBERS 10000

Group g_groups[MAX_GROUPS];
int g_group_count = 0;

GroupMember g_group_members[MAX_GROUP_MEMBERS];
int g_group_member_count = 0;

// Message types
#define MSG_GROUP_CREATE      0x40
#define MSG_GROUP_CREATE_ACK  0x41
#define MSG_GROUP_INVITE      0x42
#define MSG_GROUP_JOIN        0x43
#define MSG_GROUP_LEAVE       0x44
#define MSG_GROUP_REMOVE_USER 0x45
#define MSG_GROUP_MSG         0x46
#define MSG_GROUP_MSG_DELIVER 0x47
```

### 📝 CODE TẠO NHÓM (Yêu cầu #11)

```c
/**
 * Tạo nhóm chat mới
 * Payload format: group_name|description
 */
int handle_group_create(ChatServer *server, int client_idx, const char *payload) {
    int user_id = server->clients[client_idx].user_id;
    
    if (user_id == 0) {
        send_response(server, client_idx, MSG_ERROR, "Not logged in");
        return -1;
    }
    
    // Parse payload
    char name[100], description[256];
    char *delimiter = strchr(payload, '|');
    
    if (delimiter) {
        strncpy(name, payload, delimiter - payload);
        name[delimiter - payload] = '\0';
        strcpy(description, delimiter + 1);
    } else {
        strcpy(name, payload);
        description[0] = '\0';
    }
    
    // Tạo group
    Group *group = &g_groups[g_group_count++];
    group->group_id = g_group_count;
    strcpy(group->name, name);
    strcpy(group->description, description);
    group->created_by = user_id;
    group->created_at = time(NULL);
    
    // Thêm creator làm admin
    GroupMember *member = &g_group_members[g_group_member_count++];
    member->group_id = group->group_id;
    member->user_id = user_id;
    strcpy(member->role, "admin");
    member->joined_at = time(NULL);
    
    // Log
    log_activity(user_id, "GROUP_CREATE", name);
    
    // Response
    char response[150];
    sprintf(response, "OK|%d|%s", group->group_id, name);
    send_response(server, client_idx, MSG_GROUP_CREATE_ACK, response);
    
    return 0;
}
```

### 📝 CODE MỜI NGƯỜI VÀO NHÓM (Yêu cầu #12)

```c
/**
 * Mời người dùng vào nhóm
 * Payload format: group_id|user_id
 * 
 * NOTE: Theo đề bài, user gửi yêu cầu MỜI tham gia nhóm tới user khác
 */
int handle_group_invite(ChatServer *server, int client_idx, const char *payload) {
    int inviter_id = server->clients[client_idx].user_id;
    int group_id, target_user_id;
    
    if (sscanf(payload, "%d|%d", &group_id, &target_user_id) != 2) {
        send_response(server, client_idx, MSG_ERROR, "Invalid format");
        return -1;
    }
    
    // Kiểm tra inviter có trong group không
    if (!is_group_member(group_id, inviter_id)) {
        send_response(server, client_idx, MSG_ERROR, "You are not in this group");
        return -1;
    }
    
    // Kiểm tra target đã trong group chưa
    if (is_group_member(group_id, target_user_id)) {
        send_response(server, client_idx, MSG_ERROR, "User already in group");
        return -1;
    }
    
    // Gửi thông báo mời cho target user
    int target_client = find_client_by_user_id(server, target_user_id);
    if (target_client >= 0) {
        Group *group = get_group_by_id(group_id);
        User *inviter = get_user_by_id(inviter_id);
        
        char notify[200];
        sprintf(notify, "INVITE|%d|%s|%d|%s",
                group_id, group->name,
                inviter_id, inviter->username);
        send_response(server, target_client, MSG_GROUP_INVITE, notify);
    }
    
    // Có thể lưu invite vào database để user offline cũng nhận được
    
    log_activity(inviter_id, "GROUP_INVITE", "Invited user to group");
    
    send_response(server, client_idx, MSG_GROUP_INVITE, "OK|Invitation sent");
    return 0;
}

/**
 * Tham gia nhóm (chấp nhận lời mời)
 */
int handle_group_join(ChatServer *server, int client_idx, const char *payload) {
    int user_id = server->clients[client_idx].user_id;
    int group_id = atoi(payload);
    
    // Kiểm tra group tồn tại
    Group *group = get_group_by_id(group_id);
    if (group == NULL) {
        send_response(server, client_idx, MSG_ERROR, "Group not found");
        return -1;
    }
    
    // Kiểm tra đã trong group chưa
    if (is_group_member(group_id, user_id)) {
        send_response(server, client_idx, MSG_ERROR, "Already in group");
        return -1;
    }
    
    // Thêm member
    GroupMember *member = &g_group_members[g_group_member_count++];
    member->group_id = group_id;
    member->user_id = user_id;
    strcpy(member->role, "member");
    member->joined_at = time(NULL);
    
    // Thông báo cho các thành viên khác
    User *user = get_user_by_id(user_id);
    notify_group_members(server, group_id, user_id,
                        "USER_JOINED", user->username);
    
    log_activity(user_id, "GROUP_JOIN", group->name);
    
    send_response(server, client_idx, MSG_GROUP_JOIN, "OK|Joined group");
    return 0;
}
```

### 📝 CODE RỜI NHÓM (Yêu cầu #14)

```c
/**
 * Rời khỏi nhóm
 */
int handle_group_leave(ChatServer *server, int client_idx, const char *payload) {
    int user_id = server->clients[client_idx].user_id;
    int group_id = atoi(payload);
    
    // Tìm và xóa membership
    for (int i = 0; i < g_group_member_count; i++) {
        if (g_group_members[i].group_id == group_id &&
            g_group_members[i].user_id == user_id) {
            
            // Thông báo cho các thành viên khác
            User *user = get_user_by_id(user_id);
            notify_group_members(server, group_id, user_id,
                                "USER_LEFT", user->username);
            
            // Đánh dấu xóa (hoặc dịch chuyển mảng)
            g_group_members[i].group_id = -1;
            
            log_activity(user_id, "GROUP_LEAVE", "Left group");
            
            send_response(server, client_idx, MSG_GROUP_LEAVE, "OK|Left group");
            return 0;
        }
    }
    
    send_response(server, client_idx, MSG_ERROR, "Not in group");
    return -1;
}
```

### 📝 CODE XÓA NGƯỜI KHỎI NHÓM (Yêu cầu #13)

```c
/**
 * Xóa người dùng khỏi nhóm (chỉ admin)
 */
int handle_group_remove_user(ChatServer *server, int client_idx, const char *payload) {
    int admin_id = server->clients[client_idx].user_id;
    int group_id, target_user_id;
    
    if (sscanf(payload, "%d|%d", &group_id, &target_user_id) != 2) {
        send_response(server, client_idx, MSG_ERROR, "Invalid format");
        return -1;
    }
    
    // Kiểm tra quyền admin
    if (!is_group_admin(group_id, admin_id)) {
        send_response(server, client_idx, MSG_ERROR, "Not admin");
        return -1;
    }
    
    // Không thể tự xóa mình
    if (admin_id == target_user_id) {
        send_response(server, client_idx, MSG_ERROR, "Cannot remove yourself");
        return -1;
    }
    
    // Xóa membership
    for (int i = 0; i < g_group_member_count; i++) {
        if (g_group_members[i].group_id == group_id &&
            g_group_members[i].user_id == target_user_id) {
            
            // Thông báo cho target
            int target_client = find_client_by_user_id(server, target_user_id);
            if (target_client >= 0) {
                Group *group = get_group_by_id(group_id);
                char notify[100];
                sprintf(notify, "REMOVED|%d|%s", group_id, group->name);
                send_response(server, target_client, MSG_GROUP_REMOVE_USER, notify);
            }
            
            g_group_members[i].group_id = -1;
            
            log_activity(admin_id, "GROUP_REMOVE_USER", "Removed user from group");
            
            send_response(server, client_idx, MSG_GROUP_REMOVE_USER, "OK|User removed");
            return 0;
        }
    }
    
    send_response(server, client_idx, MSG_ERROR, "User not in group");
    return -1;
}
```

### 📝 CODE GỬI TIN NHẮN NHÓM (Yêu cầu #15)

```c
/**
 * Gửi tin nhắn đến nhóm
 * Payload format: group_id|content
 */
int handle_group_message(ChatServer *server, int client_idx, const char *payload) {
    int sender_id = server->clients[client_idx].user_id;
    
    // Parse payload
    int group_id;
    char content[4000];
    
    char *delimiter = strchr(payload, '|');
    if (delimiter == NULL) {
        send_response(server, client_idx, MSG_ERROR, "Invalid format");
        return -1;
    }
    
    group_id = atoi(payload);
    strcpy(content, delimiter + 1);
    
    // Kiểm tra có trong group không
    if (!is_group_member(group_id, sender_id)) {
        send_response(server, client_idx, MSG_ERROR, "Not in group");
        return -1;
    }
    
    // Lưu message
    Message *msg = &g_messages[g_message_count++];
    msg->message_id = g_message_count;
    msg->sender_id = sender_id;
    msg->recipient_id = -group_id;  // Negative = group ID
    strcpy(msg->content, content);
    msg->sent_at = time(NULL);
    
    // Log
    log_activity(sender_id, "GROUP_MSG", "Sent group message");
    
    // Gửi đến tất cả thành viên online (trừ sender)
    User *sender = get_user_by_id(sender_id);
    Group *group = get_group_by_id(group_id);
    
    for (int i = 0; i < g_group_member_count; i++) {
        if (g_group_members[i].group_id != group_id) continue;
        if (g_group_members[i].user_id == sender_id) continue;
        
        int member_client = find_client_by_user_id(server, g_group_members[i].user_id);
        
        if (member_client >= 0) {
            char payload[4200];
            sprintf(payload, "%d|%s|%d|%s|%s|%ld",
                    msg->message_id,
                    group->name,
                    sender_id,
                    sender->username,
                    content,
                    msg->sent_at);
            send_response(server, member_client, MSG_GROUP_MSG_DELIVER, payload);
        } else {
            // Member offline → queue message
            queue_offline_group_message(g_group_members[i].user_id, msg);
        }
    }
    
    // ACK cho sender
    char ack[50];
    sprintf(ack, "OK|%d", msg->message_id);
    send_response(server, client_idx, MSG_CHAT_ACK, ack);
    
    return 0;
}
```

---

## 2.10 GỬI TIN NHẮN OFFLINE (Yêu cầu #16)

### 📚 KIẾN THỨC: STORE-AND-FORWARD

**Nguyên lý:**
1. Khi recipient offline → lưu message vào queue
2. Khi recipient đăng nhập → gửi tất cả message trong queue

### 📝 CODE

```c
typedef struct {
    int queue_id;
    int message_id;
    int recipient_id;
    time_t queued_at;
    int delivered;
} OfflineQueue;

#define MAX_OFFLINE_QUEUE 50000
OfflineQueue g_offline_queue[MAX_OFFLINE_QUEUE];
int g_offline_count = 0;

/**
 * Thêm message vào queue offline
 */
void queue_offline_message(Message *msg) {
    OfflineQueue *entry = &g_offline_queue[g_offline_count++];
    entry->queue_id = g_offline_count;
    entry->message_id = msg->message_id;
    entry->recipient_id = msg->recipient_id;
    entry->queued_at = time(NULL);
    entry->delivered = 0;
}

/**
 * Gửi tất cả tin nhắn offline khi user đăng nhập
 * Được gọi sau khi login thành công
 */
void deliver_offline_messages(ChatServer *server, int client_idx) {
    int user_id = server->clients[client_idx].user_id;
    
    for (int i = 0; i < g_offline_count; i++) {
        if (g_offline_queue[i].recipient_id == user_id &&
            g_offline_queue[i].delivered == 0) {
            
            // Tìm message gốc
            Message *msg = get_message_by_id(g_offline_queue[i].message_id);
            
            if (msg) {
                deliver_message(server, client_idx, msg);
                g_offline_queue[i].delivered = 1;
                msg->delivered = 1;
            }
        }
    }
}
```

---

## 2.11 GHI LOG HOẠT ĐỘNG (Yêu cầu #17)

### 📚 KIẾN THỨC: LOGGING

**Mục đích của logging:**
1. Debug lỗi
2. Audit trail (theo dõi hoạt động)
3. Phân tích hành vi người dùng
4. Phát hiện bất thường

### 📝 CODE

```c
#define LOG_FILE "server.log"

typedef struct {
    time_t timestamp;
    int user_id;
    char event_type[50];
    char event_data[256];
    char client_ip[46];
} ActivityLog;

/**
 * Ghi log hoạt động
 */
void log_activity(int user_id, const char *event_type, const char *event_data) {
    FILE *f = fopen(LOG_FILE, "a");
    if (f == NULL) return;
    
    time_t now = time(NULL);
    char time_str[30];
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", localtime(&now));
    
    fprintf(f, "[%s] User=%d Event=%s Data=%s\n",
            time_str, user_id, event_type, event_data);
    
    fclose(f);
}

/**
 * Các loại event cần log
 */
// Authentication
// - REGISTER: Đăng ký tài khoản
// - LOGIN: Đăng nhập thành công
// - LOGIN_FAIL: Đăng nhập thất bại
// - LOGOUT: Đăng xuất

// Messaging
// - CHAT_SEND: Gửi tin nhắn
// - GROUP_MSG: Gửi tin nhắn nhóm

// Friends
// - FRIEND_REQUEST: Gửi lời mời kết bạn
// - FRIEND_ACCEPT: Chấp nhận lời mời
// - FRIEND_REJECT: Từ chối lời mời
// - FRIEND_REMOVE: Hủy kết bạn

// Groups
// - GROUP_CREATE: Tạo nhóm
// - GROUP_JOIN: Tham gia nhóm
// - GROUP_LEAVE: Rời nhóm
// - GROUP_INVITE: Mời vào nhóm

// System
// - CONNECT: Kết nối mới
// - DISCONNECT: Ngắt kết nối
// - ERROR: Lỗi hệ thống
```

---

## 2.12 CẤU TRÚC THƯ MỤC DỰ ÁN

```
chat-tcp/
├── Makefile
├── README.md
├── include/
│   ├── common.h          # Định nghĩa chung
│   ├── protocol.h        # Message types, packet structure
│   ├── server.h          # Server structures
│   ├── user.h            # User management
│   ├── friend.h          # Friend management
│   ├── group.h           # Group management
│   ├── message.h         # Message handling
│   └── logger.h          # Logging
├── src/
│   ├── server/
│   │   ├── main.c        # Entry point
│   │   ├── server.c      # Server logic với select()
│   │   └── handlers.c    # Message handlers
│   ├── client/
│   │   ├── main.c        # Entry point
│   │   ├── client.c      # Client logic
│   │   └── ui.c          # Command line interface
│   └── common/
│       ├── protocol.c    # Serialization
│       ├── user.c        # User operations
│       ├── friend.c      # Friend operations
│       ├── group.c       # Group operations
│       ├── message.c     # Message operations
│       └── logger.c      # Logging
├── data/
│   ├── users.dat         # User database
│   ├── friends.dat       # Friendship database
│   ├── groups.dat        # Group database
│   └── messages.dat      # Message database
└── logs/
    └── server.log        # Activity log
```

---

## 2.13 MAKEFILE

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -g -I./include
LDFLAGS = -lpthread

# Source files
SERVER_SRC = src/server/main.c src/server/server.c src/server/handlers.c \
             src/common/protocol.c src/common/user.c src/common/friend.c \
             src/common/group.c src/common/message.c src/common/logger.c

CLIENT_SRC = src/client/main.c src/client/client.c src/client/ui.c \
             src/common/protocol.c

# Targets
all: server client

server: $(SERVER_SRC)
	$(CC) $(CFLAGS) -o bin/server $^ $(LDFLAGS)

client: $(CLIENT_SRC)
	$(CC) $(CFLAGS) -o bin/client $^ $(LDFLAGS)

clean:
	rm -f bin/server bin/client

.PHONY: all clean
```

---

## 2.14 LỘ TRÌNH THỰC HIỆN

### Giai đoạn 1: Nền tảng (3-4 ngày)
- [ ] Setup project structure
- [ ] Implement TCP server với select()
- [ ] Implement message framing
- [ ] Test với simple echo

### Giai đoạn 2: Authentication (2-3 ngày)
- [ ] Implement đăng ký
- [ ] Implement đăng nhập
- [ ] Implement session management
- [ ] Test login/logout flow

### Giai đoạn 3: Friends & Messaging (3-4 ngày)
- [ ] Implement friend system
- [ ] Implement direct messaging
- [ ] Implement offline queue
- [ ] Test end-to-end messaging

### Giai đoạn 4: Groups (2-3 ngày)
- [ ] Implement group CRUD
- [ ] Implement group messaging
- [ ] Test group features

### Giai đoạn 5: Polish (1-2 ngày)
- [ ] Implement logging
- [ ] Error handling
- [ ] Testing
- [ ] Documentation

---

## 2.15 TÓM TẮT CÁC KIẾN THỨC ĐÃ SỬ DỤNG

| Kiến thức | Bài giảng | Áp dụng trong dự án |
|-----------|-----------|---------------------|
| TCP Socket | Lec03, Lec04 | Tạo server, client connection |
| Socket Address | Lec03 | sockaddr_in, htons, htonl |
| Byte Order | Lec03 | Network byte order cho protocol |
| I/O Multiplexing | Lec06 | select() để xử lý nhiều clients |
| Message Framing | Lec04 | Length-prefixed protocol |
| Signal Handling | Lec05 | Xử lý SIGPIPE, cleanup |

---

# KẾT LUẬN

Plan cải tiến này:
1. ✅ Bao phủ đầy đủ 17/17 yêu cầu
2. ✅ Sử dụng kiến thức từ giáo trình (select() thay vì epoll)
3. ✅ Giải thích chi tiết tại sao chọn mỗi kỹ thuật
4. ✅ Code minh họa phù hợp trình độ môn học
5. ✅ Lộ trình thực hiện rõ ràng

**Khuyến nghị:** Bắt đầu từ giai đoạn 1, test kỹ từng phần trước khi chuyển sang giai đoạn tiếp theo.
