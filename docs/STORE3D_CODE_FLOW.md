# Store3D — Mã Nguồn và Luồng Thực Thi

> Tài liệu dành cho developers. Dựa trên mã nguồn thực tế.
> Cập nhật: 2026-08-30

---

## 1. Tổng Quan Dự Án

| Layer | Công nghệ | Phiên bản |
|-------|-----------|-----------|
| Frontend | React | 19.2.8 |
| Build | Vite | 8.2.0 |
| Ngôn ngữ | TypeScript | 6.0.2 (client), 5.5.4 (server) |
| Styling | Tailwind CSS | 4.3.3 |
| UI | shadcn/ui + Radix UI | — |
| Animation | Framer Motion | 13.0.0 |
| HTTP Client | Axios | 1.19.0 |
| Routing | React Router DOM | 7.18.2 |
| Backend | Express | 4.19.2 |
| Database | MongoDB (Mongoose) | 8.5.1 |
| Auth | JWT (jsonwebtoken) | 9.0.2 |
| AI SDK | Vercel AI SDK | 7.0.84 (server), @ai-sdk/react 4.0.87 (client) |
| Validation | Zod | 3.23.8 (server), 4.4.3 (client) |
| Lint | oxlint | 1.75.0 |

---

## 2. Cấu Trúc Repository

```
store3D/
├── client/                    # React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # 20 shadcn/ui primitives
│   │   │   ├── layout/        # navbar, footer
│   │   │   ├── chat/          # AI Chat: launcher, panel, input, message
│   │   │   ├── product/       # product-card, gallery, purchase-panel...
│   │   │   ├── cart/          # cart-drawer
│   │   │   ├── home/          # hot-sale-section
│   │   │   ├── mini-game/     # frog-catcher, reward-coupon-card
│   │   │   └── review/        # review-card, rating-summary
│   │   ├── contexts/          # Auth, Cart, Wishlist, Theme
│   │   ├── hooks/             # useChat, useGameSession, useReviewEligibility...
│   │   ├── layouts/           # main-layout, account-layout, admin-layout
│   │   ├── pages/             # Tất cả page components (lazy-loaded)
│   │   ├── routes/            # guards.tsx, chunk-error-boundary.tsx
│   │   ├── services/          # apiClient, aiChatApi, rewardApi...
│   │   ├── types/             # TypeScript interfaces
│   │   └── lib/               # cn(), resolveImageUrl()
│   └── public/                # Static assets
├── server/                    # Express API
│   └── src/
│       ├── config/            # env, cors, rateLimit, cloudinary
│       ├── controllers/       # 12 controllers (thin)
│       ├── database/          # MongoDB connection
│       ├── middleware/        # auth, validate, errorHandler, notFound
│       ├── models/            # 12 Mongoose models
│       ├── routes/            # 14 route files
│       ├── services/          # 16 service files (business logic)
│       ├── utils/             # AppError, apiResponse, asyncHandler, token
│       └── validators/        # 9 Zod schema files
└── docs/                      # Tài liệu
```

---

## 3. Luồng Khởi Động

### Frontend

```
Browser tải index.html
    ↓
Vite load main.tsx
    ↓
React render <App>
    ↓
Provider tree:
  StrictMode → ThemeProvider → BrowserRouter → AuthProvider → CartProvider → WishlistProvider
    ↓
ChunkErrorBoundary → Suspense → Routes
    ↓
Route match → MainLayout → lazy-loaded Page
    ↓
MainLayout render:
  - Navbar
  - <Outlet /> (Page)
  - Footer
  - CartDrawer (lazy)
  - ChatLauncher (lazy)
  - ChatPanel (lazy)
```

### Backend

```
Node.js start
    ↓
server.ts → startServer()
    ↓
connectDB() → MongoDB Atlas
    ↓
createApp() → Express app
    ↓
Middleware stack:
  helmet → cors → cookieParser → express.json → globalLimiter
    ↓
Route mounting:
  /api/auth, /api/products, /api/categories, /api/orders,
  /api/payment, /api/wishlist, /api/coupons, /api/reviews,
  /api/users, /api/admin/stats, /api/upload, /api/contact,
  /api/news, /api/ai-chat, /api/rewards
    ↓
notFoundHandler → errorHandler
    ↓
app.listen(port)
```

---

## 4. Luồng AI Chat (Chi Tiết)

