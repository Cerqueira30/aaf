import "@fontsource/creepster";
import "./globals.css";
import Footer from "./Footer";
export const metadata = { title: "Concurso de Monstrinhos — AAAF JI BPC", description: "Vota nos teus monstrinhos favoritos." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-PT"><body>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="logo" src="/logo-junta.png" alt="Junta de Freguesia de Carnide" />{children}<Footer /></body></html>;
}
