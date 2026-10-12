const configKey = "dls-ai-config";
const DEFAULT_BASE_URL = "/api";
const DEFAULT_MODEL = "qwen3.5:0.8b";
const REQUEST_TIMEOUT_MS = 120000;
const chatHistoryEl = document.getElementById("chatHistory");

const configFileInput = document.getElementById("configFileInput");
const uploadConfigBtn = document.getElementById("uploadConfigBtn");
const clearConfigKeyBtn = document.getElementById("clearConfigKeyBtn");
const downloadConfigTemplateBtn = document.getElementById("downloadConfigTemplateBtn");
const configKeyStatusEl = document.getElementById("configKeyStatus");
const baseUrlEl = document.getElementById("baseUrl");
const modelEl = document.getElementById("model");
const modelPresetEl = document.getElementById("modelPreset");
const providerPresetEl = document.getElementById("providerPreset");
const saveConfigBtn = document.getElementById("saveConfig");

const chatInputEl = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChat");
const onboardingModalEl = document.getElementById("onboardingModal");
const onboardingNextBtn = document.getElementById("onboardingNextBtn");
const onboardingBackBtn = document.getElementById("onboardingBackBtn");
const skipOnboardingBtn = document.getElementById("skipOnboardingBtn");

const directionEl = document.getElementById("direction");
const translateInputEl = document.getElementById("translateInput");
const translateBtn = document.getElementById("translateBtn");
const translateOutputEl = document.getElementById("translateOutput");
const clearTranslateBtn = document.getElementById("clearTranslateBtn");
const speakOutputBtn = document.getElementById("speakOutputBtn");
const copyOutputBtn = document.getElementById("copyOutputBtn");
const favoriteOutputBtn = document.getElementById("favoriteOutputBtn");

const favoritesListEl = document.getElementById("favoritesList");
const noFavoritesEl = document.getElementById("noFavorites");
const clearFavoritesBtn = document.getElementById("clearFavoritesBtn");

const translateHistoryListEl = document.getElementById("translateHistoryList");
const noTranslateHistoryEl = document.getElementById("noTranslateHistory");
const clearChatHistoryBtn = document.getElementById("clearChatHistoryBtn");
const clearTranslateHistoryBtn = document.getElementById("clearTranslateHistoryBtn");
const dictDialectEl = document.getElementById("dictDialect");
const yueDictSearchEl = document.getElementById("yueDictSearch");
const yueDictSearchBtn = document.getElementById("yueDictSearchBtn");
const yueDictResultEl = document.getElementById("yueDictResult");
const noYueDictResultEl = document.getElementById("noYueDictResult");
const phraseDialectEl = document.getElementById("phraseDialect");
const dailyDialectEl = document.getElementById("dailyDialect");
const quizDialectEl = document.getElementById("quizDialect");
let currentFavCategory = "all";

const PROVIDER_PRESETS = {
  ollama: {
    baseUrl: DEFAULT_BASE_URL,
    model: DEFAULT_MODEL,
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
};

const navPageEls = Array.from(document.querySelectorAll(".page"));
const navBtnEls = Array.from(document.querySelectorAll(".nav-btn"));
const navGroupEls = Array.from(document.querySelectorAll(".nav-group"));
const pagesByName = new Map(
  navPageEls.map((el) => [el.id.replace(/^page-/, ""), el]),
);

let currentPageName = "home";
let toneChartDrawn = false;

function ensureToneChart() {
  if (toneChartDrawn) return;
  drawToneChart();
  toneChartDrawn = true;
}

// 页面导航功能
function navigateTo(pageName) {
  currentPageName = pageName;
  for (const page of navPageEls) page.classList.remove("active");
  const targetPage = pagesByName.get(pageName);
  if (targetPage) targetPage.classList.add("active");

  for (const btn of navBtnEls) {
    btn.classList.toggle("active", btn.dataset.page === pageName);
  }
  for (const group of navGroupEls) {
    const pages = (group.dataset.groupPages || "").split(/\s+/);
    group.classList.toggle("has-active", pages.includes(pageName));
    group.classList.remove("open");
  }

  localStorage.setItem("dls-ai-current-page", pageName);
  if (pageName === "tones") ensureToneChart();
}

// 初始化导航
function initNavigation() {
  // 为所有导航按钮添加点击事件
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const pageName = btn.dataset.page;
      if (!pageName) {
        const group = btn.closest(".nav-group");
        if (group) {
          for (const item of navGroupEls) {
            if (item !== group) item.classList.remove("open");
          }
          group.classList.toggle("open");
        }
        return;
      }
      navigateTo(pageName);
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-menu")) {
      for (const group of navGroupEls) group.classList.remove("open");
    }
  });
  
  // 恢复上次访问的页面
  const lastPage = localStorage.getItem('dls-ai-current-page') || 'home';
  navigateTo(lastPage);
}

const ONBOARDING_STORAGE_KEY = "dls-ai-onboarding-completed";
let onboardingStepIndex = 0;

function completeOnboarding() {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
  } catch {
    /* localStorage 不可用时仅关闭当前引导 */
  }
  onboardingModalEl.hidden = true;
}

function openOnboarding() {
  if (!onboardingModalEl) return;
  onboardingStepIndex = 0;
  onboardingModalEl.hidden = false;
  renderOnboardingStep();
  skipOnboardingBtn.focus();
}

function renderOnboardingStep() {
  const steps = Array.from(document.querySelectorAll("[data-onboarding-step]"));
  const indicators = Array.from(document.querySelectorAll(".onboarding-progress span"));
  steps.forEach((step, index) => {
    step.hidden = index !== onboardingStepIndex;
  });
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle("active", index === onboardingStepIndex);
  });
  onboardingBackBtn.hidden = onboardingStepIndex === 0;
  onboardingNextBtn.textContent = onboardingStepIndex === steps.length - 1 ? "Start learning" : "Next";
}

function initOnboarding() {
  if (!onboardingModalEl) return;
  onboardingNextBtn.addEventListener("click", () => {
    const stepCount = document.querySelectorAll("[data-onboarding-step]").length;
    if (onboardingStepIndex < stepCount - 1) {
      onboardingStepIndex += 1;
      renderOnboardingStep();
      return;
    }
    completeOnboarding();
    navigateTo("chat");
    chatInputEl.focus();
  });
  onboardingBackBtn.addEventListener("click", () => {
    onboardingStepIndex = Math.max(0, onboardingStepIndex - 1);
    renderOnboardingStep();
  });
  skipOnboardingBtn.addEventListener("click", completeOnboarding);
  document.querySelectorAll("[data-onboarding-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", openOnboarding);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !onboardingModalEl.hidden) completeOnboarding();
  });

  try {
    if (localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1") return;
  } catch {
    /* 继续展示引导，避免首次用户错过入口 */
  }
  openOnboarding();
}

const CHAT_SYSTEM_PROMPT =
  "You are a patient dialect tutor for English speakers. You know the pronunciation, grammar and vocabulary of Cantonese, Taishanese, Shanghainese, Hokkien/Minnan, Teochew, Wenzhounese and Sichuanese. Be concise, accurate and friendly. Always reply in English, and show dialect words in Chinese characters with romanization.\nRules:\n1. For Cantonese or Taishanese, give Jyutping (or a Taishanese pronunciation hint / local romanization) and a clear English meaning\n2. For Hokkien or Minnan, give Tâi-lô or Pe̍h-ōe-jī and an English meaning\n3. For Shanghainese or Wenzhounese, give a common Wu romanization, IPA or a pronunciation hint and an English meaning\n4. For Teochew, give Teochew pinyin, Pe̍h-ōe-jī or a pronunciation hint and an English meaning\n5. For Sichuanese, explain the common phrasing, give a pronunciation hint and an English meaning\n6. When explaining a dialect word, give its common written form, its romanization and an example from daily life\n7. If dictionary reference information is provided, prefer its romanization and meaning\n8. When the user names a dialect, do not mix in another dialect\n9. When you need dictionary, quiz, phrase of the day, phrases, tones, examples, dialect comparison, challenge or progress information, use the tools provided. After a tool returns, you must write a complete natural-language reply from the result; never return empty content or only a tool call.\n10. Format replies in Markdown (headings, lists, tables, code blocks) so they are easy to read.";

const conversation = [
  {
    role: "system",
    content: CHAT_SYSTEM_PROMPT,
  },
];

const localZhToShMap = {
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

const localZhToYueMap = {
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

const localShToZhMap = Object.fromEntries(
  Object.entries(localZhToShMap).map(([zh, sh]) => [sh, zh]),
);
const localYueToZhMap = Object.fromEntries(
  Object.entries(localZhToYueMap).map(([zh, yue]) => [yue, zh]),
);

const localZhToMinnanMap = {
  你好: "你好",
  谢谢: "多謝",
  不好意思: "歹勢",
  对不起: "歹勢",
  吃饭: "食飯",
  今天: "今仔日",
  明天: "明仔載",
  哪里: "佗位",
  请问: "請問",
  多少钱: "幾若錢",
  太贵: "傷貴",
  便宜一点: "較俗",
  好吃: "好食",
  再见: "再會",
};

const localMinnanToZhMap = Object.fromEntries(
  Object.entries(localZhToMinnanMap).map(([zh, minnan]) => [minnan, zh]),
);

const localZhToSichuanMap = {
  你好: "你好",
  谢谢: "谢谢",
  不好意思: "不好意思",
  对不起: "对不起",
  我: "我",
  你: "你",
  我们: "我们",
  今天: "今天",
  明天: "明天",
  什么: "啥子",
  怎么: "啷个",
  哪里: "哪儿",
  可以: "要得",
  没有: "莫得",
  很好: "巴适",
  舒服: "安逸",
  加油: "雄起",
  吃饭: "吃饭",
  多少钱: "好多钱",
  再见: "拜拜",
};

const localSichuanToZhMap = Object.fromEntries(
  Object.entries(localZhToSichuanMap).map(([zh, sichuan]) => [sichuan, zh]),
);

const DIALECTS = {
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

const SUPPORTED_DIALECT_IDS = Object.freeze(Object.keys(DIALECTS).filter((dialect) => dialect !== "unknown"));

function getDialectMeta(dialect) {
  return DIALECTS[dialect] || DIALECTS.yue;
}

const REGIONAL_DIALECTS = {
  minnan: {
    label: DIALECTS.minnan.label,
    file: "read/minnan_dictionary.csv",
    readingLabel: DIALECTS.minnan.readingLabel,
    altLabel: DIALECTS.minnan.altLabel,
  },
  hokkien: {
    label: DIALECTS.hokkien.label,
    file: "read/minnan_dictionary.csv",
    readingLabel: DIALECTS.hokkien.readingLabel,
    altLabel: DIALECTS.hokkien.altLabel,
  },
  shanghai: {
    label: DIALECTS.shanghai.label,
    file: "read/shanghai_dictionary.csv",
    readingLabel: DIALECTS.shanghai.readingLabel,
    altLabel: DIALECTS.shanghai.altLabel,
  },
  shanghainese: {
    label: DIALECTS.shanghainese.label,
    file: "read/shanghai_dictionary.csv",
    readingLabel: DIALECTS.shanghainese.readingLabel,
    altLabel: DIALECTS.shanghainese.altLabel,
  },
  sichuan: {
    label: DIALECTS.sichuan.label,
    file: "read/sichuan_dictionary.csv",
    readingLabel: DIALECTS.sichuan.readingLabel,
    altLabel: DIALECTS.sichuan.altLabel,
  },
};

let yueDictionary = [];
let yueDictionaryLoaded = false;
let yueDictionaryLoadPromise = null;
let minnanDictionary = [];
let minnanDictionaryLoaded = false;
let minnanDictionaryLoadPromise = null;
const regionalDialectState = {
  minnan: { entries: minnanDictionary, loaded: minnanDictionaryLoaded, loadPromise: minnanDictionaryLoadPromise },
  hokkien: { entries: [], loaded: false, loadPromise: null },
  shanghai: { entries: [], loaded: false, loadPromise: null },
  shanghainese: { entries: [], loaded: false, loadPromise: null },
  sichuan: { entries: [], loaded: false, loadPromise: null },
};
const yueAudioAvailabilityCache = new Map();
const yueAudioResolveCache = new Map();
const yueWordPinyinMap = new Map();
const yueScriptCanonicalMap = new Map();
const yueSearchNormalizeCache = new Map();
/** 单字 → 词典条目（用于 RAG / findYueWords 单字） */
const yueDictEntriesByChar = new Map();
/** 整词（≥2 字）→ 词典条目 */
const yueDictEntriesByWord = new Map();
/** 精确匹配索引：词形（含简繁归一）→ 条目列表 */
const yueDictExactIndex = new Map();
/** 包含某字的词条索引（用于多字拆字搜索，避免全表扫描） */
const yueDictEntriesByContainingChar = new Map();
let yueMaxWordLength = 1;
let webAudioContext = null;
let webAudioPlaybackToken = 0;
const activeWebAudioSources = new Set();
const webAudioBufferCache = new Map();
const TTS_YUE_BASE_PATH = "tts/wordsyn/jyutping-wong-44100-v9/jyutping-wong";
const yuePinyinAliasMap = Object.freeze({
  // 词典中存在少量非标准拼写，这里统一到 TTS 音库可识别的拼写。
  a1: "aa1",
  bi1: "be1",
  bi4: "be4",
  zeu1: "zau1",
  zeu6: "zau6",
  gwak6: "gwat6",
  ik1: "jik1",
  ik6: "jik6",
  leu1: "leoi1",
  leu5: "leoi5",
  keu4: "keoi4",
  meu1: "miu1",
  nget4: "ngit4",
  ngek6: "ngak6",
  keng4: "king4",
  dep6: "dip6",
  det6: "deot6",
  det4: "deot4",
  kwang3: "kwaang3",
  lu4: "lou4",
  lu3: "lou3",
  gwek4: "gwik4",
  jen1: "jin1",
  ket4: "kat4",
  coet1: "ceot1",
  coet2: "ceot2",
  coet6: "ceot6",
  cet1: "ceot1",
  cet6: "ceot6",
  met6: "mat6",
  bet6: "bat6",
  bet4: "bat4",
  tet6: "tat6",
  zet4: "zeot4",
  mon1: "mong1",
  mu1: "mou1",
  kem4: "kim4",
  kem2: "kim2",
  zep4: "zip4",
  zep2: "zip2",
  fi3: "fai3",
  geot3: "goek3",
});
const yueScriptFallbackPairs = Object.freeze({
  马: "馬",
});

function getConfig() {
  const raw = localStorage.getItem(configKey);
  if (!raw) {
    return {
      apiKey: "",
      baseUrl: DEFAULT_BASE_URL,
      model: DEFAULT_MODEL,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    let baseUrl = parsed.baseUrl || DEFAULT_BASE_URL;
    if (baseUrl.includes("localhost")) {
      baseUrl = baseUrl.replace(/localhost/gi, "127.0.0.1");
    }
    return {
      apiKey: parsed.apiKey || "",
      baseUrl: baseUrl,
      model: parsed.model || DEFAULT_MODEL,
    };
  } catch {
    return {
      apiKey: "",
      baseUrl: DEFAULT_BASE_URL,
      model: DEFAULT_MODEL,
    };
  }
}

function setConfig(config) {
  localStorage.setItem(configKey, JSON.stringify(config));
}

function renderMessage(role, text, options = {}) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  if (options.guardrailBlocked) el.classList.add("msg-guardrail");

  const label = document.createElement("div");
  label.className = "msg-label";
  if (options.guardrailBlocked) {
    label.textContent = "Safety notice";
  } else {
    label.textContent = role === "user" ? "You" : "Tutor";
  }
  el.appendChild(label);

  const body = document.createElement("div");
  body.className = role === "assistant" ? "msg-body markdown-body" : "msg-body";
  if (role === "assistant" && typeof window.renderMarkdown === "function") {
    body.innerHTML = window.renderMarkdown(text);
  } else {
    body.textContent = text;
  }
  el.appendChild(body);

  if (options.guardrailWarning) {
    const warn = document.createElement("div");
    warn.className = "guardrail-warning";
    warn.textContent = `⚠️ ${options.guardrailWarning}`;
    el.appendChild(warn);
  }

  if (options.toolCalls?.length) {
    const toolsEl = document.createElement("div");
    toolsEl.className = "msg-tools";
    for (const toolName of options.toolCalls) {
      const chip = document.createElement("span");
      chip.className = "tool-chip";
      chip.textContent = `${formatToolLabel(toolName)}`;
      toolsEl.appendChild(chip);
    }
    el.appendChild(toolsEl);
  }

  if (options.toolResults?.length) {
    renderChatToolWidgets(el, options.toolResults);
  }

  if (role === "assistant" && options.feedback !== false && !options.guardrailBlocked) {
    const messageId = options.messageId || createMessageId();
    el.dataset.messageId = messageId;
    el.dataset.userInput = options.userInput || "";
    el.dataset.assistantReply = text;

    const feedbackEl = document.createElement("div");
    feedbackEl.className = "msg-feedback";
    feedbackEl.innerHTML = `
      <span class="msg-feedback-label">Was this helpful?</span>
      <button type="button" class="feedback-btn feedback-up" title="Helpful" aria-label="Helpful">Yes</button>
      <button type="button" class="feedback-btn feedback-down" title="Needs work" aria-label="Needs work">No</button>
    `;
    feedbackEl.querySelector(".feedback-up").addEventListener("click", () => {
      submitChatFeedback(messageId, "up", options.userInput || "", text, feedbackEl);
    });
    feedbackEl.querySelector(".feedback-down").addEventListener("click", () => {
      submitChatFeedback(messageId, "down", options.userInput || "", text, feedbackEl);
    });
    el.appendChild(feedbackEl);
  }

  chatHistoryEl.appendChild(el);
  chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
  return el;
}

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatToolLabel(toolName) {
  const labels = {
    search_dialect_dictionary: "Dictionary lookup",
    generate_practice_quiz: "Quiz maker",
    get_user_progress: "Learning progress",
    get_daily_quote: "Phrase of the day",
    get_common_phrases: "Common phrases",
    navigate_to_learning: "Open a learning page",
  };
  return labels[toolName] || toolName;
}

let activeToolStatusEl = null;

function showToolStatus(toolName) {
  removeToolStatus();
  activeToolStatusEl = document.createElement("div");
  activeToolStatusEl.className = "tool-status";
  activeToolStatusEl.textContent = `Using ${formatToolLabel(toolName)}…`;
  chatHistoryEl.appendChild(activeToolStatusEl);
  chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
}

function removeToolStatus() {
  if (activeToolStatusEl) {
    activeToolStatusEl.remove();
    activeToolStatusEl = null;
  }
}

function maskApiKey(key) {
  if (!key) return "No API key set";
  if (key.length <= 8) return "API key set";
  return `API key set (…${key.slice(-4)})`;
}

function updateConfigKeyStatus() {
  if (!configKeyStatusEl) return;
  const cfg = getConfig();
  configKeyStatusEl.textContent = maskApiKey(cfg.apiKey);
  configKeyStatusEl.classList.toggle("configured", Boolean(cfg.apiKey));
}

function normalizeUploadedConfig(raw) {
  const data = typeof raw === "object" && raw ? raw : {};
  const apiKey = data.apiKey || data.api_key || data.API_KEY || data.key || data.token || "";
  return {
    apiKey: String(apiKey).trim(),
    baseUrl: String(data.baseUrl || data.base_url || "").trim(),
    model: String(data.model || "").trim(),
    provider: String(data.provider || "").trim(),
  };
}

function applyUploadedConfig(parsed) {
  const current = getConfig();
  const next = {
    ...current,
    apiKey: parsed.apiKey || current.apiKey,
    baseUrl: parsed.baseUrl || current.baseUrl,
    model: parsed.model || current.model,
    provider:
      parsed.provider ||
      current.provider ||
      inferProvider(parsed.baseUrl || current.baseUrl, parsed.model || current.model),
  };
  setConfig(next);
  loadConfigToForm();
  showPixelToast(parsed.apiKey ? "Config file loaded" : "No API key found in the config file");
}

function loadConfigToForm() {
  const cfg = getConfig();
  baseUrlEl.value = cfg.baseUrl || DEFAULT_BASE_URL;
  modelEl.value = cfg.model || DEFAULT_MODEL;
  providerPresetEl.value = cfg.provider || inferProvider(cfg.baseUrl, cfg.model);
  updateConfigKeyStatus();
  updateModelGuide();
}

function inferProvider(baseUrl = "", model = "") {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  if (/api\.deepseek\.com/i.test(normalizedBaseUrl) || /^deepseek-/i.test(model)) {
    return "deepseek";
  }
  if (/api\.openai\.com/i.test(normalizedBaseUrl)) {
    return "openai";
  }
  return "ollama";
}

function isLikelyOpenAIEndpoint(baseUrl) {
  return /\/v1$/i.test(baseUrl) || /api\.(openai|deepseek)\.com$/i.test(baseUrl);
}

function buildRequestUrl(baseUrl) {
  const b = baseUrl.replace(/\/+$/, "");
  if (/api\.openai\.com$/i.test(b)) {
    return `${b}/v1/chat/completions`;
  }
  if (/api\.deepseek\.com$/i.test(b)) {
    return `${b}/chat/completions`;
  }
  if (/\/v1$/i.test(b)) {
    return `${b}/chat/completions`;
  }
  if (b === "/api" || /\/api$/i.test(b)) {
    return b === "/api" ? "/api/chat" : `${b}/chat`;
  }
  return `${b}/api/chat`;
}

function getErrorMessage(err) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function getFriendlyError(err) {
  const msg = getErrorMessage(err);
  if (msg.includes("Request timed out")) {
    return "The request timed out. Try:\n1. A smaller model (for example qwen2.5:0.5b)\n2. A shorter message\n3. Checking that your computer has enough free memory";
  }
  if (msg.includes("Cannot reach")) {
    return "Cannot reach the model service. Try:\n1. Make sure Ollama is running (run ollama serve in a terminal)\n2. Check the Base URL in Settings\n3. Make sure the model is downloaded (run ollama list)";
  }
  if (msg.includes("Model request failed (500)") || msg.includes("500")) {
    return "The model hit an internal error. Try:\n1. A smaller model (common when memory is low)\n2. Restarting Ollama\n3. Checking that the model finished downloading";
  }
  if (msg.includes("404")) {
    return "Model not found. Try:\n1. Checking the model name\n2. With Ollama, run ollama list to see installed models and ollama pull MODEL to download one\n3. With DeepSeek, use deepseek-chat or deepseek-reasoner";
  }
  if (msg.includes("405")) {
    return "The endpoint does not allow this request method (405). Common causes:\n1. The Base URL points at a website or docs page instead of the API root\n2. For Ollama use http://127.0.0.1:11434; if the URL already ends in /api, do not add /api again\n3. With the bundled backend, use /api or http://127.0.0.1:8080 and start node server.js first\n4. OpenAI-compatible gateways should end in /v1 (for example https://api.openai.com/v1)\n5. Behind Nginx, make sure the location allows POST and matches /api/chat or /v1/chat/completions";
  }
  if (msg.includes("401")) {
    return "Unauthorized (401). Check that your API key is correct and saved in Settings. For DeepSeek, the Base URL must be https://api.deepseek.com/v1 and the key must come from the DeepSeek platform.";
  }
  if (msg.includes("empty reply")) {
    return "The model returned an empty reply. Try:\n1. Restarting Ollama\n2. A different model";
  }
  if (msg.includes("https") && (msg.includes("localhost") || msg.includes("127.0.0.1"))) {
    return "Local addresses cannot use https. Change https to http in Settings.";
  }
  return `Request failed: ${msg}`;
}

function showLoading(show) {
  let loader = document.getElementById("pixelLoader");
  if (show) {
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "pixelLoader";
      loader.className = "pixel-loader";
      loader.innerHTML = '<div class="pixel-loader-dots"><span></span><span></span><span></span></div><div class="pixel-loader-text">Thinking…</div>';
      chatHistoryEl.parentElement.insertBefore(loader, chatHistoryEl.nextSibling);
    }
    loader.style.display = "flex";
  } else {
    if (loader) loader.style.display = "none";
  }
}

function showPixelToast(message) {
  let container = document.getElementById("pixelToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "pixelToastContainer";
    container.className = "pixel-toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "pixel-toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 400);
  }, 2000);
}

function extractContentFromResponse(data) {
  if (data && data.message && typeof data.message.content === "string") {
    return data.message.content.trim();
  }
  if (
    data &&
    Array.isArray(data.choices) &&
    data.choices[0] &&
    data.choices[0].message &&
    typeof data.choices[0].message.content === "string"
  ) {
    return data.choices[0].message.content.trim();
  }
  return "";
}

function extractAssistantMessage(data) {
  if (data?.message) {
    return {
      role: data.message.role || "assistant",
      content: data.message.content || "",
      tool_calls: data.message.tool_calls || null,
    };
  }
  const choice = data?.choices?.[0]?.message;
  if (choice) {
    return {
      role: choice.role || "assistant",
      content: choice.content || "",
      tool_calls: choice.tool_calls || null,
    };
  }
  return {
    role: "assistant",
    content: extractContentFromResponse(data),
    tool_calls: null,
  };
}