Đây là luồng quan trọng nhất cần hiểu rõ.

### 4.1. Frontend Flow

```
User nhấp vào nút AI Chat (floating button)
    ↓
chat-launcher.tsx — ChatLauncher component
  - Button onClick → onToggle() → setChatOpen(!chatOpen)
  - Hiển thị AiChatIcon (chat bubble + AI sparkle)
  - Framer Motion animate open/close
    ↓
main-layout.tsx — MainLayout
  - chatOpen state quản lý bởi useState
  - ChatLauncher và ChatPanel cùng nhận chatOpen
    ↓
ChatPanel lazy-load (React.lazy)
  - Import: components/chat/chat-panel.tsx
  - Chunk: chat-panel-[hash].js (~77KB)
    ↓
chat-panel.tsx — ChatPanel
  - Gọi useChat() hook
  - Hiển thị header (Bot icon + "Store3D AI")
  - Hiển thị messages list
  - Hiển thị ChatInput
  - Escape key → onClose()
    ↓
useChat.ts — useChat hook
  - Import @ai-sdk/react useChat as useAiChat
  - Tạo DefaultChatTransport:
    - api: AI_CHAT_API (http://localhost:5000/api/ai-chat)
    - credentials: 'include' (gửi JWT cookie)
  - Return: { messages, sendMessage, status, error }
    ↓
chat-input.tsx — ChatInput
  - onSubmit → onSend(text)
  - Enter key → submit
  - Disable khi isLoading
    ↓
chat-panel.tsx — handleSend
  - Gọi sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
    ↓
useChat → @ai-sdk/react useAiChat
  - Gửi POST /api/ai-chat qua DefaultChatTransport
  - Headers: Content-Type: application/json
  - Body: { messages: [{ id, role, parts: [{ type: "text", text }] }] }
  - Credentials: include (JWT cookie)
    ↓
chat-message.tsx — ChatMessage
  - Render từng message
  - User: avatar + bubble phải
  - Assistant: avatar + bubble trái
  - Filter parts type === 'text' để render
```

### 4.2. Backend Flow

```
POST /api/ai-chat
    ↓
Middleware stack (theo thứ tự):
  1. globalLimiter (300/15min)
  2. guestAiChatLimiter (15/15min) — không yêu cầu đăng nhập
  3. validateRequest(chatMessageSchema) — Zod validation
     - messages: array, 1-20 tin nhắn
     - Mỗi tin: role (user|assistant)
     - Nội dung accepts 2 format:
       a. UIMessage parts: parts[] với { type: "text", text: 1-2000 ký tự }
       b. Legacy content: content string (1-2000 ký tự)
     - Phải có ít nhất 1 trong 2 (content hoặc parts hợp lệ)
    ↓
aiChatController.ts — chat handler
  - Đọc req.body.messages
  - Gọi createChatStream({ messages })
    ↓
aiChatService.ts — createChatStream
  - Nếu provider === 'mock':
    - Tạo MockLanguageModelV4
    - doStream() trả về ReadableStream với mock response
    - Mỗi từ cách nhau 30ms (mô phỏng streaming)
  - Nếu provider !== 'mock':
    - Kiểm tra config.ai.apiKey
    - Nếu không có apiKey → throw Error('AI_SERVICE_UNAVAILABLE')
    - Gọi streamText({ model, messages, system })
  - System prompt: "Bạn là trợ lý AI của Store3D..."
    ↓
aiChatController.ts — xử lý response
  - result.pipeUIMessageStreamToResponse(res)
    (AI SDK's built-in adapter cho Express Response)
  - Tự set headers: Content-Type: text/event-stream,
    x-vercel-ai-ui-message-stream: v1, cache-control: no-cache
  - Streaming SSE chunks trực tiếp tới client
    ↓
Frontend nhận stream
  - DefaultChatTransport.processResponseStream()
  - Parse SSE (text/event-stream) → UIMessage chunks
  - @ai-sdk/react useAiChat cập nhật messages state real-time
  - ChatPanel render từng chunk qua ChatMessage (filter parts type === 'text')
```

### 4.3. AI Chat File Map

