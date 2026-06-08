# Voice Memo to Task (MVP)

A full-stack Next.js application that captures voice memos, transcribes them, and extracts structured to-do items using Google Gemini AI.

## Features
- **Voice Recording**: Browser-native microphone integration with visual feedback.
- **AI Task Extraction**: Google Gemini automatically parses complex sentences into distinct tasks with categories, priorities, and due dates.
- **Premium UI**: Custom glassmorphism design with an interactive Light/Dark mode.
- **Task Management**: Search, filter, edit, and complete tasks directly from the dashboard.
- **Database Backed**: Securely stores all audio metadata, transcripts, and tasks via Supabase (PostgreSQL).

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, vanilla CSS.
- **Backend**: Supabase (Database, Auth, RLS).
- **AI**: `@google/genai` (Gemini 2.5 Flash).
- **Date Picking**: `react-datepicker`.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   Ensure your Supabase project is running. Execute the SQL contained in `database_schema.sql` in your Supabase SQL editor to create the `users`, `voice_memos`, and `tasks` tables with proper Row Level Security (RLS) policies.

3. **Environment Variables**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase URL, Anon Key, and Google Gemini API Key in `.env.local`.

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Sample Test Transcripts
Try speaking these phrases into the app to test the AI extraction:
1. *"Remind me to buy groceries tomorrow at 5 PM."* (Should create 1 task, categorize as Personal, set due date for tomorrow at 17:00).
2. *"I need to submit my AI assignment on Friday and also call Rahul tonight."* (Should create 2 separate tasks with different due dates).
3. *"Schedule a high priority team sync for next Monday at 10 AM."* (Should detect priority as High, set date).

---
*Built as a student project/MVP.*