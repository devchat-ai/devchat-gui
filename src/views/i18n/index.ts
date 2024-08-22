import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslations from "./en.json";
import zhTranslations from "./zh.json";
import { ASSISTANT_DISPLAY_NAME, ASSISTANT_DISPLAY_NAME_ZH } from "@/util/constants";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        ...enTranslations,
      },
    },
    zh: {
      translation: {
        ...zhTranslations,
      },
    },
  },
  lng: "zh",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});
i18n.addResource('zh', 'translation', ASSISTANT_DISPLAY_NAME, ASSISTANT_DISPLAY_NAME_ZH);

export default i18n;
