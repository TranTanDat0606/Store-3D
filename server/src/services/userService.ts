import { Address, GameSession, Product, Review, User, UserRole, UserCoupon, Wishlist } from '../models';
import { AppError } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';

export interface UserDeletionPlanEntry {
  collection: string;
  action: 'delete' | 'unset';
  fields: string[];
  /** Documented exception: the step is listed but NEVER executed. */
  keep?: boolean;
}

/** The subset of a Mongoose model the cascade executor needs (pure seam stays untyped by models). */
type CascadeTarget = {
  deleteMany(filter: Record<string, unknown>): PromiseLike<unknown>;
  updateMany(filter: Record<string, unknown>, update: Record<string, unknown>): PromiseLike<unknown>;
};

/** Models keyed by the exact collection name used in `userDeletionPlan()`. */
const CASCADE_MODELS: Record<string, CascadeTarget> = {
  reviews: Review,
  wishlists: Wishlist,
  addresses: Address,
  usercoupons: UserCoupon,
  gamesessions: GameSession,
};

/**
 * GAP-15 — what happens to each user-referencing collection when the account
 * is removed. Pure data (unit-test seam, Task 10), executed by `remove`:
 *
 * - `action: 'delete'` — the rows belong to the user and go with it; `fields`
 *   names the reference (`user`/`userId`) that would otherwise dangle.
 * - `action: 'unset'`  — the rows survive and only the reference field is
 *   cleared; the executor supports it, but no collection needs it today.
 * - `keep: true`       — listed for the record, skipped by the executor.
 *
 * Orders are retained (keep: true) because an order is a historical record:
 * totals, payment, status transitions and the denormalized `customer` snapshot
 * (name/phone/email/address) live on the order itself, so it stays readable
 * and auditable after the account is gone — and admin order search/filter runs
 * on `customer.*` + `_id`, never on the user id. Deleting orders would destroy
 * financial history; unsetting `user` would only orphan the id without
 * improving anything the snapshot does not already carry.
 */
export function userDeletionPlan(): UserDeletionPlanEntry[] {
  return [
    { collection: 'reviews', action: 'delete', fields: ['user'] },
    { collection: 'wishlists', action: 'delete', fields: ['user'] },
    { collection: 'addresses', action: 'delete', fields: ['userId'] },
    { collection: 'usercoupons', action: 'delete', fields: ['user'] },
    { collection: 'gamesessions', action: 'delete', fields: ['user'] },
    { collection: 'orders', action: 'unset', fields: ['user'], keep: true },
  ];
}

export class UserService {
  async list(params: Record<string, unknown>) {
    const options = { ...parsePagination(params), searchFields: ['fullname', 'email', 'phone'] };
    const result = await apiFeatures(
      User.find(),
      {},
      options,
    );
    const adminCount = await User.countDocuments({ role: UserRole.Admin });
    return { ...result, adminCount };
  }

  async getById(id: string) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
  }

  async updateRole(id: string, role: UserRole) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);

    // The system must always keep at least one admin account.
    if (user.role === UserRole.Admin && role !== UserRole.Admin) {
      const adminCount = await User.countDocuments({ role: UserRole.Admin });
      if (adminCount <= 1) {
        throw new AppError('Không thể hạ quyền admin cuối cùng của hệ thống', 400);
      }
    }

    user.role = role;
    await user.save();
    return user;
  }

  async remove(id: string) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);

    // The system must always keep at least one admin account.
    if (user.role === UserRole.Admin) {
      const adminCount = await User.countDocuments({ role: UserRole.Admin });
      if (adminCount <= 1) {
        throw new AppError('Không thể xóa admin cuối cùng của hệ thống', 400);
      }
    }

    // GAP-15: cascade per userDeletionPlan() BEFORE dropping the user document.
    // If anything below throws, the account still exists so the delete can be
    // retried; deleting the user first would leave references dangling forever
    // with no owner left to re-trigger the cleanup.
    // Product.rating/reviewCount are denormalized aggregates of the reviews we
    // are about to remove — remember the affected products up front.
    const reviewedProductIds = await Review.distinct('product', { user: id });
    for (const step of userDeletionPlan()) {
      // keep:true → documented no-op (Orders: retained denormalized snapshot).
      if (step.keep) continue;
      const model = CASCADE_MODELS[step.collection];
      if (!model) {
        // Internal invariant: the plan and CASCADE_MODELS must agree.
        throw new Error(`userDeletionPlan: no model mapped for collection "${step.collection}"`);
      }
      for (const field of step.fields) {
        if (step.action === 'delete') await model.deleteMany({ [field]: id });
        else await model.updateMany({ [field]: id }, { $unset: { [field]: '' } });
      }
    }
    for (const productId of reviewedProductIds) {
      await this.refreshProductRating(productId);
    }

    await user.deleteOne();
    return user;
  }

  /**
   * Same formula as reviewService.updateProductRating — recomputes the
   * denormalized aggregates after the cascade deleted this user's reviews.
   */
  private async refreshProductRating(productId: unknown): Promise<void> {
    const stats = await Review.aggregate<{ _id: null; avg: number; count: number }>([
      { $match: { product: productId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const stat = stats[0];
    await Product.updateOne(
      { _id: productId },
      {
        rating: stat ? Math.round(stat.avg * 10) / 10 : 0,
        reviewCount: stat?.count ?? 0,
      },
    );
  }

  async toggleActive(id: string) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    user.active = !user.active;
    await user.save();
    return user;
  }
}

export const userService = new UserService();
