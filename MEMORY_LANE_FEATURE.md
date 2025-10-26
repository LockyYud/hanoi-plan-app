# Chức năng Xem lại Kỷ niệm (Memory Lane)

## Tổng quan

Chức năng "Xem lại Kỷ niệm" cho phép người dùng xem lại các ghi chú địa điểm của họ theo thời gian và hiển thị lộ trình di chuyển trên bản đồ.

## Tính năng

### 1. Filter theo thời gian

- **Quick filters**: Hôm nay, Tuần này, Tháng này, Năm này, Tất cả
- **Custom date range**: Chọn khoảng thời gian tùy chỉnh với date picker
- Tự động lọc ghi chú theo khoảng thời gian đã chọn

### 2. Hiển thị danh sách ghi chú

- Hiển thị tất cả ghi chú trong khoảng thời gian đã chọn
- Mỗi ghi chú hiển thị:
    - Số thứ tự
    - Mood/icon
    - Nội dung
    - Địa chỉ
    - Thời gian
    - Số lượng ảnh (nếu có)
    - Preview ảnh đầu tiên

### 3. Thống kê

- **Tổng số địa điểm**: Số lượng ghi chú trong khoảng thời gian
- **Số ghi chú có ảnh**: Đếm số ghi chú có kèm ảnh
- **Tổng quãng đường**: Tính toán khoảng cách giữa các điểm (km)

### 4. Sắp xếp lộ trình

#### Theo thời gian (Time-based)

- Tự động sắp xếp theo thứ tự thời gian tạo ghi chú
- Phù hợp để xem lại hành trình theo đúng thời gian diễn ra

#### Tùy chỉnh (Custom)

- Cho phép kéo thả (drag & drop) để sắp xếp lại thứ tự
- Phù hợp khi muốn tạo lộ trình riêng không theo thời gian
- Có thể sắp xếp lại để tối ưu hóa quãng đường

### 5. Hiển thị lộ trình trên bản đồ

#### Route visualization

- Vẽ đường polyline màu đỏ (#FF6B6B) nối các điểm
- Hiển thị mũi tên chỉ hướng di chuyển
- Độ rộng và opacity tối ưu cho dễ nhìn

#### Markers đặc biệt

- **Điểm bắt đầu**: Marker màu xanh lá (#4CAF50)
- **Điểm dừng**: Marker màu cam (#FF6B6B) với số thứ tự
- **Điểm kết thúc**: Marker màu đỏ (#F44336)
- Hover để xem thông tin chi tiết

#### Route info panel

- Hiển thị thông tin lộ trình:
    - Tổng số điểm
    - Tổng quãng đường
    - Phương thức sắp xếp
- Legend cho các loại marker
- Nút đóng để tắt hiển thị route

#### Auto-fit bounds

- Tự động zoom và center map để hiển thị toàn bộ lộ trình
- Padding phù hợp để không bị che bởi UI

## Cách sử dụng

### 1. Mở Memory Lane

- Click vào nút **Calendar** (📅) trên FAB menu ở góc dưới bên phải
- Hoặc có thể thêm vào sidebar nếu cần

### 2. Chọn khoảng thời gian

- Click vào quick filter (Hôm nay, Tuần này, ...) để lọc nhanh
- Hoặc chọn custom date range với date picker

### 3. Sắp xếp lộ trình

- Click "Theo thời gian" để sắp xếp theo thời gian tạo ghi chú
- Click "Tùy chỉnh" và kéo thả các ghi chú để sắp xếp lại

### 4. Xem lộ trình trên bản đồ

- Click nút "Xem lộ trình trên bản đồ" ở cuối danh sách
- Map sẽ tự động zoom và hiển thị route với các marker
- Click vào marker để xem thông tin chi tiết
- Click nút X trên route info panel để đóng

## Cấu trúc Code

### Components

- **`memory-lane-view.tsx`**: Dialog chính hiển thị danh sách ghi chú và filters
- **`route-display.tsx`**: Component hiển thị lộ trình trên map
- **`timeline/index.ts`**: Export file cho các components

### Store

- **`useMemoryLaneStore`**: Store quản lý state của memory lane
    - `routeNotes`: Danh sách ghi chú để hiển thị route
    - `routeSortBy`: Phương thức sắp xếp ("time" | "custom")
    - `showRoute`: Boolean để hiển thị/ẩn route
    - `clearRoute()`: Function để clear route

- **`useUIStore`**: Thêm state
    - `showMemoryLane`: Boolean để mở/đóng memory lane dialog

### Integration

- Tích hợp vào `map-container.tsx`
- Thêm nút vào `map-controls.tsx` FAB menu
- Sử dụng Mapbox GL JS để vẽ route và markers

## Technologies

- **React**: Component-based UI
- **Zustand**: State management
- **Mapbox GL JS**: Map rendering và route visualization
- **Tailwind CSS**: Styling
- **Shadcn/ui**: UI components (Dialog, Card, Button, Input, Badge)
- **Lucide React**: Icons
- **Sonner**: Toast notifications

## Tính toán

### Haversine Formula

Sử dụng công thức Haversine để tính khoảng cách giữa 2 điểm trên mặt cầu (Trái Đất):

```javascript
const R = 6371; // Bán kính Trái Đất (km)
const dLat = ((lat2 - lat1) * Math.PI) / 180;
const dLng = ((lng2 - lng1) * Math.PI) / 180;
const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
const distance = R * c;
```

## UI/UX Design

### Colors (Pinory Theme)

- Primary: `#FF6B6B` (Coral Red)
- Secondary: `#FF8E53` (Orange)
- Accent: `#FFD6A5` (Peach)
- Background: `#0C0C0C` (Dark)
- Text: `#EDEDED` (Light gray)
- Muted: `#A0A0A0` (Gray)

### Interactions

- Smooth transitions và animations
- Hover effects trên tất cả interactive elements
- Loading states cho async operations
- Toast notifications cho feedback
- Drag & drop với visual feedback

### Responsive

- Dialog responsive với max-width và max-height
- Scroll trong danh sách ghi chú
- Grid layout cho stats và filters
- Mobile-friendly với touch interactions

## Future Enhancements

1. **Export route**: Xuất lộ trình ra file GPX/KML
2. **Share route**: Chia sẻ lộ trình với link
3. **Route optimization**: Tự động tối ưu hóa lộ trình
4. **Multiple routes**: So sánh nhiều lộ trình
5. **Route statistics**: Thêm thống kê chi tiết (thời gian di chuyển ước tính, ...)
6. **Filter by category**: Lọc theo loại địa điểm
7. **Timeline view**: Hiển thị dạng timeline thay vì list
8. **Animation**: Animate route drawing và marker placement
9. **Clustering**: Nhóm các marker gần nhau khi zoom out
10. **Heatmap**: Hiển thị heatmap của các địa điểm thường xuyên ghé thăm

## Notes

- Cần có ít nhất 2 ghi chú để hiển thị route
- Route chỉ hiển thị khi có đủ dữ liệu (coordinates)
- Sử dụng built-in Mapbox arrow icon cho route direction
- Map markers được cleanup khi component unmount
- Tất cả state được quản lý bởi Zustand store
