import type { FilterQuery, Query } from 'mongoose';

export interface PaginationOptions {
  page: number;
  limit: number;
  sort: string;
  search?: string;
  searchFields?: string[];
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Applies regex search, filtering, sorting and pagination to a Mongoose query.
 * Returns the result docs plus pagination metadata.
 */
export async function apiFeatures<T>(
  query: Query<T[], T>,
  filter: FilterQuery<T>,
  options: PaginationOptions,
): Promise<{ data: T[]; pagination: PaginationResult }> {
  const { page, limit, sort, search, searchFields } = options;

  const finalFilter: FilterQuery<T> = { ...filter };

  if (search && searchFields && searchFields.length > 0) {
    finalFilter.$or = searchFields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    })) as FilterQuery<T>['$or'];
  }

  const [total, data] = await Promise.all([
    query.model.countDocuments(finalFilter),
    query.find(finalFilter).sort(sort).skip((page - 1) * limit).limit(limit).exec(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/** Maps friendly frontend sort keys to real Mongoose sort strings. */
const FRIENDLY_SORT: Record<string, string> = {
  newest: '-createdAt',
  'price-asc': 'salePrice',
  'price-desc': '-salePrice',
  rating: '-rating -reviewCount',
};

export function parsePagination(query: Record<string, unknown>): PaginationOptions {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 12));
  const rawSort = String(query.sort || '-createdAt');
  const sort = (FRIENDLY_SORT[rawSort] ?? rawSort).replace(/[^\w\s,.-]/g, '');
  const search = query.search ? String(query.search).trim() : undefined;

  return { page, limit, sort, search };
}