| File | Trách nhiệm | Được gọi bởi | Gọi |
|------|-------------|---------------|-----|
| `components/chat/chat-launcher.tsx` | Nút AI Chat floating | MainLayout | — |
| `components/chat/chat-panel.tsx` | Panel chat UI | MainLayout | useChat, ChatMessage, ChatInput |
| `components/chat/chat-input.tsx` | Input form | ChatPanel | — |
| `components/chat/chat-message.tsx` | Render tin nhắn | ChatPanel | — |
| `hooks/useChat.ts` | Wrap @ai-sdk/react useChat | ChatPanel | aiChatApi |
| `services/aiChatApi.ts` | Export AI_CHAT_API URL | useChat | — |
| `server/routes/ai-chat.ts` | Định nghĩa route POST / | app.ts | controller, middleware |
| `server/controllers/aiChatController.ts` | Xử lý request/response | Route | aiChatService |
| `server/services/aiChatService.ts` | Tạo stream, extract text từ UIMessage/content, gọi AI provider | Controller | ai SDK |
| `server/config/rateLimit.ts` | Rate limiter cho AI chat | Route | — |
| `server/validators/aiChat.ts` | Zod schema validation | Route | — |
| `server/middleware/auth.ts` | Xác thực JWT | Route | User model |
| `server/config/index.ts` | Config (AI_API_KEY, AI_PROVIDER) | Service | — |

---

## 5. Luồng Xác Thực (Authentication)

```
Client gửi request với cookie "token"
    ↓
Express cookie-parser parse cookie
    ↓
requireAuth middleware (middleware/auth.ts)
  1. Đọc token: req.cookies.token
  2. Nếu không có token → 401 "Bạn chưa đăng nhập"
  3. verifyToken(token) → JWT.verify()
     - Nếu invalid/expired → 401 "Phiên đăng nhập không hợp lệ"
  4. User.findById(payload.sub).select('_id role')
     - Nếu không tìm thấy → 401 "Tài khoản không tồn tại"
  5. req.user = { _id, role }
  6. next()
    ↓
Route handler sử dụng req.user
    ↓
requireAdmin middleware (nếu cần)
  - Kiểm tra req.user.role === 'admin'
  - Nếu không → 403 "Bạn không có quyền truy cập"
```

---

## 6. Luồng API Chung

```
React Component
    ↓
Frontend Service (apiClient.ts)
  - Axios instance với baseURL, withCredentials, timeout
  - Interceptor: kiểm tra response format
    ↓
Express Route (routes/*.ts)
    ↓
Middleware pipeline:
  - globalLimiter (rate limit)
  - requireAuth (nếu cần)
  - validateRequest(schema) (Zod validation)
    ↓
Controller (controllers/*.ts)
  - Đọc req.body, req.params, req.query
  - Gọi Service
    ↓
Service (services/*.ts)
  - Business logic
  - Mongoose operations
  - External API calls
    ↓
Model (models/*.ts) → MongoDB
    ↓
Service trả về data
    ↓
Controller gọi successResponse(res, data)
    ↓
HTTP Response: { success, message, data, pagination?, errors? }
    ↓
Frontend nhận response
  - getErrorMessage(error) nếu có lỗi
  - Render UI
```

---

## 7. Database

### Models

| Model | Mô tả | Index quan trọng |
|-------|--------|-------------------|
| User | Người dùng | email (unique) |
| Product | Sản phẩm | slug (unique), category |
| Category | Danh mục | slug (unique) |
| Order | Đơn hàng | user, status |
| OrderItem | Chi tiết đơn hàng | order |
| Wishlist | Yêu thích | user (unique) |
| Review | Đánh giá | user+product (unique) |
| Coupon | Mã giảm giá | code (unique) |
| News | Tin tức | slug (unique) |
| ContactRequest | Liên hệ | — |
| GameSession | Phiên chơi game | user+order (unique), TTL |
| UserCoupon | Mã giảm giá từ game | user, code |

### Atomic Operations

- **Stock decrement:** `Product.bulkWrite` với `$inc: { stock: -qty }` + kiểm tra stock >= 0
- **Game completion:** `GameSession.findOneAndUpdate({ _id, user, status: Active })` — ngăn duplicate reward
- **Coupon redemption:** `UserCoupon.findOneAndUpdate({ code, user, usedAt: null })` — ngăn double-redeem

### TTL Index

- `GameSession.expiresAt` — auto-delete sau thời gian hết hạn

---

## 8. Luồng Xử Lý Lỗi

