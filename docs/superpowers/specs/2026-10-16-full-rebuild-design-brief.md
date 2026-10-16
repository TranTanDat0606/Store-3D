# STORE 3D — Full Rebuild Design Brief

Date: 2026-10-16 · Workflow: workflow-router → **A (New Website/UI)** · Skill: `web-design-director`
Status: internal artifact, feeds `enhance-prompt` → Stitch `generate-design` → **GATE 1 (Design Review)**
Grounding: 3 codebase surveys (storefront, backend/business rules, admin+branding) — see §Evidence.

---

## Design Classification

- **Primary type:** E-commerce (3D-printed collectibles / models, Vietnamese market)
- **Secondary types:** Dashboard (admin back-office), Editorial (news/blog), Account portal
- **Audience:** Vietnamese collectors, hobbyists, gift buyers (Gen Z–Millennial); visually driven, price- and trust-sensitive; mobile-first.
- **Primary goal:** product discovery → evaluation → purchase (repeat purchase via coupons/rewards).
- **Secondary goals:** order tracking, wishlist/coupons account, content (tin tức), admin operations efficiency.

## UX Strategy

- **Primary user action:** search/browse → open PDP → add to cart → checkout (COD or VietQR bank transfer).
- **Secondary actions:** live search, category & filter (material/printer/price), wishlist, verified reviews, coupon apply, order timeline, news reading, admin CRUD.
- **Information hierarchy:** product imagery > price/sale price + discount > trust (rating, review count, stock, USPs) > supporting content (news, guidelines).
- **Navigation model:** sticky navbar — logo + primary nav (Trang chủ, Sản phẩm, Danh mục(dynamic from DB), Tin tức, Liên hệ) + live search w/ suggestions + wishlist/cart(count)/account; mobile = drawer with login entry. Footer: brand/social, Liên kết, Hỗ trợ, Liên hệ.
- **Conversion strategy:** persistent cart entry, cart drawer → checkout 2-column (shipping + payment | sticky summary w/ coupon), clear order states, post-purchase review + reward game funnel.

## Visual Direction

- **Design direction:** *Premium Dark Futuristic Collectibles* — an obsidian display-case aesthetic: near-black surfaces, **gold** for premium/price/CTA emphasis, **blue** for tech/information accents, white text, muted slate secondary. Restraint over neon.
- **Emotional tone:** premium, precise, collectible; confidence of a high-end display case, not arcade cyberpunk.
- **Typography:** `Be Vietnam Pro` (400–800, full Vietnamese diacritics) for body + headings; `Orbitron` strictly for Latin/numeric accents (ST3D, stats digits) — it has NO Vietnamese diacritics, never for VN words. Max 2 families, clear type scale, AA contrast.
- **Color tokens (single dark theme, no light mode / no toggle):** bg `#07090F`-range, surface `#0E1219`/`#151A24`, border subtle, text white → muted slate, primary gold, secondary blue, semantic success/warning/danger distinct. Charts: 5 accessible series.
- **Imagery:** real product photos on dark, AO BING cinematic hero video ≈3 s (plays once/loops muted, no scroll-scrub), category images from DB, no fabricated stats/products/prices.
- **Motion:** purposeful only — hero video settle, entrance fades, hover feedback, state transitions. **No scroll-driven pinned hero** (explicit requirement). Respect `prefers-reduced-motion`.

## Layout Strategy

- **Desktop (≥1280):** 12-col, max-w ~1280; Home = AO BING hero → Hot Sale → Danh mục (dynamic) → Bán chạy → Sản phẩm nổi bật/Tin tức → trust/CTA → footer. PLP: sticky filter sidebar + grid. PDP: gallery | sticky purchase panel. Admin: fixed sidebar + topbar + dense tables.
- **Tablet (768–1279):** 8-col, filters in sheet, nav condensed (no 2-line wrap — fixes known 768–1024 defect).
- **Mobile (<768):** single column, designed not shrunk; thumb-reach CTAs, bottom purchase bar on PDP, horizontal category scroll.
- **Content density:** storefront airy; admin dense.

## Component Strategy (only what this product type needs)

Navbar (w/ search, dynamic categories), Footer, ProductCard (image, original/sale price, discount %, rating+count, stock, add-to-cart), CategoryTile (DB-driven, uncapped), FilterSidebar/Sheet, Pagination, ProductGallery+Lightbox, PurchasePanel/MobilePurchaseBar, Tabs (Mô tả/Thông số/Đánh giá), CartDrawer, CheckoutSummary+CouponInput, OrderStatusTimeline (multi-step, replaces badge-only), OrderStatusBadge, CouponCard, WishlistButton, StarRating + verified badge, EmptyState/ErrorState/Skeleton, form fields+dialogs (shadcn/Radix), Toast; Admin: StatCard, charts (recharts), DataTable+filters, Dialog/AlertDialog CRUD forms, ImageUpload, status transition controls, sidebar+topbar shell.

## Explicitly Avoid

- Light mode or theme toggle anywhere (incl. admin).
- Generic SaaS hero, arbitrary gradients, glassmorphism overload, neon overload, pill-button spam, decorative meaningless stats.
- Scroll-driven/pinned hero choreography (AO BING = fixed ~3 s cinematic band only).
- Cinematic storytelling that delays product discovery (hero must be compact; discovery starts within first scroll).
- Identical rounded-card grids for every section; cards only where content is truly card-shaped.
- Fabricated business data: no fake prices, stock, reviews, coupons (SALE10/GIAM50K/REWARD-* only as returned by API), no invented "500+/10K+/4.9" stats (remove or back with real API figures).
- Landing-page-only structure; this is a working store with cart, account and admin.

## Business constraints the design must respect (from survey)

- Roles `admin`/`customer`; orders: pending → confirmed → shipping → completed (+cancelled) — timeline must mirror this.
- Payments: COD + VietQR only (no VNPay/MoMo); bank transfer <1.000₫ rejected; free shipping (0₫).
- Reviews: verified purchase, completed order required, one per user+product.
- Coupons: admin global (percent/fixed, minOrder, expiry) + game reward `REWARD-*` (percent, cap 200.000₫).
- Categories/products dynamic from DB (uncapped count), material PLA/PETG/ABS/Resin, printer FDM/Resin.
- Errors UI must surface: 400 business messages (stock, coupon, invalid transition), 401/403, 404, 409 duplicates.

## Screen set planned for GATE 1 review

Storefront: Home (desktop/tablet/mobile), PLP, PDP, Checkout (+cart drawer state), Login/Register, Account (orders+detail), News, Contact.
Admin: Dashboard, Products list+edit, Orders, representative CRUD (categories/coupons/users/support).
Specs: Navbar+footer spec, **Logo system** (favicon/app/admin variants), Design System overview.
AO BING hero: technical approach (fixed ~3 s video band) documented in the spec screen.

## Evidence

- Storefront inventory: routes, pages, journeys, state patterns, homepage sections (3-agent survey).
- Backend: full API map, models, order/payment state machines, coupon/review rules, error cases, 11 known logic gaps (not to be designed around as if fixed).
- Admin: 12 routes + patterns; branding: no logo image exists today (code-rendered Box icon, sky-blue #0ea5e9), shadcn new-york/neutral tokens, Be Vietnam Pro + Orbitron.
