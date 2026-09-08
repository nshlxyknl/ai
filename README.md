# AI

A Next.js AI chat application with a business analytics dashboard. It combines a dashboard view for tracking business metrics with a ChatGPT-style conversational interface powered by Google Gemini.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| AI SDK | `@google/genai` (Google Gemini) |
| Compiler | React Compiler (automatic memoization) |
| Linting | ESLint 9 |

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- A Google Gemini API key

### Installation & Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create the environment file**

   Copy the template below into a file named `.env.local` at the project root:

   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   > **Note:** `.env.local` is git-ignored and should never be committed. You can obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/).

3. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

The application has two main views:

### Dashboard (`/`)

A business analytics dashboard with stat cards (Total Users, Revenue, Orders, Growth Rate), a sales bar chart, device usage breakdown, and a recent activity feed. The stats update automatically every 5 seconds.

- **Overview tab**: Fully implemented with the metrics above.
- **Analytics / Users / Products / Orders / Settings tabs**: Placeholder stubs (coming soon).
- All data is mock/hardcoded — there is no backend data source.

### AI Chat (`/chat`)

A ChatGPT-style conversational interface. Features:

- **Provider selector** dropdown (Gemini / Grok)
- **Send messages** to the backend via a chat API
- **New Chat** button to clear the conversation
- **Enter** to send, **Shift+Enter** for a new line
- Auto-scroll to the latest message

## How It Works

### Frontend → Backend Flow

1. The chat page (`src/app/chat/page.tsx`) collects the selected provider and message history.
2. On submit, it POSTs `{ provider, messages }` to the `/api/chat` endpoint.
3. The API route (`src/app/api/chat/route.ts`) forwards the conversation to the AI model and returns the response.
4. The reply is appended to the chat and rendered.

### API Route (`/api/chat`)

The server-side route at `src/app/api/chat/route.ts`:

- Accepts `{ provider: string, messages: Message[] }`
- Uses the `@google/genai` SDK with the `gemini-2.0-flash` model
- Converts message roles (`assistant` → `model`) to Gemini's expected format
- Returns `{ message: string }` on success or `{ error: string }` on failure

> **Currently only the `gemini` provider works.** The UI lists "Grok" as an option, but the API route rejects any provider other than `gemini`. Grok support is not yet implemented on the backend.

## Project Structure

```
├── .env.local                  # Environment variables (API keys, git-ignored)
├── next.config.ts              # Next.js config (React Compiler enabled)
├── package.json                # Project manifest & scripts
├── tsconfig.json               # TypeScript config
├── public/                     # Static assets
└── src/
    └── app/
        ├── layout.tsx          # Root layout (fonts, metadata)
        ├── page.tsx            # Dashboard page (/)
        ├── globals.css         # Global styles + Tailwind
        ├── chat/
        │   └── page.tsx        # AI Chat page (/chat)
        └── api/
            └── chat/
                └── route.ts    # API route: POST /api/chat
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Roadmap / Known Gaps

- **Grok provider**: The `openai` package is installed and a `GROK_API_KEY` exists in `.env.local`, but the Grok backend is not implemented. The API route currently rejects any provider other than `gemini`.
- **Dashboard sections**: Analytics, Users, Products, Orders, and Settings tabs are placeholder "coming soon" stubs.
- **Unused dependencies**: `openai` and `generative-ai` are installed but not imported in the source code.
