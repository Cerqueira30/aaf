import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { validateChoices, voterKey } from "@/lib/validate";
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const choices = validateChoices(body.choices);
  if (!choices) return NextResponse.json({ error: "Escolhas inválidas." }, { status: 400 });
  const ip = (req.headers.get("x-forwarded-for") ?? "desconhecido").split(",")[0].trim();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { error } = await sb.rpc("cast_vote", { p_voter: randomUUID(), p_choices: choices, p_ip: voterKey(ip, process.env.VOTER_HASH_SECRET!) });
  if (error) {
    if (error.message.includes("closed")) return NextResponse.json({ error: "A votação está encerrada." }, { status: 403 });
    if (error.message.includes("rate_limited")) return NextResponse.json({ error: "Demasiados votos seguidos. Tenta daqui a uns minutos." }, { status: 429 });
    if (error.message.includes("invalid")) return NextResponse.json({ error: "Escolhas inválidas." }, { status: 400 });
    return NextResponse.json({ error: "Erro ao registar. Tenta novamente." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
