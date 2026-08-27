# News/Blog Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a complete News/blog backend feature with model, validator, service, controller, and routes following existing project patterns.

**Architecture:** Mongoose model with slug generation, Zod validation, service layer with pagination/filtering, Express controllers and routes with admin/public separation.

**Tech Stack:** TypeScript, Mongoose, Zod, Express, asyncHandler, apiFeatures utility

## Global Constraints

- Follow existing code patterns from Product/Category features
- Use Vietnamese language for error messages
- Use `slugify` utility from `../utils/slugify` for consistent slug generation
- Admin routes use `/admin` prefix to avoid conflict with `/:slug` parameter
- All services export class instance for dependency injection

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `server/src/models/News.ts` | Mongoose model with NewsStatus enum |
| Create | `server/src/validators/news.ts` | Zod schemas for create/update/query |
| Create | `server/src/services/newsService.ts` | Business logic with CRUD operations |
| Create | `server/src/controllers/newsController.ts` | Request handlers |
| Create | `server/src/routes/news.ts` | Express router with middleware |
| Modify | `server/src/models/index.ts` | Export News model |
| Modify | `server/src/app.ts` | Mount news routes |

---

### Task 1: Create News Model

**Files:**
- Create: `server/src/models/News.ts`

**Interfaces:**
- Consumes: `slugify` from `../utils/slugify`
- Produces: `News`, `NewsStatus`, `INews` (exported for other modules)

- [ ] **Step 1: Create News model file**

```typescript
import { Schema, model, models } from 'mongoose';
import slugify from '../utils/slugify';

export enum NewsStatus {
  Draft = 'draft',
  Published = 'published',
}

export interface INews {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  category: string;
  author: string;
  status: NewsStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
      maxlength: [300, 'Tiêu đề tối đa 300 ký tự'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Mô tả ngắn tối đa 500 ký tự'],
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Nội dung là bắt buộc'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    author: {
      type: String,
      trim: true,
      default: 'Store3D',
    },
    status: {
      type: String,
      enum: Object.values(NewsStatus),
      default: NewsStatus.Draft,
    },
    publishedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

newsSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title);
  }
  next();
});

newsSchema.index({ slug: 1 });
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1 });

export const News = models.News || model<INews>('News', newsSchema);
```

- [ ] **Step 2: Update models index to export News**

Modify `server/src/models/index.ts` - add at end:

```typescript
export { News, NewsStatus, type INews } from './News';
```

- [ ] **Step 3: Verify model compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

---

### Task 2: Create News Validator

**Files:**
- Create: `server/src/validators/news.ts`

**Interfaces:**
- Consumes: None (standalone)
- Produces: `createNewsSchema`, `updateNewsSchema`, `newsQuerySchema`, `CreateNewsInput`, `UpdateNewsInput`

- [ ] **Step 1: Create validator file**

```typescript
import { z } from 'zod';

export const createNewsSchema = z.object({
  title: z.string().trim().min(2, 'Tiêu đề tối thiểu 2 ký tự').max(300),
  excerpt: z.string().trim().max(500).optional().default(''),
  content: z.string().trim().min(1, 'Nội dung là bắt buộc'),
  thumbnail: z.string().optional().default(''),
  category: z.string().trim().optional().default('general'),
  author: z.string().trim().optional().default('Store3D'),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export const updateNewsSchema = createNewsSchema.partial();

export const newsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
```

- [ ] **Step 2: Verify validator compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

---

### Task 3: Create News Service

**Files:**
- Create: `server/src/services/newsService.ts`

**Interfaces:**
- Consumes: `News`, `NewsStatus` from `../models`, `AppError`, `apiFeatures`, `parsePagination`, `slugify`, validator types
- Produces: `NewsService` class, `newsService` instance

- [ ] **Step 1: Create service file**

```typescript
import { News, NewsStatus } from '../models';
import { AppError } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';
import slugify from '../utils/slugify';
import type { CreateNewsInput, UpdateNewsInput } from '../validators/news';

async function ensureUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await News.findOne({ slug: candidate }).select('_id');
    if (!existing || (excludeId && String(existing._id) === excludeId)) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

export class NewsService {
  /** Public: list published news. */
  async list(params: Record<string, unknown>) {
    const options = { ...parsePagination(params), searchFields: ['title', 'excerpt'] };
    const filter: Record<string, unknown> = { status: NewsStatus.Published };
    if (params.category) filter.category = params.category;
    return apiFeatures(News.find(), filter, { ...options, sort: '-publishedAt -createdAt' });
  }

  /** Admin: list all news. */
  async adminList(params: Record<string, unknown>) {
    const options = { ...parsePagination(params), searchFields: ['title', 'excerpt'] };
    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    if (params.category) filter.category = params.category;
    return apiFeatures(News.find(), filter, { ...options, sort: '-createdAt' });
  }

  async getBySlug(slug: string) {
    const news = await News.findOne({ slug });
    if (!news) throw new AppError('Không tìm thấy bài viết', 404);
    return news;
  }

  async getById(id: string) {
    const news = await News.findById(id);
    if (!news) throw new AppError('Không tìm thấy bài viết', 404);
    return news;
  }

  async create(data: CreateNewsInput) {
    const slug = await ensureUniqueSlug(data.title);
    const newsData = { ...data, slug };
    if (data.status === NewsStatus.Published && !data.publishedAt) {
      (newsData as Record<string, unknown>).publishedAt = new Date();
    }
    return News.create(newsData);
  }

  async update(id: string, data: UpdateNewsInput) {
    const existing = await News.findById(id);
    if (!existing) throw new AppError('Không tìm thấy bài viết', 404);

    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = await ensureUniqueSlug(data.title, id);
    }

    const updates: Record<string, unknown> = { ...data };
    if (data.title) updates.slug = slug;
    if (data.status === NewsStatus.Published && !existing.publishedAt) {
      updates.publishedAt = new Date();
    }

    const updated = await News.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return updated;
  }

  async remove(id: string) {
    const deleted = await News.findByIdAndDelete(id);
    if (!deleted) throw new AppError('Không tìm thấy bài viết', 404);
    return deleted;
  }

  /** Get distinct categories from published news. */
  async getCategories() {
    return News.distinct('category', { status: NewsStatus.Published });
  }
}

export const newsService = new NewsService();
```

