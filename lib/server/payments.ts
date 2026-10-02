import { createHash, createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { currentPlans, coversPlan, type CurrentPlan } from '../plans.ts';

export const plans = {
  ...currentPlans,
  // Honor existing signed orders and passes bought under the old price.
  premium: { amount: 19900, seconds: 30 * 86400, title: '30-day Premium pass' },
} as const;
type Plan = keyof typeof plans;
type RecordValue = Record<string, unknown>;
export type Gateway = {
  createOrder: (data: { amount: number; currency: string; receipt: string; notes: Record<string, string> }) => Promise<RecordValue>;
  getOrder: (id: string) => Promise<RecordValue>;
  getPayment: (id: string) => Promise<RecordValue>;
  getOrderPayments?: (id: string) => Promise<RecordValue>;
};
type Config = { keyId: string; secret: string; gateway: Gateway; now?: () => number };
type Ticket = { orderId: string; plan: Plan; session: string; expiresAt: number };
type Access = { plan: Plan; paymentId: string; session: string; expiresAt: number };
const sessionCookie = 'astrois_payment_session';
const accessCookie = 'astrois_paid_access';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
class PaymentError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function cookie(req: Request, name: string) {
  return (req.headers.get('cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1) || '';
}
function signed<T>(payload: T, purpose: string, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + createHmac('sha256', secret).update(purpose + ':' + body).digest('hex');
}
function unpack<T>(value: string, purpose: string, secret: string): T | null {
  const [body, signature, extra] = value.split('.');
  if (!body || !signature || extra || !same(signature, createHmac('sha256', secret).update(purpose + ':' + body).digest('hex'))) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()) as T; } catch { return null; }
}
function setCookie(res: Response, req: Request, name: string, value: string, maxAge: number) {
  res.headers.append('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`);
}
function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
async function input(req: Request): Promise<RecordValue> {
  if (req.headers.get('origin') !== new URL(req.url).origin) throw new PaymentError(403, 'Please start checkout from the Astrois website.');
  if (!req.headers.get('content-type')?.includes('application/json')) throw new PaymentError(400, 'Send payment details as JSON.');
  const raw = await req.text();
  if (raw.length > 8192) throw new PaymentError(400, 'Payment request is too large.');
  try {
    const data = JSON.parse(raw);
    if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error();
    return data;
  } catch { throw new PaymentError(400, 'Invalid payment request.'); }
}
export function paymentHandlers(config: Config) {
  const { secret, keyId, gateway } = config;
  const now = config.now || Date.now;
  function access(req: Request) {
    const value = unpack<Access>(cookie(req, accessCookie), 'access', secret);
    return value && value.plan in plans && value.session === digest(cookie(req, sessionCookie)) && value.expiresAt > now() ? value : null;
  }
  async function safely(run: () => Promise<Response>) {
    try {
      if (!secret || !keyId) throw new PaymentError(503, 'Checkout is not configured yet. Please try again later.');
      return await run();
    } catch (error) {
      if (error instanceof PaymentError) return json({ error: error.message }, error.status);
      const status = (error as { statusCode?: number; status?: number })?.statusCode || (error as { status?: number })?.status;
      return json({ error: status === 401 ? 'Payment gateway authentication failed. Please contact support.' : 'The payment gateway is unavailable. Please try again.' }, status === 401 ? 401 : 500);
    }
  }
  const handlers = {
    create: (req: Request) => safely(async () => {
      const data = await input(req);
      if (typeof data.plan !== 'string' || !Object.hasOwn(currentPlans, data.plan)) throw new PaymentError(400, 'Choose a valid current chat pass.');
      const plan = data.plan as CurrentPlan, price = plans[plan];
      if (data.amount !== undefined && (!Number.isSafeInteger(data.amount) || Number(data.amount) < 100 || data.amount !== price.amount)) throw new PaymentError(400, 'The amount must match the selected pass and be at least 100 paise.');
      if (data.currency !== undefined && data.currency !== 'INR') throw new PaymentError(400, 'Only INR is supported.');
      const active = access(req);
      if (active && coversPlan(active.plan, plan)) throw new PaymentError(409, 'You already have an active pass. Return to your chat.');
      const existing = cookie(req, sessionCookie);
      const session = /^[a-f0-9-]{36}$/.test(existing) ? existing : randomUUID();
      const order = await gateway.createOrder({ amount: price.amount, currency: 'INR', receipt: 'astrois_' + randomUUID().replaceAll('-', ''), notes: { app: 'astrois', plan, session: digest(session) } });
      if (typeof order.id !== 'string' || order.amount !== price.amount || order.currency !== 'INR') throw new Error('Invalid gateway order');
      const ticket: Ticket = { orderId: order.id, plan, session: digest(session), expiresAt: now() + 86400000 };
      const res = json({ order_id: order.id, amount: price.amount, currency: 'INR', key_id: keyId, order_token: signed(ticket, 'order', secret), description: price.title, test_mode: keyId.startsWith('rzp_test_') });
      setCookie(res, req, sessionCookie, session, 31 * 86400);
      return res;
    }),
    verify: (req: Request) => safely(async () => {
      const data = await input(req);
      for (const key of ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'order_token']) {
        if (typeof data[key] !== 'string' || !data[key] || (data[key] as string).length > 2048) throw new PaymentError(400, 'Payment confirmation is incomplete.');
      }
      const ticket = unpack<Ticket>(data.order_token as string, 'order', secret);
      if (!ticket || !Object.hasOwn(plans, ticket.plan) || ticket.expiresAt <= now() || ticket.session !== digest(cookie(req, sessionCookie)) || ticket.orderId !== data.razorpay_order_id) throw new PaymentError(400, 'This payment does not match your checkout session.');
      if (!/^pay_[a-zA-Z0-9]+$/.test(data.razorpay_payment_id as string) || !/^[a-f0-9]{64}$/.test(data.razorpay_signature as string)) throw new PaymentError(400, 'Invalid payment confirmation.');
      // Trust the signed server order, never an order ID supplied by Checkout alone.
      const expected = createHmac('sha256', secret).update(ticket.orderId + '|' + data.razorpay_payment_id).digest('hex');
      if (!same(expected, data.razorpay_signature as string)) throw new PaymentError(400, 'Payment signature does not match. Access has not been activated.');
      const [order, payment] = await Promise.all([gateway.getOrder(ticket.orderId), gateway.getPayment(data.razorpay_payment_id as string)]);
      const price = plans[ticket.plan], notes = order.notes as RecordValue | undefined;
      if (order.id !== ticket.orderId || order.amount !== price.amount || order.currency !== 'INR' || notes?.session !== ticket.session || notes?.plan !== ticket.plan || payment.order_id !== ticket.orderId || payment.id !== data.razorpay_payment_id || payment.amount !== price.amount || payment.currency !== 'INR' || Number(payment.amount_refunded || 0) > 0) throw new PaymentError(400, 'Payment details do not match this pass.');
      if (payment.status === 'authorized') throw new PaymentError(409, 'Your payment is awaiting confirmation. Use “Check payment again” in a moment; do not pay again.');
      if (payment.status !== 'captured' || order.status !== 'paid') throw new PaymentError(400, 'Payment has not completed. Access has not been activated.');
      if (typeof payment.created_at !== 'number' || payment.created_at * 1000 > now() + 60000) throw new Error('Invalid gateway timestamp');
      // A replay always produces the same expiry; it cannot add extra paid time.
      const purchased: Access = { plan: ticket.plan, session: ticket.session, paymentId: payment.id as string, expiresAt: payment.created_at * 1000 + price.seconds * 1000 };
      if (purchased.expiresAt <= now()) throw new PaymentError(410, 'This pass has expired. Your payment cannot be used again.');
      const current = access(req);
      const grant = current && current.expiresAt > purchased.expiresAt ? current : purchased;
      const res = json({ success: true, access: { plan: grant.plan, expiresAt: grant.expiresAt }, test_mode: keyId.startsWith('rzp_test_') });
      setCookie(res, req, accessCookie, signed(grant, 'access', secret), Math.ceil((grant.expiresAt - now()) / 1000));
      return res;
    }),
    recover: (req: Request): Promise<Response> => safely(async () => {
      const data = await input(req);
      if (typeof data.order_token !== 'string' || data.order_token.length > 2048) throw new PaymentError(400, 'Missing checkout receipt.');
      const ticket = unpack<Ticket>(data.order_token, 'order', secret);
      if (!ticket || !Object.hasOwn(plans, ticket.plan) || ticket.expiresAt <= now() || ticket.session !== digest(cookie(req, sessionCookie))) throw new PaymentError(400, 'This checkout does not belong to your session.');
      if (!gateway.getOrderPayments) throw new PaymentError(503, 'Payment recovery is unavailable.');
      const collection = await gateway.getOrderPayments(ticket.orderId);
      const items = Array.isArray(collection.items) ? collection.items as RecordValue[] : [];
      const payment = items.find(item => item.status === 'captured' && Number(item.amount_refunded || 0) === 0);
      if (!payment && items.some(item => item.status === 'failed')) {
        const mismatch = items.some(item => /website|business.*mismatch/i.test(String(item.error_description || '') + ' ' + String(item.error_reason || '')));
        throw new PaymentError(400, mismatch ? 'Razorpay blocked this payment because this website is not approved for your merchant account. Contact support; do not pay again if money was deducted.' : 'Razorpay reports this payment failed. No pass was activated. If money was deducted, contact support before retrying.');
      }
      if (!payment || typeof payment.id !== 'string') throw new PaymentError(409, 'Waiting for Razorpay to confirm payment. Do not pay again; check again shortly.');
      // Recovery trusts only the authenticated gateway response and the session-bound signed order.
      // The ordinary verifier still checks capture, amount, currency, ownership and refunds.
      return handlers.verify(new Request(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify({
        razorpay_order_id: ticket.orderId, razorpay_payment_id: payment.id, order_token: data.order_token,
        razorpay_signature: createHmac('sha256', secret).update(ticket.orderId + '|' + payment.id).digest('hex'),
      }) }));
    }),
    status: (req: Request) => safely(async () => {
      const active = access(req);
      return json({ access: active ? { plan: active.plan, expiresAt: active.expiresAt } : null, test_mode: keyId.startsWith('rzp_test_') });
    }),
  };
  return handlers;
}