function toApiTools(mcpTools) {
  return (mcpTools || []).map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

let mcpToolsCache = null;

async function checkGuardrail(text, stage, context = {}) {
  try {
    const res = await fetch("/mcp/guardrail/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, text, context }),
    });
    if (!res.ok) {
      return {
        allowed: false,
        message: "The safety review service is unavailable, so the request was declined.",
        violations: [{ id: "ai_guardrail_unavailable", severity: "block" }],
      };
    }
    return await res.json();
  } catch {
    return {
      allowed: false,
      message: "Cannot reach the safety review service, so the request was declined.",
      violations: [{ id: "ai_guardrail_unavailable", severity: "block" }],
    };
  }
}

async function submitChatFeedback(messageId, rating, userInput, assistantReply, feedbackEl) {
  if (feedbackEl.dataset.submitted === "1") return;
  try {
    const res = await fetch("/mcp/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        messageId,
        userInput,
        assistantReply,
        source: "chat",
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      showPixelToast(data.error || "Could not send feedback");
      return;
    }
    feedbackEl.dataset.submitted = "1";
    feedbackEl.classList.add(rating === "up" ? "feedback-sent-up" : "feedback-sent-down");
    feedbackEl.querySelector(".msg-feedback-label").textContent =
      rating === "up" ? "Thanks for the feedback!" : "Thanks. We will keep improving.";
    feedbackEl.querySelectorAll(".feedback-btn").forEach((btn) => {
      btn.disabled = true;
    });
  } catch {
    showPixelToast("Could not send feedback. Please try again later.");
  }
}

// 所有工具调用均通过服务端 MCP 接口（/mcp/tools + /mcp/call），无客户端离线实现

async function fetchMcpTools() {
  if (mcpToolsCache) return mcpToolsCache;
  try {
    const res = await fetch("/mcp/tools");
    if (!res.ok) return [];
    const data = await res.json();
    mcpToolsCache = Array.isArray(data.tools) ? data.tools : [];
    return mcpToolsCache;
  } catch {
    return [];
  }
}

async function fetchChatTools() {
  return fetchMcpTools();
}

function getUserProgressPayload() {
  const stats = typeof getProgressStats === "function" ? getProgressStats() : {};
  let favoritesCount = 0;
  let wordbookCount = 0;
  try {
    favoritesCount = JSON.parse(localStorage.getItem("dls-ai-favorites") || "[]").length;
    wordbookCount = JSON.parse(localStorage.getItem("dls-ai-wordbook") || "[]").length;
  } catch {
    /* ignore */
  }
  return {
    ...stats,
    favoritesCount,
    wordbookCount,
    quizCompleted: stats.quizCompleted || stats.quizCount || 0,
  };
}

async function callMcpTool(name, args = {}) {
  const payload = { ...args };
  if (name === "get_user_progress") {
    payload.progress = getUserProgressPayload();
  }
  const res = await fetch("/mcp/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: name, arguments: payload }),
  });
  if (!res.ok) {
    throw new Error(`Tool ${name} failed (${res.status})`);
  }
  const data = await res.json();
  return data.result ?? data;
}

function parseToolArguments(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function requestChatCompletion(messages, options = {}) {
  const cfg = getConfig();
  const baseUrl = (cfg.baseUrl || "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Base URL cannot be empty. Enter http://localhost:11434");
  }
  if (/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl)) {
    throw new Error(
      "A local address is using https. Ollama uses http by default, so use http://localhost:11434",
    );
  }

  const useOpenAIStyle = isLikelyOpenAIEndpoint(baseUrl);
  const url = buildRequestUrl(baseUrl);
  const headers = {
    "Content-Type": "application/json",
  };
  if (cfg.apiKey) {
    headers.Authorization = `Bearer ${cfg.apiKey}`;
  }

  const model = cfg.model || DEFAULT_MODEL;
  const body = {
    model,
    messages,
    stream: false,
  };

  if (options.tools?.length) {
    body.tools = options.tools;
    if (useOpenAIStyle) {
      body.tool_choice = "auto";
    }
  }

  if (useOpenAIStyle) {
    body.temperature = 0.3;
  } else {
    body.keep_alive = -1;
    body.think = false;
    body.options = { temperature: 0.3 };
  }

  let res;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const reason =
      error instanceof DOMException && error.name === "AbortError"
        ? `Request timed out (over ${REQUEST_TIMEOUT_MS / 1000} seconds)`
        : getErrorMessage(error);
    throw new Error(
      `Cannot reach the model service (${reason}). Check that: 1) the Base URL is correct; 2) local Ollama is running (if you use Ollama); 3) if this page is on GitHub Pages (https), the browser blocks access to local http.`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const rawText = await res.text();

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = null;
  }

  if (!res.ok) {
    const apiError =
      (data && data.error && (data.error.message || data.error.code)) ||
      rawText.slice(0, 200);
    throw new Error(`Model request failed (${res.status}): ${apiError}`);
  }

  if (!data) {
    const preview = rawText.slice(0, 200).replace(/\s+/g, " ");
    throw new Error(
      `The endpoint did not return JSON. Check the Ollama address and model settings. Response preview: ${preview}`,
    );
  }

  return data;
}

const MAX_TOOL_ROUNDS = 6;

async function runChatWithTools(messages, onToolCall) {
  const chatTools = await fetchChatTools();
  let apiTools = chatTools.length ? toApiTools(chatTools) : null;
  const usedTools = [];
  const toolResults = [];
  const workingMessages = [...messages];
  let toolsDisabled = false;
  let finalAnswerAttempts = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    let data;
    try {
      data = await requestChatCompletion(workingMessages, {
        tools: toolsDisabled ? null : apiTools,
      });
    } catch (err) {
      if (apiTools && !toolsDisabled && round === 0) {
        toolsDisabled = true;
        data = await requestChatCompletion(workingMessages, { tools: null });
      } else {
        throw err;
      }
    }

    const assistantMsg = extractAssistantMessage(data);
    const toolCalls = toolsDisabled ? null : assistantMsg.tool_calls;

    if (!toolCalls?.length) {
      const content = (assistantMsg.content || "").trim();
      if (!content && usedTools.length && finalAnswerAttempts < 1) {
        toolsDisabled = true;
        finalAnswerAttempts += 1;
        workingMessages.push({
          role: "user",
          content: "Using the tool results above, write a complete final answer in English. Include at least one useful piece of information. Do not call tools and do not return empty content.",
        });
        continue;
      }
      if (!content && usedTools.length) {
        throw new Error("The model could not write a final answer from the tool results. Try a model that supports tool calling.");
      }
      return {
        content,
        usedTools,
        toolResults,
        toolsDisabled,
      };
    }

    workingMessages.push({
      role: "assistant",
      content: assistantMsg.content || "",
      tool_calls: toolCalls,
    });

    for (const toolCall of toolCalls) {
      const fn = toolCall.function || {};
      const toolName = fn.name;
      const toolArgs = parseToolArguments(fn.arguments);
      usedTools.push(toolName);
      onToolCall?.(toolName, toolArgs);
      const result = await executeChatTool(toolName, toolArgs);
      toolResults.push({ name: toolName, args: toolArgs, result });
      const toolMessage = {
        role: "tool",
        content: JSON.stringify(result, null, 2),
      };
      if (toolCall.id) toolMessage.tool_call_id = toolCall.id;
      if (toolName) toolMessage.name = toolName;
      workingMessages.push(toolMessage);
    }

    // 工具结果一旦回传就锁定为最终回答阶段，避免小模型再次陷入工具调用循环。
    toolsDisabled = true;
    workingMessages.push({
      role: "user",
      content: "The tool results are back. Write a complete final answer from them in English. Do not call tools again and do not return empty content.",
    });
  }

  throw new Error("Too many tool calls. Please simplify the question and try again.");
}

async function callChatAPI(messages) {
  const data = await requestChatCompletion(messages);
  const content = extractContentFromResponse(data);
  if (!content) {
    throw new Error("The model returned an empty reply. Check the Ollama endpoint and model settings.");
  }
  return content.trim();
}

function localTranslate(input, direction) {
  function applyDict(text, dict) {
    let out = text;
    const entries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
    for (const [k, v] of entries) {
      out = out.split(k).join(v);
    }
    return out;
  }

  if (direction === "zh_to_yue") return applyDict(input, localZhToYueMap);
  if (direction === "yue_to_zh") return applyDict(input, localYueToZhMap);
  if (direction === "zh_to_minnan") return applyDict(input, localZhToMinnanMap);
  if (direction === "minnan_to_zh") return applyDict(input, localMinnanToZhMap);
  if (direction === "zh_to_hokkien") return applyDict(input, localZhToMinnanMap);
  if (direction === "hokkien_to_zh") return applyDict(input, localMinnanToZhMap);
  if (direction === "zh_to_shanghai") return applyDict(input, localZhToShMap);
  if (direction === "shanghai_to_zh") return applyDict(input, localShToZhMap);
  if (direction === "zh_to_shanghainese") return applyDict(input, localZhToShMap);
  if (direction === "shanghainese_to_zh") return applyDict(input, localShToZhMap);
  if (direction === "zh_to_sichuan") return applyDict(input, localZhToSichuanMap);
  if (direction === "sichuan_to_zh") return applyDict(input, localSichuanToZhMap);
  return input;
}

function getTranslatePrompt(direction) {
  const promptMap = {
    zh_to_yue:
      "你是专业的粤语翻译助手。请把用户输入的标准中文翻译成地道粤语。\n规则：\n1. 使用粤语特有字词（如：係、嘅、喺、唔、咗、啲、嘢、噉、喇、嚟、佢等）\n2. 使用粤语音译词（如：的士、巴士、朱古力等）\n3. 保持粤语语法结构（如：我哋、呢个、嗰个、点解等）\n4. 如有词典参考信息，请优先参考其中的粤拼和用法\n5. 只输出翻译结果，不要解释",
    yue_to_zh:
      "你是专业的粤语翻译助手。请把用户输入的粤语翻译成标准中文（普通话）。\n规则：\n1. 将粤语特有字词转换为标准中文（如：係→是、嘅→的、喺→在、唔→不、咗→了等）\n2. 将粤语音译词转为标准中文（如：的士→出租车、巴士→公交车等）\n3. 将粤语语法转为标准中文语法（如：我哋→我们、呢个→这个等）\n4. 如有词典参考信息，请优先参考其中的含义\n5. 只输出翻译结果，不要解释",
    zh_to_taishanese:
      "你是专业的台山话（Taishanese）翻译助手。请把用户输入的标准中文翻译成自然的台山话。\n规则：\n1. 使用台山话常见口语词和粤西/四邑地区表达，避免混成标准广州粤语\n2. 必要时给出常用汉字写法，并可在括号内补充读音提示或本地罗马化\n3. 如有词典参考信息，请优先参考其中的注音和释义\n4. 保持语义准确、适合日常学习场景\n5. 只输出翻译结果，不要解释",
    taishanese_to_zh:
      "你是专业的台山话（Taishanese）翻译助手。请把用户输入的台山话翻译成标准中文（普通话）。\n规则：\n1. 识别台山话常见词形、口语表达和读音转写\n2. 将口语表达翻译成自然标准中文\n3. 如有词典参考信息，请优先参考其中的释义\n4. 只输出翻译结果，不要解释",
    zh_to_minnan:
      "你是专业的闽南语翻译助手。请把用户输入的标准中文翻译成自然的闽南语/台语。\n规则：\n1. 使用常见闽南语词形（如：食飯、歹勢、多謝、今仔日、佗位等）\n2. 必要时保留汉字写法，并可在括号内给出台罗注音\n3. 如有词典参考信息，请优先参考其中的台罗、白话字和释义\n4. 保持语义准确、适合日常学习场景\n5. 只输出翻译结果，不要解释",
    minnan_to_zh:
      "你是专业的闽南语翻译助手。请把用户输入的闽南语/台语翻译成标准中文（普通话）。\n规则：\n1. 识别闽南语常见汉字词与台罗/白话字注音\n2. 如有词典参考信息，请优先参考其中的释义\n3. 将口语表达翻译成自然标准中文\n4. 只输出翻译结果，不要解释",
    zh_to_hokkien:
      "你是专业的 Hokkien（闽南话）翻译助手。请把用户输入的标准中文翻译成自然的闽南话。\n规则：\n1. 使用常见闽南话词形（如：食飯、歹勢、多謝、今仔日、佗位等）\n2. 必要时保留汉字写法，并可在括号内给出台罗或白话字注音\n3. 如有词典参考信息，请优先参考其中的台罗、白话字和释义\n4. 保持语义准确、适合日常学习场景\n5. 只输出翻译结果，不要解释",
    hokkien_to_zh:
      "你是专业的 Hokkien（闽南话）翻译助手。请把用户输入的闽南话翻译成标准中文（普通话）。\n规则：\n1. 识别闽南话常见汉字词与台罗/白话字注音\n2. 如有词典参考信息，请优先参考其中的释义\n3. 将口语表达翻译成自然标准中文\n4. 只输出翻译结果，不要解释",
    zh_to_shanghai:
      "你是专业的上海话翻译助手。请把用户输入的标准中文翻译成自然的上海话。\n规则：\n1. 使用常见上海话词形（如：侬好、阿拉、今朝、哪能、啥物事等）\n2. 必要时在括号内给出读音提示或 IPA\n3. 如有词典参考信息，请优先参考其中的罗马化、IPA 和释义\n4. 保持语义准确、适合日常学习场景\n5. 只输出翻译结果，不要解释",
    shanghai_to_zh:
      "你是专业的上海话翻译助手。请把用户输入的上海话翻译成标准中文（普通话）。\n规则：\n1. 识别上海话常见词形和口语表达\n2. 如有词典参考信息，请优先参考其中的释义\n3. 将口语表达翻译成自然标准中文\n4. 只输出翻译结果，不要解释",
    zh_to_shanghainese:
      "你是专业的 Shanghainese（上海话）翻译助手。请把用户输入的标准中文翻译成自然的上海话。\n规则：\n1. 使用常见上海话词形（如：侬好、阿拉、今朝、哪能、啥物事等）\n2. 必要时在括号内给出读音提示、罗马化或 IPA\n3. 如有词典参考信息，请优先参考其中的罗马化、IPA 和释义\n4. 保持语义准确、适合日常学习场景\n5. 只输出翻译结果，不要解释",
    shanghainese_to_zh:
      "你是专业的 Shanghainese（上海话）翻译助手。请把用户输入的上海话翻译成标准中文（普通话）。\n规则：\n1. 识别上海话常见词形和口语表达\n2. 如有词典参考信息，请优先参考其中的释义\n3. 将口语表达翻译成自然标准中文\n4. 只输出翻译结果，不要解释",
    zh_to_teochew:
      "你是专业的潮州话（Teochew）翻译助手。请把用户输入的标准中文翻译成自然的潮州话。\n规则：\n1. 使用潮汕地区常见潮州话词形和口语表达，避免混成闽南话或粤语\n2. 必要时保留汉字写法，并可在括号内给出潮州话拼音、白话字或读音提示\n3. 如有词典参考信息，请优先参考其中的注音和释义\n4. 保持语义准确、适合日常学习场景\n5. 只输出翻译结果，不要解释",
    teochew_to_zh:
      "你是专业的潮州话（Teochew）翻译助手。请把用户输入的潮州话翻译成标准中文（普通话）。\n规则：\n1. 识别潮州话常见汉字词、口语表达和注音转写\n2. 如有词典参考信息，请优先参考其中的释义\n3. 将口语表达翻译成自然标准中文\n4. 只输出翻译结果，不要解释",
    zh_to_wenzhounese:
      "你是专业的温州话（Wenzhounese）翻译助手。请把用户输入的标准中文翻译成自然的温州话。\n规则：\n1. 使用温州话常见吴语词形和口语表达，避免混成普通上海话\n2. 必要时保留汉字写法，并可在括号内给出读音提示、罗马化或 IPA\n3. 如有词典参考信息，请优先参考其中的注音和释义\n4. 保持语义准确、适合日常学习场景\n5. 只输出翻译结果，不要解释",
    wenzhounese_to_zh:
      "你是专业的温州话（Wenzhounese）翻译助手。请把用户输入的温州话翻译成标准中文（普通话）。\n规则：\n1. 识别温州话常见词形、口语表达和读音转写\n2. 如有词典参考信息，请优先参考其中的释义\n3. 将口语表达翻译成自然标准中文\n4. 只输出翻译结果，不要解释",
    zh_to_sichuan:
      "你是专业的四川话翻译助手。请把用户输入的标准中文翻译成自然的四川话。\n规则：\n1. 使用常见四川话表达（如：啷个、啥子、要得、莫得、巴适、安逸等）\n2. 必要时给出读音提示\n3. 如有词典参考信息，请优先参考其中的读音和释义\n4. 保持语义准确、适合日常学习场景\n5. 只输出翻译结果，不要解释",
    sichuan_to_zh:
      "你是专业的四川话翻译助手。请把用户输入的四川话翻译成标准中文（普通话）。\n规则：\n1. 识别四川话常见口语词和语气表达\n2. 如有词典参考信息，请优先参考其中的释义\n3. 将口语表达翻译成自然标准中文\n4. 只输出翻译结果，不要解释",
  };
  return (
    promptMap[direction] ||
    "你是翻译助手。请将用户输入翻译成目标语言，保持原意、表达自然。只输出翻译结果。"
  );
}

function getTranslateDirectionName(direction) {
  const directionMap = {
    zh_to_yue: "Mandarin → Cantonese",
    yue_to_zh: "Cantonese → Mandarin",
    zh_to_taishanese: "Mandarin → Taishanese",
    taishanese_to_zh: "Taishanese → Mandarin",
    zh_to_minnan: "Mandarin → Minnan",
    minnan_to_zh: "Minnan → Mandarin",
    zh_to_hokkien: "Mandarin → Hokkien",
    hokkien_to_zh: "Hokkien → Mandarin",
    zh_to_shanghai: "Mandarin → Shanghai dialect",
    shanghai_to_zh: "Shanghai dialect → Mandarin",
    zh_to_shanghainese: "Mandarin → Shanghainese",
    shanghainese_to_zh: "Shanghainese → Mandarin",
    zh_to_teochew: "Mandarin → Teochew",
    teochew_to_zh: "Teochew → Mandarin",
    zh_to_wenzhounese: "Mandarin → Wenzhounese",
    wenzhounese_to_zh: "Wenzhounese → Mandarin",
    zh_to_sichuan: "Mandarin → Sichuanese",
    sichuan_to_zh: "Sichuanese → Mandarin",
  };
  return directionMap[direction] || direction;
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/** word_list.csv 为简单两列格式，跳过引号解析以加速大批量加载 */
function parseSimpleTwoColumnLine(line) {
  const commaIdx = line.indexOf(",");
  if (commaIdx === -1) return null;
  const word = line.slice(0, commaIdx).trim();
  const pinyin = line.slice(commaIdx + 1).trim();
  if (!word || !pinyin) return null;
  return [word, pinyin];
}

function rebuildYueScriptCanonicalMap() {
  yueScriptCanonicalMap.clear();
  yueSearchNormalizeCache.clear();

  const parent = new Map();
  const find = (ch) => {
    if (!parent.has(ch)) {
      parent.set(ch, ch);
      return ch;
    }
    const p = parent.get(ch);
    if (p === ch) return ch;
    const root = find(p);
    parent.set(ch, root);
    return root;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    const root = ra < rb ? ra : rb;
    const child = root === ra ? rb : ra;
    parent.set(child, root);
  };

  for (const item of yueDictionary) {
    const simp = (item.simp || "").trim();
    const trad = (item.trad || "").trim();
    if (!simp || !trad || simp.length !== trad.length) continue;

    for (let i = 0; i < simp.length; i++) {
      const s = simp[i];
      const t = trad[i];
      if (s && t && s !== t) {
        union(s, t);
      }
    }
  }

  for (const [simp, trad] of Object.entries(yueScriptFallbackPairs)) {
    if (simp && trad && simp !== trad) {
      union(simp, trad);
    }
  }

  const groups = new Map();
  for (const ch of parent.keys()) {
    const root = find(ch);
    if (!groups.has(root)) {
      groups.set(root, new Set());
    }
    groups.get(root).add(ch);
  }

  for (const charSet of groups.values()) {
    const chars = Array.from(charSet).sort();
    const canonical = chars[0];
    for (const ch of chars) {
      yueScriptCanonicalMap.set(ch, canonical);
    }
  }
}

function normalizeYueSearchText(text) {
  const raw = (text || "").trim();
  if (!raw) return "";
  if (yueSearchNormalizeCache.has(raw)) {
    return yueSearchNormalizeCache.get(raw);
  }

  const normalized = Array.from(raw, (ch) => yueScriptCanonicalMap.get(ch) || ch).join("");
  yueSearchNormalizeCache.set(raw, normalized);
  return normalized;
}

function rebuildYueDictRagLookupMaps() {
  yueDictEntriesByChar.clear();
  yueDictEntriesByWord.clear();
  for (const entry of yueDictionary) {
    const simp = (entry.simp || "").trim();
    const trad = (entry.trad || "").trim();

    const addCharKey = (ch) => {
      if (!ch || [...ch].length !== 1) return;
      if (!yueDictEntriesByChar.has(ch)) yueDictEntriesByChar.set(ch, []);
      yueDictEntriesByChar.get(ch).push(entry);
    };
    const addWordKey = (w) => {
      if (!w || [...w].length < 2) return;
      if (!yueDictEntriesByWord.has(w)) yueDictEntriesByWord.set(w, []);
      yueDictEntriesByWord.get(w).push(entry);
    };

    if (simp.length === 1) addCharKey(simp);
    if (trad.length === 1 && trad !== simp) addCharKey(trad);
    addWordKey(simp);
    if (trad !== simp) addWordKey(trad);
  }
}

function addToExactIndex(key, entry) {
  if (!key) return;
  if (!yueDictExactIndex.has(key)) yueDictExactIndex.set(key, []);
  yueDictExactIndex.get(key).push(entry);
}

function rebuildYueDictSearchIndex() {
  yueDictExactIndex.clear();
  yueDictEntriesByContainingChar.clear();

  for (const entry of yueDictionary) {
    entry.normSimp = normalizeYueSearchText(entry.simp);
    entry.normTrad = normalizeYueSearchText(entry.trad);

    for (const key of [entry.simp, entry.trad, entry.normSimp, entry.normTrad]) {
      addToExactIndex(key, entry);
    }

    const containedChars = new Set();
    for (const ch of entry.simp) {
      if (/[\u4e00-\u9fff]/.test(ch)) containedChars.add(ch);
    }
    for (const ch of entry.trad) {
      if (/[\u4e00-\u9fff]/.test(ch)) containedChars.add(ch);
    }
    for (const ch of containedChars) {
      if (!yueDictEntriesByContainingChar.has(ch)) {
        yueDictEntriesByContainingChar.set(ch, []);
      }
      yueDictEntriesByContainingChar.get(ch).push(entry);
    }
  }
}

function loadYueDictionary() {
  if (yueDictionaryLoaded) return Promise.resolve();
  if (yueDictionaryLoadPromise) return yueDictionaryLoadPromise;

  yueDictionaryLoadPromise = Promise.all([
    fetch("read/yyzd.csv").then((response) => response.text()),
    fetch("read/word_list.csv").then((response) => response.text()),
  ])
    .then(([yyzdText, wordListText]) => {
      const yyzdLines = yyzdText.split(/\r?\n/);
      const wordListLines = wordListText.split(/\r?\n/);
      const dedupe = new Set();

      yueDictionary = [];
      yueWordPinyinMap.clear();
      yueSearchNormalizeCache.clear();
      yueMaxWordLength = 1;

      const addEntry = (entry) => {
        const simp = (entry.simp || "").trim();
        const trad = (entry.trad || "").trim();
        const pinyin = (entry.pinyin || "").trim();
        const example = (entry.example || "").trim();
        const explanation = (entry.explanation || "").trim();
        const alt = (entry.alt || "").trim();

        if (!simp || !pinyin) return;

        const dedupeKey = `${simp}|${trad || simp}|${pinyin}|${example}|${explanation}|${alt}`;
        if (dedupe.has(dedupeKey)) return;
        dedupe.add(dedupeKey);

        yueDictionary.push({
          simp,
          trad: trad || simp,
          pinyin,
          example,
          explanation,
          alt,
        });

        for (const word of [simp, trad || simp]) {
          const normalized = (word || "").trim();
          if (!normalized) continue;
          if (!yueWordPinyinMap.has(normalized)) {
            yueWordPinyinMap.set(normalized, pinyin);
            yueMaxWordLength = Math.max(yueMaxWordLength, normalized.length);
          }
        }
      };

      // yyzd.csv: 简体,繁体,拼音,词语示例,解释,其他对应字
      for (let i = 1; i < yyzdLines.length; i++) {
        const line = yyzdLines[i].trim();
        if (!line) continue;

        const parts = parseCsvLine(line);
        if (parts.length < 3) continue;
        addEntry({
          simp: parts[0],
          trad: parts[1],
          pinyin: parts[2],
          example: parts[3] || "",
          explanation: parts[4] || "",
          alt: parts[5] || "",
        });
      }

      // word_list.csv: 词语, 粤拼（两列，无引号嵌套，使用快速解析）
      for (let i = 1; i < wordListLines.length; i++) {
        const line = wordListLines[i].trim();
        if (!line) continue;

        const parts = parseSimpleTwoColumnLine(line);
        if (!parts) continue;
        addEntry({
          simp: parts[0],
          trad: parts[0],
          pinyin: parts[1],
          example: "",
          explanation: "",
          alt: "",
        });
      }

      rebuildYueScriptCanonicalMap();
      rebuildYueDictRagLookupMaps();
      rebuildYueDictSearchIndex();
      yueDictionaryLoaded = true;
      console.log(`粤语词典加载完成，共 ${yueDictionary.length} 条记录（yyzd + word_list）`);
    })
    .catch((err) => {
      yueDictionaryLoadPromise = null;
      yueDictionaryLoaded = false;
      console.error("加载粤语词典失败:", err);
      throw err;
    });

  return yueDictionaryLoadPromise;
}

function loadMinnanDictionary() {
  if (minnanDictionaryLoaded) return Promise.resolve();
  if (minnanDictionaryLoadPromise) return minnanDictionaryLoadPromise;

  minnanDictionaryLoadPromise = fetch("read/minnan_dictionary.csv")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then((text) => {
      minnanDictionary = text
        .split(/\r?\n/)
        .slice(1)
        .map((line) => parseCsvLine(line))
        .filter((parts) => parts.length >= 4 && parts[0])
        .map(([hanji, tailo, poj, zh, category, source]) => ({
          simp: hanji,
          trad: hanji,
          pinyin: tailo,
          alt: poj,
          explanation: zh,
          category: category || "",
          source: source || "",
        }));
      minnanDictionaryLoaded = true;
      console.log(`闽南语词典加载完成，共 ${minnanDictionary.length} 条记录`);
    })
    .catch((err) => {
      minnanDictionaryLoadPromise = null;
      minnanDictionaryLoaded = false;
      console.error("加载闽南语词典失败:", err);
      throw err;
    });

  return minnanDictionaryLoadPromise;
}

function searchMinnanDictionaryEntries(query, options = {}) {
  const normalizedQuery = (query || "").trim().toLowerCase();
  if (!normalizedQuery) return [];

  const { limit = 200 } = options;
  const results = [];
  const seen = new Set();
  for (const item of minnanDictionary) {
    const haystack = [
      item.simp,
      item.trad,
      item.pinyin,
      item.alt,
      item.explanation,
      item.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(normalizedQuery)) continue;
    const key = `${item.simp}|${item.pinyin}|${item.explanation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item);
    if (results.length >= limit) break;
  }
  return results;
}

function extractMinnanDictContext(text) {
  if (!minnanDictionary || minnanDictionary.length === 0) return "";
  const raw = (text || "").trim();
  if (!raw) return "";

  const matchedEntries = [];
  const seen = new Set();
  const tokens = raw.match(/[\u4e00-\u9fff]{1,4}|[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùḿńⁿ]+/g) || [];
  for (const token of tokens) {
    const found = searchMinnanDictionaryEntries(token, { limit: 4 });
    for (const entry of found) {
      const key = `${entry.simp}|${entry.pinyin}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matchedEntries.push(entry);
    }
  }

  return matchedEntries
    .slice(0, 12)
    .map((entry) => {
      const alt = entry.alt ? ` / Pe̍h-ōe-jī: ${entry.alt}` : "";
      return `${entry.simp} Tâi-lô: ${entry.pinyin}${alt} - ${entry.explanation}`;
    })
    .join("\n");
}

