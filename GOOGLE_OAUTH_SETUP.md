# 🔐 Hướng dẫn thiết lập Google OAuth cho Hanoi Plan

## 📋 **Bước 1: Tạo Google OAuth Application**

### 1.1 Truy cập Google Cloud Console

- Mở: https://console.developers.google.com/
- Đăng nhập với tài khoản Google của bạn

### 1.2 Tạo project mới (nếu chưa có)

```
1. Click "Select a project" → "New Project"
2. Tên project: "Hanoi Plan Auth"
3. Click "Create"
```

### 1.3 Enable Google+ API

```
1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"
```

### 1.4 Tạo OAuth 2.0 Credentials

```
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Hanoi Plan"
5. Authorized JavaScript origins:
   - http://localhost:3000
   - http://127.0.0.1:3000
6. Authorized redirect URIs:
   - http://localhost:3000/api/auth/callback/google
   - http://127.0.0.1:3000/api/auth/callback/google
7. Click "Create"
```

### 1.5 Lấy Client ID và Secret

```
Sau khi tạo, bạn sẽ nhận được:
- Client ID: (dạng: xxx.apps.googleusercontent.com)
- Client secret: (dạng: GOCSPX-xxx)
```

## 🔧 **Bước 2: Cập nhật Environment Variables**

### 2.1 Mở file `.env.local`

```bash
# Trong thư mục hanoi-plan-app
code .env.local
```

### 2.2 Thay thế credentials demo

```env
# Thay đổi từ:
GOOGLE_CLIENT_ID="demo-google-client-id"
GOOGLE_CLIENT_SECRET="demo-google-client-secret"

# Thành:
GOOGLE_CLIENT_ID="your-actual-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-actual-client-secret"
```

### 2.3 Cập nhật NextAuth Secret

```env
# Tạo secret mạnh
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

## 🚀 **Bước 3: Khởi động lại ứng dụng**

```bash
# Stop dev server nếu đang chạy
Ctrl+C

# Start lại
npm run dev
```

## ✅ **Bước 4: Test đăng nhập**

1. **Mở** http://localhost:3000
2. **Click** tab "Cá nhân" trong sidebar
3. **Click** "Đăng nhập với Google"
4. **Chọn** tài khoản Google để đăng nhập
5. **Authorize** Hanoi Plan app

## 🎯 **Demo Account cho Test**

Sau khi setup OAuth, bạn có thể dùng bất kỳ tài khoản Google nào để test:

```
Email: your-gmail@gmail.com
- Sẽ tự động tạo user trong database
- Có thể lưu địa điểm yêu thích
- Tạo và tham gia nhóm
- Tạo lộ trình
```

## 🔍 **Troubleshooting**

### Lỗi: "redirect_uri_mismatch"

```
Kiểm tra lại Authorized redirect URIs trong Google Console:
- http://localhost:3000/api/auth/callback/google
- http://127.0.0.1:3000/api/auth/callback/google
```

### Lỗi: "invalid_client"

```
Kiểm tra lại:
- GOOGLE_CLIENT_ID đúng
- GOOGLE_CLIENT_SECRET đúng
- Đã restart dev server
```

### Database Error

```bash
# Reset database nếu cần
npm run db:reset
npm run db:generate
```

## 🎉 **Hoàn thành!**

Sau khi setup thành công:

- ✅ **Đăng nhập** với Google Account
- ✅ **Lưu địa điểm yêu thích**
- ✅ **Tạo nhóm** và mời bạn bè
- ✅ **Tạo lộ trình** thông minh
- ✅ **Chia sẻ** kế hoạch

**App đã sẵn sàng sử dụng với đầy đủ tính năng! 🚀**

