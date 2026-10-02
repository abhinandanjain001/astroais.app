import { Body, Ecliptic, GeoVector } from 'astronomy-engine';
import { DateTime } from 'luxon';
import tzlookup from 'tz-lookup';
import { z } from 'zod';
import { calculateKundli } from './kundli.ts';

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  birthplace: z.object({ name: z.string().max(200), country: z.string().max(100), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }),
});

const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const bodies = [Body.Sun, Body.Moon, Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn];

function positions(date: Date) {
  return bodies.map(body => {
    const longitude = (Ecliptic(GeoVector(body, date, true)).elon + 360) % 360;
    return { body, sign: signs[Math.floor(longitude / 30)], degree: Number((longitude % 30).toFixed(2)), longitude: Number(longitude.toFixed(4)) };
  });
}

/** Weekly astronomical samples; symbolic astrology indicators, not event forecasts. */
export function calculateTimingWindows(natal: ReturnType<typeof positions>, now: Date) {
  const candidates: { topic: string; start: string; end: string; factors: string[] }[] = [];
  for (let week = 0; week < 52; week++) {
    const date = new Date(now.getTime() + week * 7 * 86400000);
    const transits = positions(date).filter(p => p.body === Body.Jupiter || p.body === Body.Saturn);
    for (const topic of ['career', 'relationships']) {
      const targets = topic === 'career' ? [Body.Sun, Body.Mercury] : [Body.Venus, Body.Moon];
      const factors: string[] = [];
      for (const transit of transits) for (const birth of natal.filter(p => targets.includes(p.body))) {
        const separation = Math.abs(transit.longitude - birth.longitude);
        const angle = Math.min(separation, 360 - separation);
        for (const [aspect, degrees] of [['conjunction', 0], ['sextile', 60], ['trine', 120]] as const) {
          if (Math.abs(angle - degrees) <= 2) factors.push(`${transit.body} ${aspect} natal ${birth.body} (orb ${Math.abs(angle - degrees).toFixed(1)}°)`);
        }
      }
      if (factors.length) candidates.push({ topic, start: date.toISOString().slice(0, 10), end: new Date(date.getTime() + 6 * 86400000).toISOString().slice(0, 10), factors });
    }
  }
  // Merge adjacent samples with the same indicators into honest broad ranges.
  const windows: typeof candidates = [];
  for (const topic of ['career', 'relationships']) for (const candidate of candidates.filter(c => c.topic === topic)) {
    const previous = windows.at(-1);
    if (previous?.topic === topic && previous.factors.join('|') === candidate.factors.join('|') && Date.parse(candidate.start) - Date.parse(previous.end) <= 86400000) previous.end = candidate.end;
    else windows.push({ ...candidate });
  }
  return { sampling: 'Weekly over the next 52 weeks; 2-degree orb; tropical geocentric aspects only', windows,
    interpretation: 'Jupiter traditionally symbolizes growth and opportunities; Saturn commitment and sustained effort. Windows are symbolic periods to explore, not evidence that a job, partner or marriage will occur. No houses or dashas calculated. Absence of an indicator does not mean an event cannot happen.' };
}

export function calculateChart(input: unknown, now = new Date()) {
  const profile = profileSchema.parse(input);
  const timezone = tzlookup(profile.birthplace.latitude, profile.birthplace.longitude);
  const local = `${profile.birth}T${profile.birthTime}`;
  const time = DateTime.fromISO(local, { zone: timezone });
  if (!time.isValid || time.toFormat("yyyy-MM-dd'T'HH:mm") !== local || time.year < 1900 || time.toMillis() > now.getTime()) throw new Error('Invalid birth date');
  if (time.getPossibleOffsets().length > 1) throw new Error('Ambiguous daylight-saving time');
  const natal = positions(time.toJSDate());
  return {
    method: 'Tropical zodiac · geocentric planetary positions · Astronomy Engine',
    timezone,
    birthUtc: time.toUTC().toISO(),
    calculatedAt: now.toISOString(),
    natal,
    kundli: calculateKundli(natal, time.toJSDate(), profile.birthplace.latitude, profile.birthplace.longitude),
    current: positions(now),
    timing: calculateTimingWindows(natal, now),
    limitations: 'Timezone is inferred from the selected district. These are tropical positions, not a Vedic kundli. Houses, ascendant, dashas and exact future-event dates are not calculated. Astrology interpretations are uncertain, not verified predictions.',
  };
}