function renderMinnanDictResult(results) {
  if (!Array.isArray(results) || results.length === 0) {
    yueDictResultEl.innerHTML = "";
    noYueDictResultEl.style.display = "block";
    noYueDictResultEl.textContent = "No Minnan entry found";
    return;
  }

  noYueDictResultEl.style.display = "none";
  yueDictResultEl.innerHTML = results
    .map((item) => `
      <div class="yue-dict-item">
        <h4>${item.simp}</h4>
        <p class="pinyin">Tâi-lô: ${item.pinyin || "n/a"}${item.alt ? ` / Pe̍h-ōe-jī: ${item.alt}` : ""}</p>
        <p class="example">Category: ${item.category || "General"}</p>
        <p class="explanation">${item.explanation || "No definition yet"}</p>
        <p class="example">Source: ${item.source || "Local collection"}</p>
        <div class="audio-action">
          <button class="play-btn" disabled title="No standard Minnan audio">No audio</button>
        </div>
      </div>
    `)
    .join("");
}

function isRegionalDialect(dialect) {
  return Boolean(REGIONAL_DIALECTS[dialect]);
}

function getRegionalDialectState(dialect) {
  if (!regionalDialectState[dialect]) {
    regionalDialectState[dialect] = { entries: [], loaded: false, loadPromise: null };
  }
  return regionalDialectState[dialect];
}

function getRegionalDialectEntries(dialect) {
  if (dialect === "minnan") return minnanDictionary;
  return getRegionalDialectState(dialect).entries;
}

function loadRegionalDialectDictionary(dialect) {
  if (dialect === "minnan") {
    return loadMinnanDictionary().then(() => {
      const state = getRegionalDialectState("minnan");
      state.entries = minnanDictionary;
      state.loaded = minnanDictionaryLoaded;
      state.loadPromise = minnanDictionaryLoadPromise;
    });
  }

  const meta = REGIONAL_DIALECTS[dialect];
  if (!meta) return Promise.reject(new Error(`Unknown dialect: ${dialect}`));

  const state = getRegionalDialectState(dialect);
  if (state.loaded) return Promise.resolve();
  if (state.loadPromise) return state.loadPromise;

  state.loadPromise = fetch(meta.file)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then((text) => {
      state.entries = text
        .split(/\r?\n/)
        .slice(1)
        .map((line) => parseCsvLine(line))
        .filter((parts) => parts.length >= 4 && parts[0])
        .map(([term, romanization, ipa, zh, category, source]) => ({
          simp: term,
          trad: term,
          pinyin: romanization,
          alt: ipa,
          explanation: zh,
          category: category || "",
          source: source || "",
        }));
      state.loaded = true;
      console.log(`${meta.label}词典加载完成，共 ${state.entries.length} 条记录`);
    })
    .catch((err) => {
      state.loadPromise = null;
      state.loaded = false;
      console.error(`加载${meta.label}词典失败:`, err);
      throw err;
    });

  return state.loadPromise;
}

function searchRegionalDialectEntries(dialect, query, options = {}) {
  const normalizedQuery = (query || "").trim().toLowerCase();
  if (!normalizedQuery) return [];

  const { limit = 200 } = options;
  const results = [];
  const seen = new Set();
  for (const item of getRegionalDialectEntries(dialect)) {
    const haystack = [
      item.simp,
      item.trad,
      item.pinyin,
      item.alt,
      item.explanation,
      item.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(normalizedQuery)) continue;
    const key = `${item.simp}|${item.pinyin}|${item.explanation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item);
    if (results.length >= limit) break;
  }
  return results;
}

function extractRegionalDialectContext(dialect, text) {
  const entries = getRegionalDialectEntries(dialect);
  if (!entries || entries.length === 0) return "";
  const raw = (text || "").trim();
  if (!raw) return "";

  const matchedEntries = [];
  const seen = new Set();
  const tokens = raw.match(/[\u4e00-\u9fff]{1,4}|[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùḿńⁿ]+/g) || [];
  for (const token of tokens) {
    const found = searchRegionalDialectEntries(dialect, token, { limit: 4 });
    for (const entry of found) {
      const key = `${entry.simp}|${entry.pinyin}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matchedEntries.push(entry);
    }
  }

  const meta = REGIONAL_DIALECTS[dialect];
  return matchedEntries
    .slice(0, 12)
    .map((entry) => {
      const alt = entry.alt ? ` / ${meta.altLabel}:${entry.alt}` : "";
      return `${entry.simp} ${meta.readingLabel}:${entry.pinyin}${alt} - ${entry.explanation}`;
    })
    .join("\n");
}

function renderRegionalDialectResult(dialect, results) {
  const meta = REGIONAL_DIALECTS[dialect];
  if (!Array.isArray(results) || results.length === 0) {
    yueDictResultEl.innerHTML = "";
    noYueDictResultEl.style.display = "block";
    noYueDictResultEl.textContent = `No ${meta.label} entry found`;
    return;
  }

  noYueDictResultEl.style.display = "none";
  yueDictResultEl.innerHTML = results
    .map((item) => `
      <div class="yue-dict-item">
        <h4>${item.simp}</h4>
        <p class="pinyin">${meta.readingLabel}: ${item.pinyin || "n/a"}${item.alt ? ` / ${meta.altLabel}: ${item.alt}` : ""}</p>
        <p class="example">Category: ${item.category || "General"}</p>
        <p class="explanation">${item.explanation || "No definition yet"}</p>
        <p class="example">Source: ${item.source || "Local collection"}</p>
        <div class="audio-action">
          <button class="play-btn" disabled title="No standard ${meta.label} audio">No audio</button>
        </div>
      </div>
    `)
    .join("");
}

function findYueWords(word) {
  if (!yueDictionaryLoaded) return [];
  const w = (word || "").trim();
  if (!w) return [];
  if ([...w].length >= 2) return yueDictEntriesByWord.get(w) || [];
  return yueDictEntriesByChar.get(w) || [];
}

function searchYueDictionaryEntries(query, options = {}) {
  if (!yueDictionaryLoaded) return [];

  const normalizedQuery = (query || "").trim();
  if (!normalizedQuery) return [];
  const normalizedScriptQuery = normalizeYueSearchText(normalizedQuery);

  const { limit = 200 } = options;
  const resultMap = new Map();

  const makeKey = (item) =>
    `${item.simp}|${item.trad}|${item.pinyin}|${item.example}|${item.explanation}|${item.alt}`;
  const addResult = (item) => {
    const key = makeKey(item);
    if (!resultMap.has(key)) {
      resultMap.set(key, item);
    }
  };

  const isContainsMatch = (item, text, normalizedText) =>
    item.simp.includes(text) ||
    item.trad.includes(text) ||
    item.normSimp.includes(normalizedText) ||
    item.normTrad.includes(normalizedText);

  // 1) 整词精确命中：O(1) 索引查找
  for (const key of [normalizedQuery, normalizedScriptQuery]) {
    for (const item of yueDictExactIndex.get(key) || []) {
      addResult(item);
    }
  }

  // 2) 包含整词查询：单次遍历 + 预计算归一化字段
  for (const item of yueDictionary) {
    if (isContainsMatch(item, normalizedQuery, normalizedScriptQuery)) {
      addResult(item);
    }
  }

  // 3) 多字查询：按字索引拆字，避免重复全表扫描
  const singleChars = [...new Set(normalizedQuery.match(/[\u4e00-\u9fff]/g) || [])];
  if (singleChars.length > 1) {
    const charsWithExactEntry = new Set();

    for (const ch of singleChars) {
      const normalizedScriptCh = normalizeYueSearchText(ch);
      for (const key of [ch, normalizedScriptCh]) {
        for (const item of yueDictExactIndex.get(key) || []) {
          addResult(item);
          charsWithExactEntry.add(ch);
        }
      }
    }

    for (const ch of singleChars) {
      if (!charsWithExactEntry.has(ch)) {
        addResult({
          simp: ch,
          trad: ch,
          pinyin: "",
          example: "",
          explanation: "No separate entry for this character. Showing words that contain it.",
          alt: "",
        });
      }
    }

    for (const ch of singleChars) {
      for (const item of yueDictEntriesByContainingChar.get(ch) || []) {
        if (isContainsMatch(item, ch, normalizeYueSearchText(ch))) {
          addResult(item);
        }
      }
    }
  }

  return Array.from(resultMap.values()).slice(0, Math.max(1, limit));
}

function getPrimaryPinyin(pinyin) {
  if (!pinyin || !pinyin.trim()) return "";
  const cleaned = pinyin.toLowerCase().trim().split("/")[0].trim();
  const firstPart = cleaned.split(/\s+/)[0].trim().replace(/[^a-z0-9]/g, "");
  return yuePinyinAliasMap[firstPart] || firstPart;
}

function withToneFallbacks(pinyin) {
  const out = [pinyin];
  const match = pinyin.match(/^(.*?)([1-9])$/);
  if (!match) return out;
  const stem = match[1];
  const tone = match[2];
  if (tone === "7" || tone === "8" || tone === "9") {
    out.push(`${stem}1`, `${stem}3`, `${stem}6`);
  }
  return out;
}

function withSpellingFallbacks(pinyin) {
  const out = [pinyin];
  const queue = [pinyin];
  const seen = new Set([pinyin]);
  const rules = [
    (value) => value.replace(/^a([1-9])$/, "aa$1"),
    (value) => value.replace(/^(.*)eu([1-9])$/, "$1eoi$2"),
    (value) => value.replace(/^(.*)oet([1-9])$/, "$1eot$2"),
    (value) => value.replace(/^(.*)eui([1-9])$/, "$1eoi$2"),
    (value) => value.replace(/^(.*)eun([1-9])$/, "$1eon$2"),
    (value) => value.replace(/^(.*)eung([1-9])$/, "$1oeng$2"),
    (value) => value.replace(/^(.*)euk([1-9])$/, "$1oek$2"),
    (value) => value.replace(/^(.*)eut([1-9])$/, "$1eot$2"),
    (value) =>
      value.replace(
        /^((?:gw|kw|ng|ch|zh|sh|[bcdfghjklmnpqrstvwxyz]))a([1-9])$/,
        "$1aa$2",
      ),
    (value) => value.replace(/^hng([1-9])$/, "ng$1"),
    (value) => value.replace(/^yu([1-9])$/, "jyu$1"),
    (value) => value.replace(/^yun([1-9])$/, "jyun$1"),
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const applyRule of rules) {
      const next = applyRule(current);
      if (next !== current && !seen.has(next)) {
        seen.add(next);
        out.push(next);
        queue.push(next);
      }
    }
  }

  return out;
}

function withInitialFallbacks(pinyin) {
  const out = [pinyin];
  if (pinyin.startsWith("ch")) out.push(`c${pinyin.slice(2)}`);
  if (pinyin.startsWith("zh")) out.push(`z${pinyin.slice(2)}`);
  if (pinyin.startsWith("sh")) out.push(`s${pinyin.slice(2)}`);
  if (pinyin.startsWith("y")) out.push(`j${pinyin.slice(1)}`);
  if (pinyin.startsWith("j")) out.push(`z${pinyin.slice(1)}`);
  return out;
}

function getYuePinyinCandidates(pinyin) {
  const pinyinMain = getPrimaryPinyin(pinyin);
  if (!pinyinMain) return [];

  const pinyinMap = {
    yu5: "jyu5",
    yu6: "jyu6",
    seui3: "seoi3",
    seoi6: "seoi6",
    jeung1: "jung1",
    jeung3: "jung3",
    jeong1: "jung1",
    jeong3: "jung3",
    jaang1: "zoeng1",
    jaang2: "zoeng2",
    jaang3: "zoeng3",
    jaang6: "zoeng6",
    gaang1: "gong1",
    gaang2: "gong2",
    gaang3: "gong3",
    gaang6: "gong6",
    maang5: "maang5",
    maang6: "maang6",
    paang4: "pang4",
    paang6: "pang6",
    faang1: "fong1",
    faang2: "fong2",
    faang3: "fong3",
    faang6: "fong6",
    naang5: "nong5",
    naang6: "nong6",
    laang6: "long6",
    laang5: "long5",
    yaang1: "jong1",
    yaang2: "jung2",
    yaang3: "jung3",
    yaang6: "jung6",
    yung1: "jung1",
    yung2: "jung2",
    yung3: "jung3",
    yung6: "jung6",
    waang1: "wong1",
    waang2: "wong2",
    waang3: "wong3",
    waang6: "wong6",
    yu1: "jyu1",
    yu2: "jyu2",
    yu3: "jyu3",
    yu4: "jyu4",
    yun1: "jyun1",
    yun2: "jyun2",
    yun3: "jyun3",
    yun4: "jyun4",
    yun5: "jyun5",
    yun6: "jyun6",
  };

  const seeds = [pinyinMain];
  const mapped = pinyinMap[pinyinMain];
  if (mapped) seeds.push(mapped);

  const candidates = [];
  for (const seed of seeds) {
    for (const toneVariant of withToneFallbacks(seed)) {
      for (const spellingVariant of withSpellingFallbacks(toneVariant)) {
        for (const initialVariant of withInitialFallbacks(spellingVariant)) {
          if (!candidates.includes(initialVariant)) {
            candidates.push(initialVariant);
          }
        }
      }
    }
  }

  return candidates;
}

function getYuePinyinUrl(pinyin) {
  const candidates = getYuePinyinCandidates(pinyin);
  if (candidates.length === 0) return null;
  return `${TTS_YUE_BASE_PATH}/${candidates[0]}.wav`;
}

async function checkAudioPathExists(path) {
  if (yueAudioAvailabilityCache.has(path)) {
    return yueAudioAvailabilityCache.get(path);
  }
  let ok = false;
  try {
    const response = await fetch(path, { method: "HEAD" });
    ok = response.ok;
  } catch {
    ok = false;
  }
  yueAudioAvailabilityCache.set(path, ok);
  return ok;
}

async function resolveYueAudioPath(pinyin) {
  const pinyinMain = getPrimaryPinyin(pinyin);
  if (!pinyinMain) return null;
  if (yueAudioResolveCache.has(pinyinMain)) {
    return yueAudioResolveCache.get(pinyinMain);
  }

  const candidates = getYuePinyinCandidates(pinyin);
  for (const candidate of candidates) {
    const path = `${TTS_YUE_BASE_PATH}/${candidate}.wav`;
    const exists = await checkAudioPathExists(path);
    if (exists) {
      yueAudioResolveCache.set(pinyinMain, path);
      return path;
    }
  }

  yueAudioResolveCache.set(pinyinMain, null);
  return null;
}

async function checkYueAudioExists(pinyin) {
  const audioPath = await resolveYueAudioPath(pinyin);
  return Boolean(audioPath);
}

function getWebAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!webAudioContext) {
    webAudioContext = new AudioContextCtor();
  }
  return webAudioContext;
}

async function ensureWebAudioReady() {
  const context = getWebAudioContext();
  if (!context) return null;
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch (err) {
      console.warn("恢复 Web Audio 上下文失败:", err);
    }
  }
  return context;
}

function stopAllWebAudioPlayback() {
  webAudioPlaybackToken += 1;
  activeWebAudioSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // 忽略重复停止异常
    }
    try {
      source.disconnect();
    } catch {
      // 忽略断开异常
    }
  });
  activeWebAudioSources.clear();
}

function trackWebAudioSource(source) {
  activeWebAudioSources.add(source);
  source.onended = () => {
    activeWebAudioSources.delete(source);
    try {
      source.disconnect();
    } catch {
      // 忽略断开异常
    }
  };
}

async function loadWebAudioBuffer(path, context) {
  if (webAudioBufferCache.has(path)) {
    return webAudioBufferCache.get(path);
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`音频加载失败: ${path}`);
  }

  const rawBuffer = await response.arrayBuffer();
  const decodedBuffer = await context.decodeAudioData(rawBuffer.slice(0));
  webAudioBufferCache.set(path, decodedBuffer);
  return decodedBuffer;
}

async function playAudioPathsWithWebAudio(paths, options = {}) {
  const { interrupt = false, gapSeconds = 0.04 } = options;
  if (!Array.isArray(paths) || paths.length === 0) return false;

  const context = await ensureWebAudioReady();
  if (!context) return false;

  if (interrupt) {
    stopAllWebAudioPlayback();
  }
  const playbackToken = webAudioPlaybackToken;

  const buffers = [];
  for (const path of paths) {
    if (playbackToken !== webAudioPlaybackToken) return false;
    try {
      const buffer = await loadWebAudioBuffer(path, context);
      buffers.push(buffer);
    } catch (err) {
      console.warn(`Web Audio 解码失败: ${path}`, err);
    }
  }

  if (buffers.length === 0 || playbackToken !== webAudioPlaybackToken) {
    return false;
  }

  let startAt = context.currentTime + 0.02;
  buffers.forEach((buffer, index) => {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    trackWebAudioSource(source);
    source.start(startAt);
    startAt += buffer.duration + (index < buffers.length - 1 ? gapSeconds : 0);
  });

  return true;
}

function tokenizePinyin(pinyinText) {
  if (!pinyinText) return [];
  return pinyinText
    .toLowerCase()
    .split(/\s+/)
    .flatMap((part) => part.split("/"))
    .map((part) => part.trim().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .map((part) => getPrimaryPinyin(part))
    .filter(Boolean);
}

async function resolveYueAudioPathsFromPinyin(pinyinText) {
  const tokens = tokenizePinyin(pinyinText);
  if (tokens.length === 0) return [];

  const audioPaths = [];
  for (const token of tokens) {
    const path = await resolveYueAudioPath(token);
    if (path) {
      audioPaths.push(path);
    }
  }
  return audioPaths;
}

async function playAudioPathsWithHtmlAudio(paths, options = {}) {
  const { gapMs = 40 } = options;
  if (!Array.isArray(paths) || paths.length === 0) return false;

  for (let i = 0; i < paths.length; i++) {
    const currentPath = paths[i];
    const audio = new Audio(currentPath);

    try {
      await new Promise((resolve, reject) => {
        audio.onended = resolve;
        audio.onerror = () => reject(new Error(`HTMLAudio 播放失败: ${currentPath}`));
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(reject);
        }
      });
    } catch (err) {
      console.warn("HTMLAudio 回退播放失败:", err);
      return false;
    }

    if (i < paths.length - 1 && gapMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, gapMs));
    }
  }

  return true;
}

function isSpeechDelimiter(ch) {
  return /[\s，。！？；：、“”‘’（）()【】《》,.!?;:'"、\u3000]/.test(ch);
}

function extractPinyinTokensFromText(text) {
  const normalizedText = (text || "").trim();
  if (!normalizedText) return [];

  const tokens = [];
  let i = 0;

  while (i < normalizedText.length) {
    const ch = normalizedText[i];
    if (isSpeechDelimiter(ch)) {
      i += 1;
      continue;
    }

    let matched = false;
    const maxLen = Math.min(yueMaxWordLength, normalizedText.length - i);
    for (let len = maxLen; len > 0; len--) {
      const segment = normalizedText.slice(i, i + len);
      const pinyin = yueWordPinyinMap.get(segment);
      if (!pinyin) continue;

      const segmentTokens = tokenizePinyin(pinyin);
      if (segmentTokens.length === 0) continue;

      tokens.push(...segmentTokens);
      i += len;
      matched = true;
      break;
    }

    if (!matched) {
      i += 1;
    }
  }

  return tokens;
}

function loadFavorites() {
  const raw = localStorage.getItem("dls-ai-favorites");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem("dls-ai-favorites", JSON.stringify(favorites));
}

function loadTranslateHistory() {
  const raw = localStorage.getItem("dls-ai-translate-history");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTranslateHistory(history) {
  localStorage.setItem("dls-ai-translate-history", JSON.stringify(history));
}

function renderTranslateHistory() {
  const history = loadTranslateHistory();
  translateHistoryListEl.innerHTML = "";
  
  if (history.length === 0) {
    noTranslateHistoryEl.style.display = "block";
    return;
  }
  
  noTranslateHistoryEl.style.display = "none";
  
  history.slice(0, 20).forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.innerHTML = `
      <div class="history-item-content">
        <strong>${getTranslateDirectionName(item.direction)}</strong>
        <p style="margin: 4px 0;">${item.input}</p>
        <p style="margin: 4px 0; color: var(--accent); font-weight: 500;">${item.output}</p>
      </div>
      <div class="history-item-actions">
        <button class="icon-btn" title="Listen" onclick="speakTranslateOutput('${item.output.replace(/'/g, "\\'")}', '${item.direction || ""}')">Listen</button>
        <button class="icon-btn" title="Copy" onclick="copyText('${item.output.replace(/'/g, "\\'")}')">Copy</button>
        <button class="icon-btn" title="Save" onclick="addToFavorites('${item.input.replace(/'/g, "\\'")}', '${item.output.replace(/'/g, "\\'")}', '${item.direction}')">⭐</button>
      </div>
    `;
    translateHistoryListEl.appendChild(el);
  });
}

function addToTranslateHistory(input, output, direction) {
  const history = loadTranslateHistory();
  history.unshift({ input, output, direction, timestamp: Date.now() });
  if (history.length > 100) {
    history.pop();
  }
  saveTranslateHistory(history);
  renderTranslateHistory();
}

async function speakText(text) {
  if (!text) return;

  const normalizedText = text.trim();
  if (!normalizedText) return;

  try {
    await loadYueDictionary();
    const pinyinTokens = extractPinyinTokensFromText(normalizedText);
    const audioPaths = [];

    for (const pinyin of pinyinTokens) {
      const path = await resolveYueAudioPath(pinyin);
      if (path) {
        audioPaths.push(path);
      }
    }

    if (audioPaths.length === 0) {
      alert("No audio file found for this text");
      return;
    }

    const played = await playAudioPathsWithWebAudio(audioPaths, {
      interrupt: true,
      gapSeconds: 0.03,
    });
    if (played) return;

    alert("Could not play the audio. Please try again.");
    return;
  } catch (err) {
    console.warn("TTS 朗读失败:", err);
    alert("Could not play the audio. Please try again.");
  }
}

