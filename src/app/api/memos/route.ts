import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // SIMULATED TRANSCRIPTION DELAY
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // Mock transcript
    const mockTranscript = "Tomorrow remind me to submit my AI assignment by 5 PM and call Rahul at 8 PM."

    // 1. Insert the voice memo
    const { data: memoData, error: memoError } = await supabase
      .from('voice_memos')
      .insert({
        user_id: user.id,
        transcript: mockTranscript,
        status: 'completed'
      })
      .select()
      .single()

    if (memoError) {
      console.error('Error inserting memo:', memoError)
      return NextResponse.json({ error: 'Failed to save memo' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      memo: memoData
    })

  } catch (error: any) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Transcription processing failed' }, { status: 500 })
  }
}
