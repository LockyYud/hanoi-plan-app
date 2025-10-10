# Category Store Optimization

## 🎯 Vấn đề
Trước đây, categories được fetch riêng biệt ở 2 nơi:
1. **Sidebar** - fetch categories mỗi khi component mount
2. **LocationNoteForm** - fetch categories mỗi khi form được mở

Điều này gây ra:
- ⏱️ Chậm: Mỗi lần mở form phải đợi load categories
- 🔄 Dư thừa: Fetch cùng một data nhiều lần
- 🐛 Không đồng bộ: Thêm category mới ở form nhưng sidebar không cập nhật ngay

## ✅ Giải pháp
Tạo một **shared category store** bằng Zustand để:
- Fetch categories **một lần duy nhất** khi user login
- Share data giữa tất cả components
- Auto-update khi có thay đổi

## 📝 Thay đổi

### 1. Tạo Category Store (`src/lib/store.ts`)
```typescript
export interface Category {
    id: string
    name: string
    slug: string
    icon?: string
    color?: string
    isDefault: boolean
    userId?: string
}

interface CategoryStore {
    categories: Category[]
    setCategories: (categories: Category[]) => void
    addCategory: (category: Category) => void
    updateCategory: (id: string, updates: Partial<Category>) => void
    removeCategory: (id: string) => void
    isLoadingCategories: boolean
    setIsLoadingCategories: (loading: boolean) => void
    fetchCategories: (session: any) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
    // ... implementation với smart caching
}))
```

**Features:**
- ✅ Smart caching: Không fetch lại nếu đã có data
- ✅ Loading state: Tránh duplicate requests
- ✅ Session-aware: Auto clear khi logout
- ✅ CRUD operations: Add/Update/Remove categories

### 2. Category Provider (`src/components/providers.tsx`)
```typescript
function CategoryLoader({ children }: { readonly children: ReactNode }) {
    const { data: session, status } = useSession();
    const { fetchCategories } = useCategoryStore();

    useEffect(() => {
        if (status !== "loading") {
            fetchCategories(session);
        }
    }, [session, status, fetchCategories]);

    return <>{children}</>;
}
```

**Workflow:**
1. User login → Session available
2. Provider tự động fetch categories
3. Store lưu trữ và share cho tất cả components

### 3. LocationNoteForm sử dụng store
```typescript
// ❌ BEFORE: Fetch riêng
const [categories, setCategories] = useState<Category[]>([]);
const [isLoadingCategories, setIsLoadingCategories] = useState(true);

useEffect(() => {
    const fetchCategories = async () => { /* ... */ };
    if (isOpen) fetchCategories();
}, [isOpen]);

// ✅ AFTER: Dùng chung store
const { categories, isLoadingCategories, addCategory } = useCategoryStore();
```

### 4. Sidebar sử dụng store
```typescript
// ❌ BEFORE: Fetch riêng
const [categories, setCategories] = useState<Category[]>([]);

const fetchCategories = useCallback(async () => { /* ... */ }, [session]);

useEffect(() => {
    if (mounted) fetchCategories();
}, [mounted, fetchCategories]);

// ✅ AFTER: Dùng chung store
const { categories } = useCategoryStore();
```

## 🚀 Kết quả

### Hiệu suất
- ⚡ Form mở **ngay lập tức** - không cần đợi fetch
- 📉 Giảm 2 API calls thành **1 API call duy nhất**
- 💾 Categories được cache trong memory

### UX
- 🎨 Thêm category mới → Update **ngay lập tức** ở cả form và sidebar
- 🔄 Không bị mất đồng bộ giữa các components
- ⏱️ Trải nghiệm mượt mà hơn

### Code Quality
- 🧹 Loại bỏ duplicate code
- 📦 Centralized state management
- 🔧 Dễ maintain và mở rộng

## 🔍 Flow hoạt động

```
User Login
    ↓
SessionProvider updates session
    ↓
CategoryLoader detects session
    ↓
useCategoryStore.fetchCategories(session)
    ↓
┌─────────────────────────────┐
│ Check: Already loading?     │ → Yes → Skip
└─────────────────────────────┘
    ↓ No
┌─────────────────────────────┐
│ Check: Session exists?      │ → No → Clear categories
└─────────────────────────────┘
    ↓ Yes
┌─────────────────────────────┐
│ Check: Categories loaded?   │ → Yes → Skip
└─────────────────────────────┘
    ↓ No
Fetch from API /api/categories
    ↓
Store in useCategoryStore
    ↓
┌─────────────────────────────┐
│ All components auto-update  │
│ - Sidebar                   │
│ - LocationNoteForm          │
│ - Any other components      │
└─────────────────────────────┘
```

## 📚 Best Practices Áp dụng

1. **Single Source of Truth**: Categories chỉ fetch ở 1 nơi
2. **Smart Caching**: Không fetch lại nếu không cần
3. **Separation of Concerns**: Provider lo việc fetch, components chỉ consume
4. **Type Safety**: Full TypeScript với interface Category
5. **Scalability**: Dễ thêm categories features sau này

## 🎓 Bài học

Khi có data cần share giữa nhiều components:
1. ✅ Tạo shared store (Zustand/Redux/Context)
2. ✅ Fetch ở level cao (Provider/Layout)
3. ✅ Components chỉ consume, không fetch
4. ❌ Tránh fetch duplicate ở nhiều components

## 🔄 Migration Path cho features tương tự

Nếu gặp tình huống tương tự với data khác (VD: groups, places):
1. Thêm store vào `store.ts`
2. Tạo loader component trong provider
3. Update components để dùng store
4. Test và verify

---
**Tác giả:** AI Assistant  
**Ngày:** October 10, 2025  
**Related Files:**
- `src/lib/store.ts`
- `src/components/providers.tsx`
- `src/components/map/location-note-form.tsx`
- `src/components/layout/sidebar.tsx`
