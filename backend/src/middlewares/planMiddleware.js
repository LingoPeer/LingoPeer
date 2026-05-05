import { getUserPlanRow } from '../models/Billing.js';

/**
 * After `authenticateToken`. Attaches `req.planTier` for lesson / AI routes.
 */
export async function attachPlanTier(req, res, next) {
  try {
    const row = await getUserPlanRow(req.user.id);
    req.planTier = row?.plan_tier ?? 'free';
    next();
  } catch (err) {
    next(err);
  }
}
