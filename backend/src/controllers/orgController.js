import { AppError } from '../utils/AppError.js';
import {
  getOrganizationForUser,
  countOrganizationMembers,
  getBillingSummaryForUser,
} from '../models/Billing.js';
import pool from '../config/db.js';

/**
 * GET /api/org — organization + seat summary for the current user (admin sees full org).
 */
export const getMyOrganization = async (req, res) => {
  const userId = req.user.id;
  const org = await getOrganizationForUser(userId);
  if (!org) {
    return res.json({ success: true, organization: null });
  }

  const memberCount = await countOrganizationMembers(org.id);
  const subR = await pool.query(
    `SELECT status, cancel_at_period_end, current_period_end, stripe_price_id, stripe_subscription_id
     FROM subscriptions WHERE organization_id = $1 ORDER BY updated_at DESC LIMIT 1`,
    [org.id],
  );
  const subscription = subR.rows[0] ?? null;

  const billing = await getBillingSummaryForUser(userId);

  res.json({
    success: true,
    organization: {
      id: org.id,
      name: org.name,
      seat_quantity: org.seat_quantity,
      member_count: memberCount,
      my_role: org.my_role,
      stripe_customer_id: org.stripe_customer_id ? '***' : null,
    },
    subscription,
    billing,
  });
};

export const requireOrgAdmin = async (req, res, next) => {
  try {
    const org = await getOrganizationForUser(req.user.id);
    if (!org || org.my_role !== 'admin') {
      throw new AppError('Organization admin access required', 403, 'ORG_ADMIN');
    }
    req.organization = org;
    next();
  } catch (err) {
    next(err);
  }
};
