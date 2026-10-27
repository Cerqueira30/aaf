"use client";
import { useEffect, useState } from "react";
import { sb, photoUrl } from "@/lib/supabase";

type Photo = { id: string; number: number; url: string };
type Step = "pick" | "confirm" | "done";

export default function Home() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [open, setOpen] = useState(true); const [closes, setCloses] = useState<string | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("pick");
  
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, ph] = await Promise.all([sb.from("config").select("open,closes_at").single(),
        sb.from("photos").select("id,number,path").eq("active", true).order("number")]);
      if (ph.error) { setErr("Não foi possível carregar as fotografias. Verifica a ligação e atualiza a página."); setPhotos([]); return; }
      const d = c.data; setCloses(d?.closes_at ?? null); setOpen(!!d?.open && !(d.closes_at && new Date(d.closes_at) < new Date()));
      setPhotos(ph.data.map((x) => ({ id: x.id, number: x.number, url: photoUrl(x.path) })));
    })();
  }, []);

  const toggle = (id: string) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s);
  async function call(url: string, body: object) {
    setBusy(true); setErr("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "Erro."); return true;
    } catch (e) { setErr((e as Error).message || "Erro de rede. Tenta novamente."); return false; }
    finally { setBusy(false); }
  }
  const chosen = (photos ?? []).filter((p) => sel.includes(p.id));

  return (<>
    <div className="hero" role="img" aria-label="AAAF JI BPC — Concurso de Monstrinhos" />
    <main>
      {step === "pick" && <>
        <h1>Escolhe até 3 monstrinhos favoritos</h1>
        <p className="sub">Pequenos monstros, grandes talentos!</p>
        {open && closes && <p className="sub">A votação encerra a {new Date(closes).toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" })}.</p>}
        {!open && <p className="err">A votação está encerrada.</p>}
        {err && <p className="err" role="alert">{err}</p>}
        {photos === null && <p>A carregar fotografias…</p>}
        {photos?.length === 0 && !err && <p>Ainda não há monstrinhos publicados. Volta mais tarde.</p>}
        <div className="grid">
          {photos?.map((p) => (
            <button key={p.id} className="card" aria-pressed={sel.includes(p.id)} onClick={() => toggle(p.id)} disabled={!open}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Monstrinho n.º ${p.number}`} loading="lazy" />
              <span className="n">Monstrinho n.º {p.number}</span>
            </button>))}
        </div>
        <div className="bar">
          <strong aria-live="polite">Selecionaste {sel.length} de 3</strong>
          <button className="btn" disabled={!sel.length || !open} onClick={() => setStep("confirm")}>Continuar</button>
        </div>
      </>}

      {step === "confirm" && <div className="panel">
        <h1>Confirma os teus votos</h1>
        <div className="thumbs">{chosen.map((p) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={p.id} src={p.url} alt={`Monstrinho n.º ${p.number}`} />)}</div>
        <p>{chosen.map((p) => `n.º ${p.number}`).join(", ")}</p>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn" disabled={busy} onClick={async () => { if (await call("/api/vote", { choices: sel })) setStep("done"); }}>{busy ? "A registar…" : "Confirmar votação"}</button>{" "}
        <button className="btn alt" disabled={busy} onClick={() => { setErr(""); setStep("pick"); }}>Alterar escolhas</button>
      </div>}

      {step === "done" && <div className="panel"><h1>Votação concluída!</h1>
        <p>Obrigado por participares no Concurso de Monstrinhos da AAAF JI BPC.</p>
        <button className="btn" onClick={() => { setSel([]); setStep("pick"); }}>Votar outra vez</button></div>}
    </main></>);
}
