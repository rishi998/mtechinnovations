import { Types } from 'mongoose';

/** Resolve Mongo product id from an order line (`productId` may be populated). */
export function orderLineStorefrontProductId(productId: unknown): string {
  if (productId instanceof Types.ObjectId) {
    return String(productId);
  }
  if (
    productId &&
    typeof productId === 'object' &&
    productId !== null &&
    '_id' in productId
  ) {
    const id = (productId as { _id: unknown })._id;
    if (id instanceof Types.ObjectId) {
      return String(id);
    }
    if (id != null) {
      return String(id);
    }
  }
  if (typeof productId === 'string') {
    return productId;
  }
  return String(productId ?? '');
}
