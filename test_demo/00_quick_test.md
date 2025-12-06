# QUICK TEST - CHẠY NHANH TRONG 2 PHÚT

Dành cho ai muốn test nhanh các tính năng chính.

> Run these commands from the repository root (where you ran `git clone` or `git pull`).
> Example: `cd /path/to/tcp-chat-socket`

---

## BƯỚC 1: Khởi động (Terminal riêng)

```bash
# from repository root, e.g. `cd /path/to/tcp-chat-socket`
make clean && make
./bin/server
```

---

## BƯỚC 2: Client 1 - Alice (Terminal mới)

```bash
# from repository root, e.g. `cd /path/to/tcp-chat-socket`
./bin/client
```

# Sau khi client kết nối:
```
register alice pass123456 alice@test.com
login alice pass123456
friend list
```

---

## BƯỚC 3: Client 2 - Bob (Terminal mới)

```bash
# from repository root, e.g. `cd /path/to/tcp-chat-socket`
./bin/client
```

# Sau khi client kết nối:
```
register bob pass123456 bob@test.com
login bob pass123456
friend add alice
```

---

## BƯỚC 4: Alice chấp nhận kết bạn và chat

# Terminal Alice:
```
friend accept 2
msg 2 Hello Bob!
```

# Terminal Bob:
```
msg 1 Hi Alice!
```

---

## BƯỚC 5: Tạo nhóm và chat nhóm

# Terminal Alice:
```
group create TestGroup Quick test group
group invite 1 2
```

# Terminal Bob:
```
group join 1
group msg 1 Hello group!
```

# Terminal Alice:
```
group msg 1 Welcome everyone!
```

---

## BƯỚC 6: Kết thúc

# Cả 2 terminal:
```
logout
quit
```

# Terminal server: Ctrl+C để dừng

---

DONE! Bạn đã test xong các tính năng chính:
- ✅ Đăng ký/Đăng nhập
- ✅ Kết bạn
- ✅ Chat 1-1
- ✅ Tạo nhóm
- ✅ Chat nhóm