```
Frontend request thất bại
    ↓
Backend: throw new AppError(message, statusCode)
    ↓
errorHandler middleware (middleware/errorHandler.ts)
  - AppError → statusCode từ error
  - Mongoose ValidationError → 400
  - Mongoose CastError → 400
  - JWT Error → 401
  - Multer Error → 400
  - MongoDB duplicate key (code 11000) → 409
  - Lỗi khác → 500
    ↓
errorResponse(res, statusCode, message)
  → { success: false, message, data: null, errors: [] }
    ↓
Frontend: getErrorMessage(error) (services/apiClient.ts)
  - Axios error → đọc error.response.data.message
  - Network error → "Không thể kết nối tới máy chủ"
  - Fallback → "Đã có lỗi xảy ra"
    ↓
Hiển thị AlertBanner với thông báo tiếng Việt
```

---

## 9. Các Luồng Tính Năng Chính

### Đăng Nhập

```
/dang-nhap → LoginPage → useForm (Zod: email + password)
    ↓
POST /api/auth/login → authLimiter → authController.login
    ↓
userService.findByEmail → bcrypt.compare → signToken
    ↓
Set cookie "token" (httpOnly, secure, sameSite: lax)
    ↓
AuthContext dispatch AUTH_SUCCESS → redirect
```

### Mua Hàng

```
ProductDetail → usePurchasePanel → addToCart
    ↓
CartContext (localStorage) → CartDrawer → CheckoutPage
    ↓
CheckoutPage → applyCoupon → createOrder
    ↓
POST /api/orders → requireAuth → orderService.create
  - Validate stock
  - Atomic stock decrement
  - Apply coupon (UserCoupon.usedAt)
  - Create Order + OrderItems
    ↓
OrderSuccessPage → Game button (nếu hoàn thành)
```

### AI Chat

```
Xem chi tiết ở Section 4
```

### Mini Game

```
OrderSuccessPage / OrderCompletionModal → startGame → POST /api/rewards/game/start
    ↓
rewardService.startGame
  - Kiểm tra order completed + chưa có game session
  - Tạo GameSession (unique index user+order)
    ↓
FrogCatcher game (5 lanes, click insects, avoid obstacles)
  - Insects: Mosquito(+2), Fly(+4), Dragonfly(+6), Beetle(+8)
  - Obstacles: Rock, Fruit → -1 heart (3 hearts total)
  - Progressive difficulty (speed + spawn rate increase)
    ↓
completeGame → POST /api/rewards/game/complete
    ↓
rewardService.completeGame
  - Atomic findOneAndUpdate (ngăn duplicate)
  - Xác định reward tier:
    50+ → 5%, 60+ → 10%, 70+ → 15%,
    80+ → 20%, 90+ → 25%, 100+ → 30%
  - Max discount: 200,000 VND
  - Tạo UserCoupon
    ↓
UserCoupon hiển thị → áp dụng tại CheckoutPage
```

---

## 10. "Nơi Để Debug?"

### AI Chat không mở

1. `components/chat/chat-launcher.tsx` — nút có render không?
2. `layouts/main-layout.tsx` — ChatLauncher có được import lazy không?
3. Browser console — có lỗi chunk load không?
4. Network tab — chunk JS có load thành công không?

### AI Chat mở nhưng tin nhắn không gửi

1. `components/chat/chat-input.tsx` — form submit có hoạt động không?
2. `hooks/useChat.ts` — transport URL có đúng không?
3. Network tab — POST /api/ai-chat có gửi không?
4. Request body có đúng format? (cần `{ messages: [{ id, role, parts }] }`)
5. Response status code là gì?
6. Nếu 400: Kiểm tra Zod validator — `parts[].type` phải là `"text"`, `text` phải 1-2000 ký tự

### API trả 401

1. JWT cookie có tồn tại không? (Application → Cookies)
2. Token có hết hạn không?
3. `server/middleware/auth.ts` — verifyToken có pass không?
4. User có tồn tại trong DB không?

### API trả 429

1. `server/config/rateLimit.ts` — guestAiChatLimiter max=15/15min (AI Chat)
2. Đã gửi quá 15 request trong 15 phút?

### API trả 400 (Validation Error)

1. Request body có đúng format không? (cần `{ messages: [{ id, role, parts }] }`)
2. `server/validators/aiChat.ts` — `textPartSchema` có validate đúng không?
3. `text` trong parts phải 1-2000 ký tự, `type` phải là `"text"`
4. Nếu dùng legacy format: `content` string phải 1-2000 ký tự
5. Kiểm tra DefaultChatTransport gửi gì trong Network tab → Request Payload

