# Plan triển khai Journey Feature

## ✅ Đã hoàn thành

### Phase 1: Database & Backend

- [x] Tạo migration SQL cho Journey và JourneyStop models
- [x] Cập nhật Prisma schema
- [x] Tạo API endpoints:
    - [x] GET /api/journeys
    - [x] POST /api/journeys
    - [x] PUT /api/journeys
    - [x] DELETE /api/journeys
- [x] Cập nhật types.ts với Journey và JourneyStop

### Phase 2: Components

- [x] Tạo JourneyCard component
- [x] Tạo CreateJourneyDialog component

## 🚧 Còn lại cần làm

### Phase 3: Sidebar Integration

- [ ] Cập nhật sidebar.tsx:
    - [ ] Thêm tab "Hành trình" 🗺️
    - [ ] Fetch và hiển thị danh sách journeys
    - [ ] Integrate CreateJourneyDialog
    - [ ] Xử lý các actions (view, edit, delete)

### Phase 4: Map Integration

- [ ] Cập nhật store để quản lý journey state
- [ ] Kết nối "Xem trên map" với RouteDisplay
- [ ] Journey info panel overlay

### Phase 5: Migration

- [ ] Chạy migration: `npx prisma migrate dev`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Test database với mock data

### Phase 6: Testing & Polish

- [ ] Test tạo journey
- [ ] Test chỉnh sửa journey
- [ ] Test xóa journey
- [ ] Test hiển thị trên map
- [ ] Fix UI/UX issues
- [ ] Add error handling
- [ ] Add loading states

## Commands cần chạy

```bash
# 1. Run migration
cd /home/do-duy/personal/hanoi-plan-app
npx prisma migrate dev --name add_journey_model

# 2. Generate Prisma client
npx prisma generate

# 3. Test build
npm run build

# 4. Start dev server
npm run dev
```

## Next Steps

1. **Chạy migration** để tạo tables trong database
2. **Cập nhật sidebar.tsx** để thêm tab "Hành trình"
3. **Test flow**: Note địa điểm → Tạo journey → Xem trên map
4. **Polish UX**: Loading states, error handling, animations

## Notes

- Journey feature không replace Memory Lane, mà là complement
- Memory Lane = xem lại theo thời gian (passive)
- Journey = tạo hành trình có kế hoạch (active)
- User có cả 2 options, tùy mục đích sử dụng

