// Type-only import: erased at compile time, so this module stays runtime-pure
// (no mongoose loaded) while the pipeline remains assignable to Model.aggregate.
import type { PipelineStage } from 'mongoose';

/**
 * Pure aggregation-pipeline builder for the denormalized Product.rating /
 * Product.reviewCount aggregates (GAP-15, Task 10b). No mongoose, no models,
 * no I/O — the same seam style as discountMath.
 *
 * `excludingUserId` is the key to the user-deletion cascade being retry-safe:
 * the refresh runs BEFORE the reviews are deleted, so the pipeline must
 * compute the POST-deletion truth on its own. `$ne` does exactly that and
 * stays correct on a retry, where the excluded reviews may already be gone
 * (the condition then matches everything, which is the same truth).
 */
export function ratingRefreshPipeline(
  productId: unknown,
  excludingUserId: unknown,
): PipelineStage[] {
  return [
    { $match: { product: productId, user: { $ne: excludingUserId } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ];
}