### AI Provider lỗi

1. `server/config/index.ts` — AI_API_KEY, AI_PROVIDER có setting không?
2. `server/services/aiChatService.ts` — provider có handle đúng không?
3. Server logs — có error message không?

### AI Chat stream nhưng không hiển thị

1. Network tab — Response header có `Content-Type: text/event-stream` không?
2. Network tab — Response header có `x-vercel-ai-ui-message-stream: v1` không?
3. `server/controllers/aiChatController.ts` — `pipeUIMessageStreamToResponse` có gọi không?
4. `server/services/aiChatService.ts` — `streamText()` có throw error không?
5. Browser console — có lỗi parse SSE không?
6. `client/hooks/useChat.ts` — DefaultChatTransport.processResponseStream có parse được không?

### Reward không tạo

1. `server/services/rewardService.ts` — startGame检查 order completed?
2. GameSession unique index — đã có session chưa?
3. `completeGame` — score có đủ điều kiện reward tier không? (cần 50+ điểm)
4. `server/models/UserCoupon.ts` — coupon có tạo thành công không?

### Coupon không áp dụng

1. `server/services/orderService.ts` — resolveCoupon检查 gì?
2. UserCoupon: ownership, expiry, usedAt, minOrder
3. Admin Coupon: code, expiry, quantity, minOrder
4. Checkout request body có đúng format không?

---

## 11. Các Điểm Thất Bại Phổ Biến

| Vấn đề | Nguyên nhân | Nơi kiểm tra |
|--------|-------------|---------------|
| Lazy chunk load fail | Network interruption, deploy race | `routes/chunk-error-boundary.tsx` |
| JWT expired | Token hết hạn 7 ngày | `utils/token.ts`, cookie maxAge |
| AI service unavailable | Thiếu AI_API_KEY hoặc provider down | `config/index.ts`, `aiChatService.ts` |
| Stock race condition | Concurrent orders | `orderService.ts` — atomic bulkWrite |
| Coupon double-redeem | Race condition | `UserCoupon.findOneAndUpdate` with usedAt:null |
| Duplicate game reward | User click nhiều lần | `GameSession.findOneAndUpdate` with status:Active |
| File upload fail | File > 5MB hoặc Cloudinary down | `config/cloudinary.ts`, Multer config |
| CORS error | Client URL không match | `config/cors.ts`, CLIENT_URL env |

---

## 12. Bảng Công Nghệ

| Layer | Công nghệ | Sử dụng |
|-------|-----------|---------|
| Frontend | React 19.2.8 | UI framework |
| Build | Vite 8.2.0 | Dev server + production build |
| Styling | Tailwind CSS 4.3.3 | Utility-first CSS |
| UI | shadcn/ui + Radix UI | Component primitives |
| Animation | Framer Motion 13.0.0 | Page/component transitions |
| Forms | React Hook Form + Zod | Form validation |
| HTTP | Axios 1.19.0 | API client |
| Routing | React Router DOM 7.18.2 | Client-side routing |
| AI | Vercel AI SDK 7.0.84 | Streaming AI chat |
| Backend | Express 4.19.2 | HTTP server |
| Database | MongoDB + Mongoose 8.5.1 | Data persistence |
| Auth | JWT (jsonwebtoken 9.0.2) | Cookie-based auth |
| Password | bcryptjs 2.4.3 | Password hashing |
| Upload | Cloudinary 2.10.1 | Image hosting |
| Validation | Zod 3.23.8 | Request validation |
| Rate Limit | express-rate-limit 7.4.0 | API protection |
| Security | Helmet 7.1.0 | HTTP headers |

---

## 13. Hướng Dẫn Thay Đổi

### Muốn sửa AI Chat UI

| File | Lưu ý |
|------|-------|
| `components/chat/chat-launcher.tsx` | Icon, button styling |
| `components/chat/chat-panel.tsx` | Panel layout, header, messages |
| `components/chat/chat-input.tsx` | Input form |
| `components/chat/chat-message.tsx` | Message rendering |
| `hooks/useChat.ts` | Transport config |

**Rủi ro:** Thay đổi useChat có thể ảnh hưởng streaming. Kiểm tra @ai-sdk/react docs.

