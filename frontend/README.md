# Duolingsheng, English frontend

The English-language frontend for Duolingsheng (多邻省), an AI tutor for Chinese regional dialects: Cantonese,
Taishanese, Hokkien/Minnan, Shanghainese, Teochew, Wenzhounese and Sichuanese.

This repo is **frontend only**. It is a restyled, English-language version of the `main/` folder of the original
Chinese project (`dls-AI`, MIT). The backend (auth, MCP tools, safety guardrails, model proxy, TTS audio) lives in a
separate repo and is not included here.

## Run it

```bash
BACKEND_URL=http://127.0.0.1:8080 npm start
```

Then open http://localhost:5173. `dev-server.mjs` serves `public/` and forwards these routes to the backend:

| Route      | Used for                                    |
| ---------- | ------------------------------------------- |
| `/api/*`   | Model proxy (Ollama / OpenAI-compatible)    |
| `/auth/*`  | Login, sign-up, GitHub OAuth, roles         |
| `/mcp`     | Dictionary, quiz, phrase and progress tools |
| `/tts/*`   | Cantonese audio files                       |

Without a backend the UI still loads, but chat, translation, login and audio will show errors.

## What is in `public/`

| File               | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `index.html`       | All pages (one `<section>` each) and the tour modal   |
| `styles.css`       | The whole design: tokens, themes, components          |
| `app.js`           | App logic. Builds most dynamic UI as HTML strings     |
| `auth.js`          | Login, sign-up, OAuth                                 |
| `role-features.js` | Student, parent, teacher and admin workspaces; theme  |
| `markdown.js`      | Small Markdown renderer for tutor replies             |
| `read/*.csv`       | Local dictionaries                                    |

**Keep the element IDs and `data-*` attributes in `index.html`.** `app.js` looks them up by ID. Restyle freely, but
rename nothing without searching `app.js` first.

## Design

Practice-grid paper, ink green, vermilion seal red. Each dialect is a colored "stamp". Headlines are Gloock, the
interface is Schibsted Grotesk, romanization is Spline Sans Mono, and Chinese characters are Noto Serif SC (all
loaded from Google Fonts in `index.html`). There are no drop shadows. Light, dark and auto themes are driven by
`data-theme` on `<html>` and by CSS variables at the top of `styles.css`.

## Status of the English translation

Done: all page text in `index.html`, and the UI strings in `app.js`, `auth.js` and `role-features.js` (toasts,
buttons, errors, reports, badges, levels). The tutor's system prompt and the quiz-maker prompt now ask for English.

Still Chinese:

- **Learning content in `app.js`:** the phrase lists, daily phrases, quiz banks and tone words. The dialect text must
  stay Chinese, but the meanings are Mandarin glosses and still need English. A native speaker should review them.
- **Translation prompts and keyword matchers in `app.js`:** the per-dialect translation system prompts, and the
  regexes that detect which dialect or tool a message is about. These are logic, not display text.
- **Favorites categories:** stored as Chinese keys (`翻译`, `短语`, `每日一句`, `生词`, `自定义`) so existing saved
  data keeps working. They are shown in English.
- **Backend text:** error messages returned by the backend (`data.error`) and the backend's own agent prompts.
- **Developer console logs.**

## Credits

Based on the original Chinese `dls-AI` project, copyright (c) 2026 ChessBrainIsNotHuman, MIT licensed. See `LICENSE`.
