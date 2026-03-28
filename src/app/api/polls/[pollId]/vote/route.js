import { supabaseAdmin } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { pollId } = await params;
  
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { optionIndex, sessionId } = body;

  if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex > 2) {
    return NextResponse.json({ error: 'Invalid optionIndex' }, { status: 400 });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  // Check if voted (using admin to bypass RLS for ease of read, or public since read is true)
  const { data: existingVote } = await supabaseAdmin
    .from('column_poll_votes')
    .select('id, option_index')
    .eq('poll_id', pollId)
    .eq('session_id', sessionId)
    .single();

  if (!existingVote) {
    const { error: insertError } = await supabaseAdmin
      .from('column_poll_votes')
      .insert({
        poll_id: pollId,
        session_id: sessionId,
        option_index: optionIndex
      });

    if (insertError) {
      console.error('Vote insert failed:', insertError);
      return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
    }
  }

  // Fetch updated results
  const { data: votes } = await supabaseAdmin
    .from('column_poll_votes')
    .select('option_index')
    .eq('poll_id', pollId);

  const totalVotes = votes?.length || 0;
  
  const { data: poll } = await supabaseAdmin
    .from('column_polls')
    .select('options')
    .eq('id', pollId)
    .single();

  const results = poll?.options?.map((text, index) => {
    const count = (votes || []).filter(v => v.option_index === index).length;
    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return { index, text, count, percentage };
  }) || [];

  return NextResponse.json({ 
    success: true, 
    alreadyVoted: !!existingVote,
    results, 
    totalVotes 
  }, { status: 200 });
}
