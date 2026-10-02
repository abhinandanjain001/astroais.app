'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, Sun } from 'lucide-react';

const suggestions = {
  Work: [
    ['Make room for progress.', 'Choose one task that moves your work forward. Start small and finish it before taking on something new.', ['Spend 20 minutes on your most important task', 'Send one application, follow-up, or useful work message', 'Write down tomorrow’s first step']],
    ['Build confidence through practice.', 'Today, focus on something you can improve rather than an outcome you cannot control.', ['Practice one useful skill for 15 minutes', 'Improve one section of your CV or current project', 'Record one thing you learned']],
    ['Clear the distractions.', 'A simpler plan can help you feel less overwhelmed. Give your attention to one achievable priority.', ['Choose your top priority for today', 'Work without notifications for 20 minutes', 'Ask for help with one thing that is blocking you']],
  ],
  Relationships: [
    ['Create space for connection.', 'A thoughtful conversation is a useful step today. Listen before deciding what the other person means.', ['Check in with someone you care about', 'Listen for five minutes without interrupting', 'Say one specific thing you appreciate']],
    ['Speak with kindness and clarity.', 'If something is on your mind, explain how you feel calmly. You do not need to solve everything in one conversation.', ['Write down what you want to communicate', 'Send a kind, honest message', 'Make time for a shared activity']],
    ['Respect your own pace.', 'Connection grows through small, consistent actions. Choose one comfortable step instead of putting pressure on yourself.', ['Reach out to one trusted person', 'Set one respectful boundary if needed', 'Make a small plan to spend time together']],
  ],
  Wellbeing: [
    ['Give yourself a gentler start.', 'Notice what you need today. A little rest and a manageable plan can make the day feel easier.', ['Take a short screen-free break', 'Go outside or stretch comfortably for five minutes', 'Write down one thing you are grateful for']],
    ['Protect a moment of calm.', 'Pause before rushing into the next task. Choose one simple action that helps you feel grounded.', ['Take five slow, comfortable breaths', 'Set aside ten minutes for something you enjoy', 'Plan a consistent bedtime']],
    ['Make the day manageable.', 'You do not have to do everything today. Choose a realistic goal and recognise your effort.', ['Choose one achievable personal goal', 'Take a break between demanding tasks', 'Write down one small win this evening']],
  ],
} as const;
type Focus = keyof typeof suggestions;
export function dailyIndex(profile: string, date: string) {
  return Array.from(profile + date).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0) % 3;
}
function localDay() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function DailyGoals({ userId, profile, name }: {userId: string; profile: string; name: string}) {
  const [day, setDay] = useState('');
  const [focus, setFocus] = useState<Focus>('Work');
  const [done, setDone] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [loadedKey, setLoadedKey] = useState('');
  const key = `astrois-daily-v1:${userId}:${profile}:${day}`;
  useEffect(() => { setDay(localDay()); const timer=setInterval(()=>setDay(localDay()),30000); return ()=>clearInterval(timer); }, []);
  useEffect(() => {
    if (!day) return;
    setDone([]); setCustom([]); setFocus('Work'); setDraft('');
    try { const saved=JSON.parse(localStorage.getItem(key)||'null'); if(saved){setDone(Array.isArray(saved.done)?saved.done.filter((x:unknown)=>typeof x==='string'):[]);setCustom(Array.isArray(saved.custom)?saved.custom.filter((x:unknown)=>typeof x==='string').slice(0,10):[]); if(saved.focus in suggestions)setFocus(saved.focus);} } catch {}
    setLoadedKey(key);
  }, [key, day]);
  useEffect(() => {if(day && loadedKey===key)try{localStorage.setItem(key,JSON.stringify({done,custom,focus}));}catch{}}, [done,custom,focus,day,key,loadedKey]);
  if (!day || loadedKey!==key) return <p>Preparing your free daily goals…</p>;
  const [title, advice, goals] = suggestions[focus][dailyIndex(profile,day)];
  const all=[...goals,...custom]; const completed=all.filter(goal=>done.includes(goal)).length;
  return <section className="free-daily-goals" aria-label="Free daily advice and goals">
    <div className="eyebrow"><Sun size={16}/> FREE EVERY DAY · {new Date(day+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric'})}</div>
    <h3>{name ? `${name}, ` : ''}{title.charAt(0).toLowerCase()+title.slice(1)}</h3>
    <label className="chat-language">Your focus today<select value={focus} onChange={event=>setFocus(event.target.value as Focus)}>{Object.keys(suggestions).map(item=><option key={item}>{item}</option>)}</select></label>
    <p>{advice}</p>
    <div className="goal-progress"><span>{completed} of {all.length} goals complete</span><progress value={completed} max={all.length}/></div>
    <div className="daily-goal-list">{all.map(goal=><label key={goal}><input type="checkbox" checked={done.includes(goal)} onChange={()=>setDone(previous=>previous.includes(goal)?previous.filter(item=>item!==goal):[...previous,goal])}/><span>{goal}</span>{done.includes(goal)&&<CheckCircle2 size={18}/>}</label>)}</div>
    <form onSubmit={event=>{event.preventDefault();const goal=draft.trim();if(goal && custom.length<10 && !all.includes(goal)){setCustom(previous=>[...previous,goal]);setDraft('');}}} className="daily-goal-form"><input aria-label="Your own daily goal" placeholder="Add your own small goal…" value={draft} maxLength={120} onChange={event=>setDraft(event.target.value)}/><button className="button glass" disabled={!draft.trim()||custom.length>=10}>Add goal</button></form>
    <p className="details-note">Free practical reflections, refreshed each day. Saved on this browser for your profile. These suggestions are not predictions; explore your personal chart with the AI guide below.</p>
  </section>;
}
