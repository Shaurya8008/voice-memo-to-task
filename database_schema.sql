-- Supabase Database Schema for "Voice Memo to Task"

-- ==============================================================================
-- HOW TO SET THIS UP:
-- 1. Go to https://supabase.com/ and create a new project.
-- 2. Once the project is created, go to the "SQL Editor" on the left sidebar.
-- 3. Click "New Query", paste ALL of the code in this file into the editor, and click "Run".
-- 4. Go to "Project Settings" -> "API" to get your `Project URL` and `anon public` key.
-- 5. Copy those values into a `.env.local` file in the root of your project:
--    NEXT_PUBLIC_SUPABASE_URL=your-project-url
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
-- ==============================================================================

-- Create custom types
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'completed');
CREATE TYPE memo_status AS ENUM ('processing', 'completed', 'failed');

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- User Policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Create voice_memos table
CREATE TABLE voice_memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT,
  transcript TEXT NOT NULL,
  status memo_status DEFAULT 'processing' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for voice_memos
ALTER TABLE voice_memos ENABLE ROW LEVEL SECURITY;

-- Voice Memos Policies
CREATE POLICY "Users can view their own voice memos"
  ON voice_memos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice memos"
  ON voice_memos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice memos"
  ON voice_memos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice memos"
  ON voice_memos FOR DELETE
  USING (auth.uid() = user_id);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memo_id UUID REFERENCES voice_memos(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority priority_level DEFAULT 'medium' NOT NULL,
  status task_status DEFAULT 'pending' NOT NULL,
  category TEXT DEFAULT 'Inbox',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Tasks Policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Create task_logs table (for auditing or AI extraction logs)
CREATE TABLE task_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for task_logs
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own task logs"
  ON task_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task logs"
  ON task_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to automatically create a user profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update 'updated_at' on tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();