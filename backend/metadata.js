export const CHAT_SYSTEM_PROMPT =
  "You are a patient dialect tutor for English speakers. You know the pronunciation, grammar and vocabulary of Cantonese, Taishanese, Shanghainese, Hokkien/Minnan, Teochew, Wenzhounese and Sichuanese. Be concise, accurate and friendly. Always reply in English, and show dialect words in Chinese characters with romanization.\nRules:\n1. For Cantonese or Taishanese, give Jyutping (or a Taishanese pronunciation hint / local romanization) and a clear English meaning\n2. For Hokkien or Minnan, give Tâi-lô or Pe̍h-ōe-jī and an English meaning\n3. For Shanghainese or Wenzhounese, give a common Wu romanization, IPA or a pronunciation hint and an English meaning\n4. For Teochew, give Teochew pinyin, Pe̍h-ōe-jī or a pronunciation hint and an English meaning\n5. For Sichuanese, explain the common phrasing, give a pronunciation hint and an English meaning\n6. When explaining a dialect word, give its common written form, its romanization and an example from daily life\n7. If dictionary reference information is provided, prefer its romanization and meaning\n8. When the user names a dialect, do not mix in another dialect\n9. When you need dictionary, quiz, phrase of the day, phrases, tones, examples, dialect comparison, challenge or progress information, use the tools provided. After a tool returns, you must write a complete natural-language reply from the result; never return empty content or only a tool call.\n10. Format replies in Markdown (headings, lists, tables, code blocks) so they are easy to read.";

export const DIALECTS = {
  yue: {
    label: "Cantonese",
    readingLabel: "Jyutping",
    altLabel: "",
    speechLang: "zh-HK",
    dictionaryLabel: "Cantonese dictionary",
  },
  taishanese: {
    label: "Taishanese",
    readingLabel: "Pronunciation hint",
    altLabel: "Local romanization",
    speechLang: "zh-CN",
    dictionaryLabel: "Taishanese dictionary",
  },
  minnan: {
    label: "Minnan",
    readingLabel: "Tâi-lô",
    altLabel: "Pe̍h-ōe-jī",
    speechLang: "zh-TW",
    dictionaryLabel: "Minnan dictionary",
  },
  hokkien: {
    label: "Hokkien",
    readingLabel: "Tâi-lô",
    altLabel: "Pe̍h-ōe-jī",
    speechLang: "zh-TW",
    dictionaryLabel: "Hokkien dictionary",
  },
  shanghai: {
    label: "Shanghai dialect",
    readingLabel: "Romanization",
    altLabel: "IPA",
    speechLang: "zh-CN",
    dictionaryLabel: "Shanghai dialect dictionary",
  },
  shanghainese: {
    label: "Shanghainese",
    readingLabel: "Romanization",
    altLabel: "IPA",
    speechLang: "zh-CN",
    dictionaryLabel: "Shanghai dialect dictionary",
  },
  teochew: {
    label: "Teochew",
    readingLabel: "Teochew pinyin",
    altLabel: "Pe̍h-ōe-jī",
    speechLang: "zh-CN",
    dictionaryLabel: "Teochew dictionary",
  },
  wenzhounese: {
    label: "Wenzhounese",
    readingLabel: "Pronunciation hint",
    altLabel: "IPA",
    speechLang: "zh-CN",
    dictionaryLabel: "Wenzhounese dictionary",
  },
  sichuan: {
    label: "Sichuanese",
    readingLabel: "Pronunciation hint",
    altLabel: "IPA",
    speechLang: "zh-CN",
    dictionaryLabel: "Sichuanese dictionary",
  },
  unknown: {
    label: "This dialect",
    readingLabel: "Romanization",
    altLabel: "",
    speechLang: "zh-CN",
    dictionaryLabel: "Dialect dictionary",
  },
};

export const localZhToShMap = {
  你好: "侬好",
  谢谢: "谢谢侬",
  不好意思: "对勿起",
  对不起: "对勿起",
  我: "阿拉",
  你: "侬",
  我们: "阿拉",
  今天: "今朝",
  明天: "明朝",
  这个: "格个",
  那个: "伊个",
  什么: "啥物事",
  怎么: "哪能",
  吃饭: "吃饭",
  多少钱: "几钿",
  很好: "老好",
  再见: "再会",
};

export const localZhToYueMap = {
  你好: "你好",
  谢谢: "多谢",
  我: "我",
  你: "你",
  我们: "我哋",
  今天: "今日",
  明天: "听日",
  这个: "呢个",
  那个: "嗰个",
  什么: "咩",
  很好: "几好",
};
