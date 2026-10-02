export const chatLanguages = [
  { code: 'auto', label: 'Auto · match my question', instruction: 'Match the language of the latest user question, including mixed-language questions.' },
  { code: 'en', label: 'English', instruction: 'Reply in simple English.' },
  { code: 'hi', label: 'हिन्दी · Hindi', instruction: 'Reply in natural Hindi using Devanagari script.' },
  { code: 'hinglish', label: 'Hinglish', instruction: 'Reply in natural Hindi-English mixed language using Latin script.' },
  { code: 'bn', label: 'বাংলা · Bengali', instruction: 'Reply in natural Bengali using Bengali script.' },
  { code: 'mr', label: 'मराठी · Marathi', instruction: 'Reply in natural Marathi using Devanagari script.' },
  { code: 'gu', label: 'ગુજરાતી · Gujarati', instruction: 'Reply in natural Gujarati using Gujarati script.' },
  { code: 'ta', label: 'தமிழ் · Tamil', instruction: 'Reply in natural Tamil using Tamil script.' },
  { code: 'te', label: 'తెలుగు · Telugu', instruction: 'Reply in natural Telugu using Telugu script.' },
  { code: 'kn', label: 'ಕನ್ನಡ · Kannada', instruction: 'Reply in natural Kannada using Kannada script.' },
  { code: 'ml', label: 'മലയാളം · Malayalam', instruction: 'Reply in natural Malayalam using Malayalam script.' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ · Punjabi', instruction: 'Reply in natural Punjabi using Gurmukhi script.' },
  { code: 'ur', label: 'اردو · Urdu', instruction: 'Reply in natural Urdu using Urdu script.' },
  { code: 'es', label: 'Español · Spanish', instruction: 'Reply in natural Spanish.' },
  { code: 'fr', label: 'Français · French', instruction: 'Reply in natural French.' },
  { code: 'ar', label: 'العربية · Arabic', instruction: 'Reply in natural Arabic using Arabic script.' },
] as const;
export type ChatLanguage = typeof chatLanguages[number]['code'];

export function languageInstruction(code: string) {
  return chatLanguages.find(language => language.code === code)?.instruction || chatLanguages[0].instruction;
}
