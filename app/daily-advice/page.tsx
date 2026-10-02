import { FeatureGuide } from '@/components/feature-guide';
import { featureMetadata } from '@/lib/seo';
export const metadata = featureMetadata('Free Daily Advice & Personal Goals', 'Build a daily ritual with free practical advice, work and relationship focus options, and checkable goals. Explore personal astrology guidance with Astrois.', '/daily-advice');
export default function Page() {
  return <FeatureGuide title="A small intention. A better daily ritual." lead="Make space for one useful step each day. Astrois offers free practical daily advice and checkable goals, with optional personal astrology readings when you want to explore further."
    sections={[
      {title:'Choose what matters today',text:'After Google sign-in and entering your details, open Daily Guidance. Choose Work, Relationships or Wellbeing to see a short reflection and manageable suggested actions. Free suggestions refresh daily and are practical prompts, not predictions.'},
      {title:'Turn advice into something you can do',text:'Tick off goals as you complete them or add your own small action. A work goal might be a focused practice session or one application; a relationship goal might be a thoughtful conversation. Choose what is realistic for your day.'},
      {title:'Keep your progress personal',text:'Goals are saved in the current browser for your user, birth profile and local date. They refresh for a new day. They do not automatically sync across devices, and clearing browser storage removes saved progress.'},
      {title:'Explore today’s chart with your AI guide',text:'Free goals do not use your chat allowance. The separate personal reading button uses your active trial or pass to explore your calculated birth chart and current planetary positions. When AI is unavailable, the local astrology engine provides a shorter reading.'},
    ]}
    faq={[
      {question:'Do I need to pay for daily goals?',answer:'No. Daily practical suggestions and checkable goals are free. Optional astrology conversations use chat access, starting with the two-minute free trial.'},
      {question:'Will today’s advice guarantee a good outcome?',answer:'No. The free suggestions are general practical reflections. Choose actions that suit your circumstances; astrology interpretations are uncertain and do not replace professional guidance.'},
    ]}/>;
}
