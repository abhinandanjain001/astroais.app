import { FeatureGuide } from '@/components/feature-guide';
import { featureMetadata } from '@/lib/seo';
export const metadata = featureMetadata('AI Astrology Chat for Career & Relationships', 'Ask Astrois about career, relationships and personal growth in your language. Get simple guidance grounded in your calculated birth chart, with two minutes free.', '/astrology-chat');
export default function Page() {
  return <FeatureGuide title="Bring your questions. Find a little clarity." lead="Astrois combines your calculated birth chart with a conversational AI guide. Ask a question in your own words and receive a simple explanation that connects astrology reflections with practical next steps."
    sections={[
      {title:'A conversation built around your details',text:'Before chat begins, enter your birth date, local birth time and birthplace. The guide receives your calculated chart and conversation history so it can respond to your situation rather than display a generic daily horoscope. Try: “I am looking for my first job. What should I focus on?”'},
      {title:'Ask in the language that feels natural',text:'Choose English, Hindi, Hinglish, Bengali, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, Spanish, French or Arabic. Auto mode follows your question where supported. Simple wording helps you understand the reading without learning complex astrology terminology.'},
      {title:'Approximate timing, with honest limits',text:'For career or relationship timing questions, the engine calculates selected current-to-natal planetary aspect windows over the next year. The guide can describe relevant approximate month ranges. These are symbolic astrology windows, not evidence that a job or partner will arrive on a particular date.'},
      {title:'Guidance when AI is unavailable',text:'If AI providers run out of quota or cannot connect, a local astrology engine returns a shorter reading using your calculated placements and relevant timing windows. Local replies are clearly labelled. The app still requires Google sign-in and an active free trial or paid pass.'},
    ]}
    faq={[
      {question:'How much does astrology chat cost?',answer:'You receive two minutes of free chat. One-time passes start at ₹5 for five minutes, ₹199 for 24 hours of Premium access, or ₹1,999 for 30 days. Passes do not renew automatically.'},
      {question:'Can the guide predict my future with certainty?',answer:'No. It can explain astrology interpretations and approximate calculation-based windows. Your decisions, circumstances and other people’s choices also matter. Use the reading for reflection, not as a guaranteed forecast.'},
    ]}/>;
}
