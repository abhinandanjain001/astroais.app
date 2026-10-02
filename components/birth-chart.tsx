'use client';

import { useState } from 'react';
import { Download, Orbit } from 'lucide-react';
import type { Kundli } from '@/lib/server/kundli';
import { kundliSvg } from '@/lib/kundli-image';

export function BirthChart({ chart, name, birth, birthTime, place }: { chart: Kundli | null; name:string; birth:string; birthTime:string; place:string }) {
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  if (!chart) return <div className="kundli-panel"><h3>Your birth chart</h3><p>This kundli view is unavailable for polar birthplaces. Your calculated planetary positions remain available for chat.</p></div>;
  const svg = kundliSvg(chart,name,birth,birthTime,place);
  async function download() {
    setSaving(true); setError('');
    let url = '';
    try {
      url = URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width=1280;canvas.height=1584;
      const context=canvas.getContext('2d');
      if (!context) throw new Error();
      context.drawImage(image,0,0,canvas.width,canvas.height);
      const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error()),'image/png'));
      const downloadUrl=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=downloadUrl;link.download='astrois-birth-chart.png';link.click();
      setTimeout(()=>URL.revokeObjectURL(downloadUrl),10000);
    } catch { setError('The image could not be saved. Please try again.'); }
    finally { if(url)URL.revokeObjectURL(url);setSaving(false); }
  }
  return <section className="kundli-panel" aria-labelledby="kundli-title">
    <div className="kundli-heading"><div><div className="eyebrow">YOUR COSMIC BLUEPRINT</div><h3 id="kundli-title"><Orbit size={22} aria-hidden="true"/>Your personal kundli</h3></div>
      <button className="button glass" onClick={download} disabled={saving}><Download size={16} aria-hidden="true"/>{saving?'Preparing image…':'Download PNG'}</button>
    </div>
    <div className="kundli-layout">
      {/* Inline SVG data image is generated locally from this user's calculated positions. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="kundli-image" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`${name}'s South Indian sidereal birth chart. Ascendant ${chart.ascendant.sign}. Planet positions are listed alongside.`} width={640} height={792}/>
      <div className="kundli-positions"><p><strong>Ascendant · {chart.ascendant.sign}</strong><br/>The sign rising at your birth, based on your time and location.</p>
        <table><caption>Planet positions at your birth</caption><thead><tr><th>Planet</th><th>Sign</th><th>House</th></tr></thead><tbody>{chart.planets.map(planet=><tr key={planet.body}><th scope="row">{planet.body}</th><td>{planet.sign}<small>{planet.degree.toFixed(1)}°</small></td><td>{planet.house}</td></tr>)}</tbody></table>
        <details><summary>How your kundli is calculated</summary><p>{chart.method}.</p><p>{chart.limitations}</p></details>
      </div>
    </div>
    {error&&<p role="alert">{error}</p>}
    <p className="details-note">Made from your birth date, local birth time and selected birthplace. A different birth time or place can change the chart. Approximate Lahiri conversion; verify boundary placements with specialist software.</p>
  </section>;
}
