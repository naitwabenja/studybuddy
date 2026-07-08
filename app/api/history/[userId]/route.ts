import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const snapshot = await db
      .collection('analyses')
      .where('user_id', '==', userId)
      .get()

    const data = snapshot.docs.map((doc) => {
      const docData = doc.data()
      return {
        id: doc.id,
        user_id: (docData.user_id || '') as string,
        assignment_text: (docData.assignment_text || '') as string,
        explanation: (docData.explanation || '') as string,
        created_at: (docData.created_at || '') as string,
      }
    })

    // Sort in-memory to prevent FAILED_PRECONDITION (requiring a composite index in Firestore)
    data.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
      return timeB - timeA
    })

    const limitedData = data.slice(0, 10)

    return NextResponse.json(limitedData)
  } catch (error) {
    console.error('History API error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch history'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
