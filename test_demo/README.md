# Test Demo - TCP Chat Application

Hướng dẫn test trải nghiệm ứng dụng Chat TCP Socket.

## Cách sử dụng

1. Chạy server: `./bin/server`
2. Mở nhiều terminal và chạy client: `./bin/client`
3. Copy và paste các lệnh từ các file test theo thứ tự

## Danh sách file test

| File | Mô tả |
|------|-------|
| `01_basic_auth.txt` | Test đăng ký và đăng nhập |
| `02_friend_system.txt` | Test hệ thống kết bạn |
| `03_direct_messaging.txt` | Test nhắn tin trực tiếp |
| `04_group_chat.txt` | Test nhóm chat |
| `05_full_scenario.txt` | Kịch bản test đầy đủ với 3 user |
| `commands_reference.txt` | Tham khảo tất cả lệnh |

## Lưu ý

- Mỗi khi restart server, data sẽ bị xóa (nếu chạy `make clean`)
- User ID bắt đầu từ 1 và tăng dần
- Group ID bắt đầu từ 1 và tăng dần
- Password tối thiểu 6 ký tự
