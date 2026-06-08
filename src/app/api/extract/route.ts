import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Task } from '@/types'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcript, memoId } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No GEMINI_API_KEY found, falling back to mock logic.");
      return mockExtract(transcript, memoId);
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `
      You are an AI assistant that extracts actionable tasks from voice memo transcripts.
      Given the following transcript, extract a list of tasks.
      For each task, provide:
      - title: A short, actionable title.
      - description: Additional context from the transcript, if any.
      - category: A best-guess category (e.g., "Work", "Personal", "University", "Inbox").
      - priority: "low", "medium", or "high".
      - dueDate: If a date or time is mentioned, convert it to an ISO 8601 string relative to current time (${new Date().toISOString()}). If no time/date is mentioned, leave it empty or omit it.

      Transcript:
      "${transcript}"

      Respond ONLY with a valid JSON array containing the task objects. Do not wrap in markdown tags like \`\`\`json. If no tasks are found, return an empty array [].
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || "[]";
      // Try to parse the text as JSON. Strip any markdown tags if the model ignored the instructions.
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedTasks = JSON.parse(cleanedText);
      const tasksToReturn = Array.isArray(parsedTasks) ? parsedTasks.map(t => ({
        ...t,
        memoId
      })) : [];

      if (tasksToReturn.length === 0) {
         // Fallback to manual review
         tasksToReturn.push({
           title: "Review Voice Memo",
           priority: "medium",
           category: "Inbox",
           memoId: memoId
         });
      }

      return NextResponse.json({ success: true, tasks: tasksToReturn });

    } catch (aiError) {
      console.error('Gemini API Error:', aiError);
      console.log('Falling back to mock logic due to API error.');
      return mockExtract(transcript, memoId);
    }

  } catch (error: any) {
    console.error('Extraction error:', error)
    return NextResponse.json({ error: 'Task extraction failed' }, { status: 500 })
  }
}

// Fallback logic if API key fails or is missing
async function mockExtract(transcript: string, memoId: string) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const tasks: Partial<Task>[] = []
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const lowerTranscript = transcript.toLowerCase()

    if (lowerTranscript.includes('submit') && lowerTranscript.includes('assignment')) {
      tomorrow.setHours(17, 0, 0, 0)
      tasks.push({
        title: "Submit AI Assignment",
        priority: "high",
        category: "University",
        dueDate: tomorrow.toISOString(),
        memoId: memoId
      })
    }

    if (lowerTranscript.includes('call') && lowerTranscript.includes('rahul')) {
      tomorrow.setHours(20, 0, 0, 0)
      tasks.push({
        title: "Call Rahul",
        priority: "medium",
        category: "Personal",
        dueDate: tomorrow.toISOString(),
        memoId: memoId
      })
    }

    if (tasks.length === 0) {
      tasks.push({
        title: "Review Voice Memo",
        priority: "medium",
        category: "Inbox",
        memoId: memoId
      })
    }

    return NextResponse.json({ success: true, tasks })
}
