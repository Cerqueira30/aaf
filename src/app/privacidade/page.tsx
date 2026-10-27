// EDITA ESTES TRÊS VALORES ANTES DE PUBLICAR
const CONTACTO = "[indicar email ou telefone de contacto da AAAF JI BPC]";
const CONSERVACAO = "[indicar o prazo, por exemplo: 30 dias após o fim do concurso]";
const RESPONSAVEL = "AAAF JI BPC";

export const metadata = { title: "Privacidade — Concurso de Monstrinhos" };
export default function Privacidade() {
  return <main style={{ maxWidth: 680 }}>
    <h1>Privacidade</h1>
    <p>Este site serve apenas para votar no Concurso de Monstrinhos organizado por {RESPONSAVEL}.</p>
    <h2>Que dados tratamos</h2>
    <p>Ao votar, guardamos os monstrinhos que escolheste e a data e hora do voto. Para travar abusos, guardamos também, durante no máximo uma hora, uma versão irreversível do endereço de rede (IP) do aparelho. Não pedimos nome, email nem telefone, e o voto não fica ligado a ti.</p>
    <p>As fotografias dos monstrinhos são mostradas com um número, sem o nome das crianças.</p>
    <h2>Para que usamos</h2>
    <p>Apenas para contar os votos e apurar o resultado. Os resultados só são vistos pela {RESPONSAVEL}.</p>
    <h2>Quanto tempo guardamos</h2>
    <p>{CONSERVACAO}. Depois disso, os votos e as fotografias são apagados.</p>
    <h2>Os teus direitos e contacto</h2>
    <p><a href="/">Voltar à votação</a></p>
  </main>;
}
