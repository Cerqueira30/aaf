"use client";
import { usePathname } from "next/navigation";
export default function Footer() {
  const p = usePathname();
  if (p.startsWith("/admin")) return null;
  return <footer style={{ textAlign: "center", padding: "0 16px 100px" }}>
    {p === "/privacidade" ? <a href="/">Voltar à votação</a> : <a href="/privacidade">Privacidade</a>}
  </footer>;
}
