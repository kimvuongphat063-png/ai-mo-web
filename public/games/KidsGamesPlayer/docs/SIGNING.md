# Ký APK release

## Khóa của dự án

- Vị trí: `KidsGamesPlayer/.local-signing/` trên máy đã build bản giao (`kidsgamesplayer-release.p12` + `keystore.properties` chứa mật khẩu ngẫu nhiên).
- Thư mục đã được giới hạn quyền cho tài khoản Windows hiện tại (icacls) và nằm trong `.gitignore`; `tools/package_delivery.py` từ chối đóng gói mọi file dạng `.p12/.jks/.keystore/keystore.properties`.
- Alias `kgp-release`, RSA 4096, hiệu lực 10.000 ngày, DN `CN=Kids Games Player, OU=Family, O=Family, C=VN`.
- SHA-256 chứng chỉ (công khai, để đối chiếu): xem `BUILD_REPORT.md` và `dist/apksigner-verify.txt`.

## Vì sao phải giữ khóa này

Android chỉ cho **cài đè (cập nhật) app** khi APK mới có cùng `applicationId` (`vn.family.kidsgamesplayer`) **và cùng chứng chỉ ký**. Mất khóa → không cập nhật được bản đã cài; phải gỡ app (mất tiến trình và danh sách game đã nạp) rồi cài bản ký khóa mới.

## Sao lưu (việc chủ dự án cần làm)

1. Chép **cả thư mục** `.local-signing/` sang 2 nơi an toàn, ví dụ USB cất riêng + trình quản lý mật khẩu/kho mã hóa cá nhân.
2. Không gửi qua chat/email, không đưa vào ZIP mã nguồn, không commit.
3. Khi chuyển máy build: chép thư mục này vào `KidsGamesPlayer/.local-signing/` rồi chạy `scripts\build.ps1`.

Agent đã tạo khóa nhưng **chưa sao lưu** ra ngoài máy này (agent không có nơi lưu trữ an toàn được chủ máy chỉ định).

## Quy tắc script

- `scripts/create_signing_key.ps1|sh` chỉ tạo khóa **nếu chưa có**, không bao giờ ghi đè; mật khẩu truyền cho keytool qua biến môi trường, không in ra màn hình/log.
- `app/build.gradle.kts` đọc `.local-signing/keystore.properties` lúc build; không có file này thì bản release **không được ký** và `package_delivery` sẽ từ chối.
- Bản debug dùng khóa debug của Android SDK và `applicationIdSuffix=.debug`, nên cài song song, không đè bản release.
