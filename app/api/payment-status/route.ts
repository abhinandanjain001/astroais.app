import { razorpayHandlers } from '@/lib/server/razorpay';
export async function GET(request: Request) { return razorpayHandlers().status(request); }