- [ ] **Step 2: Verify service compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

---

### Task 4: Create News Controller

**Files:**
- Create: `server/src/controllers/newsController.ts`

**Interfaces:**
- Consumes: `newsService` from `../services/newsService`, `asyncHandler`, `successResponse`, `AuthRequest`
- Produces: `newsController` object with handler methods

- [ ] **Step 1: Create controller file**

```typescript
import { Response } from 'express';
import { newsService } from '../services/newsService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import type { AuthRequest } from '../middleware/auth';

export const newsController = {
  /** Public: published news listing. */
  list: asyncHandler(async (req, res: Response) => {
    const result = await newsService.list(req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  /** Public: get news by slug. */
  getBySlug: asyncHandler(async (req, res: Response) => {
    const news = await newsService.getBySlug(req.params.slug);
    return successResponse(res, news);
  }),

  /** Public: list published news categories. */
  categories: asyncHandler(async (_req, res: Response) => {
    const categories = await newsService.getCategories();
    return successResponse(res, categories);
  }),

  /** Admin: list all news. */
  adminList: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await newsService.adminList(req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  /** Admin: get news by ID. */
  adminGetById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const news = await newsService.getById(req.params.id);
    return successResponse(res, news);
  }),

  /** Admin: create news. */
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const news = await newsService.create(req.body);
    return successResponse(res, news, { status: 201, message: 'Tạo bài viết thành công' });
  }),

  /** Admin: update news. */
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const news = await newsService.update(req.params.id, req.body);
    return successResponse(res, news, { message: 'Cập nhật bài viết thành công' });
  }),

  /** Admin: delete news. */
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await newsService.remove(req.params.id);
    return successResponse(res, null, { message: 'Xóa bài viết thành công' });
  }),
};
```

- [ ] **Step 2: Verify controller compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

---

### Task 5: Create News Routes

**Files:**
- Create: `server/src/routes/news.ts`

**Interfaces:**
- Consumes: `newsController`, `requireAuth`, `requireAdmin`, `validateRequest`, validator schemas
- Produces: Express Router (default export)

- [ ] **Step 1: Create routes file**

```typescript
import { Router } from 'express';
import { newsController } from '../controllers/newsController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createNewsSchema, updateNewsSchema, newsQuerySchema } from '../validators/news';

const router = Router();

// Public routes
router.get('/', validateRequest(newsQuerySchema, 'query'), newsController.list);
router.get('/categories', newsController.categories);
router.get('/:slug', newsController.getBySlug);

// Admin routes - use /admin prefix to avoid conflict with slug
router.get('/admin/all', requireAuth, requireAdmin, validateRequest(newsQuerySchema, 'query'), newsController.adminList);
router.get('/admin/:id', requireAuth, requireAdmin, newsController.adminGetById);
router.post('/admin', requireAuth, requireAdmin, validateRequest(createNewsSchema), newsController.create);
router.put('/admin/:id', requireAuth, requireAdmin, validateRequest(updateNewsSchema), newsController.update);
router.delete('/admin/:id', requireAuth, requireAdmin, newsController.remove);

export default router;
```

- [ ] **Step 2: Verify routes compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

---

### Task 6: Mount News Routes in App

**Files:**
- Modify: `server/src/app.ts`

**Interfaces:**
- Consumes: `newsRoutes` from `./routes/news`
- Produces: Updated app.ts with news routes mounted

- [ ] **Step 1: Add import for news routes**

Add after line 20 (after `import uploadRoutes from './routes/upload';`):

```typescript
import newsRoutes from './routes/news';
```

- [ ] **Step 2: Mount news routes**

Add after line 57 (after `app.use('/api/upload', uploadRoutes);`):

```typescript
app.use('/api/news', newsRoutes);
```

- [ ] **Step 3: Verify app compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

---

## Summary

| Task | Files Created | Files Modified |
|------|---------------|----------------|
| 1 | `server/src/models/News.ts` | `server/src/models/index.ts` |
| 2 | `server/src/validators/news.ts` | - |
| 3 | `server/src/services/newsService.ts` | - |
| 4 | `server/src/controllers/newsController.ts` | - |
| 5 | `server/src/routes/news.ts` | - |
| 6 | - | `server/src/app.ts` |

**Total:** 5 new files, 2 modified files

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/news` | Public | List published news |
| GET | `/api/news/categories` | Public | List news categories |
| GET | `/api/news/:slug` | Public | Get news by slug |
| GET | `/api/news/admin/all` | Admin | List all news |
| GET | `/api/news/admin/:id` | Admin | Get news by ID |
| POST | `/api/news/admin` | Admin | Create news |
| PUT | `/api/news/admin/:id` | Admin | Update news |
| DELETE | `/api/news/admin/:id` | Admin | Delete news |
