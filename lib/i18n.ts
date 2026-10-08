import type { Farm } from "@/types";
export type Language = Farm["language"];
export const languages = [
  { code: "en", label: "English", locale: "en-IN" },
  { code: "kn", label: "ಕನ್ನಡ", locale: "kn-IN" },
  { code: "hi", label: "हिन्दी", locale: "hi-IN" },
] as const;
const hindi: Record<string, string> = {
  Overview: "अवलोकन",
  "Voice AI": "वॉइस AI",
  "My farm": "मेरा खेत",
  "Government schemes": "सरकारी योजनाएँ",
  "Crop health": "फसल स्वास्थ्य",
  "Market intelligence": "बाज़ार जानकारी",
  "Weather intelligence": "मौसम जानकारी",
  "Threat monitor": "खतरे की निगरानी",
  "Action planner": "कार्य योजना",
  "Knowledge library": "ज्ञान भंडार",
  "Farmer context": "किसान संदर्भ",
  Notifications: "सूचनाएँ",
  Settings: "सेटिंग्स",
  "System status": "सिस्टम स्थिति",
  "CURRENT CROP": "वर्तमान फसल",
  "WEATHER NOW": "वर्तमान मौसम",
  "MARKET PRICE / QUINTAL": "बाज़ार मूल्य / क्विंटल",
  "FARM STATUS": "खेत की स्थिति",
  Alert: "चेतावनी",
  Healthy: "स्वस्थ",
  "Ask Jeevandhara.": "जीवनधारा से पूछें।",
  "Speak naturally in Hindi, English or Kannada.":
    "हिन्दी, अंग्रेज़ी या कन्नड़ में सहजता से बोलें।",
  "START SPEAKING": "बोलना शुरू करें",
  "Type a question": "सवाल लिखें",
  "Your next actions": "आपके अगले कार्य",
  "Your farm. Connected, informed, and in control.":
    "आपका खेत। जुड़ा हुआ, जानकारी से लैस और आपके नियंत्रण में।",
  "Your farm at a glance": "आपके खेत की एक झलक",
  Location: "स्थान",
  Crop: "फसल",
  "Farm size": "खेत का आकार",
  Irrigation: "सिंचाई",
  Soil: "मिट्टी",
  "Edit farm": "खेत संपादित करें",
  "Explore farmer context": "किसान संदर्भ देखें",
  "Open action planner": "कार्य योजना खोलें",
  "Field signals": "खेत के संकेत",
  "WEATHER ADVISORY": "मौसम सलाह",
  "Rain is on the horizon.": "बारिश की संभावना है।",
  "RAIN PROBABILITY": "बारिश की संभावना",
  "SOIL MOISTURE": "मिट्टी की नमी",
  "View weather intelligence": "मौसम जानकारी देखें",
  "Your farm context does the rest.":
    "आपके खेत की जानकारी आगे का मार्ग दिखाती है।",
  "ASK YOUR FARM": "अपने खेत से पूछें",
  "VOICE-FIRST INTELLIGENCE": "आवाज़ आधारित जानकारी",
  "DEMO MODE": "डेमो मोड",
  "Load demo farm": "डेमो खेत लोड करें",
  Home: "होम",
  Voice: "आवाज़",
  Farm: "खेत",
  Actions: "कार्य",
  More: "और",
  "Preferred language": "पसंदीदा भाषा",
  "Speak or type a question first.": "पहले बोलकर या लिखकर सवाल पूछें।",
  "Review schemes and check structured eligibility.":
    "योजनाएँ देखें और निर्धारित नियमों के अनुसार पात्रता जाँचें।",
  "Compare nearby markets and transport costs.":
    "नज़दीकी बाज़ारों और परिवहन लागत की तुलना करें।",
  "Review rainfall and check field drainage.":
    "बारिश का पूर्वानुमान देखें और खेत की जल निकासी जाँचें।",
  "Review sensor readings and verify activity.":
    "सेंसर के आँकड़े देखें और गतिविधि की पुष्टि करें।",
  "Check rainfall and soil moisture before irrigating.":
    "सिंचाई से पहले बारिश और मिट्टी की नमी जाँचें।",
  "Inspect leaves and upload a crop image.":
    "पत्तियों की जाँच करें और फसल की तस्वीर अपलोड करें।",
  "Inspect crop leaves and upload an image for further analysis.":
    "फसल की पत्तियों की जाँच करें और आगे के विश्लेषण के लिए तस्वीर अपलोड करें।",
  "Search the knowledge library for relevant field guidance.":
    "खेत से संबंधित मार्गदर्शन के लिए ज्ञान भंडार में खोजें।",
};
const kannada: Record<string, string> = {
  "Speak naturally in Hindi, English or Kannada.":
    "ಹಿಂದಿ, ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಸಹಜವಾಗಿ ಮಾತನಾಡಿ.",
  Home: "ಮುಖಪುಟ",
  Voice: "ಧ್ವನಿ",
  Farm: "ಕೃಷಿ",
  Actions: "ಕಾರ್ಯಗಳು",
  More: "ಇನ್ನಷ್ಟು",
};
export function translate(
  language: Language,
  text: string,
  kannadaText?: string,
) {
  return language === "hi"
    ? (hindi[text] ?? text)
    : language === "kn"
      ? (kannadaText ?? kannada[text] ?? text)
      : text;
}
export function speechLocale(language: Language) {
  return languages.find((l) => l.code === language)?.locale ?? "en-IN";
}
