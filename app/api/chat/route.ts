import { chatHandler } from '@/lib/server/chat';
import { razorpayHandlers } from '@/lib/server/razorpay';
import { verifyFirebaseUser, signInRequired } from '@/lib/server/firebase-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;
function handler() {
  const value = (name: string) => process.env[name] || '';
  return chatHandler({
    key: value('OPENROUTER_API_KEY'),
    secret: value('CHAT_SESSION_SECRET') || value('RAZORPAY_KEY_SECRET'),
    paidAccess: async request => {
      const response = await razorpayHandlers().status(request);
      if (!response.ok) return null;
      const data = await response.json() as { access: { expiresAt: number } | null };
      return data.access;
    },
  });
}
export async function GET(request: Request) { return handler()(request); }
export async function POST(request: Request) {
  try { await verifyFirebaseUser(request); } catch { return signInRequired(); }
  return handler()(request);
}
