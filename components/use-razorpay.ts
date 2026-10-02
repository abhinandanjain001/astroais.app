'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { currentPlans, type AccessPlan, type CurrentPlan } from '@/lib/plans';
export type PaidAccess = { plan: AccessPlan; expiresAt: number };
type Confirmation = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; order_token: string };
type CheckoutInstance = { open: () => void; close: () => void; on: (name: string, handler: (event: { error?: { description?: string; reason?: string } }) => void) => void };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => CheckoutInstance } }
let scriptPromise: Promise<void> | undefined;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    const timer = window.setTimeout(() => fail(), 15000);
    function fail() { clearTimeout(timer); script.remove(); scriptPromise = undefined; reject(new Error('Checkout could not load. Check your connection and try again.')); }
    script.onerror = fail;
    script.onload = () => { clearTimeout(timer); if (window.Razorpay) resolve(); else fail(); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
type ApiResult = { error?: string; success?: boolean; access: PaidAccess | null; test_mode: boolean; key_id: string; amount: number; currency: string; order_id: string; order_token: string; description: string };
class PaymentApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
async function api(path: string, body?: unknown) {
  const response = await fetch(path, { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(25000) });
  const data = await response.json() as ApiResult;
  if (!response.ok) throw new PaymentApiError(data.error || 'We could not confirm your payment. Please try again.', response.status);
  return data;
}
const pendingKey = 'astrois-payment-confirmation';
const orderKey = 'astrois-payment-order';
export function useRazorpay() {
  const [access, setAccess] = useState<PaidAccess | null>(null);
  const [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState(''), [testMode, setTestMode] = useState(true);
  const [pending, setPending] = useState<Confirmation | null>(null);
  const lock = useRef(false);
  const checkoutRef = useRef<CheckoutInstance | null>(null);
  const [orderToken, setOrderToken] = useState<string | null>(null);
  useEffect(() => {
    api('/api/payment-status').then(data => { setAccess(data.access); setTestMode(data.test_mode); }).catch(() => setMessage('Could not check your existing pass. Reload before making another payment.')).finally(() => setLoaded(true));
    try { const token = sessionStorage.getItem(orderKey); if (token) setOrderToken(token); } catch {}
    try { const value = sessionStorage.getItem(pendingKey); if (value) { setPending(JSON.parse(value)); setMessage('A payment needs confirmation. Check it again before making another payment.'); } } catch {}
  }, []);
  useEffect(() => {
    if (!access) return;
    const timer = setInterval(() => { if (access.expiresAt <= Date.now()) setAccess(null); }, 1000);
    return () => clearInterval(timer);
  }, [access]);
  const verify = useCallback(async (confirmation: Confirmation | { order_token: string }) => {
    setBusy(true); lock.current = true;
    setMessage('Confirming your payment securely…');
    try {
      const result = await api('razorpay_signature' in confirmation ? '/api/verify-payment' : '/api/recover-payment', confirmation);
      if (!result.success || !result.access) throw new Error('Payment has not been confirmed yet.');
      setAccess(result.access); setTestMode(result.test_mode); setPending(null); setOrderToken(null);
      checkoutRef.current?.close();
      document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' });
      try { sessionStorage.removeItem(pendingKey); sessionStorage.removeItem(orderKey); } catch {}
      const title = result.access.plan === 'premium' ? '30-day Premium pass' : currentPlans[result.access.plan].title;
      setMessage(`${result.test_mode ? 'Test payment confirmed. ' : 'Payment confirmed. '}Your ${title} is active.`);
    } catch (error) {
      if (error instanceof PaymentApiError && [400, 410].includes(error.status)) {
        setPending(null); setOrderToken(null);
        try { sessionStorage.removeItem(pendingKey); sessionStorage.removeItem(orderKey); } catch {}
      }
      setMessage(error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'Confirmation took too long. Check payment again; do not pay twice.');
    } finally { setBusy(false); lock.current = false; }
  }, []);
  useEffect(() => {
    if (!loaded || access || (!pending && !orderToken)) return;
    let attempts = 0;
    const check = () => { if (!lock.current && attempts++ < 24) void verify(pending || { order_token: orderToken! }); };
    check();
    const timer = window.setInterval(check, 5000);
    window.addEventListener('focus', check);
    return () => { clearInterval(timer); window.removeEventListener('focus', check); };
  }, [loaded, access, pending, orderToken, verify]);
  async function start(plan: CurrentPlan, closeDialog: () => void) {
    if (lock.current || pending || orderToken || !loaded) return;
    lock.current = true; setBusy(true); setMessage('Preparing secure checkout…');
    let finished = false;
    try {
      await loadCheckout();
      const order = await api('/api/create-order', { plan });
      setTestMode(order.test_mode);
      setOrderToken(order.order_token);
      try { sessionStorage.setItem(orderKey, order.order_token); } catch {}
      const checkout = new window.Razorpay!({
        key: order.key_id, amount: order.amount, currency: order.currency, order_id: order.order_id,
        name: 'astrois.app', description: order.description, theme: { color: '#b69570' },
        handler: (result: Omit<Confirmation, 'order_token'>) => {
          finished = true;
          const confirmation = { ...result, order_token: order.order_token };
          setPending(confirmation);
          try { sessionStorage.setItem(pendingKey, JSON.stringify(confirmation)); } catch {}
          void verify(confirmation);
        },
        modal: { ondismiss: () => { if (!finished) { setMessage('Checkout closed. Checking whether your payment completed. Do not pay again while confirmation is pending.'); setBusy(false); lock.current = false; } } },
      });
      checkout.on('payment.failed', (event) => {
        const details = (event.error?.description || '') + ' ' + (event.error?.reason || '');
        setMessage(/website|business.*mismatch/i.test(details) ? 'Razorpay blocked payment: this website is not approved for the merchant account. No pass was activated.' : 'Razorpay reports the payment failed. If money was deducted, contact support before paying again.');
      });
      closeDialog();
      // Let the app dialog release its focus trap before Razorpay takes focus.
      await new Promise(resolve => setTimeout(resolve, 200));
      checkoutRef.current = checkout;
      checkout.open();
      setBusy(false); lock.current = false;
      setMessage(order.test_mode ? 'Test checkout is open. No real money will be charged.' : 'Complete your payment in the secure checkout window.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Checkout could not start. Please try again.');
      setBusy(false); lock.current = false;
    }
  }
  return { access, busy, loaded, message, testMode, pending: pending || orderToken, start, retry: () => { if (!lock.current && (pending || orderToken)) void verify(pending || { order_token: orderToken! }); }, dismissPending: () => { if (lock.current) return; setOrderToken(null); setPending(null); try { sessionStorage.removeItem(orderKey); sessionStorage.removeItem(pendingKey); } catch {} setMessage('Checkout receipt dismissed. If money was deducted, contact support before paying again.'); } };
}