function copyText(text) {
  if (!text) return;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      console.log("文本已复制到剪贴板");
    }).catch(err => {
      console.error("复制失败:", err);
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand("copy");
    if (successful) {
      console.log("文本已复制到剪贴板（使用 execCommand）");
    } else {
      alert("Copy failed. Please copy manually.");
    }
  } catch (err) {
    console.error("复制失败:", err);
    alert("Copy failed. Please copy manually.");
  }
  
  document.body.removeChild(textArea);
}

async function playYuePinyin(pinyin, resolvedPath = "") {
  if (!pinyin && !resolvedPath) return;

  const audioPaths = resolvedPath ? [resolvedPath] : (await resolveYueAudioPathsFromPinyin(pinyin));
  if (audioPaths.length === 0) {
    console.warn(`发音路径无效: ${pinyin}`);
    alert("The audio file is missing or cannot be played");
    return;
  }
  
  console.log(`尝试播放发音: ${audioPaths.join(", ")}`);

  const played = await playAudioPathsWithWebAudio(audioPaths, {
    interrupt: false,
    gapSeconds: 0.03,
  });
  if (played) {
    console.log(`成功播放发音: ${audioPaths.join(", ")}`);
    return;
  }

  const fallbackPlayed = await playAudioPathsWithHtmlAudio(audioPaths, { gapMs: 40 });
  if (fallbackPlayed) {
    console.log(`成功播放发音(HTMLAudio回退): ${audioPaths.join(", ")}`);
    return;
  }

  alert("The audio file is missing or cannot be played");
}

function renderYueDictResult(results) {
  if (!results || results.length === 0) {
    yueDictResultEl.innerHTML = "";
    noYueDictResultEl.style.display = "block";
    return;
  }
  
  noYueDictResultEl.style.display = "none";
  yueDictResultEl.innerHTML = "";
  
  results.forEach((item) => {
    const el = document.createElement("div");
    el.className = "yue-dict-item";

    el.innerHTML = `
      <h4>${item.simp} <span style="font-size:0.85em;color:var(--muted)">(${item.trad})</span></h4>
      <p class="pinyin">Romanization: ${item.pinyin}</p>
      ${item.example ? `<p class="example">Example: ${item.example}</p>` : ""}
      ${item.explanation ? `<p class="explanation">Meaning: ${item.explanation}</p>` : ""}
      <div class="audio-action"><span style="color:var(--muted);font-size:0.85em">(checking audio…)</span></div>
    `;
    yueDictResultEl.appendChild(el);

    const audioActionEl = el.querySelector(".audio-action");
    resolveYueAudioPathsFromPinyin(item.pinyin).then((audioPaths) => {
      if (!audioActionEl) return;
      audioActionEl.innerHTML = "";
      if (audioPaths.length === 0) {
        audioActionEl.innerHTML = `<span style="color:var(--muted);font-size:0.85em">(no audio file)</span>`;
        return;
      }
      const playBtn = document.createElement("button");
      playBtn.className = "play-btn";
      playBtn.textContent = "Play sound";
      playBtn.addEventListener("click", () => {
        playYuePinyin(item.pinyin, audioPaths.length === 1 ? audioPaths[0] : "");
      });
      audioActionEl.appendChild(playBtn);
    });
  });
}

async function searchYueWord() {
  const word = yueDictSearchEl.value.trim();
  if (!word) {
    alert("Please enter a word to look up");
    return;
  }

  const dialect = dictDialectEl?.value || "yue";
  if (isRegionalDialect(dialect)) {
    try {
      await loadRegionalDialectDictionary(dialect);
    } catch {
      alert(`${REGIONAL_DIALECTS[dialect].label} dictionary failed to load. Please try again later.`);
      return;
    }

    const results = searchRegionalDialectEntries(dialect, word, { limit: 200 });
    if (results.length > 0) {
      renderRegionalDialectResult(dialect, results);
      results.slice(0, 3).forEach((r) => {
        addToWordbook(r.simp, r.trad, r.pinyin, r.explanation, dialect);
      });
      trackDailyTask("query_dict", 1);
      addXP(3);
    } else {
      renderRegionalDialectResult(dialect, []);
      alert(`No results for "${word}"`);
    }
    return;
  }

  if (dialect !== "yue") {
    const meta = getDialectMeta(dialect);
    yueDictResultEl.innerHTML = "";
    noYueDictResultEl.style.display = "block";
    noYueDictResultEl.textContent = `There is no local ${meta.label} dictionary yet. Use translation or chat to learn with AI.`;
    return;
  }

  try {
    await loadYueDictionary();
  } catch {
    alert("The Cantonese dictionary failed to load. Please try again later.");
    return;
  }

  const results = searchYueDictionaryEntries(word, { limit: 200 });

  if (results.length > 0) {
    renderYueDictResult(results);
  } else {
    renderYueDictResult([]);
    alert(`No results for "${word}"`);
  }
}

saveConfigBtn.addEventListener("click", () => {
  const current = getConfig();
  const cfg = {
    provider: providerPresetEl.value || inferProvider(baseUrlEl.value.trim(), modelEl.value.trim()),
    apiKey: current.apiKey || "",
    baseUrl: baseUrlEl.value.trim() || DEFAULT_BASE_URL,
    model: modelEl.value.trim() || DEFAULT_MODEL,
  };
  setConfig(cfg);
  updateConfigKeyStatus();
  showPixelToast("Settings saved");
});

uploadConfigBtn?.addEventListener("click", () => {
  configFileInput?.click();
});

configFileInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 64 * 1024) {
    showPixelToast("Config file is too large (64 KB limit)");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = normalizeUploadedConfig(JSON.parse(ev.target.result));
      if (!parsed.apiKey && !parsed.baseUrl && !parsed.model) {
        showPixelToast("Config file format is not valid");
        return;
      }
      applyUploadedConfig(parsed);
    } catch {
      showPixelToast("Config file is not valid JSON");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
});

clearConfigKeyBtn?.addEventListener("click", () => {
  const current = getConfig();
  setConfig({ ...current, apiKey: "" });
  updateConfigKeyStatus();
  showPixelToast("API key cleared");
});

