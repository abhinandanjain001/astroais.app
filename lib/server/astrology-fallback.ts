import type { calculateChart } from './chart.ts';

type Chart = ReturnType<typeof calculateChart>;
type Message = { role: string; content: string };
type Topic = 'career' | 'relationships' | 'wellbeing' | 'money' | 'general';
const topics: [Topic, RegExp][] = [
  ['career', /job|career|work|business|promotion|interview|naukri|kaam|नौकरी|करियर|काम|চাকরি|কাজ|வேலை|ఉద్యోగ|ಉದ್ಯೋಗ|ജോലി|نوکری|وظيفة|emploi|travail|trabajo/iu],
  ['relationships', /marri|marry|love|relationship|partner|crush|shaadi|shadi|pyaar|rishta|शादी|विवाह|प्यार|साथी|বিয়ে|বিয়ে|திருமண|ప్రేమ|ಮದುವೆ|വിവാഹ|شادی|زواج|mariage|pareja/iu],
  ['money', /money|saving|finance|invest|debt|paisa|पैस|धन|निवेश|টাকা|பணம்|డబ్బు|ಹಣ|پیس|مال|argent|dinero/iu],
  ['wellbeing', /stress|anxious|worry|overwhelm|sad|health|\bill\b|tension|तनाव|चिंता|स्वास्थ्य|স্বাস্থ্য|صحت|salud|santé/iu],
];
const actions: Record<Topic, string> = {
  career: 'For today, improve one part of your CV or project, then send one application or follow-up. Are you looking for a first job, a change, or a promotion?',
  relationships: 'Choose one honest, low-pressure conversation. If you want to meet someone, make space for a shared activity rather than rushing a commitment.',
  money: 'Review your essential expenses and one spending habit. A chart cannot determine investment returns; use actual figures when making financial decisions.',
  wellbeing: 'Take a short break and speak with someone you trust about what is weighing on you. For health symptoms, seek a qualified clinician rather than relying on a chart.',
  general: 'Choose one manageable goal for today and spend ten focused minutes on it. Tell me whether you want help with work, relationships, or your daily focus.',
};
const signThemes: Record<string, string> = {
  Aries:'taking a clear first step', Taurus:'steady routines and patience', Gemini:'asking questions and communicating clearly', Cancer:'emotional support and a sense of security', Leo:'confidence and expressing yourself', Virgo:'practical preparation and attention to detail', Libra:'balance and listening to another perspective', Scorpio:'honesty and examining what matters', Sagittarius:'learning and exploring new possibilities', Capricorn:'consistent effort and realistic plans', Aquarius:'fresh perspectives and community', Pisces:'reflection and compassion',
};
const hindiThemes: Record<string,string> = {
  Aries:'पहला स्पष्ट कदम उठाने', Taurus:'नियमित प्रयास और धैर्य', Gemini:'सवाल पूछने और स्पष्ट बात करने', Cancer:'भावनात्मक सहारे', Leo:'आत्मविश्वास', Virgo:'तैयारी और छोटी बातों पर ध्यान देने', Libra:'संतुलन और दूसरे की बात सुनने', Scorpio:'ईमानदारी', Sagittarius:'सीखने और नए अवसर खोजने', Capricorn:'नियमित मेहनत और व्यावहारिक योजना', Aquarius:'नए विचार और लोगों से जुड़ने', Pisces:'चिंतन और संवेदनशीलता',
};
const hindiActions: Record<Topic,string> = {
  career:'आज अपने CV या काम का एक हिस्सा सुधारें और एक आवेदन या फॉलो-अप भेजें। आप पहली नौकरी, नौकरी बदलने या प्रमोशन के बारे में पूछ रहे हैं?',
  relationships:'आज बिना दबाव के एक ईमानदार बातचीत करें। किसी से मिलना चाहते हैं तो साथ में किसी गतिविधि के लिए समय निकालें; जल्दी में बड़ा फैसला न लें।',
  money:'अपने जरूरी खर्च और एक खर्च करने की आदत की समीक्षा करें। निवेश का लाभ कुंडली से तय नहीं होता; निर्णय वास्तविक आंकड़ों के आधार पर लें।',
  wellbeing:'थोड़ा आराम लें और भरोसेमंद व्यक्ति से बात करें। स्वास्थ्य की समस्या में डॉक्टर की मदद लें, कुंडली पर निर्भर न रहें।',
  general:'आज एक छोटा लक्ष्य चुनें और उस पर दस मिनट काम करें। आप काम, रिश्ते या आज की दिनचर्या में किस विषय पर मदद चाहते हैं?',
};
// Concise local wording keeps every selectable language available without another API.
const localized: Record<string,{intro:string;position:string;window:string;none:string;uncertain:string;action:string}> = {
 bn:{intro:'AI এখন উপলব্ধ নয়। আপনার গণনা করা জন্মছক থেকে এই সংক্ষিপ্ত নির্দেশনা।',position:'গণনা করা অবস্থান',window:'জ্যোতিষভিত্তিক সময়কাল',none:'এই গণনায় স্পষ্ট সময়কাল পাওয়া যায়নি।',uncertain:'এটি সম্ভাবনা নিয়ে ভাবার সময়, নিশ্চিত ঘটনার তারিখ নয়।',action:'আজ একটি ছোট লক্ষ্য বেছে নিয়ে কাজ শুরু করুন। সম্পর্কের ক্ষেত্রে শান্তভাবে কথা বলুন; কাজের ক্ষেত্রে একটি আবেদন বা ফলো-আপ পাঠান।'},
 mr:{intro:'AI सध्या उपलब्ध नाही. तुमच्या गणना केलेल्या जन्मपत्रिकेवर आधारित थोडक्यात मार्गदर्शन.',position:'गणना केलेली स्थिती',window:'ज्योतिषानुसार कालावधी',none:'या गणनेत स्पष्ट कालावधी आढळला नाही.',uncertain:'हा विचार करण्याचा कालावधी आहे; घटना घडण्याची हमी नाही.',action:'आज एक छोटे उद्दिष्ट निवडा. कामासाठी एक अर्ज किंवा पाठपुरावा करा; नात्यांमध्ये शांतपणे संवाद साधा.'},
 gu:{intro:'AI અત્યારે ઉપલબ્ધ નથી. તમારી ગણતરી કરેલી જન્મકુંડળી પરથી ટૂંકું માર્ગદર્શન.',position:'ગણતરી કરેલી સ્થિતિ',window:'જ્યોતિષ આધારિત સમયગાળો',none:'આ ગણતરીમાં સ્પષ્ટ સમયગાળો મળ્યો નથી.',uncertain:'આ વિચારવા માટેનો સમય છે, કોઈ ઘટનાની ખાતરી નથી.',action:'આજે એક નાનું લક્ષ્ય પસંદ કરો. કામ માટે એક અરજી કે ફોલો-અપ કરો; સંબંધોમાં શાંતિથી વાત કરો.'},
 ta:{intro:'AI தற்போது கிடைக்கவில்லை. கணக்கிடப்பட்ட உங்கள் பிறப்பு ஜாதகத்திலிருந்து சுருக்கமான வழிகாட்டல்.',position:'கணக்கிடப்பட்ட நிலை',window:'ஜோதிட அடிப்படையிலான காலம்',none:'இந்தக் கணக்கீட்டில் தெளிவான காலம் கிடைக்கவில்லை.',uncertain:'இது சிந்திக்க உதவும் காலம்; நிகழ்வு நடக்கும் தேதிக்கான உறுதி அல்ல.',action:'இன்று ஒரு சிறிய இலக்கைத் தேர்ந்தெடுக்கவும். வேலைக்காக ஒரு விண்ணப்பம் அனுப்பவும்; உறவுகளில் அமைதியாகப் பேசவும்.'},
 te:{intro:'AI ప్రస్తుతం అందుబాటులో లేదు. లెక్కించిన మీ జన్మ చార్ట్ ఆధారంగా సంక్షిప్త సూచన.',position:'లెక్కించిన స్థానం',window:'జ్యోతిష్య ఆధారిత కాలం',none:'ఈ లెక్కింపులో స్పష్టమైన కాలం కనిపించలేదు.',uncertain:'ఇది ఆలోచించడానికి ఒక కాలం మాత్రమే; సంఘటన జరిగే తేదీకి హామీ కాదు.',action:'ఈ రోజు ఒక చిన్న లక్ష్యం ఎంచుకోండి. ఉద్యోగం కోసం ఒక దరఖాస్తు పంపండి; సంబంధాలలో ప్రశాంతంగా మాట్లాడండి.'},
 kn:{intro:'AI ಈಗ ಲಭ್ಯವಿಲ್ಲ. ಲೆಕ್ಕಿಸಿದ ನಿಮ್ಮ ಜನ್ಮ ಜಾತಕದಿಂದ ಸಂಕ್ಷಿಪ್ತ ಮಾರ್ಗದರ್ಶನ.',position:'ಲೆಕ್ಕಿಸಿದ ಸ್ಥಾನ',window:'ಜ್ಯೋತಿಷ್ಯ ಆಧಾರಿತ ಅವಧಿ',none:'ಈ ಲೆಕ್ಕದಲ್ಲಿ ಸ್ಪಷ್ಟ ಅವಧಿ ಕಂಡುಬಂದಿಲ್ಲ.',uncertain:'ಇದು ಯೋಚಿಸಲು ನೆರವಾಗುವ ಅವಧಿ; ಘಟನೆ ನಡೆಯುವ ಖಚಿತ ದಿನಾಂಕವಲ್ಲ.',action:'ಇಂದು ಒಂದು ಸಣ್ಣ ಗುರಿ ಆರಿಸಿ. ಕೆಲಸಕ್ಕಾಗಿ ಒಂದು ಅರ್ಜಿ ಕಳುಹಿಸಿ; ಸಂಬಂಧಗಳಲ್ಲಿ ಶಾಂತವಾಗಿ ಮಾತನಾಡಿ.'},
 ml:{intro:'AI ഇപ്പോൾ ലഭ്യമല്ല. കണക്കാക്കിയ നിങ്ങളുടെ ജനന ചാർട്ടിൽ നിന്നുള്ള ചുരുക്ക മാർഗ്ഗനിർദ്ദേശം.',position:'കണക്കാക്കിയ സ്ഥാനം',window:'ജ്യോതിഷ അടിസ്ഥാനത്തിലുള്ള കാലം',none:'ഈ കണക്കിൽ വ്യക്തമായ കാലം കണ്ടെത്തിയില്ല.',uncertain:'ഇത് ചിന്തിക്കാനുള്ള കാലം മാത്രമാണ്; സംഭവത്തിന്റെ ഉറപ്പായ തീയതിയല്ല.',action:'ഇന്ന് ഒരു ചെറിയ ലക്ഷ്യം തിരഞ്ഞെടുക്കുക. ജോലിക്കായി ഒരു അപേക്ഷ അയയ്ക്കുക; ബന്ധങ്ങളിൽ ശാന്തമായി സംസാരിക്കുക.'},
 pa:{intro:'AI ਹੁਣ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਤੁਹਾਡੀ ਗਣਨਾ ਕੀਤੀ ਜਨਮ ਕੁੰਡਲੀ ਤੋਂ ਸੰਖੇਪ ਸਲਾਹ।',position:'ਗਣਨਾ ਕੀਤੀ ਸਥਿਤੀ',window:'ਜੋਤਿਸ਼ ਅਧਾਰਿਤ ਸਮਾਂ',none:'ਇਸ ਗਣਨਾ ਵਿੱਚ ਸਪੱਸ਼ਟ ਸਮਾਂ ਨਹੀਂ ਮਿਲਿਆ।',uncertain:'ਇਹ ਸੋਚਣ ਲਈ ਸਮਾਂ ਹੈ, ਘਟਨਾ ਦੀ ਪੱਕੀ ਤਾਰੀਖ ਨਹੀਂ।',action:'ਅੱਜ ਇੱਕ ਛੋਟਾ ਟੀਚਾ ਚੁਣੋ। ਕੰਮ ਲਈ ਇੱਕ ਅਰਜ਼ੀ ਭੇਜੋ; ਰਿਸ਼ਤਿਆਂ ਵਿੱਚ ਸ਼ਾਂਤੀ ਨਾਲ ਗੱਲ ਕਰੋ।'},
 ur:{intro:'AI ابھی دستیاب نہیں۔ آپ کے حساب کردہ پیدائشی نقشے سے مختصر رہنمائی۔',position:'حساب کردہ مقام',window:'علم نجوم پر مبنی مدت',none:'اس حساب میں واضح مدت نہیں ملی۔',uncertain:'یہ غور کرنے کی مدت ہے، کسی واقعے کی یقینی تاریخ نہیں۔',action:'آج ایک چھوٹا مقصد منتخب کریں۔ کام کے لیے ایک درخواست بھیجیں؛ رشتوں میں سکون سے بات کریں۔'},
 es:{intro:'La IA no está disponible. Esta orientación breve usa tu carta natal calculada.',position:'Posición calculada',window:'Periodo astrológico para explorar',none:'El cálculo no identifica un periodo claro.',uncertain:'No es una fecha garantizada para conseguir empleo o pareja.',action:'Elige una pequeña meta hoy. Para el trabajo, envía una solicitud; para tus relaciones, busca una conversación tranquila.'},
 fr:{intro:'L’IA est indisponible. Ce bref conseil utilise votre thème natal calculé.',position:'Position calculée',window:'Période astrologique à explorer',none:'Le calcul ne trouve pas de période claire.',uncertain:'Ce n’est pas une date garantie pour un emploi ou une rencontre.',action:'Choisissez un petit objectif aujourd’hui. Pour le travail, envoyez une candidature ; pour les relations, prenez le temps de parler calmement.'},
 ar:{intro:'الذكاء الاصطناعي غير متاح الآن. هذه إرشادات مختصرة من خريطة ميلادك المحسوبة.',position:'الموقع المحسوب',window:'فترة فلكية للتأمل',none:'لا يحدد هذا الحساب فترة واضحة.',uncertain:'هذه ليست مواعيد مضمونة للعمل أو الزواج.',action:'اختر هدفاً صغيراً اليوم. للعمل أرسل طلباً واحداً، وللعلاقات خصص وقتاً لحوار هادئ.'},
};
function replyLanguage(language:string, question:string) {
  if(language !== 'auto') return language;
  for(const [code,pattern] of [['hi',/[\u0900-\u097f]/],['bn',/[\u0980-\u09ff]/],['gu',/[\u0a80-\u0aff]/],['pa',/[\u0a00-\u0a7f]/],['ta',/[\u0b80-\u0bff]/],['te',/[\u0c00-\u0c7f]/],['kn',/[\u0c80-\u0cff]/],['ml',/[\u0d00-\u0d7f]/],['ur',/[\u0600-\u06ff]/]] as const) if(pattern.test(question)) return code;
  return /\b(kab|naukri|shaadi|shadi|pyaar|mera|meri|mujhe|kaam)\b/i.test(question)?'hinglish':'en';
}
function monthRange(start:string,end:string,language:string,timezone:string) {
  const locale=language==='hinglish'?'en-IN':language;
  const format=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:timezone});
  const first=format.format(new Date(start+'T12:00:00Z')),last=format.format(new Date(end+'T12:00:00Z'));
  return first===last?first:`${first} – ${last}`;
}
export function astrologyFallback(chart:Chart,messages:Message[],language='auto',mode='chat') {
  const question=messages.filter(m=>m.role==='user').at(-1)?.content || '';
  const lang=replyLanguage(language,question);
  const intro=lang==='hi'?'AI अभी उपलब्ध नहीं है। यह संक्षिप्त उत्तर आपके गणना किए हुए जन्मचार्ट से है।':lang==='hinglish'?'AI abhi available nahi hai. Yeh short reading aapke calculated birth chart se hai.':localized[lang]?.intro || 'AI is unavailable right now. Here is a shorter reading from your calculated birth chart.';
  if(/suicid|kill myself|end my life|hurt myself|आत्महत्या|खुद को मार|खुदकुशी/i.test(question)) return lang==='hi'?intro+'\n\nमुझे दुख है कि आप इतनी तकलीफ में हैं। अभी ज्योतिष से ज्यादा आपकी सुरक्षा जरूरी है। किसी भरोसेमंद व्यक्ति को अपने साथ रहने के लिए कहें और खुद को नुकसान पहुंचाने वाली चीजों से दूर रहें। अगर अभी खतरा है तो अपने स्थानीय आपातकालीन नंबर पर कॉल करें; भारत में 112।':intro+'\n\nI’m sorry you’re in so much pain. Your safety matters more than a chart right now. Ask someone you trust to stay with you and move away from anything you could use to hurt yourself. If you’re in immediate danger, call your local emergency number; in India, call 112.';
  if(/curse|black magic|possess|जादू|श्राप/i.test(question)) return intro+'\n\nA birth chart cannot establish that someone has cursed you or is controlling you. If you feel unsafe, reach out to someone you trust and focus on what you can verify.';
  const recent=messages.filter(m=>m.role==='user').slice(-3).map(m=>m.content).join(' ');
  const topic=mode==='daily'?'general':topics.find(([,pattern])=>pattern.test(question))?.[0] || topics.find(([,pattern])=>pattern.test(recent))?.[0] || 'general';
  const body=topic==='career'?'Mercury':topic==='relationships'?'Venus':'Moon';
  const natal=chart.natal.find(p=>p.body===body)!;
  const placements=`${natal.body}: ${natal.degree.toFixed(2)}° ${natal.sign}`;
  const windows=(topic==='career'||topic==='relationships')?chart.timing.windows.filter(w=>w.topic===topic&&Date.parse(w.end+'T23:59:59Z')>=Date.parse(chart.calculatedAt)).slice(0,2):[];
  const wantsTiming=/when|date|month|year|kab|कब|तारीख|কবে|எப்போது|ఎప్పుడు|ಯಾವಾಗ|എപ്പോൾ|کب|متى|quand|cuándo/i.test(question);
  const ranges=windows.map(w=>monthRange(w.start,w.end,lang,chart.timezone)).join('; ');
  const closest=chart.current.flatMap(transit=>{
    const separation=Math.abs(transit.longitude-natal.longitude), angle=Math.min(separation,360-separation);
    return ([['conjunction',0],['sextile',60],['square',90],['trine',120],['opposition',180]] as const).map(([aspect,degrees])=>({transit,aspect,orb:Math.abs(angle-degrees)}));
  }).filter(factor=>factor.orb<=3).sort((a,b)=>a.orb-b.orb)[0];
  const evidence=closest?`${closest.transit.body} ${closest.aspect} natal ${natal.body} (${closest.orb.toFixed(1)}°)`:`${chart.current.find(p=>p.body==='Moon')?.sign}`;
  if(localized[lang]) {
    const copy=localized[lang];
    return [intro,`${copy.position}: ${placements}.`,(wantsTiming&&(topic==='career'||topic==='relationships'))?(ranges?`${copy.window}: ${ranges}. ${copy.uncertain}`:copy.none):null,copy.action].filter(Boolean).join('\n\n');
  }
  const timing=wantsTiming&&(topic==='career'||topic==='relationships')?(lang==='hi'?(ranges?`ज्योतिष के आधार पर विचार करने के समय: ${ranges}। ${windows.some(w=>w.factors.some(f=>f.startsWith('Jupiter')))?'गुरु का संकेत अवसर और विकास से जुड़ा माना जाता है।':'शनि का संकेत निरंतर मेहनत और जिम्मेदारी से जुड़ा माना जाता है।'} यह नौकरी या साथी मिलने की पक्की तारीख नहीं है।`:'इस गणना में स्पष्ट समय नहीं मिला। इसका अर्थ यह नहीं है कि अवसर नहीं आएगा।'):lang==='hinglish'?(ranges?`Explore karne ke astrology periods: ${ranges}. Yeh job ya partner milne ki guaranteed date nahi hai.`:'Is calculation mein clear timing window nahi mila; iska matlab yeh nahi ki opportunity nahi aayegi.'):(ranges?`The calculated periods to explore are ${ranges}. ${windows.some(w=>w.factors.some(f=>f.startsWith('Jupiter')))?'The Jupiter factors traditionally point to growth and opportunities.':'The Saturn factors traditionally point to commitment and sustained effort.'} These are symbolic windows, not dates a job or partner is guaranteed.`:'This calculation does not identify a clear timing window. That does not mean an opportunity cannot happen.')):null;
  const interpretation=lang==='hi'?`आपके जन्मचार्ट में ${placements} है। पारंपरिक ज्योतिष इसे ${hindiThemes[natal.sign]} से जोड़ता है।`:lang==='hinglish'?`Aapke birth chart mein ${placements} hai. Traditional astrology mein yeh ${signThemes[natal.sign]} ka reflection hai.`:`Your birth chart has ${placements}. In traditional astrology, this is associated with ${signThemes[natal.sign]}.`;
  const current=mode==='daily'?(lang==='hi'?`आज की गणना: ${evidence}। इसे चिंतन का संकेत मानें, किसी घटना की गारंटी नहीं।`:lang==='hinglish'?`Aaj ka calculated chart factor: ${evidence}. Isse reflection samjhein, guaranteed outcome nahi.`:`Today’s calculated chart factor: ${evidence}. Use it as a reflection prompt, not a guaranteed outcome.`):null;
  const action=lang==='hi'?hindiActions[topic]:lang==='hinglish'?`Aaj ek chhota practical step lein. ${actions[topic]}`:actions[topic];
  return [intro,timing,interpretation,current,action].filter(Boolean).join('\n\n');
}
