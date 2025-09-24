# ShareVoucher API Integration Setup

Ứng dụng hiện đã được tích hợp với ShareVoucher API để upload ảnh thay vì lưu trực tiếp vào database dưới dạng base64.

## Thiết lập Environment Variables

Thêm các biến môi trường sau vào file `.env.local` của bạn:

### Option 1: Bearer Token Authentication (Main Endpoint)

```bash
# Sử dụng endpoint chính với Bearer token
NEXT_PUBLIC_SHAREVOUCHER_AUTH_TOKEN="your-bearer-token-here"
NEXT_PUBLIC_SHAREVOUCHER_USE_INTERNAL="false"
```

### Option 2: Basic Authentication (Internal Endpoint)

```bash
# Sử dụng internal endpoint với Basic auth
NEXT_PUBLIC_SHAREVOUCHER_BASIC_AUTH="your-basic-auth-token-here"
NEXT_PUBLIC_SHAREVOUCHER_USE_INTERNAL="true"
```

## Cách lấy Authentication Tokens

### Bearer Token

1. Đăng nhập vào ShareVoucher dashboard
2. Vào Settings > API Keys
3. Tạo hoặc copy API key của bạn

### Basic Auth Token

1. Lấy username và password cho internal API
2. Encode thành base64: `btoa(username + ":" + password)`
3. Sử dụng kết quả làm `NEXT_PUBLIC_SHAREVOUCHER_BASIC_AUTH`

**✅ Đã cấu hình**: Token `YWRtaW46MTIzNDU2` đã được thiết lập trong `.env.local` từ curl command bạn cung cấp.

## API Endpoints

### Main Upload Endpoint

```
POST https://sharevoucher.app/api/v1/asset/image
Headers: Authorization: Bearer {token}
```

### Internal Upload Endpoint

```
POST https://sharevoucher.app/api/v1/internal/asset/image
Headers: authorization: Basic {token}
```

## Cách thức hoạt động

1. **Upload ảnh**: Khi người dùng chọn ảnh trong form, ảnh sẽ được compress
2. **Proxy upload**: Ảnh được gửi qua Next.js API proxy (`/api/upload-image`) để bypass CORS
3. **ShareVoucher API**: Proxy server gọi ShareVoucher API với authentication
4. **Lưu URL**: API trả về URL của ảnh, URL này được lưu vào database thay vì data base64
5. **Hiển thị ảnh**: Component sẽ hiển thị ảnh từ URL được trả về
6. **Backward compatibility**: Hệ thống vẫn hỗ trợ hiển thị ảnh base64 cũ

## Thay đổi codebase

### Files đã được cập nhật:

1. **`src/lib/image-upload.ts`** - Service upload ảnh với proxy support
2. **`src/lib/image-utils.ts`** - Utility functions cho xử lý ảnh
3. **`src/app/api/upload-image/route.ts`** - ⭐ **NEW** Proxy API để bypass CORS
4. **`src/components/map/location-note-form.tsx`** - Upload ảnh trong location notes
5. **`src/components/map/add-place-form.tsx`** - Upload ảnh trong place form
6. **`src/components/map/note-details-view.tsx`** - Hiển thị ảnh trong note details
7. **`src/components/map/place-popup.tsx`** - Hiển thị ảnh trong place popup
8. **`src/app/api/places/route.ts`** - API hỗ trợ lưu image URLs

### Features mới:

- ✅ Upload ảnh qua ShareVoucher API
- ✅ **CORS bypass**: Sử dụng Next.js API proxy
- ✅ Progress indicator khi upload
- ✅ Error handling cho upload thất bại
- ✅ Compression ảnh trước khi upload
- ✅ Support cả Bearer và Basic authentication
- ✅ Backward compatibility với base64 images
- ✅ Server-side authentication (an toàn hơn)
- ✅ Debug logging chi tiết

## Troubleshooting

### Lỗi authentication

- Kiểm tra token có đúng không
- Kiểm tra endpoint đang sử dụng (main vs internal)

### Upload thất bại

- Kiểm tra kết nối internet
- Kiểm tra size ảnh (có thể bị giới hạn)
- Xem console logs để debug

### Ảnh không hiển thị

- Kiểm tra URL có valid không
- Kiểm tra CORS settings
- Kiểm tra network requests trong browser DevTools

## Testing

Để test integration:

1. Thiết lập environment variables
2. Chạy ứng dụng: `npm run dev`
3. Thử upload ảnh trong location note hoặc place form
4. Kiểm tra console logs để thấy progress
5. Verify ảnh hiển thị đúng sau khi upload

## Migration từ Base64

Ảnh base64 cũ vẫn sẽ hoạt động bình thường. Chỉ ảnh mới sẽ được upload qua ShareVoucher API. Không cần migration dữ liệu.