downloadConfigTemplateBtn?.addEventListener("click", () => {
  const template = {
    apiKey: "your-api-key-here",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    provider: "deepseek",
  };
  const blob = new Blob([`${JSON.stringify(template, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "dls-ai-config.template.json";
  anchor.click();
  URL.revokeObjectURL(url);
  showPixelToast("Config template downloaded");
});

providerPresetEl.addEventListener("change", () => {
  const preset = PROVIDER_PRESETS[providerPresetEl.value];
  if (!preset) return;
  baseUrlEl.value = preset.baseUrl;
  modelEl.value = preset.model;
  updateModelGuide();
});

modelPresetEl.addEventListener("change", () => {
  const val = modelPresetEl.value;
  if (val) {
    modelEl.value = val;
    const provider = inferProvider(baseUrlEl.value.trim(), val);
    providerPresetEl.value = provider;
    if (provider === "deepseek") {
      baseUrlEl.value = PROVIDER_PRESETS.deepseek.baseUrl;
    }
    updateModelGuide();
  }
});

modelEl.addEventListener("input", () => {
  providerPresetEl.value = inferProvider(baseUrlEl.value.trim(), modelEl.value.trim());
  updateModelGuide();
});

baseUrlEl.addEventListener("input", () => {
  providerPresetEl.value = inferProvider(baseUrlEl.value.trim(), modelEl.value.trim());
  updateModelGuide();
});

function updateModelGuide() {
  const provider = providerPresetEl.value || inferProvider(baseUrlEl.value.trim(), modelEl.value.trim());
  const model = modelEl.value.trim() || DEFAULT_MODEL;
  const titleEl = document.getElementById("modelGuideTitle");
  const hintEl = document.getElementById("modelGuideHint");
  const cmdEl = document.getElementById("modelDownloadCmd");

  if (!titleEl || !hintEl || !cmdEl) return;

  if (provider === "deepseek") {
    titleEl.textContent = "Connect to DeepSeek";
    hintEl.textContent = "DeepSeek is a cloud OpenAI-compatible API, so there is nothing to download. Upload a config file that contains your API key:";
    cmdEl.textContent = `Base URL: ${PROVIDER_PRESETS.deepseek.baseUrl} / Model: ${model}`;
    return;
  }

  if (provider === "openai") {
    titleEl.textContent = "Connect to an OpenAI-compatible API";
    hintEl.textContent = "Cloud OpenAI-compatible APIs need no download. Make sure the Base URL ends in /v1 and upload a config file with your API key:";
    cmdEl.textContent = `Base URL: ${baseUrlEl.value.trim() || PROVIDER_PRESETS.openai.baseUrl} / Model: ${model}`;
    return;
  }

  titleEl.textContent = "Download a model";
  hintEl.textContent = "Run this command in a terminal:";
  cmdEl.textContent = `ollama pull ${model}`;
}

function copyModelCmd() {
  const cmd = document.getElementById("modelDownloadCmd");
  if (!cmd) return;
  navigator.clipboard.writeText(cmd.textContent).then(() => {
    showPixelToast("Command copied");
  }).catch(() => {
    showPixelToast("Copy failed. Please copy manually.");
  });
}

const CHAT_STORAGE_KEY = "dls-ai-chat-history";
const MAX_CHAT_HISTORY = 50;

function saveConversation() {
  const toSave = conversation.filter(m => m.role !== "system").slice(-MAX_CHAT_HISTORY);
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
  } catch {}
}

function loadConversation() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return;
    for (const msg of saved) {
      conversation.push(msg);
      renderMessage(msg.role, msg.content);
    }
  } catch {}
}

function clearConversation() {
  conversation.length = 0;
  conversation.push({
    role: "system",
    content: CHAT_SYSTEM_PROMPT,
  });
  chatHistoryEl.innerHTML = "";
  localStorage.removeItem(CHAT_STORAGE_KEY);
  showPixelToast("Chat cleared");
}

sendChatBtn.addEventListener("click", async () => {
  const input = chatInputEl.value.trim();
  if (!input) return;

  const inputGuard = await checkGuardrail(input, "input", { source: "chat" });
  if (!inputGuard.allowed) {
    renderMessage("user", input);
    chatInputEl.value = "";
    const blockMsg = inputGuard.message || "This request did not pass the safety check. Please try a different question.";
    renderMessage("assistant", `🛡️ ${blockMsg}`, {
      guardrailBlocked: true,
      feedback: false,
    });
    return;
  }

  renderMessage("user", input);
  chatInputEl.value = "";

  const requestedDialect = detectDialectFromText(input);
  try {
    if (isRegionalDialect(requestedDialect)) {
      await loadRegionalDialectDictionary(requestedDialect);
    } else if (requestedDialect === "yue") {
      await loadYueDictionary();
    }
  } catch {
    /* 词典失败时上下文字段为空 */
  }
  const dictContext = isRegionalDialect(requestedDialect)
    ? extractRegionalDialectContext(requestedDialect, input)
    : requestedDialect === "yue"
      ? extractYueDictContext(input)
      : "";
  const dictLabel = isRegionalDialect(requestedDialect)
    ? `${REGIONAL_DIALECTS[requestedDialect].label}词典参考信息`
    : requestedDialect === "yue"
      ? "粤语词典参考信息"
      : "";
  const enhancedInput = dictContext ? `${input}\n\n[${dictLabel}]\n${dictContext}` : input;

  conversation.push({ role: "user", content: enhancedInput });
  saveConversation();

  showLoading(true);
  try {
    let usedTools = [];
    let toolResults = [];
    let reply = "";

    // 工具选择和回复均由大模型决定；不再使用本地正则意图兜底。
    const modelResult = await runChatWithTools(conversation, (toolName) => {
      showToolStatus(toolName);
    });
    removeToolStatus();
    if (modelResult.usedTools?.length) {
      usedTools = modelResult.usedTools;
      toolResults = modelResult.toolResults || [];
      reply = modelResult.content || reply;
    } else {
      removeToolStatus();
    }

    if (!reply) {
      throw new Error("The model did not write a final reply after using tools. Check that this model supports tool calling.");
    }

    const outputGuard = await checkGuardrail(reply, "output", { source: "chat" });
    if (!outputGuard.allowed) {
      const blockMsg = outputGuard.message || "This reply did not pass the safety check and cannot be shown.";
      renderMessage("assistant", `🛡️ ${blockMsg}`, {
        guardrailBlocked: true,
        feedback: false,
      });
      return;
    }

    const safeReply = outputGuard.sanitizedText || reply;
    const warnMsg =
      outputGuard.message ||
      (inputGuard.violations || []).find((v) => v.severity === "warn")?.message ||
      "";

    conversation.push({ role: "assistant", content: safeReply });
    renderMessage("assistant", safeReply, {
      toolCalls: usedTools,
      toolResults,
      userInput: input,
      messageId: createMessageId(),
      guardrailWarning: warnMsg || undefined,
    });
    saveConversation();
  } catch (err) {
    removeToolStatus();
    const errorMsg = getFriendlyError(err);
    renderMessage("assistant", errorMsg, { feedback: false });
  } finally {
    showLoading(false);
  }
});

function isMinnanQuery(text) {
  return /闽南|閩南|闽南话|閩南話|台语|台語|臺語|臺灣話|台湾话|hokkien|minnan|tailo|白话字|白話字/i.test(text || "");
}

function detectDialectFromText(text) {
  const raw = text || "";
  if (/台山话|台山話|台山|四邑话|四邑話|taishan|taishanese|toisan|toishanese|hoisan/i.test(raw)) return "taishanese";
  if (/潮州话|潮州話|潮汕话|潮汕話|teochew|chiuchow|chaozhou/i.test(raw)) return "teochew";
  if (/温州话|溫州話|wenzhou|wenzhounese/i.test(raw)) return "wenzhounese";
  if (/hokkien|闽南话|閩南話/i.test(raw)) return "hokkien";
  if (/shanghainese/i.test(raw)) return "shanghainese";
  if (/上海话|上海話|沪语|滬語|吴语|吳語|shanghai|shanghainese/i.test(raw)) return "shanghai";
  if (/四川话|四川話|川话|川話|成都话|成都話|sichuan|sichuanese|chengdu/i.test(raw)) return "sichuan";
  if (isMinnanQuery(raw)) return "minnan";
  return "yue";
}

function extractYueDictContext(text) {
  if (!yueDictionary || yueDictionary.length === 0) return "";

  const yueKeywords = ["粤语", "广东话", "粤", "点解", "咩", "嘅", "喺", "佢", "唔", "啲", "嘢", "噉", "喇", "嚟", "係", "发音", "拼音", "声调", "读", "说", "讲", "话", "怎么", "什么", "意思", "翻译", "学习"];
  const hasYueKeyword = yueKeywords.some(keyword => text.includes(keyword));

  if (!hasYueKeyword) return "";

  const chars = text.replace(/[^\u4e00-\u9fff]/g, "").split("").filter(c => c.trim());
  const seen = new Set();
  const matchedEntries = [];

  for (const char of chars) {
    const found = yueDictEntriesByChar.get(char) || [];
    for (const entry of found.slice(0, 2)) {
      const key = `${entry.simp}|${entry.pinyin}`;
      if (!seen.has(key)) {
        seen.add(key);
        matchedEntries.push(entry);
      }
    }
  }

  const words = text.replace(/[^\u4e00-\u9fff]+/g, " ").trim().split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    const found = yueDictEntriesByWord.get(word) || [];
    for (const entry of found.slice(0, 1)) {
      const key = `${entry.simp}|${entry.pinyin}`;
      if (!seen.has(key)) {
        seen.add(key);
        matchedEntries.push(entry);
      }
    }
  }

  if (matchedEntries.length === 0) return "";

  const uniqueEntries = matchedEntries.slice(0, 15);
  return uniqueEntries.map(entry => {
    const example = entry.example ? `（示例：${entry.example}）` : "";
    const explanation = entry.explanation ? ` - ${entry.explanation}` : "";
    return `${entry.simp}(${entry.trad}) 拼音:${entry.pinyin}${example}${explanation}`;
  }).join("\n");
}

function extractTranslateRAG(input, direction) {
  if (!yueDictionary || yueDictionary.length === 0) return "";

  const chars = input.replace(/[^\u4e00-\u9fff]/g, "").split("").filter(c => c.trim());
  const seen = new Set();
  const matchedEntries = [];

  for (const char of chars) {
    const found = yueDictEntriesByChar.get(char) || [];
    for (const entry of found.slice(0, 2)) {
      const key = `${entry.simp}|${entry.pinyin}`;
      if (!seen.has(key)) {
        seen.add(key);
        matchedEntries.push(entry);
      }
    }
  }

  if (matchedEntries.length === 0) return "";

  const uniqueEntries = matchedEntries.slice(0, 20);
  const entries = uniqueEntries.map(entry => {
    const example = entry.example ? `（示例：${entry.example}）` : "";
    const explanation = entry.explanation ? ` - ${entry.explanation}` : "";
    return `${entry.simp}(${entry.trad}) 拼音:${entry.pinyin}${example}${explanation}`;
  }).join("\n");

  if (direction === "zh_to_yue") {
    return `以下是输入文本中部分汉字的粤语词典参考信息，翻译时请参考这些粤拼和用法：\n${entries}`;
  } else {
    return `以下是输入文本中部分字的粤语词典参考信息，翻译时请参考这些粤拼和含义：\n${entries}`;
  }
}

function extractMinnanTranslateRAG(input, direction) {
  const entries = extractMinnanDictContext(input);
  if (!entries) return "";
  if (direction === "zh_to_minnan") {
    return `以下是输入文本中部分汉字的闽南语词典参考信息，翻译时请参考台罗、白话字和用法：\n${entries}`;
  }
  return `以下是输入文本中部分闽南语词条的参考信息，翻译时请参考释义：\n${entries}`;
}

function getDialectFromDirection(direction) {
  const dialect = String(direction || "")
    .replace(/^zh_to_/, "")
    .replace(/_to_zh$/, "");
  return DIALECTS[dialect] ? dialect : "yue";
}

function getOutputDialectFromDirection(direction) {
  const raw = String(direction || "");
  if (raw.endsWith("_to_zh")) return "zh";
  return getDialectFromDirection(raw);
}

function canPlayStandardAudioForDialect(dialect) {
  return dialect === "yue";
}

async function speakTextForDialect(text, dialect = "yue", reading = "") {
  if (!text) return false;
  if (!canPlayStandardAudioForDialect(dialect)) {
    showDialectAudioUnavailable(dialect, reading || text);
    return false;
  }
  await speakText(text);
  return true;
}

async function speakTranslateOutput(text, direction) {
  const outputDialect = getOutputDialectFromDirection(direction);
  if (outputDialect === "zh") {
    if (speakWithWebSpeech(text, "zh-CN")) return true;
    showDialectAudioUnavailable("yue", "Mandarin audio is not available");
    return false;
  }
  return speakTextForDialect(text, outputDialect);
}

async function speakFavoriteText(text, direction = "", dialect = "") {
  if (direction) return speakTranslateOutput(text, direction);
  return speakTextForDialect(text, dialect || "yue");
}

function extractRegionalTranslateRAG(input, direction) {
  const dialect = getDialectFromDirection(direction);
  const meta = REGIONAL_DIALECTS[dialect];
  if (!meta) return "";

  const entries = extractRegionalDialectContext(dialect, input);
  if (!entries) return "";
  if (direction.startsWith("zh_to_")) {
    return `以下是输入文本中部分汉字的${meta.label}词典参考信息，翻译时请参考注音和用法：\n${entries}`;
  }
  return `以下是输入文本中部分${meta.label}词条的参考信息，翻译时请参考释义：\n${entries}`;
}

translateBtn.addEventListener("click", async () => {
  const input = translateInputEl.value.trim();
  if (!input) return;

  const inputGuard = await checkGuardrail(input, "input", { source: "translate" });
  if (!inputGuard.allowed) {
    translateOutputEl.textContent = `${inputGuard.message || "The input did not pass the safety check"}`;
    return;
  }

  translateOutputEl.textContent = "Translating…";
  translateBtn.disabled = true;
  const direction = directionEl.value;
  const targetDialect = getDialectFromDirection(direction);
  const isRegionalDirection = isRegionalDialect(targetDialect);

  try {
    if (isRegionalDirection) {
      await loadRegionalDialectDictionary(targetDialect);
    } else if (targetDialect === "yue") {
      await loadYueDictionary();
    }
  } catch {
    /* 无词典则不加 RAG */
  }
  const systemPrompt = getTranslatePrompt(direction);
  const ragContext = isRegionalDirection
    ? extractRegionalTranslateRAG(input, direction)
    : targetDialect === "yue"
      ? extractTranslateRAG(input, direction)
      : "";
  const userContent = ragContext ? `${input}\n\n[${ragContext}]` : input;

  try {
    const result = await callChatAPI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ]);
    const outputGuard = await checkGuardrail(result, "output", { source: "translate" });
    if (!outputGuard.allowed) {
      translateOutputEl.textContent = `${outputGuard.message || "The translation did not pass the safety check"}`;
      return;
    }
    const safeResult = outputGuard.sanitizedText || result;
    translateOutputEl.textContent = safeResult;
    addToTranslateHistory(input, safeResult, direction);
  } catch (err) {
    const friendlyErr = getFriendlyError(err);
    translateOutputEl.textContent = `Translation failed: ${friendlyErr}`;
  } finally {
    translateBtn.disabled = false;
  }
});

clearTranslateBtn.addEventListener("click", () => {
  translateInputEl.value = "";
  translateOutputEl.textContent = "";
});

speakOutputBtn.addEventListener("click", () => {
  const text = translateOutputEl.textContent.trim();
  speakTranslateOutput(text, directionEl.value);
});

copyOutputBtn.addEventListener("click", () => {
  const text = translateOutputEl.textContent.trim();
  copyText(text);
});

favoriteOutputBtn.addEventListener("click", () => {
  const input = translateInputEl.value.trim();
  const output = translateOutputEl.textContent.trim();
  const direction = directionEl.value;
  
  if (!input || !output) {
    alert("Translate something first");
    return;
  }
  
  addToFavorites(input, output, direction);
  alert("Added to favorites");
});

clearFavoritesBtn.addEventListener("click", () => {
  if (confirm("Clear all favorites?")) {
    localStorage.removeItem("dls-ai-favorites");
    renderFavorites();
  }
});

clearChatHistoryBtn.addEventListener("click", () => {
  if (confirm("Clear the chat history?")) {
    clearConversation();
  }
});

clearTranslateHistoryBtn.addEventListener("click", () => {
  if (confirm("Clear the translation history?")) {
    localStorage.removeItem("dls-ai-translate-history");
    renderTranslateHistory();
  }
});

yueDictSearchBtn.addEventListener("click", searchYueWord);

yueDictSearchEl.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchYueWord();
  }
});

dictDialectEl?.addEventListener("change", () => {
  const dialectName = getDialectMeta(dictDialectEl.value).label;
  yueDictSearchEl.placeholder = `Search a ${dialectName} word or character…`;
  yueDictResultEl.innerHTML = "";
  noYueDictResultEl.style.display = "block";
  noYueDictResultEl.textContent = `Search for a ${dialectName} word to see its entry.`;
});

const dailyQuotes = [
  { yue: "早晨！", zh: "早上好！", pinyin: "zou2 san4" },
  { yue: "你好吗？", zh: "你好吗？", pinyin: "nei5 hou2 maa3" },
  { yue: "多谢你！", zh: "谢谢你！", pinyin: "do1 ze6 nei5" },
  { yue: "唔该晒！", zh: "非常感谢！", pinyin: "m4 goi1 saai3" },
  { yue: "食咗饭未呀？", zh: "吃饭了吗？", pinyin: "sik6 zo2 faan6 mei6 aa3" },
  { yue: "今日天气真好！", zh: "今天天气真好！", pinyin: "gam1 jat6 tin1 hei3 zan1 hou2" },
  { yue: "我好挂住你！", zh: "我很想念你！", pinyin: "ngo5 hou2 gwaa3 zyu6 nei5" },
  { yue: "慢慢行！", zh: "慢慢走！", pinyin: "maan6 maan6 haang4" },
  { yue: "小心啲！", zh: "小心一点！", pinyin: "siu2 sam1 di1" },
  { yue: "得闲饮茶！", zh: "有空喝茶！", pinyin: "dak1 haan4 jam2 caa4" },
  { yue: "唔好意思！", zh: "不好意思/对不起！", pinyin: "m4 hou2 ji3 si1" },
  { yue: "好嘢！", zh: "好棒！", pinyin: "hou2 je5" },
  { yue: "冇问题！", zh: "没问题！", pinyin: "mou5 man6 tai4" },
  { yue: "加油！", zh: "加油！", pinyin: "gaa1 jau4" },
  { yue: "恭喜发财！", zh: "恭喜发财！", pinyin: "gung1 hei2 faat3 coi4" },
  { yue: "身体健康！", zh: "身体健康！", pinyin: "san1 tai3 gin5 hong1" },
  { yue: "心想事成！", zh: "心想事成！", pinyin: "sam1 soeng2 si6 sing4" },
  { yue: "万事如意！", zh: "万事如意！", pinyin: "maan6 si6 jyu4 ji3" },
  { yue: "一路平安！", zh: "一路平安！", pinyin: "jat1 lou6 ping4 on1" },
  { yue: "再见！", zh: "再见！", pinyin: "zoi3 gin3" },
];

const commonPhrases = {
  greeting: [
    { yue: "早晨！", zh: "早上好！", pinyin: "zou2 san4" },
    { yue: "你好！", zh: "你好！", pinyin: "nei5 hou2" },
    { yue: "你好吗？", zh: "你好吗？", pinyin: "nei5 hou2 maa3" },
    { yue: "食咗饭未呀？", zh: "吃饭了吗？", pinyin: "sik6 zo2 faan6 mei6 aa3" },
    { yue: "最近点呀？", zh: "最近怎么样？", pinyin: "zeoi3 gan6 dim2 aa3" },
    { yue: "好耐冇见！", zh: "好久不见！", pinyin: "hou2 noi6 mou5 gin3" },
    { yue: "再见！", zh: "再见！", pinyin: "zoi3 gin3" },
    { yue: "拜拜！", zh: "拜拜！", pinyin: "baai1 baai3" },
    { yue: "听日见！", zh: "明天见！", pinyin: "ting1 jat6 gin3" },
    { yue: "晚安！", zh: "晚安！", pinyin: "maan5 on1" },
  ],
  daily: [
    { yue: "多谢你！", zh: "谢谢你！", pinyin: "do1 ze6 nei5" },
    { yue: "唔该晒！", zh: "非常感谢！", pinyin: "m4 goi1 saai3" },
    { yue: "唔好意思！", zh: "不好意思/对不起！", pinyin: "m4 hou2 ji3 si1" },
    { yue: "对唔住！", zh: "对不起！", pinyin: "deoi3 m4 zyu6" },
    { yue: "冇问题！", zh: "没问题！", pinyin: "mou5 man6 tai4" },
    { yue: "得闲饮茶！", zh: "有空喝茶！", pinyin: "dak1 haan4 jam2 caa4" },
    { yue: "慢慢行！", zh: "慢慢走！", pinyin: "maan6 maan6 haang4" },
    { yue: "小心啲！", zh: "小心一点！", pinyin: "siu2 sam1 di1" },
    { yue: "快啲啦！", zh: "快一点！", pinyin: "faai3 di1 laa1" },
    { yue: "等我一阵！", zh: "等我一下！", pinyin: "dang2 ngo5 jat1 zan6" },
  ],
  food: [
    { yue: "好食！", zh: "好吃！", pinyin: "hou2 sik6" },
    { yue: "好饮！", zh: "好喝！", pinyin: "hou2 jam2" },
    { yue: "我想食...", zh: "我想吃...", pinyin: "ngo5 soeng2 sik6" },
    { yue: "唔该，买单！", zh: "麻烦，结账！", pinyin: "m4 goi1, maai5 daan1" },
    { yue: "几多钱？", zh: "多少钱？", pinyin: "gei2 do1 cin2" },
    { yue: "太贵啦！", zh: "太贵了！", pinyin: "taai3 gwai3 laa1" },
    { yue: "平啲啦！", zh: "便宜一点！", pinyin: "peng4 di1 laa1" },
    { yue: "我唔要辣！", zh: "我不要辣！", pinyin: "ngo5 m4 jiu3 laat6" },
    { yue: "加多啲饭！", zh: "多加点饭！", pinyin: "gaa1 do1 di1 faan6" },
    { yue: "冻水！", zh: "冰水！", pinyin: "dung3 seoi2" },
  ],
  shopping: [
    { yue: "我想买...", zh: "我想买...", pinyin: "ngo5 soeng2 maai5" },
    { yue: "有冇大啲？", zh: "有大一点吗？", pinyin: "jau5 mou5 daai6 di1" },
    { yue: "有冇细啲？", zh: "有小一点吗？", pinyin: "jau5 mou5 sai3 di1" },
    { yue: "可以试下吗？", zh: "可以试一下吗？", pinyin: "ho2 ji5 si3 haa5 maa3" },
    { yue: "呢件几多钱？", zh: "这件多少钱？", pinyin: "ni1 gin6 gei2 do1 cin2" },
    { yue: "太贵啦！", zh: "太贵了！", pinyin: "taai3 gwai3 laa1" },
    { yue: "平啲啦！", zh: "便宜一点！", pinyin: "peng4 di1 laa1" },
    { yue: "我睇睇先！", zh: "我先看看！", pinyin: "ngo5 tai2 tai2 sin1" },
    { yue: "我要呢个！", zh: "我要这个！", pinyin: "ngo5 jiu3 ni1 go3" },
    { yue: "唔该，包装！", zh: "麻烦，包装！", pinyin: "m4 goi1, baau1 zong1" },
  ],
  emotion: [
    { yue: "我好开心！", zh: "我很开心！", pinyin: "ngo5 hou2 hoi1 sam1" },
    { yue: "我好挂住你！", zh: "我很想念你！", pinyin: "ngo5 hou2 gwaa3 zyu6 nei5" },
    { yue: "我好嬲！", zh: "我很生气！", pinyin: "ngo5 hou2 nau1" },
    { yue: "我好攰！", zh: "我很累！", pinyin: "ngo5 hou2 gui6" },
    { yue: "我好惊！", zh: "我很害怕！", pinyin: "ngo5 hou2 geng1" },
    { yue: "我好紧张！", zh: "我很紧张！", pinyin: "ngo5 hou2 gan2 zoeng1" },
    { yue: "我好兴奋！", zh: "我很兴奋！", pinyin: "ngo5 hou2 hing1 fan5" },
    { yue: "我好嬲啊！", zh: "我很生气啊！", pinyin: "ngo5 hou2 nau1 aa3" },
    { yue: "我好唔舍得！", zh: "我很舍不得！", pinyin: "ngo5 hou2 m4 se2 dak1" },
    { yue: "我好钟意你！", zh: "我很喜欢你！", pinyin: "ngo5 hou2 zung1 ji3 nei5" },
  ],
};

const dialectLearningData = {
  yue: {
    quotes: dailyQuotes,
    phrases: commonPhrases,
    quiz: null,
  },
  minnan: {
    quotes: [
      { yue: "你好！", zh: "你好！", pinyin: "li2 ho2" },
      { yue: "多謝你！", zh: "谢谢你！", pinyin: "to-sia7 li2" },
      { yue: "歹勢！", zh: "不好意思！", pinyin: "phai2-se3" },
      { yue: "今仔日天氣真好。", zh: "今天天气真好。", pinyin: "kin-a2-jit8 thinn-khi3 tsin ho2" },
      { yue: "你食飽未？", zh: "你吃饱了吗？", pinyin: "li2 tsiah8 pa2 bue7" },
      { yue: "咱來去食飯。", zh: "我们去吃饭。", pinyin: "lan2 lai5-khi3 tsiah8-png7" },
      { yue: "請問佗位？", zh: "请问在哪里？", pinyin: "tshiann2-mng7 toh-ui7" },
      { yue: "再會！", zh: "再见！", pinyin: "tsai3-hue7" },
    ],
    phrases: {
      greeting: [
        { yue: "你好！", zh: "你好！", pinyin: "li2 ho2" },
        { yue: "你食飽未？", zh: "你吃饱了吗？", pinyin: "li2 tsiah8 pa2 bue7" },
        { yue: "好久無看著！", zh: "好久不见！", pinyin: "ho2-ku2 bo5 khuann3-tioh8" },
        { yue: "再會！", zh: "再见！", pinyin: "tsai3-hue7" },
      ],
      daily: [
        { yue: "多謝你！", zh: "谢谢你！", pinyin: "to-sia7 li2" },
        { yue: "歹勢！", zh: "不好意思！", pinyin: "phai2-se3" },
        { yue: "無問題！", zh: "没问题！", pinyin: "bo5 bun7-te5" },
        { yue: "請問！", zh: "请问！", pinyin: "tshiann2-mng7" },
      ],
      food: [
        { yue: "好食！", zh: "好吃！", pinyin: "ho2 tsiah8" },
        { yue: "我欲食飯。", zh: "我要吃饭。", pinyin: "gua2 beh4 tsiah8-png7" },
        { yue: "幾若錢？", zh: "多少钱？", pinyin: "kui2-na7 tsinn5" },
        { yue: "傷貴矣！", zh: "太贵了！", pinyin: "siunn kui3--ah" },
      ],
      shopping: [
        { yue: "我欲買這个。", zh: "我要买这个。", pinyin: "gua2 beh4 bue2 tsit e5" },
        { yue: "有較大个無？", zh: "有大一点的吗？", pinyin: "u7 khah tua7 e5 bo5" },
        { yue: "較俗咧。", zh: "便宜一点吧。", pinyin: "khah siok8 leh" },
        { yue: "我先看覓。", zh: "我先看看。", pinyin: "gua2 sing khuann3 mai7" },
      ],
      emotion: [
        { yue: "我真歡喜！", zh: "我很开心！", pinyin: "gua2 tsin huann-hi2" },
        { yue: "我真想你。", zh: "我很想你。", pinyin: "gua2 tsin siunn7 li2" },
        { yue: "我真艱苦。", zh: "我很难受。", pinyin: "gua2 tsin kan-khoo2" },
        { yue: "我真愛睏。", zh: "我很困。", pinyin: "gua2 tsin ai3-khun3" },
      ],
    },
  },
  shanghai: {
    quotes: [
      { yue: "侬好！", zh: "你好！", pinyin: "nong ho" },
      { yue: "谢谢侬！", zh: "谢谢你！", pinyin: "zia zia nong" },
      { yue: "今朝天气老好。", zh: "今天天气很好。", pinyin: "cin tsau thi ci lau hau" },
      { yue: "阿拉一道去吃饭。", zh: "我们一起去吃饭。", pinyin: "aq la iq dau chi ve" },
      { yue: "侬哪能啦？", zh: "你怎么样？", pinyin: "nong na nen la" },
      { yue: "再会！", zh: "再见！", pinyin: "tse we" },
    ],
    phrases: {
      greeting: [
        { yue: "侬好！", zh: "你好！", pinyin: "nong ho" },
        { yue: "侬哪能啦？", zh: "你怎么样？", pinyin: "nong na nen la" },
        { yue: "好久勿见！", zh: "好久不见！", pinyin: "hau cieu veq ci" },
        { yue: "再会！", zh: "再见！", pinyin: "tse we" },
      ],
      daily: [
        { yue: "谢谢侬！", zh: "谢谢你！", pinyin: "zia zia nong" },
        { yue: "对勿起！", zh: "对不起！", pinyin: "te veq chi" },
        { yue: "勿要紧。", zh: "不要紧。", pinyin: "veq iau cin" },
        { yue: "慢慢走。", zh: "慢慢走。", pinyin: "me me tseu" },
      ],
      food: [
        { yue: "蛮好吃！", zh: "很好吃！", pinyin: "me ho chi" },
        { yue: "阿拉去吃饭。", zh: "我们去吃饭。", pinyin: "aq la chi ve" },
        { yue: "几钿？", zh: "多少钱？", pinyin: "ci di" },
        { yue: "忒贵哉！", zh: "太贵了！", pinyin: "theq kue ze" },
      ],
      shopping: [
        { yue: "阿拉想买格个。", zh: "我想买这个。", pinyin: "aq la shian ma gaq geq" },
        { yue: "有大点个伐？", zh: "有大一点的吗？", pinyin: "yeu du di geq vaq" },
        { yue: "便宜点好伐？", zh: "便宜一点好吗？", pinyin: "bi yi di hau vaq" },
        { yue: "阿拉先看看。", zh: "我先看看。", pinyin: "aq la shi khe khe" },
      ],
      emotion: [
        { yue: "阿拉老开心。", zh: "我很开心。", pinyin: "aq la lau khe shin" },
        { yue: "阿拉老想侬。", zh: "我很想你。", pinyin: "aq la lau shian nong" },
        { yue: "阿拉老累。", zh: "我很累。", pinyin: "aq la lau le" },
        { yue: "阿拉老欢喜侬。", zh: "我很喜欢你。", pinyin: "aq la lau hue xi nong" },
      ],
    },
  },
  sichuan: {
    quotes: [
      { yue: "你好！", zh: "你好！", pinyin: "ni hao" },
      { yue: "要得！", zh: "可以/好的！", pinyin: "yao de" },
      { yue: "巴适得板！", zh: "非常舒服/很好！", pinyin: "ba shi de ban" },
      { yue: "今天天气安逸。", zh: "今天天气舒服。", pinyin: "jin tian tian qi an yi" },
      { yue: "你吃饭没有？", zh: "你吃饭了吗？", pinyin: "ni chi fan mei you" },
      { yue: "慢慢耍哈。", zh: "慢慢玩/慢走。", pinyin: "man man shua ha" },
    ],
    phrases: {
      greeting: [
        { yue: "你好！", zh: "你好！", pinyin: "ni hao" },
        { yue: "吃饭没有？", zh: "吃饭了吗？", pinyin: "chi fan mei you" },
        { yue: "好久没见咯！", zh: "好久不见！", pinyin: "hao jiu mei jian lo" },
        { yue: "拜拜！", zh: "再见！", pinyin: "bai bai" },
      ],
      daily: [
        { yue: "要得！", zh: "可以/好的！", pinyin: "yao de" },
        { yue: "莫得问题！", zh: "没问题！", pinyin: "mo de wen ti" },
        { yue: "不好意思哈！", zh: "不好意思！", pinyin: "bu hao yi si ha" },
        { yue: "慢慢走哈。", zh: "慢慢走。", pinyin: "man man zou ha" },
      ],
      food: [
        { yue: "巴适！", zh: "很好/舒服！", pinyin: "ba shi" },
        { yue: "安逸！", zh: "舒服/惬意！", pinyin: "an yi" },
        { yue: "好多钱？", zh: "多少钱？", pinyin: "hao duo qian" },
        { yue: "少放点辣。", zh: "少放一点辣。", pinyin: "shao fang dian la" },
      ],
      shopping: [
        { yue: "这个好多钱？", zh: "这个多少钱？", pinyin: "zhe ge hao duo qian" },
        { yue: "便宜点嘛。", zh: "便宜一点吧。", pinyin: "pian yi dian ma" },
        { yue: "我先看哈。", zh: "我先看看。", pinyin: "wo xian kan ha" },
        { yue: "有没有大点的？", zh: "有没有大一点的？", pinyin: "you mei you da dian de" },
      ],
      emotion: [
        { yue: "我好高兴哦！", zh: "我很开心！", pinyin: "wo hao gao xing o" },
        { yue: "我有点恼火。", zh: "我有点生气/烦。", pinyin: "wo you dian nao huo" },
        { yue: "我累惨了。", zh: "我很累。", pinyin: "wo lei can le" },
        { yue: "这个太安逸了。", zh: "这个太舒服了。", pinyin: "zhe ge tai an yi le" },
      ],
    },
  },
};

dialectLearningData.hokkien = dialectLearningData.minnan;
dialectLearningData.shanghainese = dialectLearningData.shanghai;
dialectLearningData.taishanese = dialectLearningData.yue;
dialectLearningData.teochew = dialectLearningData.minnan;
dialectLearningData.wenzhounese = dialectLearningData.shanghai;

const LEARNING_PAGE_LABELS = {
  quiz: "Quiz",
  phrases: "Common phrases",
  daily: "Phrase of the day",
  dictionary: "Dictionary",
  tones: "Tones",
  wordbook: "Wordbook",
};

// 所有工具调用统一走服务端 MCP 接口
async function executeChatTool(name, args = {}) {
  return callMcpTool(name, args);
}

function buildToolFallbackReply({ usedTools, toolResults }) {
  if (usedTools.includes("generate_practice_quiz")) {
    return "Here is a set of practice questions. Answer them below.";
  }
  if (usedTools.includes("get_daily_quote")) {
    return "Here is today's phrase. Try saying it out loud.";
  }
  if (usedTools.includes("get_common_phrases")) {
    return "Here are some useful phrases. Tap one to hear it.";
  }
  if (usedTools.includes("search_dialect_dictionary")) {
    const entries = toolResults.find((item) => item.name === "search_dialect_dictionary")?.result;
    if (Array.isArray(entries) && entries.length) {
      return `I found ${entries.length} matching dictionary entries. See the cards below.`;
    }
  }
  if (usedTools.includes("get_user_progress")) {
    return "Here is a summary of your progress.";
  }
  if (usedTools.includes("navigate_to_learning")) {
    const nav = toolResults.find((item) => item.name === "navigate_to_learning")?.result;
    return nav?.label ? `Opened the ${nav.label} page for you.` : "Opened the page for you.";
  }
  return "I used a learning tool. See the result below.";
}

async function runIntentToolFallback(userInput) {
  const raw = userInput || "";
  const dialect = detectDialectFromText(raw);
  const usedTools = [];
  const toolResults = [];

  const lower = raw.toLowerCase();

  // 练习/出题意图（最优先）
  if (
    /(出|来|做|考|测).*?(题|练习|测验|quiz)|练习一下|考考我|来几道|想做题|帮我.*?(题|练习)/i.test(raw) ||
    /practice|quiz|exercise/i.test(lower)
  ) {
    const args = { dialect, count: 5, difficulty: "medium" };
    const result = await executeChatTool("generate_practice_quiz", args);
    usedTools.push("generate_practice_quiz");
    toolResults.push({ name: "generate_practice_quiz", args, result });
    return { usedTools, toolResults };
  }

  // 每日一句 / 例句
  if (
    /每日一句|今天.*?(句|学|例)|例句|来一句|学一句|方言例句/i.test(raw) ||
    /daily.*quote|example sentence/i.test(lower)
  ) {
    const args = { dialect };
    const result = await executeChatTool("get_daily_quote", args);
    usedTools.push("get_daily_quote");
    toolResults.push({ name: "get_daily_quote", args, result });
    return { usedTools, toolResults };
  }

  // 常用短语 / 场景表达
  if (
    /常用短语|场景|怎么说|如何说|问候|打招呼|购物|买东西|吃饭|点餐|表达/i.test(raw) ||
    /phrase|greeting|shopping|food/i.test(lower)
  ) {
    const category = /购物|买|shop/i.test(raw)
      ? "shopping"
      : /吃|饭|food|餐/i.test(raw)
        ? "food"
        : /情绪|心情|emotion|生气|高兴/i.test(raw)
          ? "emotion"
          : "greeting";
    const args = { dialect, category, limit: 4 };
    const result = await executeChatTool("get_common_phrases", args);
    usedTools.push("get_common_phrases");
    toolResults.push({ name: "get_common_phrases", args, result });
    return { usedTools, toolResults };
  }

  // 学习进度
  if (/学习进度|学了多久|打卡|成就|统计|完成.*(题|练习)/i.test(raw) || /progress|streak|achievement/i.test(lower)) {
    const result = await executeChatTool("get_user_progress", {});
    usedTools.push("get_user_progress");
    toolResults.push({ name: "get_user_progress", args: {}, result });
    return { usedTools, toolResults };
  }

  // 打开学习页面
  if (/打开|去.*?(测验|词典|短语|声调|生词)|跳转|切换到/i.test(raw)) {
    const page = /词典|查词|dictionary/i.test(raw)
      ? "dictionary"
      : /短语|phrase/i.test(raw)
        ? "phrases"
        : /声调|tone/i.test(raw)
          ? "tones"
          : /生词|wordbook/i.test(raw)
            ? "wordbook"
            : "quiz";
    const args = { page };
    const result = await executeChatTool("navigate_to_learning", args);
    usedTools.push("navigate_to_learning");
    toolResults.push({ name: "navigate_to_learning", args, result });
    return { usedTools, toolResults };
  }

  // 兜底：如果用户明确提到方言/学习/粤语/闽南等，给他每日一句
  if (
    /(粤语|台山话|台山話|闽南|閩南|上海话|上海話|潮州话|潮州話|温州话|溫州話|四川话|四川話|方言|学习|学.*话|怎么.*(说|讲))/i.test(raw) ||
    /(cantonese|taishanese|toisan|hokkien|shanghainese|teochew|wenzhounese|sichuanese)/i.test(lower)
  ) {
    const args = { dialect };
    const result = await executeChatTool("get_daily_quote", args);
    usedTools.push("get_daily_quote");
    toolResults.push({ name: "get_daily_quote", args, result });
    return { usedTools, toolResults };
  }

  return { usedTools, toolResults };
}

function renderChatToolWidgets(messageEl, toolResults) {
  const wrap = document.createElement("div");
  wrap.className = "chat-tool-widgets";
  for (const item of toolResults) {
    const widget = createChatToolWidget(item.name, item.result, item.args);
    if (widget) wrap.appendChild(widget);
  }
  if (wrap.childElementCount) {
    messageEl.appendChild(wrap);
  }
}

function createChatToolWidget(name, result, args = {}) {
  if (name === "generate_practice_quiz" && Array.isArray(result) && result.length) {
    return createChatQuizWidget(result);
  }
  if (name === "get_daily_quote" && result && !result.error) {
    return createChatQuoteWidget(result);
  }
  if (name === "get_common_phrases" && result?.phrases?.length) {
    return createChatPhrasesWidget(result);
  }
  if (name === "search_dialect_dictionary" && Array.isArray(result) && result.length) {
    return createChatDictWidget(result, args);
  }
  if (name === "get_user_progress" && result && !result.error) {
    return createChatProgressWidget(result);
  }
  if (name === "navigate_to_learning" && result?.ok) {
    return createChatNavWidget(result);
  }
  return null;
}

function createChatQuizWidget(questions) {
  const wrap = document.createElement("div");
  wrap.className = "chat-tool-widget chat-quiz-widget";
  let index = 0;
  let score = 0;

  function renderQuestion() {
    const q = questions[index];
    wrap.innerHTML = `
      <div class="chat-widget-title">Practice (${index + 1}/${questions.length})</div>
      <div class="chat-quiz-question">${q.question}</div>
      <div class="chat-quiz-options"></div>
      <div class="chat-quiz-feedback"></div>
    `;
    const optionsEl = wrap.querySelector(".chat-quiz-options");
    const feedbackEl = wrap.querySelector(".chat-quiz-feedback");
    q.options.forEach((option, optIndex) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-quiz-option";
      btn.textContent = option;
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".chat-quiz-option").forEach((el) => {
          el.disabled = true;
        });
        if (optIndex === q.correct) {
          btn.classList.add("correct");
          feedbackEl.textContent = "Correct!";
          feedbackEl.className = "chat-quiz-feedback correct";
          score += 1;
        } else {
          btn.classList.add("incorrect");
          wrap.querySelectorAll(".chat-quiz-option")[q.correct]?.classList.add("correct");
          feedbackEl.textContent = `Not quite. The answer is: ${q.options[q.correct]}`;
          feedbackEl.className = "chat-quiz-feedback incorrect";
        }
        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "btn secondary chat-quiz-next";
        nextBtn.textContent = index + 1 >= questions.length ? "See results" : "Next question";
        nextBtn.addEventListener("click", () => {
          index += 1;
          if (index >= questions.length) {
            wrap.innerHTML = `
              <div class="chat-widget-title">Practice complete</div>
              <p class="chat-quiz-summary">Score: ${score}/${questions.length}</p>
              <button type="button" class="btn secondary chat-open-quiz">Continue on the quiz page</button>
            `;
            wrap.querySelector(".chat-open-quiz").addEventListener("click", () => navigateTo("quiz"));
          } else {
            renderQuestion();
          }
        });
        feedbackEl.appendChild(nextBtn);
      });
      optionsEl.appendChild(btn);
    });
  }

  renderQuestion();
  return wrap;
}

function createChatQuoteWidget(quote) {
  const wrap = document.createElement("div");
  wrap.className = "chat-tool-widget chat-quote-widget";
  wrap.innerHTML = `
    <div class="chat-widget-title">${quote.label || "Dialect"} phrase of the day</div>
    <p class="chat-quote-yue">${quote.yue || ""}</p>
    <p class="chat-quote-zh">${quote.zh || ""}</p>
    <p class="chat-quote-pinyin">${quote.pinyin || ""}</p>
    <button type="button" class="btn secondary chat-speak-btn">Listen</button>
  `;
  wrap.querySelector(".chat-speak-btn").addEventListener("click", () => {
    if (typeof speakLearningItem === "function") {
      speakLearningItem(quote.yue, quote.pinyin, quote.dialect || "yue");
    } else if (typeof speakText === "function") {
      speakText(quote.yue);
    }
  });
  return wrap;
}

function createChatPhrasesWidget(data) {
  const wrap = document.createElement("div");
  wrap.className = "chat-tool-widget chat-phrases-widget";
  const title = document.createElement("div");
  title.className = "chat-widget-title";
  title.textContent = `${data.label || "Dialect"} common phrases`;
  wrap.appendChild(title);
  for (const phrase of data.phrases) {
    const item = document.createElement("div");
    item.className = "chat-phrase-item";
    item.innerHTML = `
      <div class="chat-phrase-yue">${phrase.yue}</div>
      <div class="chat-phrase-zh">${phrase.zh}</div>
      <div class="chat-phrase-pinyin">${phrase.pinyin || ""}</div>
    `;
    item.addEventListener("click", () => {
      if (typeof speakLearningItem === "function") {
        speakLearningItem(phrase.yue, phrase.pinyin, data.dialect || "yue");
      }
    });
    wrap.appendChild(item);
  }
  return wrap;
}

function createChatDictWidget(entries, args) {
  const wrap = document.createElement("div");
  wrap.className = "chat-tool-widget chat-dict-widget";
  wrap.innerHTML = `<div class="chat-widget-title">Dictionary results</div>`;
  const list = document.createElement("div");
  list.className = "chat-dict-list";
  for (const entry of entries.slice(0, 6)) {
    const row = document.createElement("div");
    row.className = "chat-dict-item";
    row.innerHTML = `
      <strong>${entry.term || entry.trad || ""}</strong>
      <span>${entry.reading || ""}</span>
      <p>${entry.meaning || ""}</p>
    `;
    list.appendChild(row);
  }
  wrap.appendChild(list);
  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "btn secondary";
  openBtn.textContent = "View in the dictionary";
  openBtn.addEventListener("click", () => {
    if (args?.query && yueDictSearchEl) yueDictSearchEl.value = args.query;
    navigateTo("dictionary");
  });
  wrap.appendChild(openBtn);
  return wrap;
}

function createChatProgressWidget(progress) {
  const wrap = document.createElement("div");
  wrap.className = "chat-tool-widget chat-progress-widget";
  wrap.innerHTML = `
    <div class="chat-widget-title">Learning progress</div>
    <ul class="chat-progress-list">
      <li>Phrases learned: <strong>${progress.phrasesLearned || 0}</strong></li>
      <li>Quizzes finished: <strong>${progress.quizCompleted || 0}</strong></li>
      <li>Saved items: <strong>${progress.favoritesCount || 0}</strong></li>
      <li>Wordbook: <strong>${progress.wordbookCount || 0}</strong></li>
      <li>Check-in streak: <strong>${progress.checkinStreak || 0}</strong> days</li>
    </ul>
  `;
  return wrap;
}

function createChatNavWidget(result) {
  const wrap = document.createElement("div");
  wrap.className = "chat-tool-widget chat-nav-widget";
  wrap.innerHTML = `
    <div class="chat-widget-title">Opened ${result.label}</div>
    <p>You can keep learning on that page.</p>
  `;
  return wrap;
}

// ==================== 新增工具辅助函数 ====================

const TONE_GUIDE_DATA = {
  yue: {
    title: "Cantonese six tones",
    description: "Cantonese has 6 tones: high level (55), high rising (35), mid level (33), low falling (21), low rising (13) and low level (22).",
    examples: [
      { word: "诗", pinyin: "si1", tone: "阴平 (高平调)", meaning: "诗" },
      { word: "史", pinyin: "si2", tone: "阴上 (高升调)", meaning: "历史" },
      { word: "试", pinyin: "si3", tone: "阴去 (中平调)", meaning: "尝试" },
      { word: "时", pinyin: "si4", tone: "阳平 (低降调)", meaning: "时间" },
      { word: "市", pinyin: "si5", tone: "阳上 (低升调)", meaning: "城市" },
      { word: "是", pinyin: "si6", tone: "阳去 (低平调)", meaning: "是" },
    ],
  },
  minnan: {
    title: "Minnan tones",
    description: "Minnan has 7 tones (including entering tones). The 5 most common are tones 1, 2, 3, 4 and 8.",
    examples: [
      { word: "你", pinyin: "lí", tone: "阳平", meaning: "你" },
      { word: "好", pinyin: "hó", tone: "上声", meaning: "好" },
      { word: "食", pinyin: "tsia̍h", tone: "阳入", meaning: "吃" },
    ],
  },
  shanghai: {
    title: "Shanghainese tones",
    description: "Shanghainese tones are fairly simple, with four main classes: yin level, yang level, yin departing and yang departing.",
    examples: [
      { word: "侬", pinyin: "nong", tone: "阴平", meaning: "你" },
      { word: "好", pinyin: "hao", tone: "上声", meaning: "好" },
    ],
  },
  sichuan: {
    title: "Sichuanese tones",
    description: "Sichuanese usually has 4 tones: yin level, yang level, rising and departing.",
    examples: [
      { word: "你", pinyin: "ni3", tone: "上声", meaning: "你" },
      { word: "好", pinyin: "hao3", tone: "上声", meaning: "好" },
    ],
  },
};

function getToneGuide(dialect) {
  return TONE_GUIDE_DATA[dialect] || TONE_GUIDE_DATA.yue;
}

const WORD_EXAMPLE_BANK = {
  yue: {
    你好: [
      { yue: "你好！", zh: "你好！", pinyin: "nei5 hou2" },
      { yue: "你好啊，最近点呀？", zh: "你好啊，最近怎么样？", pinyin: "nei5 hou2 aa3, zeoi3 gan6 dim2 aa3" },
    ],
    多谢: [
      { yue: "多谢你！", zh: "谢谢你！", pinyin: "do1 ze6 nei5" },
      { yue: "多谢晒！", zh: "非常感谢！", pinyin: "do1 ze6 saai3" },
    ],
  },
  minnan: {
    你好: [
      { yue: "你好！", zh: "你好！", pinyin: "li2 ho2" },
      { yue: "你好，食飽未？", zh: "你好，吃饱了吗？", pinyin: "li2 ho2, tsiah8 pa2 bue7" },
    ],
  },
};

function generateWordExamples(dialect, term, limit) {
  const bank = WORD_EXAMPLE_BANK[dialect] || WORD_EXAMPLE_BANK.yue;
  const list = bank[term] || [];
  if (list.length) return list.slice(0, limit);

  // 没有预设例句时，生成简单示例
  return Array.from({ length: Math.min(limit, 2) }, (_, i) => ({
    yue: `${term}。`,
    zh: `${term}。`,
    pinyin: "",
    note: "(Examples are generated. Feel free to add more natural ones.)",
  }));
}

const COMPARISON_MAP = {
  你好: { yue: "你好", minnan: "你好 / lí ho", shanghai: "侬好", sichuan: "你好" },
  谢谢: { yue: "多谢", minnan: "多谢 / to-sia", shanghai: "谢谢侬", sichuan: "谢谢" },
  吃饭: { yue: "食饭", minnan: "食饭 / tsia̍h-pn̄g", shanghai: "吃饭", sichuan: "吃饭" },
  再见: { yue: "再见 / 拜拜", minnan: "再会", shanghai: "再会", sichuan: "再见" },
};

function buildDialectComparison(word) {
  const entry = COMPARISON_MAP[word] || {};
  return SUPPORTED_DIALECT_IDS.map((d) => ({
    dialect: d,
    label: getDialectMeta(d).label,
    text: entry[d] || "（暂无数据）",
  }));
}

function generateRandomChallenge(dialect, type) {
  if (type === "tone") {
    const guide = getToneGuide(dialect);
    const ex = guide.examples?.[0] || { word: "诗", pinyin: "si1", meaning: "诗" };
    return {
      title: "Tone challenge",
      question: `Say the tone of "${ex.word}"`,
      answer: ex.tone,
      hint: ex.pinyin,
    };
  }
  if (type === "phrase") {
    const phrases = dialectLearningData[dialect]?.phrases?.greeting || [];
    const p = phrases[0] || { yue: "你好", zh: "你好" };
    return {
      title: "Phrase challenge",
      question: `Repeat after me: ${p.yue}`,
      answer: p.zh,
      hint: p.pinyin || "",
    };
  }
  // 默认 quiz
  const q = quizQuestions.medium?.[0] || { question: "「你好」用粤语怎么说？", options: ["你好", "拜拜"], correct: 0 };
  return {
    title: "Multiple-choice challenge",
    question: q.question,
    options: q.options,
    answer: q.options[q.correct],
  };
}

const quizQuestions = {
  easy: [
    { question: "「早晨」是什么意思？", options: ["早上好", "晚上好", "中午好", "再见"], correct: 0 },
    { question: "「多谢你」用粤语怎么说？", options: ["唔该你", "多谢你", "对唔住", "唔好意思"], correct: 1 },
    { question: "「食咗饭未呀？」是什么意思？", options: ["你去哪？", "你吃饭了吗？", "你好吗？", "再见！"], correct: 1 },
    { question: "「好食」是什么意思？", options: ["好喝", "好看", "好吃", "好听"], correct: 2 },
    { question: "「再见」用粤语怎么说？", options: ["早晨", "拜拜", "再见", "晚安"], correct: 2 },
    { question: "「唔该」是什么意思？", options: ["谢谢", "对不起", "你好", "再见"], correct: 0 },
    { question: "「你好吗？」用粤语怎么说？", options: ["你好吗？", "你食咗饭未？", "你叫咩名？", "你去边度？"], correct: 0 },
    { question: "「好饮」是什么意思？", options: ["好看", "好听", "好喝", "好吃"], correct: 2 },
    { question: "「慢慢行」是什么意思？", options: ["慢慢吃", "慢慢走", "慢慢说", "慢慢看"], correct: 1 },
    { question: "「小心啲」是什么意思？", options: ["快一点", "慢一点", "小心一点", "大声一点"], correct: 2 },
  ],
  medium: [
    { question: "「得闲饮茶」是什么意思？", options: ["有空喝茶", "现在喝茶", "不要喝茶", "明天喝茶"], correct: 0 },
    { question: "「好挂住你」是什么意思？", options: ["好喜欢你", "好想念你", "好担心你", "好关心你"], correct: 1 },
    { question: "「唔好意思」是什么意思？", options: ["不好意思", "很好意思", "没关系", "对不起"], correct: 0 },
    { question: "「几多钱」是什么意思？", options: ["多少钱", "什么钱", "哪里钱", "谁钱"], correct: 0 },
    { question: "「太贵啦」是什么意思？", options: ["太便宜了", "太贵了", "太好了", "太差了"], correct: 1 },
    { question: "「平啲啦」是什么意思？", options: ["贵一点", "便宜一点", "快一点", "慢一点"], correct: 1 },
    { question: "「我睇睇先」是什么意思？", options: ["我先看看", "我先买买", "我先走走", "我先吃吃"], correct: 0 },
    { question: "「好嬲」是什么意思？", options: ["好开心", "好生气", "好难过", "好害怕"], correct: 1 },
    { question: "「好攰」是什么意思？", options: ["好累", "好饿", "好困", "好忙"], correct: 0 },
    { question: "「好钟意」是什么意思？", options: ["好讨厌", "好喜欢", "好害怕", "好担心"], correct: 1 },
  ],
  hard: [
    { question: "「佢」是什么意思？", options: ["他/她", "你", "我", "它"], correct: 0 },
    { question: "「咗」是什么意思？", options: ["了", "在", "是", "有"], correct: 0 },
    { question: "「嘅」是什么意思？", options: ["的", "地", "得", "着"], correct: 0 },
    { question: "「喺」是什么意思？", options: ["在", "是", "有", "去"], correct: 0 },
    { question: "「唔」是什么意思？", options: ["不", "是", "有", "去"], correct: 0 },
    { question: "「啲」是什么意思？", options: ["一些", "很多", "全部", "没有"], correct: 0 },
    { question: "「喇」是什么意思？", options: ["了", "吗", "呢", "啊"], correct: 0 },
    { question: "「嚟」是什么意思？", options: ["来", "去", "走", "跑"], correct: 0 },
    { question: "「嘢」是什么意思？", options: ["东西", "人", "地方", "时间"], correct: 0 },
    { question: "「噉」是什么意思？", options: ["这样", "那样", "什么", "哪里"], correct: 0 },
  ],
};

function flattenDialectPhraseItems(dialect) {
  const phrases = getDialectPhrases(dialect);
  return Object.values(phrases).flat().filter((item) => item.yue && item.zh);
}

function buildQuizFromPhraseItems(dialect, difficulty) {
  const meta = getDialectMeta(dialect);
  const items = flattenDialectPhraseItems(dialect);
  const pool = [...items].sort(() => Math.random() - 0.5);
  const count = Math.min(10, pool.length);
  return pool.slice(0, count).map((item, index) => {
    const question =
      difficulty === "easy"
        ? `What does "${item.yue}" mean?`
        : `Which is the standard Mandarin meaning of "${item.yue}"?${item.pinyin ? ` (${meta.readingLabel}: ${item.pinyin})` : ""}`;
    const distractors = pool
      .filter((other) => other.zh !== item.zh)
      .slice(index + 1)
      .concat(pool.filter((other) => other.zh !== item.zh).slice(0, index + 1))
      .slice(0, 3)
      .map((other) => other.zh);
    const options = [item.zh, ...distractors].slice(0, 4).sort(() => Math.random() - 0.5);
    return {
      question,
      options,
      correct: Math.max(0, options.indexOf(item.zh)),
    };
  });
}

function getLocalQuizQuestions(dialect, difficulty) {
  if (dialect === "yue") {
    return [...(quizQuestions[difficulty] || quizQuestions.medium)]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
  }
  return buildQuizFromPhraseItems(dialect, difficulty);
}

let currentPhraseCategory = "greeting";
let currentQuiz = [];
let currentQuestionIndex = 0;
let quizScore = 0;
let quizDifficulty = "medium";

function getSelectedDialect(selectEl, fallback = "yue") {
  return DIALECTS[selectEl?.value] ? selectEl.value : fallback;
}

function getCurrentDailyDialect() {
  return getSelectedDialect(dailyDialectEl, "yue");
}

function getCurrentPhraseDialect() {
  return getSelectedDialect(phraseDialectEl, "yue");
}

function getCurrentQuizDialect() {
  return getSelectedDialect(quizDialectEl, "yue");
}

function getDialectQuotes(dialect = getCurrentDailyDialect()) {
  return dialectLearningData[dialect]?.quotes || dailyQuotes;
}

function getDialectPhrases(dialect = getCurrentPhraseDialect()) {
  return dialectLearningData[dialect]?.phrases || commonPhrases;
}

function inferKnownLearningDialect(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return "";
  for (const [dialect, data] of Object.entries(dialectLearningData)) {
    const inQuotes = (data.quotes || []).some((item) => item.yue === raw || item.zh === raw);
    if (inQuotes) return dialect;
    const phraseItems = Object.values(data.phrases || {}).flat();
    if (phraseItems.some((item) => item.yue === raw || item.zh === raw)) return dialect;
  }
  return "";
}

function showDialectAudioUnavailable(dialect = "yue", reading = "") {
  const meta = getDialectMeta(dialect);
  const readingText = reading ? `See the ${meta.readingLabel}: ${reading}` : `See the ${meta.readingLabel || "romanization"} on the page`;
  const message = `There is no standard ${meta.label} audio. ${readingText}`;
  if (typeof showPixelToast === "function") {
    showPixelToast(message);
  } else {
    alert(message);
  }
}

function speakLearningItem(text, pinyin = "", dialect = "yue") {
  if (dialect === "yue" && pinyin) {
    playYuePinyin(pinyin);
    return true;
  }
  showDialectAudioUnavailable(dialect, pinyin || text);
  return false;
}

function syncLearningDialectUI() {
  const dailyDialect = getCurrentDailyDialect();
  const phraseDialect = getCurrentPhraseDialect();
  const quizDialect = getCurrentQuizDialect();
  const dailyMeta = getDialectMeta(dailyDialect);
  const phraseMeta = getDialectMeta(phraseDialect);
  const quizMeta = getDialectMeta(quizDialect);

  document.getElementById("homeDailyTitle").textContent = `Today's ${dailyMeta.label} phrase`;
  document.getElementById("dailyTitle").textContent = `${dailyMeta.label} phrase of the day`;
  document.getElementById("phrasesTitle").textContent = `Common ${phraseMeta.label} phrases`;
  document.getElementById("quizTitle").textContent = `${quizMeta.label} quiz`;
  document.getElementById("quizIntro").textContent = `Ready to test your ${quizMeta.label}?`;
  document.getElementById("customQuoteYue").placeholder = `Phrase in ${dailyMeta.label}`;
  document.getElementById("customQuotePinyin").placeholder = `${dailyMeta.readingLabel || "Romanization"} (optional)`;
}

function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const quotes = getDialectQuotes();
  return quotes[dayOfYear % quotes.length];
}

function renderDailyQuote() {
  const quote = getDailyQuote();
  document.getElementById("homeQuoteYue").textContent = quote.yue;
  document.getElementById("homeQuoteZh").textContent = quote.zh;
  document.getElementById("homeQuotePinyin").textContent = quote.pinyin;
  
  document.getElementById("dailyQuoteYue").textContent = quote.yue;
  document.getElementById("dailyQuoteZh").textContent = quote.zh;
  document.getElementById("dailyQuotePinyin").textContent = quote.pinyin;
}

async function playDailyQuote() {
  const dialect = getCurrentDailyDialect();
  const quote = getDailyQuote();
  if (dialect !== "yue") {
    return speakLearningItem(quote.yue, quote.pinyin, dialect);
  }
  try {
    await loadYueDictionary();
  } catch {
    /* findYueWords 在无词典时为空 */
  }
  const words = quote.yue.replace(/[！？，。、]/g, "").split("");
  words.forEach((word, index) => {
    setTimeout(() => {
      const dictResult = findYueWords(word);
      if (dictResult.length > 0 && dictResult[0].pinyin) {
        playYuePinyin(dictResult[0].pinyin);
      }
    }, index * 800);
  });
  return true;
}

function renderPhraseList(category) {
  const phraseList = document.getElementById("phraseList");
  const dialect = getCurrentPhraseDialect();
  const phrases = getDialectPhrases(dialect)[category] || [];
  
  phraseList.innerHTML = phrases.map((phrase, index) => `
    <div class="phrase-item">
      <div class="phrase-content">
        <div class="yue">${phrase.yue}</div>
        <div class="zh">${phrase.zh}</div>
        <div class="pinyin">${phrase.pinyin}</div>
      </div>
      <div class="phrase-actions">
        <button class="icon-btn phrase-play-btn" data-index="${index}" data-pinyin="${phrase.pinyin}" title="Play pronunciation">Play</button>
        <button class="icon-btn phrase-fav-btn" data-phrase="${phrase.yue}" title="Save">Save</button>
      </div>
    </div>
  `).join("");
  
  phraseList.querySelectorAll(".phrase-play-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const phrase = phrases[Number(btn.dataset.index)] || {};
      const didPlay = speakLearningItem(phrase.yue, phrase.pinyin, dialect);
      if (didPlay) trackAudioPlayed();
      trackPhraseLearned();
    });
  });
  
  phraseList.querySelectorAll(".phrase-fav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addToFavorites(btn.dataset.phrase, "", "", "短语", dialect);
      alert("Added to favorites!");
    });
  });
}

