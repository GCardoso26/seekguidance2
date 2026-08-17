# Environment variables

| VARIABLE | PURPOSE | REQUIRED | DEFAULT | PROVIDER |
|---|---|---|---|---|
| `PORT` | API HTTP | optional | 8787 | CWM |
| `CWM_DB_PATH` | SQLite | optional | `data/cwm.sqlite` | CWM |
| `CWM_ASSETS_PATH` | media files | optional | `data/assets` | CWM |
| `AUTOMATION_MODE` | `mock` \| `production` | optional | `mock` | CWM |
| `FFMPEG` | must be on PATH | **required** for render | — | FFmpeg |
| `KOKORO_BASE_URL` | local TTS | optional | — | Kokoro |
| `PEXELS_API_KEY` | stock primary | optional | — | Pexels |
| `PIXABAY_API_KEY` | stock fallback | optional | — | Pixabay |
| `COMFY_BASE_URL` | **ADVANCED** image gen | optional | — | ComfyUI |
| `GEMINI_API_KEY` | script primary | optional | — | Gemini |
| `GROQ_API_KEY` | script fallback | optional | — | Groq |
| `OLLAMA_BASE_URL` | script local | optional | — | Ollama |
| `SCRIPT_LLM_API_KEY` / `OPENAI_API_KEY` | extra LLM | optional | — | OpenAI-compatible |
| `YOUTUBE_CLIENT_ID/SECRET` | OAuth | optional | — | YouTube |
| `CWM_CREDENTIALS_ENCRYPTION_KEY` | vault | optional | — | CWM |
| `CWM_MUSIC_PATH` | bed music file | optional | — | audio |
| `CWM_SFX_PATH` | sting/sfx file | optional | — | audio |
| `DRY_RUN` | YouTube dry-run | optional | true | YouTube |
| `GLOBAL_PUBLISHING_KILL_SWITCH` | safety | optional | true | YouTube |
| `N8N_BASE_URL` / `N8N_API_KEY` | orchestration | required in production mode | — | n8n |

**DEPRECATED as default visual path:** treating ComfyUI as the only MISS engine; silent `MockVisualProvider` in `AUTOMATION_MODE=production`.
