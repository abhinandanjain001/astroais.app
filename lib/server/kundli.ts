import { SiderealTime, MakeTime, e_tilt } from 'astronomy-engine';

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const normalize = (angle: number) => ((angle % 360) + 360) % 360;
const radians = Math.PI / 180;
const signPosition = (longitude: number) => ({ longitude: Number(normalize(longitude).toFixed(4)), sign: signs[Math.floor(normalize(longitude) / 30)], signIndex: Math.floor(normalize(longitude) / 30), degree: Number((normalize(longitude) % 30).toFixed(2)) });

export function calculateKundli(natal: {body: string; longitude: number}[], date: Date, latitude: number, longitude: number) {
  const time = MakeTime(date);
  const centuries = time.tt / 36525;
  // Lahiri J2000 reference 23°51′25.5324″; approximate IAU precession in longitude.
  // Reference: https://www.astro.com/swisseph/swisseph.htm
  const ayanamsa = 23 + 51 / 60 + 25.5324 / 3600 + (5028.796195 * centuries + 1.1054348 * centuries ** 2) / 3600;
  const theta = (SiderealTime(date) * 15 + longitude) * radians;
  const obliquity = e_tilt(time).tobl * radians;
  // Eastern ecliptic/horizon intersection. Polar latitudes need a specialist model.
  if (Math.abs(latitude) >= 66) return null;
  const ascendant = signPosition(Math.atan2(-Math.cos(theta), Math.sin(theta) * Math.cos(obliquity) + Math.tan(latitude * radians) * Math.sin(obliquity)) / radians + 180 - ayanamsa);
  const meanNode = normalize(125.04452 - 1934.136261 * centuries + 0.0020708 * centuries ** 2 + centuries ** 3 / 450000);
  const planets = [
    ...natal.map(planet => ({ body: planet.body, ...signPosition(planet.longitude - ayanamsa) })),
    { body: 'Rahu', ...signPosition(meanNode - ayanamsa) },
    { body: 'Ketu', ...signPosition(meanNode + 180 - ayanamsa) },
  ].map(planet => ({ ...planet, house: ((planet.signIndex - ascendant.signIndex + 12) % 12) + 1 }));
  return {
    method: 'Sidereal D1 · approximate Lahiri ayanamsa · whole-sign houses · mean lunar nodes',
    ayanamsa: Number(ayanamsa.toFixed(4)), ascendant, planets,
    houses: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, signIndex: (ascendant.signIndex + index) % 12, sign: signs[(ascendant.signIndex + index) % 12] })),
    limitations: 'Approximate Lahiri conversion, not Swiss Ephemeris. Sign and house boundaries can differ from specialist kundli software. District coordinates and recorded birth time affect the ascendant. No divisional charts or dashas are calculated.',
  };
}
export type Kundli = NonNullable<ReturnType<typeof calculateKundli>>;