function startQuiz() {
  const dialect = getCurrentQuizDialect();
  quizDifficulty = document.getElementById("quizDifficulty").value;
  currentQuiz = getLocalQuizQuestions(dialect, quizDifficulty);
  currentQuestionIndex = 0;
  quizScore = 0;
  
  document.getElementById("quizStart").style.display = "none";
  document.getElementById("quizQuestion").style.display = "block";
  
  renderQuestion();
}

function renderQuestion() {
  const question = currentQuiz[currentQuestionIndex];
  document.getElementById("questionCounter").textContent = `Question ${currentQuestionIndex + 1}/${currentQuiz.length}`;
  document.getElementById("currentScore").textContent = `Score: ${quizScore}`;
  document.getElementById("questionText").textContent = question.question;
  document.getElementById("questionFeedback").textContent = "";
  document.getElementById("questionFeedback").className = "question-feedback";
  document.getElementById("nextQuestionBtn").style.display = "none";
  
  const optionsContainer = document.getElementById("questionOptions");
  optionsContainer.innerHTML = question.options.map((option, index) => `
    <button class="question-option" data-index="${index}">${option}</button>
  `).join("");
  
  optionsContainer.querySelectorAll(".question-option").forEach(btn => {
    btn.addEventListener("click", () => handleAnswer(parseInt(btn.dataset.index)));
  });
}

function handleAnswer(selectedIndex) {
  const question = currentQuiz[currentQuestionIndex];
  const options = document.querySelectorAll(".question-option");
  const feedback = document.getElementById("questionFeedback");
  
  options.forEach(btn => btn.classList.add("disabled"));
  
  if (selectedIndex === question.correct) {
    options[selectedIndex].classList.add("correct");
    feedback.textContent = "Correct!";
    feedback.classList.add("correct");
    quizScore++;
  } else {
    options[selectedIndex].classList.add("incorrect");
    options[question.correct].classList.add("correct");
    feedback.textContent = `Not quite. The answer is: ${question.options[question.correct]}`;
    feedback.classList.add("incorrect");
  }
  
  document.getElementById("currentScore").textContent = `Score: ${quizScore}`;
  document.getElementById("nextQuestionBtn").style.display = "block";
}

function nextQuestion() {
  currentQuestionIndex++;
  
  if (currentQuestionIndex >= currentQuiz.length) {
    showQuizResult();
  } else {
    renderQuestion();
  }
}

function showQuizResult() {
  document.getElementById("quizQuestion").style.display = "none";
  document.getElementById("quizStart").style.display = "block";
  
  const percentage = Math.round((quizScore / currentQuiz.length) * 100);
  let message = "";
  if (percentage >= 90) {
    message = `Great job! Your ${getDialectMeta(getCurrentQuizDialect()).label} is excellent!`;
  } else if (percentage >= 70) {
    message = "Nice work! Keep going!";
  } else if (percentage >= 50) {
    message = "Not bad. A little more practice and you will improve!";
  } else {
    message = "Keep studying. Do not get discouraged!";
  }
  
  document.getElementById("quizScore").innerHTML = `
    <p>Quiz complete!</p>
    <p>Score: ${quizScore}/${currentQuiz.length} (${percentage}%)</p>
    <p>${message}</p>
  `;
  
  saveQuizScore(quizScore, currentQuiz.length, quizDifficulty);
}

function saveQuizScore(score, total, difficulty) {
  const scores = JSON.parse(localStorage.getItem("dls-ai-quiz-scores") || "[]");
  scores.push({
    score,
    total,
    difficulty,
    date: new Date().toISOString(),
  });
  localStorage.setItem("dls-ai-quiz-scores", JSON.stringify(scores));
  
  updateProgressStats();
}

function getRandomDictEntries(count, dialect = "yue") {
  const source = dialect === "yue" ? yueDictionary : getRegionalDialectEntries(dialect);
  if (!source || source.length === 0) return [];
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).filter(e => e.pinyin && e.explanation);
}

async function generateAIQuiz() {
  const dialect = getCurrentQuizDialect();
  const meta = getDialectMeta(dialect);
  const difficulty = document.getElementById("quizDifficulty").value;
  const aiQuizBtn = document.getElementById("startAIQuizBtn");
  const originalText = aiQuizBtn.textContent;
  aiQuizBtn.textContent = "Making questions…";
  aiQuizBtn.disabled = true;

  try {
    if (dialect === "yue") {
      await loadYueDictionary();
    } else if (isRegionalDialect(dialect)) {
      await loadRegionalDialectDictionary(dialect);
    }
  } catch (err) {
    console.error(err);
    aiQuizBtn.textContent = originalText;
    aiQuizBtn.disabled = false;
    alert(`The ${meta.label} dictionary failed to load, so AI questions are unavailable. Try again later or use the built-in questions.`);
    return;
  }

  const dictEntries = getRandomDictEntries(20, dialect);
  const dictContext = dictEntries.map(entry => {
    const example = entry.example ? `（示例：${entry.example}）` : "";
    return `${entry.simp}(${entry.trad}) ${meta.readingLabel}:${entry.pinyin} - ${entry.explanation || ""}${example}`;
  }).join("\n");

  const difficultyGuide = {
    easy: `Easy: choose the meaning of a common ${meta.label} word, 4 options, 1 correct answer`,
    medium: `Medium: tell apart the usage and meaning of ${meta.label} words, 4 options, 1 correct answer`,
    hard: `Hard: ${meta.label} grammar, slang or pronunciation, 4 options, 1 correct answer`,
  };

  const prompt = `You write quiz questions for learners of ${meta.label}. Using the ${meta.label} dictionary information below, or your general knowledge of the language, write 5 multiple-choice questions.

Difficulty: ${difficultyGuide[difficulty]}

Dictionary reference:
${dictContext || "No local dictionary reference. Use accurate general knowledge of the language."}

Write the questions and options in English, and show dialect words in Chinese characters with romanization where helpful. Output only JSON in exactly this format, with nothing else:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]

"correct" is the index of the right option (0-3). Make the questions accurate, with plausible wrong options but exactly 1 correct answer.`;

  try {
    const result = await callChatAPI([
      { role: "system", content: `You write quiz questions for learners of ${meta.label}. Output only a JSON array of questions and nothing else.` },
      { role: "user", content: prompt },
    ]);

    let questions;
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      questions = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("解析AI出题结果失败:", parseErr, result);
      aiQuizBtn.textContent = originalText;
      aiQuizBtn.disabled = false;
      alert("Could not read the AI questions. Try again or use the built-in questions.");
      return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      aiQuizBtn.textContent = originalText;
      aiQuizBtn.disabled = false;
      alert("The AI did not make valid questions. Please try again.");
      return;
    }

    currentQuiz = questions.map(q => ({
      question: q.question || "",
      options: Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"],
      correct: typeof q.correct === "number" ? q.correct : 0,
    }));

    currentQuestionIndex = 0;
    quizScore = 0;
    quizDifficulty = difficulty;

    document.getElementById("quizStart").style.display = "none";
    document.getElementById("quizQuestion").style.display = "block";
    renderQuestion();
  } catch (err) {
    console.error("AI 出题失败:", err);
    alert(`AI quiz failed: ${getErrorMessage(err)}\nCheck that the AI service is running, or use the built-in questions.`);
  } finally {
    aiQuizBtn.textContent = originalText;
    aiQuizBtn.disabled = false;
  }
}

