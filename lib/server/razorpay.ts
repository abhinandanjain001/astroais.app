import { paymentHandlers } from './payments';

// Server API routes only. Credentials never enter the client bundle.
export function razorpayHandlers() {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  async function call(path: string, body?: unknown) {
    const response = await fetch('https://api.razorpay.com/v1/' + path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: 'Basic ' + Buffer.from(keyId + ':' + secret).toString('base64'), 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw { statusCode: response.status };
    return await response.json() as Record<string, unknown>;
  }
  return paymentHandlers({ keyId, secret, gateway: {
    createOrder: data => call('orders', data),
    getOrder: id => call('orders/' + encodeURIComponent(id)),
    getOrderPayments: id => call('orders/' + encodeURIComponent(id) + '/payments'),
    getPayment: id => call('payments/' + encodeURIComponent(id)),
  } });
}
