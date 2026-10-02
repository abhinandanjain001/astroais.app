import Link from 'next/link';
import { Orbit, ArrowUpRight } from 'lucide-react';
export function FeatureGuide({title,lead,sections,faq}:{title:string;lead:string;sections:{title:string;text:string}[];faq:{question:string;answer:string}[]}) {
  return <div className="feature-guide wrap">
    <header><Link href="/" className="logo"><Orbit size={26}/> Astrois</Link><Link href="/#demo" className="button glass">Open the app <ArrowUpRight size={16}/></Link></header>
    <main>
      <div className="eyebrow">A LITTLE CLOSER TO YOURSELF</div>
      <h1>{title}</h1><p className="guide-lead">{lead}</p>
      <div className="guide-sections">{sections.map(section=><section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}</div>
      <section className="guide-faq"><h2>Questions you might have</h2>{faq.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <Link className="button primary" href="/#demo">Begin with Astrois <ArrowUpRight size={16}/></Link>
      <p className="details-note">Astrology is a tool for reflection. It cannot guarantee future events or replace professional advice.</p>
    </main>
    <footer><Link href="/birth-chart">Birth charts &amp; kundli</Link><Link href="/astrology-chat">Astrology chat</Link><Link href="/daily-advice">Daily advice &amp; goals</Link><Link href="/#pricing">Pricing</Link></footer>
  </div>;
}