const PROGRESS_STATS_KEY = "dls-ai-progress-stats";
let progressStatsCache = null;
let progressStatsDirty = false;
let progressStatsFlushTimer = null;

function getProgressStats() {
  if (progressStatsCache === null) {
    try {
      progressStatsCache = JSON.parse(localStorage.getItem(PROGRESS_STATS_KEY) || "{}");
    } catch {
      progressStatsCache = {};
    }
  }
  return progressStatsCache;
}

function flushProgressStatsNow() {
  if (!progressStatsDirty || progressStatsCache === null) return;
  try {
    localStorage.setItem(PROGRESS_STATS_KEY, JSON.stringify(progressStatsCache));
  } catch {
    /* quota */
  }
  progressStatsDirty = false;
  if (progressStatsFlushTimer) {
    clearTimeout(progressStatsFlushTimer);
    progressStatsFlushTimer = null;
  }
}

function scheduleFlushProgressStats() {
  progressStatsDirty = true;
  if (progressStatsFlushTimer) return;
  progressStatsFlushTimer = setTimeout(() => {
    progressStatsFlushTimer = null;
    flushProgressStatsNow();
  }, 250);
}

window.addEventListener("beforeunload", flushProgressStatsNow);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushProgressStatsNow();
});

function trackAudioPlayed() {
  const stats = getProgressStats();
  stats.audioPlayed = (stats.audioPlayed || 0) + 1;
  scheduleFlushProgressStats();
  updateProgressStats();
}

function trackPhraseLearned() {
  const stats = getProgressStats();
  stats.phrasesLearned = (stats.phrasesLearned || 0) + 1;
  scheduleFlushProgressStats();
  updateProgressStats();
}

function updateProgressStats() {
  const stats = getProgressStats();
  const quizScores = JSON.parse(localStorage.getItem("dls-ai-quiz-scores") || "[]");
  const favorites = JSON.parse(localStorage.getItem("dls-ai-favorites") || "[]");
  
  const phrasesLearned = stats.phrasesLearned || 0;
  const quizCompleted = quizScores.length;
  const favoritesCount = favorites.length;
  const audioPlayed = stats.audioPlayed || 0;
  
  document.getElementById("statPhrasesLearned").textContent = phrasesLearned;
  document.getElementById("statQuizCompleted").textContent = quizCompleted;
  document.getElementById("statFavorites").textContent = favoritesCount;
  document.getElementById("statAudioPlayed").textContent = audioPlayed;
  
  const totalGoal = 100;
  const currentProgress = Math.min(
    Math.round(((phrasesLearned + quizCompleted * 5 + favoritesCount + audioPlayed) / totalGoal) * 100),
    100
  );
  
  document.getElementById("progressPercentage").textContent = `${currentProgress}%`;
  document.getElementById("progressFill").style.width = `${currentProgress}%`;
}

document.getElementById("homePlayQuoteBtn").addEventListener("click", () => {
  playDailyQuote().then((didPlay) => {
    if (didPlay) trackAudioPlayed();
  });
});
document.getElementById("dailyPlayQuoteBtn").addEventListener("click", () => {
  playDailyQuote().then((didPlay) => {
    if (didPlay) trackAudioPlayed();
  });
});
document.getElementById("dailyNextQuoteBtn").addEventListener("click", () => {
  const quotes = getDialectQuotes();
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  document.getElementById("dailyQuoteYue").textContent = quote.yue;
  document.getElementById("dailyQuoteZh").textContent = quote.zh;
  document.getElementById("dailyQuotePinyin").textContent = quote.pinyin;
});
document.getElementById("dailyFavoriteQuoteBtn").addEventListener("click", () => {
  const yue = document.getElementById("dailyQuoteYue").textContent;
  const zh = document.getElementById("dailyQuoteZh").textContent;
  if (yue && yue !== "Loading…") {
    addToFavorites(yue, zh, "", "每日一句", getCurrentDailyDialect());
    alert("Added to favorites!");
  }
});

document.querySelectorAll(".phrase-cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".phrase-cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentPhraseCategory = btn.dataset.cat;
    renderPhraseList(currentPhraseCategory);
  });
});

phraseDialectEl?.addEventListener("change", () => {
  syncLearningDialectUI();
  renderPhraseList(currentPhraseCategory);
});

dailyDialectEl?.addEventListener("change", () => {
  syncLearningDialectUI();
  renderDailyQuote();
});

quizDialectEl?.addEventListener("change", syncLearningDialectUI);

document.getElementById("startQuizBtn").addEventListener("click", startQuiz);
document.getElementById("startAIQuizBtn").addEventListener("click", generateAIQuiz);
document.getElementById("nextQuestionBtn").addEventListener("click", nextQuestion);

const tonePracticeWords = [
  { yue: "诗", pinyin: "si1", tone: 1 },
  { yue: "史", pinyin: "si2", tone: 2 },
  { yue: "试", pinyin: "si3", tone: 3 },
  { yue: "时", pinyin: "si4", tone: 4 },
  { yue: "市", pinyin: "si5", tone: 5 },
  { yue: "是", pinyin: "si6", tone: 6 },
  { yue: "三", pinyin: "saam1", tone: 1 },
  { yue: "产", pinyin: "caan2", tone: 2 },
  { yue: "山", pinyin: "saan1", tone: 1 },
  { yue: "眼", pinyin: "ngaan5", tone: 5 },
  { yue: "花", pinyin: "faa1", tone: 1 },
  { yue: "华", pinyin: "waa4", tone: 4 },
  { yue: "化", pinyin: "faa3", tone: 3 },
  { yue: "下", pinyin: "haa5", tone: 5 },
  { yue: "虾", pinyin: "haa1", tone: 1 },
  { yue: "霞", pinyin: "haa4", tone: 4 },
  { yue: "马", pinyin: "maa5", tone: 5 },
  { yue: "妈", pinyin: "maa1", tone: 1 },
  { yue: "麻", pinyin: "maa4", tone: 4 },
  { yue: "骂", pinyin: "maa6", tone: 6 },
];

let currentTonePractice = [];
let currentToneQuestionIndex = 0;
let toneScore = 0;
let currentToneWord = null;

function startTonePractice() {
  currentTonePractice = [...tonePracticeWords].sort(() => Math.random() - 0.5).slice(0, 10);
  currentToneQuestionIndex = 0;
  toneScore = 0;
  
  document.querySelector(".game-start").style.display = "none";
  document.getElementById("toneQuestion").style.display = "block";
  
  renderToneQuestion();
}

function renderToneQuestion() {
  currentToneWord = currentTonePractice[currentToneQuestionIndex];
  document.getElementById("toneQuestionCounter").textContent = `Question ${currentToneQuestionIndex + 1}/${currentTonePractice.length}`;
  document.getElementById("toneScore").textContent = `Score: ${toneScore}`;
  document.getElementById("toneFeedback").textContent = "";
  document.getElementById("toneFeedback").className = "tone-feedback";
  document.getElementById("nextToneBtn").style.display = "none";
  
  const toneOptions = document.getElementById("toneOptions");
  const toneNames = ["High level", "High rising", "Mid level", "Low falling", "Low rising", "Low level"];
  toneOptions.innerHTML = toneNames.map((name, index) => `
    <button class="tone-option" data-tone="${index + 1}">
      <div>${index + 1}</div>
      <div>${name}</div>
    </button>
  `).join("");
  
  toneOptions.querySelectorAll(".tone-option").forEach(btn => {
    btn.addEventListener("click", () => handleToneAnswer(parseInt(btn.dataset.tone)));
  });
}

function handleToneAnswer(selectedTone) {
  const options = document.querySelectorAll(".tone-option");
  const feedback = document.getElementById("toneFeedback");
  
  options.forEach(btn => btn.classList.add("disabled"));
  
  if (selectedTone === currentToneWord.tone) {
    options[selectedTone - 1].classList.add("correct");
    feedback.textContent = `Correct! "${currentToneWord.yue}" is tone ${currentToneWord.tone} (${["high level", "high rising", "mid level", "low falling", "low rising", "low level"][currentToneWord.tone - 1]})`;
    feedback.classList.add("correct");
    toneScore++;
  } else {
    options[selectedTone - 1].classList.add("incorrect");
    options[currentToneWord.tone - 1].classList.add("correct");
    feedback.textContent = `Not quite. "${currentToneWord.yue}" (${currentToneWord.pinyin}) is tone ${currentToneWord.tone} (${["high level", "high rising", "mid level", "low falling", "low rising", "low level"][currentToneWord.tone - 1]})`;
    feedback.classList.add("incorrect");
  }
  
  document.getElementById("toneScore").textContent = `Score: ${toneScore}`;
  document.getElementById("nextToneBtn").style.display = "block";
}

function nextToneQuestion() {
  currentToneQuestionIndex++;
  
  if (currentToneQuestionIndex >= currentTonePractice.length) {
    showToneResult();
  } else {
    renderToneQuestion();
  }
}

function showToneResult() {
  document.getElementById("toneQuestion").style.display = "none";
  document.querySelector(".game-start").style.display = "block";
  
  const percentage = Math.round((toneScore / currentTonePractice.length) * 100);
  let message = "";
  if (percentage >= 90) {
    message = "Great job! Your tones are excellent!";
  } else if (percentage >= 70) {
    message = "Nice work! Keep practicing the tones!";
  } else if (percentage >= 50) {
    message = "Not bad. Listen and practice more and you will improve!";
  } else {
    message = "Keep practicing the tones. Do not get discouraged!";
  }
  
  document.querySelector(".game-start p").textContent = `Drill complete! Score: ${toneScore}/${currentTonePractice.length} (${percentage}%) ${message}`;
}

document.querySelectorAll(".tone-play-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    playYuePinyin(btn.dataset.pinyin);
    trackAudioPlayed();
  });
});

document.getElementById("startTonePracticeBtn").addEventListener("click", startTonePractice);
document.getElementById("playToneBtn").addEventListener("click", () => {
  if (currentToneWord) {
    playYuePinyin(currentToneWord.pinyin);
    trackAudioPlayed();
  }
});
document.getElementById("nextToneBtn").addEventListener("click", nextToneQuestion);

syncLearningDialectUI();
renderDailyQuote();
renderPhraseList("greeting");
updateProgressStats();

// 初始化页面导航
initNavigation();
initOnboarding();

// 后台预加载词典，减少首次查询/RAG 等待
loadYueDictionary().catch(() => {});

loadConfigToForm();
loadConversation();
renderFavorites();
renderTranslateHistory();

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (currentPageName === "chat") sendChatBtn.click();
        else if (currentPageName === "translate") translateBtn.click();
        break;
      case "1":
        e.preventDefault();
        navigateTo("home");
        break;
      case "2":
        e.preventDefault();
        navigateTo("chat");
        break;
      case "3":
        e.preventDefault();
        navigateTo("translate");
        break;
      case "4":
        e.preventDefault();
        navigateTo("dictionary");
        break;
      case "5":
        e.preventDefault();
        navigateTo("quiz");
        break;
    }
  }
  if (e.key === "Escape") {
    chatInputEl.blur();
    translateInputEl.blur();
    yueDictSearchEl.blur();
  }
});

// ==================== 生词本功能 ====================
const WORDBOOK_KEY = "dls-ai-wordbook";
const SR_INTERVALS = [1, 3, 7, 14, 30, 60];

function loadWordbook() {
  try {
    return JSON.parse(localStorage.getItem(WORDBOOK_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveWordbook(book) {
  localStorage.setItem(WORDBOOK_KEY, JSON.stringify(book));
}

function addToWordbook(simp, trad, pinyin, explanation, dialect = "yue") {
  const book = loadWordbook();
  const existing = book.find(w => w.simp === simp && w.pinyin === pinyin);
  if (existing) {
    existing.dialect = existing.dialect || dialect;
    saveWordbook(book);
    return;
  }
  book.push({
    simp,
    trad: trad || simp,
    pinyin,
    explanation: explanation || "",
    dialect,
    status: "new",
    level: 0,
    nextReview: Date.now(),
    addedAt: Date.now(),
    reviewCount: 0,
  });
  saveWordbook(book);
  renderWordbook();
  addXP(2);
}

function updateWordStatus(simp, pinyin, quality) {
  const book = loadWordbook();
  const item = book.find(w => w.simp === simp && w.pinyin === pinyin);
  if (!item) return;

  item.reviewCount++;

  if (quality === 0) {
    item.level = 0;
    item.status = "new";
    item.nextReview = Date.now();
  } else if (quality === 1) {
    item.level = Math.max(0, item.level - 1);
    item.status = "learning";
    item.nextReview = Date.now() + SR_INTERVALS[Math.min(item.level, SR_INTERVALS.length - 1)] * 3600000;
  } else if (quality === 2) {
    item.level = Math.min(item.level + 1, SR_INTERVALS.length - 1);
    item.status = item.level >= 4 ? "mastered" : "learning";
    item.nextReview = Date.now() + SR_INTERVALS[item.level] * 86400000;
    addXP(5);
  } else if (quality === 3) {
    item.level = Math.min(item.level + 2, SR_INTERVALS.length - 1);
    item.status = item.level >= 4 ? "mastered" : "review";
    item.nextReview = Date.now() + SR_INTERVALS[item.level] * 86400000;
    addXP(8);
  }

  saveWordbook(book);
  renderWordbook();
}

let currentWbFilter = "all";

function renderWordbook() {
  const book = loadWordbook();
  const listEl = document.getElementById("wordbookList");
  const noEl = document.getElementById("noWordbook");
  if (!listEl) return;

  const now = Date.now();
  let filtered = book;
  if (currentWbFilter === "new") filtered = book.filter(w => w.status === "new");
  else if (currentWbFilter === "learning") filtered = book.filter(w => w.status === "learning");
  else if (currentWbFilter === "review") filtered = book.filter(w => w.status !== "mastered" && w.nextReview <= now);
  else if (currentWbFilter === "mastered") filtered = book.filter(w => w.status === "mastered");

  if (filtered.length === 0) {
    listEl.innerHTML = "";
    noEl.style.display = "block";
    return;
  }
  noEl.style.display = "none";

  listEl.innerHTML = filtered.map(w => {
    const statusLabel = { new: "New", learning: "Learning", review: "Due for review", mastered: "Mastered" }[w.status] || w.status;
    const statusClass = `wb-status-${w.status}`;
    return `<div class="wordbook-item ${statusClass}">
      <div class="wb-main">
        <span class="wb-char">${w.simp}</span>
        <span class="wb-trad">(${w.trad})</span>
        <span class="wb-pinyin">${w.pinyin}</span>
        <span class="wb-status">${statusLabel}</span>
      </div>
      ${w.explanation ? `<div class="wb-explanation">${w.explanation}</div>` : ""}
      <div class="wb-actions">
        <button class="icon-btn" onclick="playWordbookAudio('${w.pinyin}', '${w.dialect || ""}')">🔊</button>
        <button class="icon-btn" onclick="removeFromWordbook('${w.simp}','${w.pinyin}')">🗑️</button>
      </div>
    </div>`;
  }).join("");
}

function removeFromWordbook(simp, pinyin) {
  const book = loadWordbook().filter(w => !(w.simp === simp && w.pinyin === pinyin));
  saveWordbook(book);
  renderWordbook();
}

function looksLikeYuePinyin(pinyin = "") {
  return /[a-z]+[1-6]\b/i.test(String(pinyin || ""));
}

function playWordbookAudio(pinyin, dialect = "yue") {
  const effectiveDialect = dialect || (looksLikeYuePinyin(pinyin) ? "yue" : "unknown");
  if (canPlayStandardAudioForDialect(effectiveDialect) && looksLikeYuePinyin(pinyin)) {
    playYuePinyin(pinyin);
    return true;
  }
  showDialectAudioUnavailable(effectiveDialect, pinyin);
  return false;
}

document.querySelectorAll(".wb-filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".wb-filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentWbFilter = btn.dataset.wbfilter;
    renderWordbook();
  });
});

// 间隔重复复习
let reviewQueue = [];
let currentReviewItem = null;

document.getElementById("startReviewBtn").addEventListener("click", () => {
  const book = loadWordbook();
  const now = Date.now();
  reviewQueue = book.filter(w => w.status !== "mastered" && w.nextReview <= now);
  if (reviewQueue.length === 0) {
    showPixelToast("No words due for review!");
    return;
  }
  reviewQueue.sort(() => Math.random() - 0.5);
  document.getElementById("reviewModal").style.display = "flex";
  showNextReviewCard();
});

function showNextReviewCard() {
  if (reviewQueue.length === 0) {
    document.getElementById("reviewModal").style.display = "none";
    showPixelToast("Review complete!");
    return;
  }
  currentReviewItem = reviewQueue.shift();
  const content = document.getElementById("reviewCardContent");
  content.innerHTML = `
    <div class="review-word">${currentReviewItem.simp} <span style="font-size:0.85em;color:var(--muted)">(${currentReviewItem.trad})</span></div>
    <div class="review-hint">Tap to show the answer</div>
    <div class="review-answer" style="display:none;">
      <p>Romanization: ${currentReviewItem.pinyin}</p>
      <p>${currentReviewItem.explanation || ""}</p>
      <button class="icon-btn" onclick="playWordbookAudio('${currentReviewItem.pinyin}', '${currentReviewItem.dialect || ""}')">🔊</button>
    </div>
  `;
  const hint = content.querySelector(".review-hint");
  const answer = content.querySelector(".review-answer");
  hint.addEventListener("click", () => {
    hint.style.display = "none";
    answer.style.display = "block";
  });
}

document.getElementById("reviewForgotBtn").addEventListener("click", () => {
  if (!currentReviewItem) return;
  updateWordStatus(currentReviewItem.simp, currentReviewItem.pinyin, 0);
  showNextReviewCard();
});
document.getElementById("reviewVagueBtn").addEventListener("click", () => {
  if (!currentReviewItem) return;
  updateWordStatus(currentReviewItem.simp, currentReviewItem.pinyin, 1);
  showNextReviewCard();
});
document.getElementById("reviewRememberBtn").addEventListener("click", () => {
  if (!currentReviewItem) return;
  updateWordStatus(currentReviewItem.simp, currentReviewItem.pinyin, 2);
  showNextReviewCard();
});
document.getElementById("reviewEasyBtn").addEventListener("click", () => {
  if (!currentReviewItem) return;
  updateWordStatus(currentReviewItem.simp, currentReviewItem.pinyin, 3);
  showNextReviewCard();
});

// ==================== 每日打卡系统 ====================
const CHECKIN_KEY = "dls-ai-checkin";
const DAILY_TASKS_KEY = "dls-ai-daily-tasks";

function loadCheckin() {
  try { return JSON.parse(localStorage.getItem(CHECKIN_KEY) || "{}"); } catch { return {}; }
}

function saveCheckin(data) {
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(data));
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function doDailyCheckin() {
  const data = loadCheckin();
  const today = getTodayStr();
  if (data.lastCheckin === today) {
    showPixelToast("Already checked in today!");
    return;
  }
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  data.streak = data.lastCheckin === yesterday ? (data.streak || 0) + 1 : 1;
  data.lastCheckin = today;
  data.totalDays = (data.totalDays || 0) + 1;
  saveCheckin(data);
  addXP(10);
  updateCheckinUI();
  showPixelToast(`Checked in! ${data.streak}-day streak`);
  checkAchievements();
}

function updateCheckinUI() {
  const data = loadCheckin();
  const streakEl = document.getElementById("checkinStreak");
  const btnEl = document.getElementById("dailyCheckinBtn");
  if (streakEl) streakEl.textContent = `${data.streak || 0}-day streak`;
  if (btnEl) {
    const today = getTodayStr();
    if (data.lastCheckin === today) {
      btnEl.textContent = "Checked in";
      btnEl.disabled = true;
    }
  }
}

document.getElementById("dailyCheckinBtn").addEventListener("click", doDailyCheckin);

// 每日任务
const DAILY_TASK_DEFS = [
  { id: "query_dict", name: "Look up 1 word", icon: "典", target: 1, xp: 5 },
  { id: "play_audio", name: "Play 3 audio clips", icon: "音", target: 3, xp: 5 },
  { id: "do_quiz", name: "Finish 1 quiz", icon: "考", target: 1, xp: 10 },
  { id: "learn_phrase", name: "Learn 2 phrases", icon: "句", target: 2, xp: 5 },
];

function loadDailyTasks() {
  try {
    const data = JSON.parse(localStorage.getItem(DAILY_TASKS_KEY) || "{}");
    const today = getTodayStr();
    if (data.date !== today) {
      return { date: today, progress: {} };
    }
    return data;
  } catch {
    return { date: getTodayStr(), progress: {} };
  }
}

function saveDailyTasks(data) {
  localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(data));
}

function trackDailyTask(taskId, increment) {
  const data = loadDailyTasks();
  const prev = data.progress[taskId] || 0;
  data.progress[taskId] = prev + (increment || 1);
  saveDailyTasks(data);
  renderDailyTasks();
  checkAchievements();
}

function renderDailyTasks() {
  const data = loadDailyTasks();
  const listEl = document.getElementById("dailyTasksList");
  if (!listEl) return;

  listEl.innerHTML = DAILY_TASK_DEFS.map(task => {
    const current = data.progress[task.id] || 0;
    const done = current >= task.target;
    const pct = Math.min(100, Math.round((current / task.target) * 100));
    return `<div class="daily-task-item ${done ? "task-done" : ""}">
      <span class="task-icon">${task.icon}</span>
      <span class="task-name">${task.name}</span>
      <div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div>
      <span class="task-count">${Math.min(current, task.target)}/${task.target}</span>
      ${done ? '<span class="task-check">✅</span>' : `<span class="task-xp">+${task.xp}XP</span>`}
    </div>`;
  }).join("");
}

// ==================== 成就系统 ====================
const ACHIEVEMENT_KEY = "dls-ai-achievements";
const XP_KEY = "dls-ai-xp";

const LEVELS = [
  { name: "Beginner", icon: "始", xp: 0, desc: "Just starting your dialect journey" },
  { name: "Newcomer", icon: "初", xp: 100, desc: "You have taken the first step" },
  { name: "Apprentice", icon: "学", xp: 300, desc: "You know the basic vocabulary" },
  { name: "Rising apprentice", icon: "进", xp: 600, desc: "You are hitting your stride" },
  { name: "Skilled", icon: "熟", xp: 1000, desc: "You can hold a basic conversation" },
  { name: "Proficient", icon: "精", xp: 1500, desc: "Your dialect is really good" },
  { name: "Expert", icon: "专", xp: 2500, desc: "Rich knowledge of the dialect" },
  { name: "Master", icon: "师", xp: 4000, desc: "A true master of dialect learning" },
];

const BADGES = [
  { id: "first_query", name: "First lookup", icon: "查", desc: "Look up a word for the first time", check: () => loadWordbook().length >= 1 },
  { id: "word_10", name: "Word collector", icon: "集", desc: "Save 10 words to the wordbook", check: () => loadWordbook().length >= 10 },
  { id: "word_50", name: "Word whiz", icon: "词", desc: "Save 50 words to the wordbook", check: () => loadWordbook().length >= 50 },
  { id: "quiz_first", name: "First quiz", icon: "考", desc: "Finish your first quiz", check: () => (JSON.parse(localStorage.getItem("dls-ai-quiz-scores") || "[]")).length >= 1 },
  { id: "quiz_5", name: "Quiz regular", icon: "测", desc: "Finish 5 quizzes", check: () => (JSON.parse(localStorage.getItem("dls-ai-quiz-scores") || "[]")).length >= 5 },
  { id: "quiz_perfect", name: "Perfect score", icon: "满", desc: "Get every answer right in a quiz", check: () => (JSON.parse(localStorage.getItem("dls-ai-quiz-scores") || "[]")).some(s => s.score === s.total) },
  { id: "checkin_3", name: "3-day streak", icon: "三", desc: "Check in 3 days in a row", check: () => (loadCheckin().streak || 0) >= 3 },
  { id: "checkin_7", name: "7-day streak", icon: "七", desc: "Check in 7 days in a row", check: () => (loadCheckin().streak || 0) >= 7 },
  { id: "checkin_30", name: "30-day streak", icon: "月", desc: "Check in 30 days in a row", check: () => (loadCheckin().streak || 0) >= 30 },
  { id: "audio_10", name: "Good ear", icon: "听", desc: "Play 10 audio clips", check: () => (getProgressStats().audioPlayed || 0) >= 10 },
  { id: "fav_5", name: "Collector", icon: "藏", desc: "Save 5 items", check: () => (JSON.parse(localStorage.getItem("dls-ai-favorites") || "[]")).length >= 5 },
  { id: "master_10", name: "Word master", icon: "师", desc: "Master 10 words", check: () => loadWordbook().filter(w => w.status === "mastered").length >= 10 },
];

