# Product Image Upload (Local /uploads) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins upload real product photos, stored on the server disk and served at `/uploads/...`, rendered on the storefront.

**Architecture:** Add a multer-based `POST /api/upload` (admin-only) that saves an image file to `server/uploads/` and returns `/uploads/<filename>`. Express serves that folder statically. The admin `ImageUpload` component uploads via FormData instead of base64 data-URLs, and every product-image render site resolves `/uploads/...` paths against the API origin via a new `resolveImageUrl()` helper. Existing data-URI placeholders keep working unchanged.

**Tech Stack:** Express + multer (server), React/Vite + axios (client), PowerShell cmd for npm installs, Playwright MCP for browser verification.

## Global Constraints

- **No git repo in this project** — there are NO commit steps. Use the verification step of each task as the checkpoint.
- **No unit-test framework** — verification is `npm run build` (server: `cmd /c "npm run build"` = `tsc`; client: `cmd /c "npm run build"` = `tsc -b && vite build`) plus live API/browser checks.
- **PowerShell can't run `npm.ps1`** — always `cmd /c "npm ..."`.
- **Product images only.** Review/category/avatar images are out of scope.
- Existing products keep their placeholder SVGs — `resolveImageUrl` must pass `data:` URIs through unchanged.
- Upload field name must be `image`; max file size 2MB; `image/*` only.
- Server dev process (`tsx watch`) auto-reloads; restart it after installing dependencies.

---

### Task 1: Server — multer dependency + uploads dir + config

**Files:**
- Modify: `server/package.json` (via npm)
- Modify: `server/src/config/index.ts`
- Create: `server/uploads/` directory

**Interfaces:**
- Produces: `config.uploadDir` (absolute path string, default `server/uploads`).

- [ ] **Step 1: Install multer + types**

Run (in `server/`):
```powershell
cmd /c "npm i multer"
cmd /c "npm i -D @types/multer"
```
Expected: package.json gains `"multer"` and `"@types/multer"`.

- [ ] **Step 2: Add uploadDir to config**

Modify `server/src/config/index.ts` — add `import path from 'path';` at the top, and add `uploadDir` to the exported object:

```ts
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ...existing requiredEnv...

export const config = {
  // ...existing fields...
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
} as const;
```

- [ ] **Step 3: Create the uploads directory**

Run:
```powershell
New-Item -ItemType Directory -Path "server\uploads" -Force | Out-Null
```

- [ ] **Step 4: Verify server build**

Run (in `server/`):
```powershell
cmd /c "npm run build"
```
Expected: `tsc` exits 0.

---

### Task 2: Server — upload route + static serving + MulterError handling

**Files:**
- Create: `server/src/routes/upload.ts`
- Modify: `server/src/app.ts`
- Modify: `server/src/middleware/errorHandler.ts`

**Interfaces:**
- Consumes: `config.uploadDir`, `requireAuth`/`requireAdmin` (from `../middleware/auth`), `AppError`, `asyncHandler`, `successResponse`.
- Produces: route `POST /api/upload` → `{ success, message, data: { url: "/uploads/<filename>" } }`; static GET `/uploads/<file>`.

- [ ] **Step 1: Create the upload route**

Create `server/src/routes/upload.ts` with exactly:

```ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(config.uploadDir, { recursive: true });
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new AppError('Chỉ chấp nhận file ảnh', 400));
  },
});

const router = Router();

router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Vui lòng chọn file ảnh', 400);
    }
    return successResponse(res, { url: `/uploads/${req.file.filename}` }, { message: 'Tải ảnh thành công' });
  }),
);

export default router;
```

- [ ] **Step 2: Mount route + static serving in app.ts**

Modify `server/src/app.ts`:
- Add imports: `import path from 'path';`, `import { config } from './config';`, `import uploadRoutes from './routes/upload';`
- After `app.use(globalLimiter);` add:

```ts
  // Serve uploaded images statically.
  app.use('/uploads', express.static(config.uploadDir));
```

- After `app.use('/api/admin/stats', statsRoutes);` add:

```ts
  app.use('/api/upload', uploadRoutes);
```