### Muốn sửa AI Chat API

| File | Lưu ý |
|------|-------|
| `server/routes/ai-chat.ts` | Route, middleware chain |
| `server/controllers/aiChatController.ts` | Request/response handling |
| `server/services/aiChatService.ts` | AI provider, system prompt |
| `server/validators/aiChat.ts` | Validation schema |
| `server/config/index.ts` | AI_API_KEY, AI_PROVIDER |

**Rủi ro:** Thay đổi streaming response có thể phá vỡ frontend useChat.

### Muốn sửa Authentication

| File | Lưu ý |
|------|-------|
| `server/middleware/auth.ts` | requireAuth, requireAdmin |
| `server/utils/token.ts` | signToken, verifyToken, cookie options |
| `server/config/index.ts` | JWT_SECRET, JWT_EXPIRES_IN |

**Rủi ro:** Thay đổi cookie options có thể ảnh hưởng deployment.

### Muốn sửa Products

| File | Lưu ý |
|------|-------|
| `server/models/Product.ts` | Schema, indexes |
| `server/services/productService.ts` | CRUD, search, filter |
| `server/controllers/productController.ts` | Request handling |
| `client/pages/product-list-page.tsx` | Danh sách |
| `client/pages/product-detail-page.tsx` | Chi tiết |
| `client/components/product/*.tsx` | UI components |

### Muốn sửa Cart/Checkout

| File | Lưu ý |
|------|-------|
| `client/contexts/CartContext.tsx` | Cart state (localStorage) |
| `client/pages/checkout-page.tsx` | Checkout form |
| `server/services/orderService.ts` | Order creation, stock, coupon |
| `server/services/couponService.ts` | Coupon validation |

### Muốn sửa Rewards/Game

| File | Lưu ý |
|------|-------|
| `server/config/rewards.ts` | Reward tiers, max score, max discount |
| `server/services/rewardService.ts` | Game session, score, reward |
| `server/models/GameSession.ts` | Session schema, TTL |
| `server/models/UserCoupon.ts` | Reward coupon |
| `client/components/mini-game/frog-catcher.tsx` | Frog Catcher game |
| `client/components/mini-game/mini-game-modal.tsx` | Game modal wrapper |
| `client/components/mini-game/reward-coupon-card.tsx` | Reward display |
| `client/hooks/useGameSession.ts` | Game state |
| `client/services/rewardApi.ts` | API client |

---

## 14. Lệnh Kiểm Tra

### Frontend

```bash
cd client
npx tsc -p tsconfig.app.json --noEmit   # TypeScript check
npx oxlint src/                           # Lint
npm run build                             # Production build (tsc -b && vite build)
```

### Backend

```bash
cd server
npx tsc --noEmit                          # TypeScript check
node --test tests/*.test.ts               # Unit tests (node:test)
```

### Playwright (nếu có)

```bash
npx playwright test --reporter=list
```

---

## 15. Mô Hình Tổng Quan

```
┌─────────────────────────────────────────────────────────┐
│                        USER                             │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                   React UI (Vite)                       │
│  Pages (lazy) → Components → Contexts → Hooks           │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              API Client (Axios + JWT cookie)            │
│  apiClient.ts → withCredentials: true                   │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                 Express Route (app.ts)                   │
│  /api/products, /api/orders, /api/ai-chat, ...          │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Middleware Pipeline                         │
│  helmet → cors → cookieParser → json → globalLimiter    │
│  → requireAuth → validateRequest → rateLimiter          │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Controller (thin)                          │
│  Đọc req → Gọi Service → Trả response                  │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Service (business logic)                   │
│  Mongoose operations, external APIs, AI provider        │
└──────────┬──────────────────────────┬───────────────────┘
           ↓                          ↓
┌──────────────────────┐  ┌──────────────────────────────┐
│   MongoDB (Mongoose) │  │   External Providers         │
│   Models + Schemas   │  │   Cloudinary, AI SDK, VietQR │
└──────────────────────┘  └──────────────────────────────┘
           ↓                          ↓
┌─────────────────────────────────────────────────────────┐
│              Response → successResponse/errorResponse   │
│  { success, message, data, pagination, errors }         │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Frontend nhận response                     │
│  getErrorMessage() → AlertBanner → UI                   │
└─────────────────────────────────────────────────────────┘
```