function loadXP() {
  return parseInt(localStorage.getItem(XP_KEY) || "0", 10);
}

function saveXP(xp) {
  localStorage.setItem(XP_KEY, String(xp));
}

function addXP(amount) {
  const xp = loadXP() + amount;
  saveXP(xp);
  renderAchievement();
}

function loadUnlockedBadges() {
  try { return JSON.parse(localStorage.getItem(ACHIEVEMENT_KEY) || "[]"); } catch { return []; }
}

function saveUnlockedBadges(badges) {
  localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(badges));
}

function checkAchievements() {
  const unlocked = loadUnlockedBadges();
  let newBadge = false;
  for (const badge of BADGES) {
    if (unlocked.includes(badge.id)) continue;
    if (badge.check()) {
      unlocked.push(badge.id);
      newBadge = true;
      showPixelToast(`Badge unlocked: ${badge.name}!`);
    }
  }
  if (newBadge) {
    saveUnlockedBadges(unlocked);
    renderAchievement();
  }
}

function renderAchievement() {
  const xp = loadXP();
  const unlocked = loadUnlockedBadges();

  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }

  const levelIcon = document.getElementById("levelIcon");
  const levelName = document.getElementById("levelName");
  const levelDesc = document.getElementById("levelDesc");
  const levelXpFill = document.getElementById("levelXpFill");
  const levelXpText = document.getElementById("levelXpText");

  if (levelIcon) levelIcon.textContent = currentLevel.icon;
  if (levelName) levelName.textContent = currentLevel.name;
  if (levelDesc) levelDesc.textContent = currentLevel.desc;

  if (nextLevel) {
    const progress = ((xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100;
    if (levelXpFill) levelXpFill.style.width = `${Math.min(100, progress)}%`;
    if (levelXpText) levelXpText.textContent = `${xp} / ${nextLevel.xp} XP`;
  } else {
    if (levelXpFill) levelXpFill.style.width = "100%";
    if (levelXpText) levelXpText.textContent = `${xp} XP (MAX)`;
  }

  const badgeGrid = document.getElementById("badgeGrid");
  if (badgeGrid) {
    badgeGrid.innerHTML = BADGES.map(badge => {
      const isUnlocked = unlocked.includes(badge.id);
      return `<div class="badge-item ${isUnlocked ? "badge-unlocked" : "badge-locked"}">
        <div class="badge-icon">${isUnlocked ? badge.icon : "🔒"}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
      </div>`;
    }).join("");
  }
}

// ==================== Web Speech API 备选发音 ====================
function speakWithWebSpeech(text, lang = "zh-HK") {
  if (!window.speechSynthesis) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = parseFloat(document.getElementById("pronSpeed")?.value || "1.0");
  const voices = speechSynthesis.getVoices();
  const zhVoice =
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.includes("zh") && (v.lang.includes("HK") || v.lang.includes("TW") || v.lang.includes("CN"))) ||
    voices.find((v) => v.lang.includes("zh"));
  if (zhVoice) utterance.voice = zhVoice;
  speechSynthesis.speak(utterance);
  return true;
}

// ==================== 发音速度调节 ====================
function getPronSpeed() {
  return parseFloat(document.getElementById("pronSpeed")?.value || "1.0");
}

// ==================== 发音对比（录音功能） ====================
let mediaRecorder = null;
let recordedChunks = [];
let recordedAudioUrl = null;

document.getElementById("startRecordBtn")?.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      recordedAudioUrl = URL.createObjectURL(blob);
      document.getElementById("playRecordingBtn").style.display = "inline-block";
      document.getElementById("compareResult").innerHTML = '<p>Recording saved. Press play to compare.</p>';
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
    document.getElementById("startRecordBtn").style.display = "none";
    document.getElementById("stopRecordBtn").style.display = "inline-block";
    document.getElementById("compareResult").innerHTML = '<p>Recording…</p>';
  } catch (err) {
    document.getElementById("compareResult").innerHTML = '<p>Cannot reach the microphone. Check your permissions.</p>';
  }
});

document.getElementById("stopRecordBtn")?.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    document.getElementById("stopRecordBtn").style.display = "none";
    document.getElementById("startRecordBtn").style.display = "inline-block";
  }
});

document.getElementById("playRecordingBtn")?.addEventListener("click", () => {
  if (recordedAudioUrl) {
    const audio = new Audio(recordedAudioUrl);
    audio.play();
  }
});

document.getElementById("playStandardBtn")?.addEventListener("click", () => {
  const pinyin = document.getElementById("comparePinyin")?.value.trim();
  if (!pinyin) {
    showPixelToast("Please enter Jyutping");
    return;
  }
  const useWebSpeech = document.getElementById("useWebSpeechTTS")?.checked;
  if (useWebSpeech) {
    speakWithWebSpeech(pinyin);
  } else {
    playYuePinyin(pinyin);
  }
});

// ==================== 声调可视化 ====================
function drawToneChart() {
  const canvas = document.getElementById("toneChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = "#1a1a24";
  ctx.fillRect(0, 0, W, H);

  const toneData = [
    { label: "Tone 1", points: [[0.1, 0.2], [0.9, 0.2]], color: "#00ff88" },
    { label: "Tone 2", points: [[0.1, 0.6], [0.9, 0.15]], color: "#00ccff" },
    { label: "Tone 3", points: [[0.1, 0.4], [0.9, 0.4]], color: "#ffcc00" },
    { label: "Tone 4", points: [[0.1, 0.7], [0.9, 0.85]], color: "#ff6644" },
    { label: "Tone 5", points: [[0.1, 0.85], [0.9, 0.55]], color: "#cc66ff" },
    { label: "Tone 6", points: [[0.1, 0.6], [0.9, 0.75]], color: "#ff88aa" },
  ];

  const marginL = 50;
  const marginR = 20;
  const marginT = 30;
  const marginB = 40;
  const chartW = W - marginL - marginR;
  const chartH = H - marginT - marginB;

  ctx.strokeStyle = "#4a4a6a";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = marginT + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(marginL, y);
    ctx.lineTo(W - marginR, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#8888a0";
  ctx.font = "11px monospace";
  ctx.textAlign = "right";
  const pitchLabels = ["High", "", "Mid", "", "Low"];
  for (let i = 0; i <= 4; i++) {
    const y = marginT + (chartH / 4) * i;
    ctx.fillText(pitchLabels[i], marginL - 8, y + 4);
  }

  toneData.forEach(tone => {
    ctx.strokeStyle = tone.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    tone.points.forEach((p, i) => {
      const x = marginL + p[0] * chartW;
      const y = marginT + p[1] * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const lastPt = tone.points[tone.points.length - 1];
    const lx = marginL + lastPt[0] * chartW + 8;
    const ly = marginT + lastPt[1] * chartH;
    ctx.fillStyle = tone.color;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(tone.label, lx, ly + 4);
  });

  ctx.fillStyle = "#8888a0";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("Time →", W / 2, H - 5);
}

// ==================== 收藏分类管理 ====================

function loadFavoritesWithCategory() {
  try {
    return JSON.parse(localStorage.getItem("dls-ai-favorites") || "[]");
  } catch { return []; }
}

function addToFavorites(input, output, direction, category, dialect = "") {
  const favorites = loadFavoritesWithCategory();
  favorites.unshift({
    input,
    output,
    direction,
    dialect,
    category: category || "翻译",
    timestamp: Date.now(),
  });
  if (favorites.length > 100) favorites.pop();
  localStorage.setItem("dls-ai-favorites", JSON.stringify(favorites));
  renderFavorites();
}

function renderFavorites() {
  const favorites = loadFavoritesWithCategory();
  const filtered = currentFavCategory === "all"
    ? favorites
    : favorites.filter(f => (f.category || "翻译") === currentFavCategory);

  favoritesListEl.innerHTML = "";

  if (filtered.length === 0) {
    noFavoritesEl.style.display = "block";
    return;
  }

  noFavoritesEl.style.display = "none";

  filtered.forEach((item, index) => {
    const realIndex = favorites.indexOf(item);
    const el = document.createElement("div");
    el.className = "favorites-item";
    const catLabel = ({ "翻译": "Translation", "短语": "Phrase", "每日一句": "Phrase of the day", "生词": "Word", "自定义": "Custom" })[item.category || "翻译"] || item.category;
    const favoriteDialect = item.dialect || inferKnownLearningDialect(item.output || item.input || "");
    el.innerHTML = `
      <div class="favorites-item-content">
        <span class="fav-cat-tag">${catLabel}</span>
        <strong>${getTranslateDirectionName(item.direction)}</strong>
        <p style="margin: 4px 0;">${item.input}</p>
        <p style="margin: 4px 0; color: var(--accent); font-weight: 500;">${item.output}</p>
      </div>
      <div class="favorites-item-actions">
        <button class="icon-btn" title="Listen" onclick="speakFavoriteText('${(item.output || item.input || "").replace(/'/g, "\\'")}', '${item.direction || ""}', '${favoriteDialect}')">🔊</button>
        <button class="icon-btn" title="Copy" onclick="copyText('${(item.output || item.input || "").replace(/'/g, "\\'")}')">📋</button>
        <button class="icon-btn" title="Delete" style="color: var(--delete);" onclick="deleteFavorite(${realIndex})">Delete</button>
      </div>
    `;
    favoritesListEl.appendChild(el);
  });
}

function deleteFavorite(index) {
  const favorites = loadFavoritesWithCategory();
  favorites.splice(index, 1);
  localStorage.setItem("dls-ai-favorites", JSON.stringify(favorites));
  renderFavorites();
}

document.querySelectorAll(".fav-cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".fav-cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFavCategory = btn.dataset.favcat;
    renderFavorites();
  });
});

// ==================== 自定义每日一句 ====================
const CUSTOM_QUOTES_KEY = "dls-ai-custom-quotes";

function loadCustomQuotes() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_QUOTES_KEY) || "[]"); } catch { return []; }
}

function saveCustomQuotes(quotes) {
  localStorage.setItem(CUSTOM_QUOTES_KEY, JSON.stringify(quotes));
}

function renderCustomQuotes() {
  const quotes = loadCustomQuotes();
  const listEl = document.getElementById("customQuotesList");
  if (!listEl) return;

  listEl.innerHTML = quotes.map((q, i) => `
    <div class="custom-quote-item">
      <span>${getDialectMeta(q.dialect || "yue").label}：${q.yue} - ${q.zh} (${q.pinyin || "no romanization"})</span>
      <button class="icon-btn" onclick="removeCustomQuote(${i})">🗑️</button>
    </div>
  `).join("");
}

function removeCustomQuote(index) {
  const quotes = loadCustomQuotes();
  quotes.splice(index, 1);
  saveCustomQuotes(quotes);
  renderCustomQuotes();
}

document.getElementById("addCustomQuoteBtn")?.addEventListener("click", () => {
  const yue = document.getElementById("customQuoteYue").value.trim();
  const zh = document.getElementById("customQuoteZh").value.trim();
  const pinyin = document.getElementById("customQuotePinyin").value.trim();
  const dialect = getCurrentDailyDialect();
  if (!yue || !zh) {
    showPixelToast(`Please fill in the ${getDialectMeta(dialect).label} phrase and its meaning`);
    return;
  }
  const quotes = loadCustomQuotes();
  quotes.push({ dialect, yue, zh, pinyin: pinyin || "" });
  saveCustomQuotes(quotes);
  renderCustomQuotes();
  document.getElementById("customQuoteYue").value = "";
  document.getElementById("customQuoteZh").value = "";
  document.getElementById("customQuotePinyin").value = "";
  showPixelToast("Custom phrase added");

  const allQuotes = [...getDialectQuotes(dialect), ...quotes.filter((q) => (q.dialect || "yue") === dialect)];
  const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
  document.getElementById("dailyQuoteYue").textContent = randomQuote.yue;
  document.getElementById("dailyQuoteZh").textContent = randomQuote.zh;
  document.getElementById("dailyQuotePinyin").textContent = randomQuote.pinyin;
});

// ==================== 学习成果分享 ====================
function generateShareText() {
  const xp = loadXP();
  const unlocked = loadUnlockedBadges();
  const checkin = loadCheckin();
  const book = loadWordbook();
  const mastered = book.filter(w => w.status === "mastered").length;

  let currentLevel = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { currentLevel = LEVELS[i]; break; }
  }

  return `Duolingsheng learning report\n${"=".repeat(20)}\nLevel: ${currentLevel.name}\nXP: ${xp}\nWords: ${book.length} (${mastered} mastered)\nBadges: ${unlocked.length}/${BADGES.length}\nCheck-in streak: ${checkin.streak || 0} days\nTotal check-ins: ${checkin.totalDays || 0} days\n${"=".repeat(20)}\nCome learn a dialect with me!`;
}

document.getElementById("shareAchievementBtn")?.addEventListener("click", () => {
  const text = generateShareText();
  if (navigator.share) {
    navigator.share({ title: "My Duolingsheng achievements", text }).catch(() => {});
  } else {
    copyText(text);
    showPixelToast("Achievements copied to the clipboard");
  }
});

document.getElementById("shareFavoritesBtn")?.addEventListener("click", () => {
  const favorites = loadFavoritesWithCategory();
  if (favorites.length === 0) {
    showPixelToast("Nothing saved yet");
    return;
  }
  const text = "My saved dialect phrases\n" + favorites.slice(0, 10).map(f => `${f.input} → ${f.output}`).join("\n");
  if (navigator.share) {
    navigator.share({ title: "Saved dialect phrases", text }).catch(() => {});
  } else {
    copyText(text);
    showPixelToast("Favorites copied to the clipboard");
  }
});

// ==================== 导出学习报告（PDF） ====================
document.getElementById("exportReportBtn")?.addEventListener("click", () => {
  const xp = loadXP();
  const unlocked = loadUnlockedBadges();
  const checkin = loadCheckin();
  const book = loadWordbook();
  const quizScores = JSON.parse(localStorage.getItem("dls-ai-quiz-scores") || "[]");
  const stats = getProgressStats();
  flushProgressStatsNow();
  const mastered = book.filter(w => w.status === "mastered").length;
  const learning = book.filter(w => w.status === "learning").length;

  let currentLevel = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { currentLevel = LEVELS[i]; break; }
  }

  const reportHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Dialect learning report</title>
<style>
body{font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;color:#333}
h1{color:#2d2d3a;border-bottom:3px solid #00ff88;padding-bottom:10px}
h2{color:#4a4a6a;margin-top:30px}
.section{background:#f5f5f5;padding:15px;margin:10px 0;border-radius:8px}
.stat{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #ddd}
.stat:last-child{border:none}
.badge{display:inline-block;padding:4px 12px;margin:4px;border-radius:20px;background:#e0e0e0;font-size:14px}
.badge.unlocked{background:#00ff88;color:#000}
.badge.locked{background:#ddd;color:#999}
.footer{text-align:center;margin-top:40px;color:#888;font-size:12px}
</style></head><body>
<h1>Duolingsheng learning report</h1>
<p>Generated: ${new Date().toLocaleString("en-US")}</p>

<h2>Level and XP</h2>
<div class="section">
<div class="stat"><span>Current level</span><strong>${currentLevel.icon} ${currentLevel.name}</strong></div>
<div class="stat"><span>XP</span><strong>${xp} XP</strong></div>
<div class="stat"><span>Level description</span><strong>${currentLevel.desc}</strong></div>
</div>

<h2>Wordbook</h2>
<div class="section">
<div class="stat"><span>Total words</span><strong>${book.length}</strong></div>
<div class="stat"><span>Mastered</span><strong>${mastered}</strong></div>
<div class="stat"><span>Learning</span><strong>${learning}</strong></div>
<div class="stat"><span>New</span><strong>${book.filter(w => w.status === "new").length}</strong></div>
</div>

<h2>Quizzes</h2>
<div class="section">
<div class="stat"><span>Quizzes finished</span><strong>${quizScores.length}</strong></div>
<div class="stat"><span>Average score</span><strong>${quizScores.length > 0 ? Math.round(quizScores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / quizScores.length) : 0}%</strong></div>
</div>

<h2>Check-ins</h2>
<div class="section">
<div class="stat"><span>Current streak</span><strong>${checkin.streak || 0} days</strong></div>
<div class="stat"><span>Total check-ins</span><strong>${checkin.totalDays || 0} days</strong></div>
</div>

<h2>Study stats</h2>
<div class="section">
<div class="stat"><span>Phrases learned</span><strong>${stats.phrasesLearned || 0}</strong></div>
<div class="stat"><span>Audio plays</span><strong>${stats.audioPlayed || 0}</strong></div>
</div>

<h2>Badges</h2>
<div class="section">
${BADGES.map(b => `<span class="badge ${unlocked.includes(b.id) ? "unlocked" : "locked"}">${b.icon} ${b.name}</span>`).join("")}
</div>

<div class="footer">Duolingsheng · learning report</div>
</body></html>`;

  const blob = new Blob([reportHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dialect-learning-report_${getTodayStr()}.html`;
  a.click();
  URL.revokeObjectURL(url);
  showPixelToast("Report exported");
});

// ==================== 数据导入导出 ====================
document.getElementById("exportAllDataBtn")?.addEventListener("click", () => {
  const allKeys = [
    "dls-ai-config", "dls-ai-favorites", "dls-ai-translate-history",
    "dls-ai-chat-history", "dls-ai-quiz-scores", "dls-ai-progress-stats",
    WORDBOOK_KEY, CHECKIN_KEY, DAILY_TASKS_KEY, ACHIEVEMENT_KEY, XP_KEY, CUSTOM_QUOTES_KEY,
  ];
  const data = {};
  for (const key of allKeys) {
    const val = localStorage.getItem(key);
    if (val) data[key] = val;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dls-ai-backup_${getTodayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showPixelToast("Data exported");
});

document.getElementById("importDataBtn")?.addEventListener("click", () => {
  document.getElementById("importDataFile")?.click();
});

document.getElementById("importDataFile")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
      showPixelToast("Data imported. Please refresh the page.");
      setTimeout(() => location.reload(), 1500);
    } catch {
      showPixelToast("Import failed. The file format is not valid.");
    }
  };
  reader.readAsText(file);
});

// ==================== 增强已有功能 ====================

// 增强：查询词典时自动添加到生词本
const originalSearchYueWord = searchYueWord;
searchYueWord = async function() {
  const word = yueDictSearchEl.value.trim();
  if (!word) { alert("Please enter a word to look up"); return; }

  const dialect = dictDialectEl?.value || "yue";
  if (isRegionalDialect(dialect)) {
    try {
      await loadRegionalDialectDictionary(dialect);
    } catch {
      alert(`The ${REGIONAL_DIALECTS[dialect].label} dictionary failed to load`);
      return;
    }
    const results = searchRegionalDialectEntries(dialect, word, { limit: 200 });
    if (results.length > 0) {
      renderRegionalDialectResult(dialect, results);
      results.slice(0, 3).forEach(r => {
        addToWordbook(r.simp, r.trad, r.pinyin, r.explanation, dialect);
      });
      trackDailyTask("query_dict", 1);
      addXP(3);
    } else {
      renderRegionalDialectResult(dialect, []);
      alert(`No results for "${word}"`);
    }
    return;
  }

  if (dialect !== "yue") {
    const meta = getDialectMeta(dialect);
    yueDictResultEl.innerHTML = "";
    noYueDictResultEl.style.display = "block";
    noYueDictResultEl.textContent = `There is no local ${meta.label} dictionary yet. Use translation or chat to learn with AI.`;
    return;
  }

  try { await loadYueDictionary(); } catch { alert("The Cantonese dictionary failed to load"); return; }
  const results = searchYueDictionaryEntries(word, { limit: 200 });
  if (results.length > 0) {
    renderYueDictResult(results);
    results.slice(0, 3).forEach(r => {
      addToWordbook(r.simp, r.trad, r.pinyin, r.explanation);
    });
    trackDailyTask("query_dict", 1);
    addXP(3);
  } else {
    renderYueDictResult([]);
    alert(`No results for "${word}"`);
  }
};

// 增强：播放发音时跟踪任务
const originalTrackAudioPlayed = trackAudioPlayed;
trackAudioPlayed = function() {
  originalTrackAudioPlayed();
  trackDailyTask("play_audio", 1);
};

// 增强：学习短语时跟踪任务
const originalTrackPhraseLearned = trackPhraseLearned;
trackPhraseLearned = function() {
  originalTrackPhraseLearned();
  trackDailyTask("learn_phrase", 1);
};

// 增强：保存测验分数时跟踪任务
const originalSaveQuizScore = saveQuizScore;
saveQuizScore = function(score, total, difficulty) {
  originalSaveQuizScore(score, total, difficulty);
  trackDailyTask("do_quiz", 1);
  addXP(score * 2);
  checkAchievements();
};

// 增强：每日一句下一句包含自定义句子
document.getElementById("dailyNextQuoteBtn").removeEventListener("click", () => {});
document.getElementById("dailyNextQuoteBtn").addEventListener("click", () => {
  const dialect = getCurrentDailyDialect();
  const customQuotes = loadCustomQuotes();
  const allQuotes = [
    ...getDialectQuotes(dialect),
    ...customQuotes.filter((q) => (q.dialect || "yue") === dialect),
  ];
  const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
  document.getElementById("dailyQuoteYue").textContent = randomQuote.yue;
  document.getElementById("dailyQuoteZh").textContent = randomQuote.zh;
  document.getElementById("dailyQuotePinyin").textContent = randomQuote.pinyin;
});

// 增强：收藏时使用分类
const originalAddToFavorites = addToFavorites;
addToFavorites = function(input, output, direction, category, dialect = "") {
  const favorites = loadFavoritesWithCategory();
  favorites.unshift({
    input,
    output,
    direction: direction || "",
    dialect,
    category: category || "翻译",
    timestamp: Date.now(),
  });
  if (favorites.length > 100) favorites.pop();
  localStorage.setItem("dls-ai-favorites", JSON.stringify(favorites));
  renderFavorites();
};

// 增强：收藏每日一句时使用分类
document.getElementById("dailyFavoriteQuoteBtn").removeEventListener("click", () => {});
document.getElementById("dailyFavoriteQuoteBtn").addEventListener("click", () => {
  const yue = document.getElementById("dailyQuoteYue").textContent;
  const zh = document.getElementById("dailyQuoteZh").textContent;
  if (yue && yue !== "Loading…") {
    addToFavorites(yue, zh, "", "每日一句", getCurrentDailyDialect());
    showPixelToast("Added to favorites");
  }
});

// 增强：短语收藏使用分类
const originalRenderPhraseList = renderPhraseList;
renderPhraseList = function(category) {
  const phraseList = document.getElementById("phraseList");
  const dialect = getCurrentPhraseDialect();
  const phrases = getDialectPhrases(dialect)[category] || [];

  phraseList.innerHTML = phrases.map((phrase, index) => `
    <div class="phrase-item">
      <div class="phrase-content">
        <div class="yue">${phrase.yue}</div>
        <div class="zh">${phrase.zh}</div>
        <div class="pinyin">${phrase.pinyin}</div>
      </div>
      <div class="phrase-actions">
        <button class="icon-btn phrase-play-btn" data-index="${index}" data-pinyin="${phrase.pinyin}" title="Play pronunciation">Play</button>
        <button class="icon-btn phrase-fav-btn" data-yue="${phrase.yue}" data-zh="${phrase.zh}" title="Save">Save</button>
      </div>
    </div>
  `).join("");

  phraseList.querySelectorAll(".phrase-play-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const phrase = phrases[Number(btn.dataset.index)] || {};
      const didPlay = speakLearningItem(phrase.yue, phrase.pinyin, dialect);
      if (didPlay) trackAudioPlayed();
      trackPhraseLearned();
    });
  });

  phraseList.querySelectorAll(".phrase-fav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addToFavorites(btn.dataset.yue, btn.dataset.zh, "", "短语", dialect);
      showPixelToast("Added to favorites");
    });
  });
};

// 增强：speakText 支持 Web Speech API 备选
const originalSpeakText = speakText;
speakText = async function(text) {
  if (!text) return;
  const useWebSpeech = document.getElementById("useWebSpeechTTS")?.checked;
  if (useWebSpeech) {
    if (speakWithWebSpeech(text)) return;
  }
  await originalSpeakText(text);
};

// 增强：playYuePinyin 支持速度调节
const originalPlayYuePinyin = playYuePinyin;
playYuePinyin = async function(pinyin, resolvedPath) {
  const speed = getPronSpeed();
  if (speed !== 1.0 && window.speechSynthesis) {
    const useWebSpeech = document.getElementById("useWebSpeechTTS")?.checked;
    if (useWebSpeech) {
      const utterance = new SpeechSynthesisUtterance(pinyin);
      utterance.lang = "zh-HK";
      utterance.rate = speed;
      speechSynthesis.speak(utterance);
      return;
    }
  }
  await originalPlayYuePinyin(pinyin, resolvedPath);
};

// ==================== 初始化新功能 ====================
renderWordbook();
updateCheckinUI();
renderDailyTasks();
renderAchievement();
renderCustomQuotes();
checkAchievements();

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}
