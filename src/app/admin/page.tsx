"use client";
import { useCallback, useEffect, useState } from "react";
import { sb, photoUrl } from "@/lib/supabase";
type Row = { photo_id: string; number: number; path: string; active: boolean; votes: number };
const ALLOWED = ["image/jpeg", "image/png", "image/webp"], MAX = 10 * 1024 * 1024;

async function shrink(f: File): Promise<Blob> { // reduz só o tamanho de ficheiro (máx. 1400px); o conteúdo não é alterado
  const bmp = await createImageBitmap(f); const s = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
  cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
  return await new Promise((r) => cv.toBlob((b) => r(b!), "image/webp", 0.85));
}

const toLocal = (iso: string) => { const x = new Date(iso); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

export default function Admin() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [em, setEm] = useState(""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState("");
  const [rows, setRows] = useState<Row[]>([]); const [tot, setTot] = useState({ participations: 0, votes: 0 });
  const [open, setOpen] = useState(false); const [closes, setCloses] = useState("");

  const load = useCallback(async () => {
    const [r, t, c] = await Promise.all([sb.rpc("results"), sb.rpc("totals"), sb.from("config").select("open,closes_at").single()]);
    if (r.error || !t.data) { setOk(false); return; }
    setOk(true); setRows(r.data as Row[]); setTot(t.data); setOpen(!!c.data?.open); setCloses(c.data?.closes_at ? toLocal(c.data.closes_at) : "");
  }, []);
  useEffect(() => { load(); const i = setInterval(() => { if (ok) load(); }, 10000); return () => clearInterval(i); }, [load, ok]);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const { error } = await sb.auth.signInWithPassword({ email: em, password: pw });
    if (error) setMsg("Email ou palavra-passe incorretos."); else load();
  }
  async function setVoting(v: boolean) {
    if (v && !confirm("Abrir (ou reabrir) a votação?")) return;
    if (!v && !confirm("Encerrar a votação? Os votos mantêm-se.")) return;
    const { error } = await sb.from("config").update({ open: v }).eq("id", 1); if (error) setMsg("Sem permissão."); load();
  }
  async function saveCloses() {
    const { error } = await sb.from("config").update({ closes_at: closes ? new Date(closes).toISOString() : null }).eq("id", 1);
    setMsg(error ? "Não foi possível guardar a data." : closes ? "Data de encerramento guardada." : "Encerramento automático removido.");
  }
  async function upload(files: FileList | null) {
    if (!files) return; setMsg("");
    let next = Math.max(0, ...rows.map((r) => r.number)) + 1;
    for (const f of Array.from(files)) {
      if (!ALLOWED.includes(f.type) || f.size > MAX) { setMsg(`"${f.name}": só JPEG, PNG ou WebP até 10 MB.`); continue; }
      try {
        const path = `${crypto.randomUUID()}.webp`;
        const up = await sb.storage.from("photos").upload(path, await shrink(f), { contentType: "image/webp" });
        if (up.error) throw up.error;
        const ins = await sb.from("photos").insert({ number: next, path, active: false });
        if (ins.error) { await sb.storage.from("photos").remove([path]); throw ins.error; }
        next++;
      } catch { setMsg(`Falhou o carregamento de "${f.name}". Tenta de novo.`); }
    }
    load();
  }
  async function toggle(r: Row) { await sb.from("photos").update({ active: !r.active }).eq("id", r.photo_id); load(); }
  async function remove(r: Row) {
    if (r.votes > 0) { setMsg("Esta fotografia já tem votos: desativa-a em vez de a apagar."); return; }
    if (!confirm(`Apagar a fotografia n.º ${r.number}?`)) return;
    const { error } = await sb.from("photos").delete().eq("id", r.photo_id);
    if (error) setMsg("Não foi possível apagar."); else await sb.storage.from("photos").remove([r.path]);
    load();
  }
  function csv() {
    const rank = (r: Row) => 1 + rows.filter((x) => x.votes > r.votes).length;
    const t = "numero,posicao,votos\n" + rows.map((r) => `${r.number},${rank(r)},${r.votes}`).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv" })); a.download = "resultados.csv"; a.click();
  }

  if (ok === null) return <main><p>A carregar…</p></main>;
  if (!ok) return <main><form className="panel" onSubmit={login}><h1>Administração</h1>
    <label htmlFor="e">Email</label><input id="e" type="email" required value={em} onChange={(e) => setEm(e.target.value)} />
    <label htmlFor="p">Palavra-passe</label><input id="p" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
    {msg && <p className="err" role="alert">{msg}</p>}<button className="btn">Entrar</button>
    <p className="sub">Só contas autorizadas veem os resultados.</p></form></main>;

  const rank = (r: Row) => 1 + rows.filter((x) => x.votes > r.votes).length;
  const tied = (r: Row) => rows.filter((x) => x.votes === r.votes).length > 1;
  const top = rows.filter((r) => r.active && rank(r) <= 3);
  return <main>
    <h1>Administração</h1>
    <div className="stats">
      <div className="stat"><b>{tot.participations}</b><span>Votações submetidas</span></div>
      <div className="stat"><b>{tot.votes}</b><span>Votos individuais</span></div>
      <div className="stat"><b>{rows.filter((r) => r.active).length}</b><span>Fotografias ativas</span></div>
      <div className="stat"><b className={open ? "ok" : "off"}>{open ? "Aberta" : "Encerrada"}</b><span>Votação</span></div>
    </div>
    <button className="btn" onClick={() => setVoting(!open)}>{open ? "Encerrar votação" : "Abrir votação"}</button>{" "}
    <button className="btn alt" onClick={csv}>Exportar CSV</button>{" "}
    <button className="btn alt" onClick={() => sb.auth.signOut().then(() => setOk(false))}>Sair</button>
    <div style={{ marginTop: 12 }}><label htmlFor="c">Encerrar automaticamente em (opcional)</label>
      <input id="c" type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} style={{ maxWidth: 260 }} />
      <button className="btn alt" onClick={saveCloses}>Guardar data</button></div>
    {msg && <p className="err" role="alert">{msg}</p>}
    <h2>Top 3</h2>
    {top.length === 0 ? <p>Ainda não há votos.</p> : <div className="grid">{top.map((r) => <div className={`card pod p${rank(r)}`} key={r.photo_id}>
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={photoUrl(r.path)} alt={`n.º ${r.number}`} />
      <span className="medal">{rank(r)}.º</span><span className="n">{rank(r)}.º lugar{tied(r) ? " (empatado)" : ""} · n.º {r.number} · {r.votes} votos</span></div>)}</div>}
    <h2>Fotografias</h2>
    <label className="btn" style={{ display: "inline-block" }}>Carregar fotografias<input type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files)} /></label>
    <p className="sub">As novas ficam ocultas até as ativares.</p>
    <div className="tw"><table className="tbl"><thead><tr><th>Pos.</th><th></th><th>N.º</th><th>Votos</th><th>%</th><th></th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.photo_id}>
        <td>{rank(r)}{tied(r) ? " (emp.)" : ""}</td>{/* eslint-disable-next-line @next/next/no-img-element */}<td><img src={photoUrl(r.path)} alt="" width={48} /></td>
        <td>{r.number}</td><td>{r.votes}</td><td>{tot.votes ? Math.round((100 * r.votes) / tot.votes) : 0}%</td>
        <td><button className="btn alt" onClick={() => toggle(r)}>{r.active ? "Ocultar" : "Publicar"}</button>{" "}<button className="btn alt" onClick={() => remove(r)}>Apagar</button></td></tr>)}
    </tbody></table></div></main>;
}
