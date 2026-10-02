import { calculateChart } from '@/lib/server/chart';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Please use the Astrois website.' }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 4096) return Response.json({ error: 'Birth profile is too large.' }, { status: 413 });
  try {
    return Response.json(calculateChart(JSON.parse(raw)), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Check your birth details. Use a date from 1900 to today and a valid local birth time.' }, { status: 400 });
  }
}
