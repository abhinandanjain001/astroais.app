import { FeatureGuide } from '@/components/feature-guide';
import { featureMetadata } from '@/lib/seo';
export const metadata = featureMetadata('Personal Birth Chart & Kundli', 'Create your personal birth chart from your birth date, time and location. View your kundli, explore planetary positions and download a chart image with Astrois.', '/birth-chart');
export default function Page() {
  return <FeatureGuide title="Your birth chart. Your unique story." lead="A personal birth chart begins with the moment and place you were born. Astrois calculates your planetary positions from those details, then presents a kundli you can view and download."
    sections={[
      {title:'Start with your exact birth details',text:'Sign in with Google, enter your name, birth date and local birth time, then search for your birth location by country, state or district. Your selected coordinates are used to infer the timezone and calculate your chart. Accurate birth time and location matter, especially for the ascendant and houses.'},
      {title:'Understand what your chart contains',text:'The app shows calculated planetary positions, zodiac signs and a visual kundli. The conversation uses tropical geocentric placements; the kundli view uses an approximate Lahiri sidereal conversion and whole-sign houses. These are different astrology conventions. The app does not calculate a full Vedic dasha system.'},
      {title:'Save your personal kundli image',text:'Once your details are ready, open My Kundli to view your own chart and download an image. Different birth dates, times and locations produce different calculations; the chart is not a shared stock horoscope.'},
      {title:'Turn your chart into a conversation',text:'Ask about career, relationships or personal growth in your preferred language. The guide explains chart factors in plain language. Any timing windows are approximate astrology-based periods to explore, not guaranteed dates for marriage, a job offer or another event.'},
    ]}
    faq={[
      {question:'What if I do not know my birth time?',answer:'The app needs a birth time to calculate the full chart. Check a birth record or ask family if possible. If you enter an approximate time, treat the resulting ascendant and houses as uncertain.'},
      {question:'Can I create a chart without a paid pass?',answer:'You can prepare your birth details and view your kundli after Google sign-in. AI conversation starts with two minutes free; continuing chat requires a pass.'},
    ]}/>;
}
