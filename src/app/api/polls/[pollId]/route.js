import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { pollId } = await params;
  
  const { data: poll, error: pollError } = await supabase
    .from('column_polls')
    .select('id, question, options')
    .eq('id', pollId)
    .single();

  if (pollError || !poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  const { data: votes, error: votesError } = await supabase
    .from('column_poll_votes')
    .select('option_index')
    .eq('poll_id', pollId);

  if (votesError) {
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }

  const totalVotes = votes.length;
  
  const results = poll.options.map((optionText, index) => {
    const count = votes.filter(v => v.option_index === index).length;
    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return { index, text: optionText, count, percentage };
  });

  return NextResponse.json({ 
    poll: { question: poll.question, options: poll.options },
    results,
    totalVotes
  });
}
