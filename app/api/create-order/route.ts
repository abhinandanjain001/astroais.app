import { razorpayHandlers } from '@/lib/server/razorpay';
export async function POST(request: Request) { return razorpayHandlers().create(request); }
