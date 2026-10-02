"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Orbit,
  Sparkles,
  Moon,
  Heart,
  Clock,
  Check,
  Menu,
  Plus,
  LockKeyhole,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BirthLocation, type Place } from "@/components/birth-location";
import { useRazorpay } from "@/components/use-razorpay";
import { useAuth } from '@/components/auth-provider';
import { DailyGoals } from '@/components/daily-goals';
import { BirthChart } from '@/components/birth-chart';
import type { Kundli } from '@/lib/server/kundli';
import { chatLanguages, type ChatLanguage } from '@/lib/languages';
import { currentPlans, coversPlan, type CurrentPlan } from '@/lib/plans';

const modules = [
  {
    icon: Moon,
    title: "Daily Guidance",
    desc: "A quiet moment to reflect on what matters today.",
    tag: "YOUR DAILY RITUAL",
    detail: "Explore astrology reflections for love, work and personal growth.",
  },
  {
    icon: Heart,
    title: "Love & Relationships",
    desc: "Understand your patterns. Make space for connection.",
    tag: "MATTERS OF THE HEART",
    detail:
      "Ask your astrology guide about connection, communication and relationships.",
  },
  {
    icon: Orbit,
    title: "Your Birth Chart",
    desc: "Your birthplace. Your moment. Your unique story.",
    tag: "YOUR COSMIC BLUEPRINT",
    detail:
      "Begin with your birth date, time and birthplace to prepare your personal profile.",
  },
  {
    icon: Sparkles,
    title: "Your Astrology Guide",
    desc: "Bring your questions. Find a little more clarity.",
    tag: "A CONVERSATION FOR YOU",
    detail:
      "Start a conversation about your life with two minutes of free astrology chat.",
  },
];
export default function Home() {
  const [dailyReading, setDailyReading] = useState<{reply:string; date:string; language:ChatLanguage} | null>(null);
  const [kundli, setKundli] = useState<Kundli | null>(null);
  const [language, setLanguage] = useState<ChatLanguage>('auto');
  const auth = useAuth();
  const payment = useRazorpay();
  const [menu, setMenu] = useState(false),
    [modal, setModal] = useState(""),
    [feature, setFeature] = useState<number | null>(null),
    [q, setQ] = useState(""),
    [messages, setMessages] = useState<{ role: string; text: string }[]>([]),
    [deadline, setDeadline] = useState<number | null>(null),
    [remaining, setRemaining] = useState(120),
    [streaming, setStreaming] = useState(false),
    [chatError, setChatError] = useState(""),
    [chartSummary, setChartSummary] = useState(""),
    [birth, setBirth] = useState(""),
    [profileReady, setProfileReady] = useState(false),
    [firstName, setFirstName] = useState(""),
    [birthTime, setBirthTime] = useState(""),
    [birthplace, setBirthplace] = useState<Place | null>(null),
    [tab, setTab] = useState("matrix");
  const selectedPlan: CurrentPlan = modal === 'monthly' ? 'monthly' : modal === 'daily' ? 'daily' : 'pass';
  const selectedPrice = currentPlans[selectedPlan];
  const alreadyCovered = !!payment.access && coversPlan(payment.access.plan, selectedPlan);
  const requestRef = useRef<AbortController | null>(null),
    chatEnd = useRef<HTMLDivElement>(null);
  const previousUser = useRef<string | null>(null);
  useEffect(() => {
    if (previousUser.current && previousUser.current !== auth.user?.uid) {
      requestRef.current?.abort(); requestRef.current = null;
      setMessages([]); setProfileReady(false); setFirstName(''); setBirth('');
      setKundli(null);
      setDailyReading(null);
      setBirthTime(''); setBirthplace(null); setQ(''); setChartSummary(''); setChatError(''); setStreaming(false);
    }
    previousUser.current = auth.user?.uid || null;
  }, [auth.user?.uid]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/chat', { signal: controller.signal }).then(response => response.json() as Promise<{expiresAt?:number}>).then(data => {
      if (!controller.signal.aborted && typeof data.expiresAt === 'number') setDeadline(data.expiresAt);
    }).catch(() => {});
    return () => {
      controller.abort();
      requestRef.current?.abort();
    };
  }, []);
  useEffect(() => {
    const activeDeadline = payment.access?.expiresAt || deadline;
    if (!activeDeadline) {
      setRemaining(120);
      return;
    }
    const tick = () =>
      setRemaining(
        Math.max(0, Math.ceil((activeDeadline - Date.now()) / 1000)),
      );
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline, payment.access]);
  useEffect(() => {
    if (messages.length) chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);
  useEffect(() => {
    const ctx = (
      document as unknown as {
        modelContext?: { registerTool: (tool: unknown, opts: unknown) => void };
      }
    ).modelContext;
    if (!ctx) return;
    const life = new AbortController();
    try {
      ctx.registerTool(
        {
          name: "navigate_astrois_dashboard",
          description:
            "Open an Astrois dashboard section without starting the timed trial.",
          inputSchema: {
            type: "object",
            properties: {
              section: {
                type: "string",
                enum: ["overview", "matrix", "oracle"],
              },
            },
            required: ["section"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: (input: { section: string }) => {
            if (!["overview", "matrix", "oracle"].includes(input.section))
              throw new Error("Invalid dashboard section");
            const destination = profileReady ? input.section : "matrix";
            setTab(destination);
            document
              .getElementById("demo")
              ?.scrollIntoView({ behavior: "smooth" });
            return { section: destination, status: "opened" };
          },
        },
        { signal: life.signal },
      );
    } catch {}
    return () => life.abort();
  }, [profileReady]);
  function launch(t = "oracle") {
    setTab(profileReady ? t : "matrix");
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
    setMenu(false);
  }
  function invalidateProfile() {
    setProfileReady(false);
    setKundli(null);
    setDailyReading(null);
    setMessages([]);
    requestRef.current?.abort();
    requestRef.current = null;
    setChatError('');
    setChartSummary('');
    setStreaming(false);
  }
  async function startChat() {
    if (auth.loading) return;
    if (!auth.user) { auth.openAccount(); return; }
    if (!firstName.trim() || !birth || !birthTime || !birthplace || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setStreaming(true);
    setChatError("");
    try {
      const response = await fetch("/api/birth-chart", {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.user.getIdToken()}` },
        body: JSON.stringify({
          firstName: firstName.trim(),
          birth,
          birthTime,
          birthplace,
        }),
      });
      const data = (await response.json()) as { error?: string; timezone?: string; natal?: {body:string;sign:string}[]; kundli?: Kundli | null };
      if (controller.signal.aborted) return;
      if (response.status === 401) auth.openAccount();
      if (!response.ok)
        throw new Error(data.error || "We could not calculate your chart.");
      setProfileReady(true);
      setKundli(data.kundli || null);
      setChartSummary(`Tropical chart · ${data.timezone} · ${data.natal?.filter(item => ['Sun','Moon'].includes(item.body)).map(item => `${item.body} in ${item.sign}`).join(' · ')}`);
      setMessages([
        {
          role: "astrois",
          text: `Hi ${firstName.trim()}. Your planetary positions are calculated from the birth details you entered. Tell me what is happening in your life and what you want to understand—I’ll respond in simple, direct language.`,
        },
      ]);
      setQ("");
      setTab("oracle");
    } catch (error) {
      if (controller.signal.aborted) return;
      setChatError(
        error instanceof Error
          ? error.message
          : "We could not calculate your chart.",
      );
    } finally {
      if (requestRef.current === controller) { requestRef.current = null; setStreaming(false); }
    }
  }
  async function ask(value = q, retry = false, daily = false) {
    if (!auth.user) { auth.openAccount(); return; }
    if (!profileReady) {
      launch("matrix");
      return;
    }
    if (!value.trim() || streaming || requestRef.current) return;
    if (!payment.access && remaining <= 0) {
      setModal("upgrade");
      return;
    }
    const question = value.trim();
    if (question.length > 5000) { setChatError('Please keep your question under 5,000 characters.'); return; }
    const controller = new AbortController();
    requestRef.current = controller;
    const history = [
      ...messages.map((message) => ({
        role: message.role === "you" ? "user" : "assistant",
        content: message.text,
      })),
      ...(!retry ? [{ role: "user", content: question }] : []),
    ] as { role: "user" | "assistant"; content: string }[];
    // Keep recent context within request bounds as a conversation grows.
    while (history.length > 25 || JSON.stringify(history).length > 45000) history.shift();
    setQ("");
    setChatError("");
    if (!retry) setMessages((current) => [...current, { role: "you", text: question }]);
    setStreaming(true);
    try {
      const response = await fetch("/api/chat", {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]),
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await auth.user.getIdToken()}` },
        body: JSON.stringify({
          profile: {
            firstName: firstName.trim(),
            birth,
            birthTime,
            birthplace,
          },
          messages: history,
          language,
          mode: daily ? 'daily' : 'chat',
        }),
      });
      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        expiresAt?: number;
        readingDate?: string;
      };
      if (controller.signal.aborted) return;
      if (response.status === 401) auth.openAccount();
      if (response.status === 402) {
        setDeadline(Date.now());
        setRemaining(0);
        setModal("upgrade");
        throw new Error(data.error || "Your free chat time has ended.");
      }
      if (!response.ok || !data.reply)
        throw new Error(
          data.error || "Your guide could not respond. Please try again.",
        );
      if (data.expiresAt && !payment.access) {
        setDeadline(data.expiresAt);
      }
      setMessages((current) => [
        ...current,
        { role: "astrois", text: data.reply! },
      ]);
      if (daily) setDailyReading({reply:data.reply!,date:new Date(`${data.readingDate}T12:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}),language});
    } catch (error) {
      if (controller.signal.aborted) return;
      setChatError(
        error instanceof Error
          ? error.message
          : "Your guide could not respond. Please try again.",
      );
    } finally {
      if (requestRef.current === controller) { requestRef.current = null; setStreaming(false); }
    }
  }
  return (
    <main>
      <header className="header wrap">
        <a className="logo" href="#" aria-label="Astrois home">
          <Orbit className="brand-orbit" size={28} />
          astro<span className="orbital-i">i</span>s
          <span className="logo-app">.app</span>
        </a>
        <nav className={menu ? "nav open" : "nav"}>
          <button onClick={() => launch("overview")}>Daily Guidance</button>
          <button onClick={() => launch("matrix")}>Birth Chart</button>
          <button onClick={() => launch("oracle")}>Ask Astrois</button>
          <a href="#pricing" onClick={() => setMenu(false)}>
            Membership
          </a>
        </nav>
        <button className="button primary small" disabled={auth.loading} onClick={auth.openAccount}>
          {auth.loading ? 'Loading…' : auth.user ? 'My account' : 'Sign in'}
        </button>
        <button
          className="mobile-menu"
          aria-label="Toggle navigation"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <Menu />
        </button>
      </header>
      <section className="hero">
        <div className="hero-art" />
        <div className="hero-shade" />
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <div className="eyebrow-pill">
              <span className="dot" /> YOUR STORY, WRITTEN IN THE STARS{" "}
              <ArrowRight size={13} />
            </div>
            <h1>
              Your personal
              <br />astrology guide.
              <br />
              <em>Clarity for every day.</em>
            </h1>
            <p>
              Explore your personal birth chart and kundli, ask your
              <br className="desktop" /> AI astrology guide about career and relationships,
              and build a daily ritual with free advice and goals.
            </p>
            <div className="hero-actions">
              <button
                className="button primary"
                onClick={() => launch("oracle")}
              >
                <Sparkles size={17} /> Begin Your Free Reading{" "}
                <ArrowUpRight size={16} />
              </button>
              <button className="button glass" onClick={() => launch("matrix")}>
                <Orbit size={17} /> Explore Your Birth Chart
              </button>
            </div>
            <div className="trial-note">
              <Clock size={13} /> Your first 2 minutes are on us <span>·</span>{" "}
              No credit card required
            </div>
          </div>
          <div className="hero-whisper">
            <Moon size={18} />
            <span>
              For the moments you seek
              <br />
              <em>a little more meaning.</em>
            </span>
          </div>
        </div>
      </section>
      <div className="signal-strip">
        <div className="wrap signals">
          <span>
            <Sparkles size={16} /> ASTROLOGY, MADE PERSONAL
          </span>
          <span>
            <Heart size={17} /> Love & relationships
          </span>
          <span>
            <Orbit size={17} /> Your birth story
          </span>
          <span>
            <Moon size={17} /> Space for self-discovery
          </span>
        </div>
      </div>
      <section className="wrap section" id="features">
        <div className="section-top">
          <div>
            <div className="eyebrow">A DEEPER UNDERSTANDING OF YOU</div>
            <h2>
              Your life. <span>Seen in a new light.</span>
            </h2>
          </div>
          <p>
            A little insight for every chapter.
            <br />
            Always with you at the centre.
          </p>
        </div>
        <div className="feature-grid">
          {modules.map((m, i) => (
            <button
              className={"feature-card " + (feature === i ? "selected" : "")}
              key={m.title}
              onClick={() => setFeature(feature === i ? null : i)}
              aria-expanded={feature === i}
            >
              <div className={"feature-icon icon-" + i}>
                <m.icon size={23} />
              </div>
              <span className="feature-number">
                0{i + 1} <ArrowUpRight size={15} />
              </span>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <div className="feature-bottom">
                <span>{m.tag}</span>
                <Plus size={14} />
              </div>
            </button>
          ))}
        </div>
        {feature !== null && (
          <div className="feature-preview">
            <Sparkles size={24} />
            <div>
              <b>{modules[feature].title}</b>
              <p>{modules[feature].detail}</p>
            </div>
            <button
              className="button glass"
              onClick={() =>
                launch(["overview", "oracle", "matrix", "oracle"][feature])
              }
            >
              Open preview <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
      <section className="wrap section demo-section" id="demo">
        <div className="section-top">
          <div>
            <div className="eyebrow">YOUR PERSONAL ASTROLOGY SPACE</div>
            <h2>
              Make space for yourself.
              <br />
              <span>Let the conversation begin.</span>
            </h2>
          </div>
          <div className="demo-note">
            <span className="dot" /> A MOMENT, JUST FOR YOU
          </div>
        </div>
        <div className="dashboard">
          <div className="dash-header">
            <div>
              <Orbit size={20} />
              <b>
                your astrois<span> space</span>
              </b>
            </div>
            <div className="demo-note">
              LIVE AI GUIDANCE <span className="dot" />
            </div>
          </div>
          <div className="onboarding-steps" aria-label="Reading steps">
            <span className={!profileReady ? "current" : "complete"}>
              1 · Your details
            </span>
            <ArrowRight size={14} />
            <span className={profileReady ? "current" : ""}>
              2 · Your conversation
            </span>
          </div>
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(profileReady ? value : "matrix")}
          >
            <div className="dash-toolbar">
              <TabsList className="dash-tabs">
                <TabsTrigger value="overview" disabled={!profileReady}>
                  <Moon size={15} />
                  Daily Guidance
                </TabsTrigger>
                <TabsTrigger value="matrix">
                  <Orbit size={15} />
                  Your Details
                </TabsTrigger>
                <TabsTrigger value="oracle" disabled={!profileReady}>
                  <Sparkles size={15} />
                  Ask Astrois
                </TabsTrigger>
                <TabsTrigger value="chart" disabled={!profileReady}><Orbit size={15}/>My Kundli</TabsTrigger>
              </TabsList>
              <span className="free-badge">
                <Clock size={13} />
                {payment.access && payment.access.plan !== 'pass'
                  ? `${payment.access.plan === 'daily' ? 'Day' : 'Monthly'} pass active`
                  : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} ${payment.access ? "paid" : "free"} chat`}
              </span>
            </div>
            <TabsContent value="overview">
              <div className="daily-reading">
                {profileReady && auth.user && <DailyGoals userId={auth.user.uid} profile={`${birth}|${birthTime}|${birthplace?.latitude}|${birthplace?.longitude}`} name={firstName}/>}
                <div className="daily-heading">
                  <Moon size={30} />
                  <div>
                    <div className="eyebrow">
                      A PAUSE. A BREATH. A FRESH PERSPECTIVE.
                    </div>
                    <h3>Come back to what matters.</h3>
                    <p>
                      Your birth chart, today’s planetary positions, and one useful step for your day.
                    </p>
                  </div>
                </div>
                <label className="chat-language">Daily reading language<select value={language} disabled={streaming} onChange={event=>setLanguage(event.target.value as ChatLanguage)}>{chatLanguages.map(item=><option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
                <button className="button primary" disabled={streaming} onClick={()=>ask('Give me my personal daily astrology guidance for today, using the calculatedAt date and timezone in my chart. Use my natal chart and supplied current planetary positions. Explain one relevant current-to-natal aspect only if you can calculate it from the supplied longitudes; do not invent it. Include a useful focus for work, a relationship or communication suggestion, and one small action for today. Keep it specific to my chart and simple. Do not make guaranteed predictions or invent auspicious times.',false,true)}>
                  <Sparkles size={16}/>{streaming?'Preparing today’s reading…':dailyReading?'Refresh today’s guidance':'Explore today with your AI guide'}
                </button>
                <p className="details-note">Uses your chat access. Your free two minutes begin with the first successful reading or chat reply.</p>
                {dailyReading && <article className="daily-personal-reading"><div className="eyebrow">{dailyReading.date} · {chatLanguages.find(item=>item.code===dailyReading.language)?.label}</div><p dir="auto">{dailyReading.reply}</p></article>}
              </div>
            </TabsContent>
            <TabsContent
              value="matrix"
              forceMount
              className="data-[state=inactive]:hidden"
            >
              <div className="matrix-form">
                <div>
                  <div className="eyebrow">FIRST, A LITTLE ABOUT YOU</div>
                  <h3>Let’s start with your details.</h3>
                  <p>
                    Tell us when and where you were born. Then we’ll open your
                    chat.
                    <br />
                    Take your time—your free two minutes start with your first
                    successful reply.
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    startChat();
                  }}
                >
                  <label>
                    First name
                    <input
                      required
                      autoComplete="given-name"
                      maxLength={60}
                      value={firstName}
                      placeholder="What should we call you?"
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        invalidateProfile();
                      }}
                    />
                  </label>
                  <label>
                    Birth date
                    <input
                      required
                      type="date"
                      value={birth}
                      onInput={(e) => { setBirth(e.currentTarget.value); invalidateProfile(); }}
                      onChange={(e) => {
                        setBirth(e.target.value);
                        invalidateProfile();
                      }}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </label>
                  <label>
                    Birth time
                    <input
                      required
                      type="time"
                      value={birthTime}
                      onInput={(e) => { setBirthTime(e.currentTarget.value); invalidateProfile(); }}
                      onChange={(e) => {
                        setBirthTime(e.target.value);
                        invalidateProfile();
                      }}
                    />
                    <small className="birth-time-help">
                      Use the local time shown on your birth record.
                    </small>
                  </label>
                  <BirthLocation
                    onChange={(place) => {
                      setBirthplace(place);
                      invalidateProfile();
                    }}
                  />
                  <label className="language-field">Reply language
                    <select value={language} onChange={event=>setLanguage(event.target.value as ChatLanguage)}>
                      {chatLanguages.map(item=><option key={item.code} value={item.code}>{item.label}</option>)}
                    </select>
                    <small>You can ask in any language. Choose how your guide replies.</small>
                  </label>
                  <button
                    className="button primary"
                    type="submit"
                    disabled={
                      streaming || !birthplace || !birth || !birthTime || !firstName.trim()
                    }
                  >
                    {streaming ? 'Calculating your chart…' : 'Save details & start chat'} <ArrowRight size={16} />
                  </button>
                </form>
                {chatError && <p className="details-note" role="alert">{chatError}</p>}
                <p className="details-note">
                  We calculate planetary positions and a personal sidereal kundli from your birth details.
                  To answer your questions, your first name, chart and messages are sent
                  through OpenRouter to an AI provider. Astrology cannot guarantee future events.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="chart">{profileReady && <BirthChart chart={kundli} name={firstName.trim()} birth={birth} birthTime={birthTime} place={birthplace?.name || ''}/>}</TabsContent>
            <TabsContent value="oracle">
              <div className="oracle-intro">
                <Sparkles size={28} />
                <h3>Welcome, {firstName.trim()}.</h3>
                {chartSummary && <p className="details-note">{chartSummary}</p>}
                <p>
                  Simple words. Practical next steps. Ask what’s on your mind.
                </p>
                <button
                  className="button glass"
                  onClick={() => setTab('chart')}
                >View my kundli</button>
                <button
                  className="button glass"
                  onClick={() => launch("matrix")}
                >
                  Edit my details
                </button>
              </div>
            </TabsContent>
          </Tabs>
          {profileReady && (tab === 'oracle' || tab === 'overview') && (
            <div className="chat-area">
              <label className="chat-language">Reply language
                <select value={language} disabled={streaming} onChange={event=>setLanguage(event.target.value as ChatLanguage)}>
                  {chatLanguages.map(item=><option key={item.code} value={item.code}>{item.label}</option>)}
                </select>
                <small>Ask in any language. This choice applies to your next reply.</small>
              </label>
              <div className="oracle-label">
                <Sparkles size={16} />
                <b>Your Astrois Guide</b>
                <span>CALCULATED CHART · LIVE AI</span>
              </div>
              {messages.length === 0 ? (
                <div className="welcome">
                  <p>What is on your mind today? Let’s explore it together.</p>
                  <div className="suggestions">
                    {[
                      "What’s ahead for my career?",
                      "Explore my relationships",
                      "How can I focus on personal growth?",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setTab("oracle");
                          ask(s);
                        }}
                      >
                        {s}
                        <ArrowUpRight size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="messages" aria-live="polite" aria-busy={streaming}>
                  {messages.map((m, i) => (
                    <div key={i} className={"message " + m.role}>
                      <b>{m.role === "you" ? "You" : "✧ Astrois"}</b>
                      <p dir="auto">{m.text}</p>
                    </div>
                  ))}
                  <div ref={chatEnd} />
                  {streaming && <p role="status">Your guide is considering your question…</p>}
                </div>
              )}
              {chatError && (
                <div className="notice" role="alert">
                  {chatError}
                  <button type="button" disabled={streaming} onClick={() => ask(messages.at(-1)?.text || q, messages.at(-1)?.role === 'you')}>Try again</button>
                </div>
              )}
              {payment.access || remaining > 0 ? (
                <form
                  className="ask-input"
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask();
                  }}
                >
                  <Sparkles size={19} />
                  <input
                    aria-label="Ask Astrois anything"
                    placeholder="Ask Astrois anything…"
                    value={q}
                    maxLength={5000}
                    onChange={(e) => setQ(e.target.value)}
                    disabled={streaming}
                  />
                  <span className="input-hint">
                    {streaming ? "REFLECTING…" : "PRESS ENTER"}
                  </span>
                  <button
                    disabled={streaming || !q.trim()}
                    aria-label="Send question"
                  >
                    <ArrowRight size={19} />
                  </button>
                </form>
              ) : (
                <div className="trial-ended">
                  <LockKeyhole size={20} />
                  <div>
                    <b>Your chat time is complete.</b>
                    <p>Continue for ₹5 — five more minutes of chat.</p>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => setModal("upgrade")}
                  >
                    Continue for ₹5 <ArrowUpRight size={16} />
                  </button>
                </div>
              )}
              <div className="chat-footer">
                <span>
                  <LockKeyhole size={11} /> No card required. No automatic
                  charges.
                </span>
                <span>Planetary positions are calculated. Astrology interpretations are not guaranteed predictions.</span>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="wrap section pricing-section" id="pricing">
        <div className="center">
          <div className="eyebrow">CONTINUE YOUR JOURNEY</div>
          <h2>A little guidance. On your terms.</h2>
          <p>Begin with two minutes free. Stay for as long as you need.</p>
        </div>
        <div className="pricing-grid">
          {[
            {
              name: "First Connection",
              label: "A little space to find your bearings.",
              price: "₹0",
              period: "your first 2 minutes",
              items: [
                "2 minutes of astrology chat",
                "Personal daily AI guidance",
                "Create your birth profile",
              ],
              cta: "Begin for free",
              plan: null,
              icon: Moon,
            },
            {
              name: "A Little More Clarity",
              label: "For the questions still on your mind.",
              price: "₹5",
              period: "/ 5-minute chat pass",
              items: [
                "5 additional minutes of chat",
                "Love, work & personal growth",
                "One-time payment, no renewal",
              ],
              cta: "Continue for ₹5",
              plan: 'pass',
              icon: Sparkles,
            },
            {
              name: "Astrois Day Pass",
              label: "Make self-discovery a daily ritual.",
              price: "₹199",
              period: "/ 24 hours",
              items: [
                "AI conversations, subject to availability",
                "Love, work & personal growth",
                "24 hours of access on this browser",
                "Personal daily AI guidance",
                "One-time payment, no renewal",
              ],
              cta: "Get a day for ₹199",
              plan: 'daily',
              icon: Orbit,
            },
            {
              name: 'Astrois Monthly', label: 'A full month of personal guidance.',
              price: '₹1,999', period: '/ 30 days', plan: 'monthly',
              items: ['AI conversations, subject to availability', 'Personal daily AI guidance', '30 days of access on this browser', 'One-time payment, no renewal'],
              cta: 'Get 30 days for ₹1,999', icon: Sparkles,
            },
          ].map((p, i) => (
            <article
              key={p.name}
              className={"price-card " + (i === 2 ? "featured" : "")}
            >
              {i === 2 && <span className="popular">THE FULL EXPERIENCE</span>}
              <p.icon size={24} />
              <h3>{p.name}</h3>
              <p>{p.label}</p>
              <div className="price">
                {p.price}
                <span>{p.period}</span>
              </div>
              <button
                className={"button " + (i === 2 ? "primary" : "glass")}
                onClick={() =>
                  i === 0
                    ? launch("oracle")
                    : setModal(p.plan === 'pass' ? 'upgrade' : p.plan!)
                }
              >
                {p.cta}
                <ArrowUpRight size={15} />
              </button>
              <ul>
                {p.items.map((item) => (
                  <li key={item}>
                    <Check size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="price-note">
          Prices in INR. One-time passes, no automatic renewal.{" "}
          {payment.testMode
            ? "Test checkout is enabled; no real money is charged."
            : "Secure checkout with Razorpay."}{" "}
          Planetary positions are calculated from your birth details; astrology
          interpretations cannot guarantee future events.
        </p>
      </section>
      <footer className="wrap footer">
        <a className="logo" href="#">
          <Orbit size={24} />
          astrois<span className="logo-app">.app</span>
        </a>
        <nav className="seo-footer-links" aria-label="Explore Astrois"><a href="/birth-chart">Birth charts &amp; kundli</a><a href="/astrology-chat">AI astrology chat</a><a href="/daily-advice">Free daily advice</a></nav>
        <span>© {new Date().getFullYear()} Astrois</span>
        <button onClick={() => setModal("about")}>
          About the experience <ArrowUpRight size={12} />
        </button>
      </footer>
      {payment.message && (
        <aside
          className="payment-status"
          role="status"
          aria-live="polite"
          aria-busy={payment.busy}
        >
          <LockKeyhole size={18} />
          <div>
            <p>{payment.message}</p>
            {payment.pending && (
              <button
                className="button glass small"
                disabled={payment.busy}
                onClick={payment.retry}
              >
                Check payment again
              </button>
            )}
            {payment.pending && !payment.busy && (
              <button className="button glass small" onClick={payment.dismissPending}>I cancelled without paying</button>
            )}
          </div>
        </aside>
      )}
      <Dialog
        open={!!modal}
        onOpenChange={(open) => {
          if (!open) setModal("");
        }}
      >
        <DialogContent className="astro-modal">
          <div className="modal-icon">
            <Moon />
          </div>
          <DialogTitle>
            {modal === "about"
              ? "Your space for self-discovery"
              : modal === 'daily' || modal === 'monthly'
                ? selectedPrice.title
                : "A little more clarity"}
          </DialogTitle>
          <DialogDescription>
            {modal === "about"
              ? "Astrology, reflection, and the questions that matter to you."
              : "Continue your conversation with your personal astrology guide."}
          </DialogDescription>
          {modal === "about" ? (
            <p>
              Astrois calculates tropical planetary positions from the birth
              details you enter and uses live AI for the conversation. Astrology
              interpretations cannot guarantee future events. Paid access is
              limited to this browser.
            </p>
          ) : (
            <>
              <div className="modal-price">
                {selectedPrice.price}{" "}
                <span>
                  {selectedPrice.period}
                </span>
              </div>
              <p>
                {selectedPlan !== 'pass'
                  ? `AI conversations and personal daily guidance for ${selectedPlan === 'daily' ? '24 hours' : '30 days'} on this browser, subject to availability. A one-time payment with no automatic renewal.`
                  : "Five more minutes to explore love, purpose, and your next chapter. A one-time pass with no renewal."}
              </p>
              <div className="notice">
                <LockKeyhole size={18} />
                {payment.testMode
                  ? "Razorpay test mode. No real money will be charged."
                  : "Secure payment with Razorpay. No automatic renewal."}{" "}
                Your pass starts when payment completes.
              </div>
              <p className="details-note">
                This pass unlocks live AI guidance based on calculated planetary
                positions. Future events are not guaranteed.
              </p>
              <button
                className="button primary"
                disabled={
                  payment.busy ||
                  !payment.loaded ||
                  !!payment.pending ||
                  alreadyCovered
                }
                onClick={() => {
                  void payment.start(
                    selectedPlan,
                    () => setModal(""),
                  );
                }}
              >
                {payment.busy
                  ? "Preparing checkout…"
                  : alreadyCovered
                    ? "Pass already active"
                    : `Pay ${selectedPrice.price} securely`}{" "}
                <ArrowRight size={16} />
              </button>
              {payment.message && <p role="status">{payment.message}</p>}
              {payment.pending && (
                <button
                  className="button glass"
                  disabled={payment.busy}
                  onClick={payment.retry}
                >
                  Check payment again
                </button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
