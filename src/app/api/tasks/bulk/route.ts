import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tasks } = await request.json()

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'No tasks provided' }, { status: 400 })
    }

    // Prepare tasks for insertion
    const tasksToInsert = tasks.map((t: any) => ({
      user_id: user.id,
      memo_id: t.memoId,
      title: t.title,
      description: t.description,
      due_date: t.dueDate,
      priority: t.priority,
      category: t.category,
      status: 'pending'
    }))

    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select()

    if (error) {
      console.error('Error bulk inserting tasks:', error)
      return NextResponse.json({ error: 'Failed to save tasks' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      tasks: data 
    })

  } catch (error: any) {
    console.error('Bulk save error:', error)
    return NextResponse.json({ error: 'Failed to save tasks' }, { status: 500 })
  }
}
