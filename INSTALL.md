# Hướng Dẫn Cài Đặt và Chạy TCP Chat Socket

Hướng dẫn chi tiết để cài đặt và chạy project trên Windows (WSL) và Linux.

---

## 📋 Mục Lục

- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt trên WSL (Windows)](#cài-đặt-trên-wsl-windows)
- [Cài Đặt trên Linux](#cài-đặt-trên-linux)
- [Build và Chạy](#build-và-chạy)
- [Test Ứng Dụng](#test-ứng-dụng)
- [Xử Lý Lỗi Thường Gặp](#xử-lý-lỗi-thường-gặp)

---

## 🔧 Yêu Cầu Hệ Thống

- **GCC Compiler** (version 4.8 trở lên)
- **GNU Make**
- **Git**
- Hệ thống POSIX-compliant (Linux, macOS, WSL)

---

## 💻 Cài Đặt trên WSL (Windows)

### Bước 1: Cài Đặt WSL (nếu chưa có)

Mở **PowerShell** với quyền Administrator và chạy:

```powershell
wsl --install
```

Sau khi cài xong, restart máy và mở **Ubuntu** từ Start Menu.

### Bước 2: Cài Đặt Các Công Cụ Cần Thiết

Trong terminal WSL Ubuntu:

```bash
# Update package list
sudo apt update

# Cài đặt GCC, Make, Git
sudo apt install -y build-essential git

# Kiểm tra version
gcc --version
make --version
git --version
```

### Bước 3: Clone Project

```bash
# Di chuyển đến thư mục home
cd ~

# Clone project từ GitHub
git clone https://github.com/brixtonpham/tcp-chat-socket.git

# Vào thư mục project
cd tcp-chat-socket
```

### Bước 4: Build Project

```bash
# Clean build (nếu cần)
make clean

# Build server và client
make
```

Nếu build thành công, bạn sẽ thấy:
```
gcc -Wall -Wextra -g -I./include -o bin/server ...
gcc -Wall -Wextra -g -I./include -o bin/client ...
```

---

## 🐧 Cài Đặt trên Linux

### Ubuntu/Debian

```bash
# Update và cài đặt dependencies
sudo apt update
sudo apt install -y build-essential git

# Clone project
git clone https://github.com/brixtonpham/tcp-chat-socket.git
cd tcp-chat-socket

# Build
make
```

### Fedora/RHEL/CentOS

```bash
# Cài đặt dependencies
sudo dnf install -y gcc make git

# Clone và build
git clone https://github.com/brixtonpham/tcp-chat-socket.git
cd tcp-chat-socket
make
```

### Arch Linux

```bash
# Cài đặt dependencies
sudo pacman -S base-devel git

# Clone và build
git clone https://github.com/brixtonpham/tcp-chat-socket.git
cd tcp-chat-socket
make
```

---

## 🚀 Build và Chạy

### Cấu Trúc Thư Mục

Sau khi build, bạn sẽ có:

```
tcp-chat-socket/
├── bin/
│   ├── server      # Server executable
│   └── client      # Client executable
├── data/           # Database files (tự động tạo)
├── logs/           # Log files (tự động tạo)
└── ...
```

### Chạy Server

Mở terminal **đầu tiên**:

```bash
cd tcp-chat-socket
./bin/server
```

Bạn sẽ thấy:
```
===========================================
  TCP Chat Server
===========================================

[INFO] Server initialized successfully
Server listening on port 8888

Server ready. Press Ctrl+C to stop.
```

### Chạy Client

Mở terminal **thứ hai** (hoặc tab mới):

```bash
cd tcp-chat-socket
./bin/client
```

Bạn sẽ thấy:
```
===========================================
  TCP Chat Client
===========================================

Connected to server at 127.0.0.1:8888

Welcome to TCP Chat Client!
Type 'help' for list of commands.

>
```

### Mở Nhiều Client (Test Chat)

Để test chat giữa nhiều người, mở thêm terminal:

```bash
# Terminal 3 (Client 2)
./bin/client

# Terminal 4 (Client 3)
./bin/client
```

---

## 🧪 Test Ứng Dụng

### Test Nhanh 2 Phút

Làm theo file `test_demo/00_quick_test.txt`:

**Terminal 1 (Client 1 - Alice):**
```
register alice pass123456 alice@test.com
login alice pass123456
```

**Terminal 2 (Client 2 - Bob):**
```
register bob pass123456 bob@test.com
login bob pass123456
friend add alice
```

**Terminal 1 (Alice):**
```
friend accept 2
msg 2 Hello Bob!
```

**Terminal 2 (Bob):**
```
msg 1 Hi Alice!
```

### Test Đầy Đủ

Xem các file test trong thư mục `test_demo/`:

```bash
test_demo/
├── 00_quick_test.txt          # Test nhanh 2 phút
├── 01_basic_auth.txt          # Test đăng ký/đăng nhập
├── 02_friend_system.txt       # Test hệ thống bạn bè
├── 03_direct_messaging.txt    # Test nhắn tin 1-1
├── 04_group_chat.txt          # Test nhóm chat
├── 05_full_scenario.txt       # Test đầy đủ tất cả tính năng
├── commands_reference.txt     # Tham khảo tất cả lệnh
└── README.md                  # Hướng dẫn test
```

### Xem Commands

Trong client, gõ:
```
help
```

---

## ❗ Xử Lý Lỗi Thường Gặp

### 1. Lỗi "Address already in use"

**Nguyên nhân:** Server cũ vẫn chạy trên port 8888.

**Giải pháp:**
```bash
# Tìm process đang dùng port 8888
lsof -i :8888

# Hoặc
netstat -tulpn | grep 8888

# Kill process
kill -9 <PID>

# Hoặc dùng lệnh này để kill tất cả
pkill -f bin/server
```

### 2. Lỗi "make: command not found"

**Giải pháp:**
```bash
# Ubuntu/Debian
sudo apt install -y build-essential

# Fedora/RHEL
sudo dnf install -y make gcc

# Arch
sudo pacman -S base-devel
```

### 3. Lỗi "gcc: command not found"

**Giải pháp:**
```bash
# Ubuntu/Debian
sudo apt install -y gcc

# Fedora/RHEL
sudo dnf install -y gcc

# Arch
sudo pacman -S gcc
```

### 4. Lỗi "Connection refused"

**Nguyên nhân:** Server chưa chạy.

**Giải pháp:**
1. Kiểm tra server đang chạy:
   ```bash
   ps aux | grep bin/server
   ```

2. Nếu không có, start server:
   ```bash
   ./bin/server
   ```

### 5. Lỗi "Permission denied" khi chạy

**Giải pháp:**
```bash
# Cấp quyền thực thi
chmod +x bin/server bin/client

# Hoặc rebuild
make clean && make
```

### 6. Client bị "treo" sau register/login

**Nguyên nhân:** Bug cũ đã được fix trong version mới nhất.

**Giải pháp:**
```bash
# Pull code mới nhất
git pull origin main

# Rebuild
make clean && make

# Restart server và client
pkill -f bin/server
pkill -f bin/client
./bin/server  # Terminal 1
./bin/client  # Terminal 2
```

### 7. Lỗi biên dịch "undefined reference"

**Giải pháp:**
```bash
# Clean và rebuild
make clean
make
```

---

## 🔄 Update Code Mới

```bash
# Pull code mới từ GitHub
git pull origin main

# Rebuild
make clean && make

# Restart server
pkill -f bin/server
./bin/server
```

---

## 🌐 Chạy Server trên IP Public (LAN)

Mặc định server lắng nghe trên `0.0.0.0:8888` (tất cả interfaces).

### Tìm IP của máy:

```bash
# Linux/WSL
ip addr show | grep "inet "

# Hoặc
hostname -I
```

### Client kết nối từ máy khác:

```bash
# Thay <SERVER_IP> bằng IP thực
./bin/client
# Hoặc sửa file src/client/main.c dòng connect
```

### Mở port trên firewall:

```bash
# Ubuntu/Debian
sudo ufw allow 8888/tcp

# Fedora/RHEL
sudo firewall-cmd --add-port=8888/tcp --permanent
sudo firewall-cmd --reload
```

---

## 📝 Xem Logs

```bash
# Xem log hoạt động
cat logs/activity.log

# Xem log server
cat logs/server.log

# Theo dõi real-time
tail -f logs/activity.log
```

---

## 🧹 Dọn Dẹp

```bash
# Xóa files build
make clean

# Xóa cả data và logs
make clean
rm -f data/*.dat logs/*.log
```

---

## 📚 Tài Liệu Thêm

- **README.md** - Tổng quan project
- **GUIDE_VN.md** - Hướng dẫn sử dụng tiếng Việt
- **test_demo/** - Các kịch bản test
- **docs/tcp_chat_plan_vn.md** - Kế hoạch kỹ thuật chi tiết

---

## ❓ Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra [Issues](https://github.com/brixtonpham/tcp-chat-socket/issues)
2. Đọc phần [Xử Lý Lỗi](#xử-lý-lỗi-thường-gặp)
3. Tạo issue mới với log lỗi chi tiết

---

## ✅ Checklist Cài Đặt Thành Công

- [ ] WSL/Linux đã cài đặt
- [ ] GCC và Make đã cài đặt
- [ ] Clone project thành công
- [ ] Build không có lỗi
- [ ] Server khởi động được
- [ ] Client kết nối được
- [ ] Test register/login thành công
- [ ] Test chat thành công

**Chúc bạn thành công!** 🎉