- [ ] **Step 3: Handle multer errors in errorHandler**

Modify `server/src/middleware/errorHandler.ts` — add a branch for multer errors (e.g. file-too-large) before the final `else`:

```ts
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message === 'File too large' ? 'File ảnh quá lớn (tối đa 2MB)' : 'File tải lên không hợp lệ';
  } else {
```

- [ ] **Step 4: Verify build + endpoint**

Run (in `server/`):
```powershell
cmd /c "npm run build"
```
Expected: `tsc` exits 0. Then confirm the route responds to unauthenticated access (PowerShell):
```powershell
$r = try { Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/upload" } catch { $_.Exception.Response }
# Expect 401 "Bạn chưa đăng nhập" (auth guard works before multer)
```

---

### Task 3: Client — uploadApi + resolveImageUrl helper

**Files:**
- Modify: `client/src/services/index.ts`
- Modify: `client/src/lib/utils.ts`
- Modify: `client/src/lib/index.ts`

**Interfaces:**
- Produces: `uploadApi.uploadImage(file: File): Promise<string>` (returns `/uploads/<filename>`); `resolveImageUrl(src?: string | null): string`.

- [ ] **Step 1: Add uploadApi to services/index.ts**

Add to `client/src/services/index.ts` (after the `statsApi` block):

```ts
export const uploadApi = {
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiClient.post<ApiResponse<{ url: string }>>('/upload', form).then((r) => r.data.data.url)
  },
}
```

- [ ] **Step 2: Add resolveImageUrl to lib/utils.ts**

Modify `client/src/lib/utils.ts` — add the import and function:

```ts
import { API_URL } from '@/services/apiClient'

export function resolveImageUrl(src?: string | null): string {
  if (!src) return ''
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) {
    const origin = API_URL.replace(/\/api\/?$/, '')
    return `${origin}${src}`
  }
  return src
}
```

- [ ] **Step 3: Export it from lib/index.ts**

Modify `client/src/lib/index.ts`:

```ts
export { cn, resolveImageUrl } from './utils'
```

- [ ] **Step 4: Verify client build**

Run (in `client/`):
```powershell
cmd /c "npm run build"
```
Expected: `tsc -b && vite build` exits 0.

---

### Task 4: Client — image-upload component uploads via API

**Files:**
- Modify: `client/src/components/admin/image-upload.tsx`

**Interfaces:**
- Consumes: `uploadApi.uploadImage`, `resolveImageUrl`, `getErrorMessage`, `toast` (sonner).

- [ ] **Step 1: Rewrite handleFiles to upload via FormData**

Replace the `fileToDataUrl` helper and `handleFiles` in `client/src/components/admin/image-upload.tsx`:

- Add imports at the top (merge with existing lucide/`cn` imports):
```ts
import { uploadApi } from '@/services'
import { getErrorMessage } from '@/services/apiClient'
import { resolveImageUrl } from '@/lib/utils'
import { toast } from 'sonner'
```
- Delete the `fileToDataUrl` function.
- Replace `handleFiles` body with:
```ts
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return
      const room = max - images.length
      if (room <= 0) return
      setReading(true)
      try {
        const selected = Array.from(files)
          .filter((f) => f.type.startsWith('image/'))
          .slice(0, room)
        const urls: string[] = []
        for (const f of selected) {
          urls.push(await uploadApi.uploadImage(f))
        }
        onChange([...images, ...urls])
      } catch (err) {
        toast.error(getErrorMessage(err))
      } finally {
        setReading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [images, max, onChange]
  )
```
- In the JSX preview map, change the img `src`:
```tsx
<img src={resolveImageUrl(img)} alt="" className="size-full object-cover" />
```

- [ ] **Step 2: Verify client build**

Run (in `client/`):
```powershell
cmd /c "npm run build"
```
Expected: exits 0.

---

### Task 5: Client — wrap every product-image render site

