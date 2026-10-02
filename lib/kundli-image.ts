import type { Kundli } from './server/kundli';

const cells = [[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[2,3],[1,3],[0,3],[0,2],[0,1],[0,0]];
const shortNames: Record<string,string> = { Sun: 'Su', Moon: 'Mo', Mercury: 'Me', Venus: 'Ve', Mars: 'Ma', Jupiter: 'Ju', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[character]!));

export function kundliSvg(chart: Kundli, name: string, birth: string, birthTime: string, place: string) {
  const text = (x:number,y:number,value:string,size=14,color='#ead6b2') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${escape(value)}</text>`;
  const boxes = cells.map(([column,row], signIndex) => {
    const x=32+column*144, y=136+row*144;
    const house=chart.houses.find(h=>h.signIndex===signIndex)!;
    const planets=chart.planets.filter(p=>p.signIndex===signIndex);
    const isAsc=chart.ascendant.signIndex===signIndex;
    const lineHeight=Math.min(20,88/Math.max(1,planets.length));
    return `<rect x="${x}" y="${y}" width="144" height="144" fill="${isAsc?'#392938':'#211828'}" stroke="#b39564" stroke-opacity=".55"/>` +
      text(x+12,y+22,house.sign,14) + text(x+12,y+41,`House ${house.house}${isAsc?' · Asc':''}`,11,'#c1aec8') +
      planets.map((p,i)=>text(x+12,y+62+i*lineHeight,`${shortNames[p.body]} ${p.degree.toFixed(1)}°`,Math.min(14,lineHeight),'#f6ead7')).join('');
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="792" viewBox="0 0 640 792" role="img" aria-label="Personal sidereal birth chart" font-family="Arial, sans-serif">
    <rect width="640" height="792" rx="20" fill="#17121f"/>
    ${text(32,42,'ASTROIS · YOUR BIRTH CHART',12)}${text(32,78,`${name.slice(0,36)}’s kundli`,26)}
    ${text(32,104,`${birth} · ${birthTime} · ${place.slice(0,46)}`,12,'#c1aec8')}
    ${boxes}
    ${text(221,371,'SIDEREAL D1',21)}${text(221,405,`Ascendant: ${chart.ascendant.sign}`,14)}
    ${text(221,430,`${chart.ascendant.degree.toFixed(1)}° · whole-sign houses`,12,'#c1aec8')}
    ${text(221,460,'South Indian chart',12,'#c1aec8')}
    ${text(32,738,'Approximate Lahiri ayanamsa · mean Rahu/Ketu · birth time sensitive',11,'#c1aec8')}
    ${text(32,762,'Su Sun · Mo Moon · Me Mercury · Ve Venus · Ma Mars · Ju Jupiter · Sa Saturn',10,'#c1aec8')}
  </svg>`;
}
