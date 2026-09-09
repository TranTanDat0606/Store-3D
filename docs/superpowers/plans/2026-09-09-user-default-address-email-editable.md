# Implementation Plan: Fix User Default Address + Make Email Editable

## Problem Summary

1. **User Checkout shows "Chưa có địa chỉ nào"** because it only queries the `Address` model. Users who only have `User.address` (flat string from profile) have no structured Address records.

2. **Email is read-only** in Account Profile — displayed as `<div>` text, not an editable input. Backend `updateProfile` excludes email.

## Architecture

Two address systems coexist:
- `User.address` — single string field on User model (edited via profile page)
- `Address` model — structured documents with province/district/ward/street (used by checkout)

**Admin and User use the same checkout page** (`checkout-page.tsx`). No separate admin checkout exists.

## Design Decisions

### Decision 1: Synthetic Address Entry

When `user.address` is non-empty, inject a synthetic `Address` object at the top of the dropdown:

```ts
const USER_ADDRESS_SENTINEL = '__user_address__'

const syntheticAddress: Address = {
  _id: USER_ADDRESS_SENTINEL,
  userId: user._id,
  label: '',
  recipientName: user.fullname,
  phone: user.phone ?? '',
  street: user.address,  // entire flat string as "street"
  ward: '',
  district: '',
  province: '',
  isDefault: hasNoOtherDefault,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
}
```

The `street` field holds the entire `User.address` string. The `formatAddress` function will be updated to handle empty ward/district/province gracefully.

### Decision 2: Edit User.address from Checkout

When "Chỉnh sửa" is clicked on the synthetic entry:
- Open a **simple edit dialog** with a single `<Input>` field for the address string
- On save: call `authApi.updateProfile({ address: newValue })`
- Call `updateUser()` from AuthContext to refresh user state
- Checkout re-renders with updated address — no page reload, no cart/coupon reset

### Decision 3: Order Creation

When `selectedAddressId === '__user_address__'`:
- Do NOT send `addressId` in the order payload
- Send `customer.address` as the formatted string from `User.address`
- Backend uses the string as-is (existing behavior when no `addressId` is provided)

### Decision 4: Email Editable

- Add `email` to profile Zod schema with `z.string().email()`
- Render email as `<Input>` (same UX as phone/address)
- Backend: add `email` to `updateProfileSchema`, add uniqueness check in controller

## Implementation Steps

### Step 1: Backend — Allow email update in profile

**Files:**
- `server/src/validators/auth.ts` — add `email` to `updateProfileSchema`
- `server/src/controllers/authController.ts` — add `email` handling + uniqueness check

**Changes:**
1. `updateProfileSchema`: add `email: z.string().email('Email không hợp lệ').max(100).optional()`
2. `updateProfile` controller: add `email` to the update object, check uniqueness if changed

### Step 2: Frontend — Make email editable in profile

**File:** `client/src/pages/account/profile-page.tsx`

**Changes:**
1. Add `email` to profile Zod schema: `email: z.string().email('Email không hợp lệ')`
2. Add email `<FormField>` + `<Input>` (same pattern as phone)
3. Include `email` in form default values: `email: user?.email ?? ''`
4. Pass `email` in form submit (already handled by `authApi.updateProfile` once backend accepts it)

### Step 3: Frontend — Update authApi to accept email

**File:** `client/src/services/authApi.ts`

**Change:** Update `updateProfile` type from `Pick<User, 'fullname' | 'phone' | 'address' | 'avatar'>` to include `'email'`.

### Step 4: Frontend — Inject synthetic address in checkout

**File:** `client/src/pages/checkout-page.tsx`

**Changes:**
1. Import `USER_ADDRESS_SENTINEL` constant
2. Update `formatAddress()` to handle empty ward/district/province:
   ```ts
   function formatAddress(addr: Address): string {
     const parts = [addr.street, addr.ward, addr.district, addr.province].filter(Boolean)
     return parts.join(', ')
   }
   ```
3. Update `loadAddresses()`:
   - After loading Address model entries, check `user.address`
   - If `user.address` is non-empty, create synthetic entry and prepend to list
   - Auto-select synthetic if no Address model entry is default
4. Update `selectAddress()` to handle synthetic entry
5. Update dropdown rendering: show "Địa chỉ từ hồ sơ" label for synthetic
6. Update "Chỉnh sửa" button: for synthetic entry, open simple edit dialog instead of address dialog
7. Add simple edit dialog state + handler for User.address editing
8. Update `onSubmit`: when `selectedAddressId === USER_ADDRESS_SENTINEL`, don't send `addressId`

### Step 5: TypeScript + Build + Tests

- Run `npx tsc --noErypt` (client + server)
- Run `npx vite build`
- Manual regression tests

## Regression Test Checklist

### USER ACCOUNT
- [ ] Login User → Account profile → Email displays in editable `<Input>`
- [ ] Edit email → Save → Reload → Email persists
- [ ] Edit address → Save → Reload → Address persists
- [ ] Changing email doesn't overwrite address and vice versa

### USER CHECKOUT
- [ ] User with `User.address` → Checkout shows address in dropdown
- [ ] Auto-selects `User.address` as default
- [ ] "Chỉnh sửa" opens simple edit dialog
- [ ] Edit → Save → Checkout updates immediately (no reload)
- [ ] Cart, coupon, payment method preserved after edit

### USER ORDER
- [ ] User with `User.address`, no Address model → Order created with correct address
- [ ] `addressId` NOT sent for synthetic entry
- [ ] Order shows correct address string

### ADMIN
- [ ] Admin Checkout still works with Address model entries
- [ ] Admin can still create/edit addresses via existing dialog
- [ ] Admin order creation unchanged

### USER WITHOUT ADDRESS
- [ ] `User.address` empty → Checkout shows "Chưa có địa chỉ nào"
- [ ] Can add new address via dialog
- [ ] New address appears in dropdown

## Files Changed

| File | Change |
|------|--------|
| `server/src/validators/auth.ts` | Add `email` to `updateProfileSchema` |
| `server/src/controllers/authController.ts` | Handle `email` in `updateProfile` + uniqueness check |
| `client/src/services/authApi.ts` | Add `email` to `updateProfile` type |
| `client/src/pages/account/profile-page.tsx` | Email as editable Input |
| `client/src/pages/checkout-page.tsx` | Synthetic address, edit dialog, format fix |
