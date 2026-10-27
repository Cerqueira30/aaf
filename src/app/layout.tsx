import "./globals.css";
export const metadata = { title: "Concurso de Monstrinhos — AAAF JI BPC", description: "Vota nos teus monstrinhos favoritos." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-PT"><body>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="logo" src="/logo-junta.png" alt="Junta de Freguesia de Carnide" />{children}<footer style={{ textAlign: "center", padding: "0 16px 90px" }}><a href="/privacidade">Privacidade</a></footer></body></html>;
}
