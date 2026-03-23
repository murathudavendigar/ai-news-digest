import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  
  const targetDate = dateParam || new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_digests")
    .select("*")
    .eq("date", targetDate)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found for this date" }, { status: 404 });
  }

  return NextResponse.json(data);
}
