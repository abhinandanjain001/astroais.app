type Feature = { properties: { name?: string; country?: string; countrycode?: string; state?: string; county?: string; type?: string; osm_type?: string; osm_id?: number; extra?: { admin_level?: string } }; geometry: { coordinates: number[] } };
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = (params.get('q') || '').trim();
  const kind = params.get('kind') || '';
  const country = params.get('country') || '';
  const state = params.get('state') || '';
  if (!['country', 'state', 'district'].includes(kind) || q.length < 2 || q.length > 100 || state.length > 100 || (kind !== 'country' && !/^[A-Z]{2}$/.test(country)) || (kind === 'district' && !state)) {
    return Response.json({ error: 'Enter at least two letters and select the country and state first.' }, { status: 400 });
  }
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', kind === 'district' ? `${q}, ${state}` : q);
  url.searchParams.set('limit', '12');
  url.searchParams.set('lang', 'en');
  url.searchParams.append('layer', kind === 'district' ? 'county' : kind);
  if (kind !== 'country') url.searchParams.set('countrycode', country);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Place search unavailable');
    const data = await response.json() as { features: Feature[] };
    const seen = new Set<string>();
    const results = data.features.filter(f => kind !== 'district' || (f.properties.state?.toLowerCase() === state.toLowerCase() && (country !== 'IN' || f.properties.extra?.admin_level === '5'))).flatMap(f => {
      const p = f.properties;
      const label = p.name || '';
      const key = [label, p.state, p.countrycode].join('|');
      if (!label || seen.has(key) || !p.countrycode) return [];
      seen.add(key);
      return [{ id: `${p.osm_type}${p.osm_id}`, name: label, country: p.country || label, countryCode: p.countrycode, state: p.state || (kind === 'state' ? label : ''), latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] }];
    });
    return Response.json({ results }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
  } catch {
    return Response.json({ error: 'Place search is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