**Files:**
- Modify: `client/src/components/product/product-card.tsx:68`
- Modify: `client/src/pages/product-detail-page.tsx:186` (main gallery only)
- Modify: `client/src/components/cart/cart-drawer.tsx:62`
- Modify: `client/src/pages/checkout-page.tsx:272`
- Modify: `client/src/pages/account/order-detail-page.tsx:95`
- Modify: `client/src/pages/account/orders-page.tsx:83`
- Modify: `client/src/pages/admin/products-page.tsx:236`
- Modify: `client/src/pages/review-form-page.tsx:148`

**Interfaces:**
- Consumes: `resolveImageUrl` (import from `'@/lib'`).

- [ ] **Step 1: Add the import to each file**

Each file listed above must import `resolveImageUrl`:
```ts
import { resolveImageUrl } from '@/lib'
```
(Add to existing `import ... from '@/lib'` lines where present, e.g. `products-page.tsx` already has `import { formatCurrency } from '@/lib'` → change to `import { formatCurrency, resolveImageUrl } from '@/lib'`.)

- [ ] **Step 2: Wrap each img src**

Apply these exact replacements:

`product-card.tsx:68`:
```tsx
src={resolveImageUrl(product.images?.[0] ?? '')}
```

`product-detail-page.tsx:186` (inside `images.map((img, i) => ...)`):
```tsx
src={resolveImageUrl(img)}
```

`cart-drawer.tsx:62`:
```tsx
src={resolveImageUrl(item.image)}
```

`checkout-page.tsx:272`:
```tsx
src={resolveImageUrl(item.image)}
```

`order-detail-page.tsx:95`:
```tsx
src={resolveImageUrl(item.image)}
```

`orders-page.tsx:83`:
```tsx
src={resolveImageUrl(item.image)}
```

`products-page.tsx:236`:
```tsx
src={resolveImageUrl(product.images[0] ?? '')}
```

`review-form-page.tsx:148`:
```tsx
src={resolveImageUrl(product.images[0])}
```

Do NOT touch review-image render sites (`product-detail-page.tsx:407`, `admin/reviews-page.tsx:137`) — out of scope.

- [ ] **Step 3: Verify client build**

Run (in `client/`):
```powershell
cmd /c "npm run build"
```
Expected: exits 0.

---

### Task 6: End-to-end verification (browser)

**Files:** none (verification only). Fixture: `.playwright-mcp/test-img.png` (must exist under the workspace root for the Playwright file chooser).

- [ ] **Step 1: Restart both servers** so multer loads

```powershell
# Kill existing node server/client processes, then restart both (logs in %TEMP%\opencode)
Start-Process cmd -ArgumentList '/c','npm run dev' -WorkingDirectory 'C:\Users\Dat\Documents\FPOLY\React\store3D\server'
Start-Process cmd -ArgumentList '/c','npm run dev' -WorkingDirectory 'C:\Users\Dat\Documents\FPOLY\React\store3D\client'
```

- [ ] **Step 2: Admin uploads an image on a product**

Via Playwright: log in as `admin@store3d.com / admin123` → open `/admin/san-pham` → click "Thêm sản phẩm mới" or edit an existing product → click "Tải ảnh" in the Hình ảnh field → file-chooser upload `.playwright-mcp/test-img.png` → save.
Expected: toast "Tạo/Cập nhật sản phẩm thành công".

- [ ] **Step 3: Verify static file is served**

Run:
```powershell
$r = Invoke-WebRequest -Method Get -Uri "http://localhost:5000/uploads/<filename-from-step-2>"
$r.StatusCode  # expect 200
$r.Headers['Content-Type']  # expect image/png
```

- [ ] **Step 4: Verify storefront renders the photo**

Via Playwright: open the product page for the edited product → the card/detail `<img>` src resolves to `http://localhost:5000/uploads/<filename>` and the image loads (no broken-image icon).

- [ ] **Step 5: Confirm placeholders still render**

Open a product that was NOT edited (e.g. `Rồng lửa châu Âu`) → its card still shows the colored placeholder SVG (data URI passes through `resolveImageUrl` unchanged).

- [ ] **Step 6: Final builds**

Run both:
```powershell
# server
cmd /c "npm run build"
# client
cmd /c "npm run build"
```
Expected: both exit 0.
