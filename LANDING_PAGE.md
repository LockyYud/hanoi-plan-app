# 🎨 Landing Page - Pinory

## Tổng quan

Landing page đã được tạo để giới thiệu Pinory cho người dùng mới trước khi họ đăng nhập vào ứng dụng.

## Nội dung

Landing page bao gồm các phần chính:

### 1. **Header**
- Logo Pinory với icon động (pinory-icon-simple.svg)
- Nút "Đăng nhập" với gradient màu brand

### 2. **Hero Section**
- Tiêu đề chính: "Ghim lại những khoảnh khắc của bạn"
- Mô tả về concept của ứng dụng: một chiếc bảng bản đồ để ghim kỷ niệm
- CTA buttons:
  - "Bắt đầu hành trình" (đăng nhập)
  - "Tìm hiểu thêm" (scroll to features)
- Stats: 1000+ kỷ niệm, 500+ người dùng
- Visual mockup: bản đồ với pins động và journey lines

### 3. **Features Section**
4 tính năng chính:
- **Ghim địa điểm**: Đánh dấu nơi bạn đã đến
- **Lưu ảnh & ghi chú**: Thêm ảnh và câu chuyện
- **Xem hành trình**: Nhìn lại toàn bộ journey
- **Chia sẻ kỷ niệm**: Chia sẻ với bạn bè

### 4. **How It Works Section**
3 bước đơn giản:
1. Đăng nhập với Google
2. Thêm địa điểm và ảnh
3. Nhìn lại hành trình

### 5. **CTA Section**
- Call-to-action lớn với background gradient
- "Bắt đầu ghim câu chuyện của bạn"
- Note: Miễn phí mãi mãi

### 6. **Footer**
- Logo và tagline
- Copyright

## Design System

### Colors
- **Primary**: Gradient từ #ff6b6b đến #ff8e53 (coral/orange)
- **Background**: Gradient từ #f8f1e5 (cream) qua white
- **Text**: Gray-900 cho headings, Gray-600 cho body

### Typography
- **Headings**: Font-bold, text-5xl ~ text-4xl
- **Body**: Text-xl ~ text-base
- **Inter font family** (từ Google Fonts)

### Assets Used
- `/pinory-icon-simple.svg` - Logo icon
- Lucide React icons: MapPin, Camera, Heart, Share2, Map

### Animations
- `animate-fade-in`: Hero content
- `animate-slide-up`: Hero visual
- `animate-float`: Floating icons và cards
- `animate-bounce`: Demo pins trên map mockup
- Hover effects: scale, shadow, translate-y

## Technical Implementation

### Files Created/Modified

1. **`src/components/landing/landing-page.tsx`** (NEW)
   - Landing page component với tất cả sections
   - Client component với next-auth integration
   - Responsive design

2. **`src/app/page.tsx`** (MODIFIED)
   - Thêm logic để hiển thị landing page khi chưa đăng nhập
   - Hiển thị main app khi đã authenticated
   - Sử dụng `useSession` hook

3. **`src/app/globals.css`** (MODIFIED)
   - Thêm `@keyframes bounce-slow` cho bounce animation
   - Thêm animation utility classes: `animate-bounce`, `delay-100`, `delay-300`, `delay-500`

### Dependencies
- `next-auth/react` - Authentication và session management
- `lucide-react` - Icons
- `next/image` - Optimized image loading

## User Flow

1. User truy cập trang chủ `/`
2. Nếu chưa đăng nhập → Hiển thị Landing Page
3. Click "Đăng nhập" hoặc "Bắt đầu hành trình" → Sign in với Google
4. Sau khi đăng nhập → Redirect về trang chủ với main app (map + sidebar)

## Responsive Design

Landing page được thiết kế responsive với breakpoints:
- Mobile: Single column layout
- Tablet (md): 2 columns cho features
- Desktop (lg): Full grid layouts, side-by-side hero section

## SEO & Metadata

Metadata đã được cấu hình trong `layout.tsx`:
- Title: "Pinory — Pin Your Story"
- Description: "Ghim lại những kỷ niệm của bạn trên bản đồ"
- OpenGraph tags
- Twitter cards

## Future Enhancements

Có thể cải thiện:
- [ ] Thêm testimonials section
- [ ] Video demo của app
- [ ] Blog/FAQ section
- [ ] Multi-language support
- [ ] Analytics tracking cho landing page
- [ ] A/B testing cho CTAs
- [ ] Screenshots thật từ app thay vì mockup
- [ ] Social proof badges
- [ ] Gallery của user-generated content

## Brand Alignment

Landing page tuân thủ Brand Identity:
- ✅ Warm & nostalgic tone
- ✅ Theme color: #f8f1e5 (cream)
- ✅ Tagline: "Pin Your Story"
- ✅ Logo usage: pinory-icon-simple.svg
- ✅ Emotional storytelling
- ✅ Personal & intimate feel

---

**Deployed:** Ready for production
**Preview:** http://localhost:3000 (when dev server running)

