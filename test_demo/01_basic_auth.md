# TEST 01: ĐĂNG KÝ VÀ ĐĂNG NHẬP

Test chức năng xác thực người dùng (Authentication)

> Run these commands from the repository root (where you ran `git clone` or `git pull`).
> Example: `cd /path/to/tcp-chat-socket`

---

## KỊCH BẢN 1: Đăng ký tài khoản mới

```bash
# Đăng ký user 1
register alice password123 alice@email.com

# Đăng ký user 2
register bob password456 bob@email.com

# Đăng ký user 3
register charlie pass789 charlie@email.com

# Kiểm tra lỗi: Username đã tồn tại
register alice newpass123 alice2@email.com

# Kiểm tra lỗi: Password quá ngắn (< 6 ký tự)
register david 12345 david@email.com
```

---

## KỊCH BẢN 2: Đăng nhập

```bash
# Đăng nhập thành công
login alice password123

# Kiểm tra lỗi: Sai password
login alice wrongpassword

# Kiểm tra lỗi: User không tồn tại
login unknownuser password123
```

---

## KỊCH BẢN 3: Đăng xuất

```bash
# Đăng xuất
logout

# Hoặc thoát ứng dụng
quit
```

---

### KẾT QUẢ MONG ĐỢI:

- Đăng ký thành công: "Registration successful! User ID: X"
- Đăng nhập thành công: "Login successful! Welcome, alice"
- Đăng ký username trùng: "Registration failed: Username already exists"
- Password ngắn: "Registration failed: Password too short (min 6 chars)"
- Sai password: "Login failed: Invalid password"
- User không tồn tại: "Login failed: User not found"
