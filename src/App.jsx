import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase usando as chaves do seu arquivo .env
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

// Funções de Ajuda
function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function numero(valor) {
  if (typeof valor === "number") return valor;
  return Number(String(valor || "0").replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
}

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function descobrirRegime(sheetName) {
  const nome = normalizar(sheetName);
  const mei = ["ABRAAO", "JOSUE", "LINDINALVA", "OSMAR", "SIMONE", "TELHADO GAMA"];
  const lucro = ["EVERTON", "GROW YOUR", "JCARLOS", "ROSILENE", "SOM EXPRESS", "TIME ENG", "TIME OBRAS", "VERO"];

  if (mei.includes(nome)) return "MEI";
  if (lucro.includes(nome)) return "Lucro Presumido";
  return "Simples Nacional";
}

function acharValor(row, nomes) {
  const keys = Object.keys(row);
  for (const nome of nomes) {
    const encontrado = keys.find(k => normalizar(k) === normalizar(nome));
    if (encontrado) return row[encontrado];
  }
  return "";
}

export default function App() {
  const [logado, setLogado] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [mensagem, setMensagem] = useState("Carregando banco...");
  const fileRef = useRef(null);

  // Busca os dados no Supabase toda vez que a página carrega (ou dá F5)
  useEffect(() => {
    carregarBanco();
  }, []);

  async function carregarBanco() {
    const { data: clientesDb, error: erroClientes } = await supabase
      .from("clientes")
      .select("*")
      .order("nome");

    const { data: lancamentosDb, error: erroLanc } = await supabase
      .from("lancamentos")
      .select("*");

    if (erroClientes || erroLanc) {
      setMensagem("Erro de conexão. Verifique seu arquivo .env");
      return;
    }

    setClientes(clientesDb || []);
    setLancamentos(lancamentosDb || []);

    if ((clientesDb || []).length === 0) {
      setMensagem("Banco conectado, aguardando primeira importação.");
    } else {
      setMensagem(`${clientesDb.length} clientes carregados da nuvem.`);
    }
  }

  async function salvarNoSupabase(clientesLista, lancamentosLista) {
    // Salva Clientes
    const { error: err1 } = await supabase
      .from("clientes")
      .upsert(clientesLista, { onConflict: "nome" });

    // Salva Lançamentos
    const { error: err2 } = await supabase
      .from("lancamentos")
      .upsert(lancamentosLista, { onConflict: "cliente,mes" });

    if (err1 || err2) {
      alert("Erro ao gravar no banco: " + (err1?.message || err2?.message));
    }
  }

  async function importarExcel(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMensagem("Processando planilha...");

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);

    const clientesImportados = [];
    const lancamentosImportados = [];

    workbook.SheetNames.forEach(sheetName => {
      const nomeAba = normalizar(sheetName);
      if (["PAINEL", "DASHBOARD", "GERAL", "TABELA"].some(termo => nomeAba.includes(termo))) return;

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!rows.length) return;

      const nomeCliente = sheetName.trim();
      const regime = descobrirRegime(nomeCliente);
      let faturamentoTotal = 0;
      let statusCliente = "Pendente";

      rows.forEach(row => {
        const mesRaw = acharValor(row, ["MÊS", "MES", "Mês", "Mes", "COMPETÊNCIA", "COMPETENCIA"]);
        const mes = normalizar(mesRaw);
        if (!MESES.includes(mes)) return;

        const vendas = numero(acharValor(row, ["VENDAS", "VENDA"]));
        const servicos = numero(acharValor(row, ["SERVIÇOS", "SERVICOS", "SERVICO"]));
        const faturamento = numero(acharValor(row, ["FATURAMENTO", "TOTAL", "RECEITA"])) || (vendas + servicos);
        const das = numero(acharValor(row, ["DAS", "TRIBUTOS", "IMPOSTO"]));
        const status = acharValor(row, ["STATUS", "SITUAÇÃO", "SITUACAO"]) || "Pendente";

        faturamentoTotal += faturamento;
        if (normalizar(status).includes("CONCL")) statusCliente = "Concluído";

        lancamentosImportados.push({
          cliente: nomeCliente,
          mes,
          regime,
          vendas,
          servicos,
          faturamento,
          das,
          status,
          updated_at: new Date().toISOString()
        });
      });

      clientesImportados.push({
        nome: nomeCliente,
        regime,
        faturamento: faturamentoTotal,
        status: statusCliente,
        updated_at: new Date().toISOString()
      });
    });

    // Envia para o Supabase
    await salvarNoSupabase(clientesImportados, lancamentosImportados);
    
    // Atualiza a tela
    setClientes(clientesImportados);
    setLancamentos(lancamentosImportados);
    setMensagem("Importação concluída e salva com sucesso!");
    e.target.value = "";
  }

  // Cálculos do Dashboard com Proteção contra banco vazio
  const totais = useMemo(() => {
    const listLanc = lancamentos || [];
    const listCli = clientes || [];

    const faturamento = listLanc.reduce((s, l) => s + Number(l.faturamento || 0), 0);
    const tributos = listLanc.reduce((s, l) => s + Number(l.das || 0), 0);
    const pendentes = listLanc.filter(l => normalizar(l.status).includes("PEND")).length;

    const porRegime = {};
    listCli.forEach(c => {
      porRegime[c.regime] = (porRegime[c.regime] || 0) + 1;
    });

    return { faturamento, tributos, pendentes, porRegime };
  }, [clientes, lancamentos]);

  if (!logado) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h1>Sempre Assessoria Contábil</h1>
        <button onClick={() => setLogado(true)} style={{ padding: "10px 20px", cursor: "pointer" }}>
          Entrar no Sistema
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importarExcel} />

      <aside style={{ width: 260, background: "#22316C", color: "#fff", padding: 20 }}>
        <h2>Sempre</h2>
        <p>Gestão Contábil 2026</p>
        <hr />
        {["MEI", "Simples Nacional", "Lucro Presumido"].map(regime => (
          <div key={regime} style={{ marginBottom: 20 }}>
            <strong>{regime}</strong>
            <ul style={{ fontSize: "12px", opacity: 0.8 }}>
              {(clientes || []).filter(c => c.regime === regime).map(c => (
                <li key={c.nome}>{c.nome}</li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: 30, background: "#f4f6f9" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h1>Dashboard</h1>
          <button onClick={() => fileRef.current.click()} style={{ padding: "10px 20px", background: "#4e73df", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>
            Importar Excel
          </button>
        </div>
        <p style={{ color: "#666" }}>{mensagem}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 25 }}>
          <div style={card}>
            <small>Empresas</small>
            <h2>{(clientes || []).length}</h2>
          </div>
          <div style={card}>
            <small>Faturamento Total</small>
            <h2>{moeda(totais.faturamento)}</h2>
          </div>
          <div style={card}>
            <small>Impostos (DAS)</small>
            <h2>{moeda(totais.tributos)}</h2>
          </div>
          <div style={card}>
            <small>Pendências</small>
            <h2>{totais.pendentes}</h2>
          </div>
        </div>

        <h2 style={{ marginTop: 40 }}>Lista de Clientes</h2>
        <table width="100%" cellPadding="12" style={{ background: "#fff", borderRadius: 10, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <th align="left">Cliente</th>
              <th align="left">Regime</th>
              <th align="right">Faturamento</th>
              <th align="center">Status</th>
            </tr>
          </thead>
          <tbody>
            {(clientes || []).map(c => (
              <tr key={c.nome} style={{ borderBottom: "1px solid #f8f8f8" }}>
                <td>{c.nome}</td>
                <td>{c.regime}</td>
                <td align="right">{moeda(c.faturamento)}</td>
                <td align="center">
                  <span style={{ padding: "4px 8px", borderRadius: 4, background: c.status === "Concluído" ? "#e1f7ec" : "#ffe8e8", color: c.status === "Concluído" ? "#008a4e" : "#d92d20" }}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 6px rgba(0,0,0,.05)"
};
