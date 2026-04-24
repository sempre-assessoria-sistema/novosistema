import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

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
  const lucro = [
    "EVERTON", "GROW YOUR", "JCARLOS", "ROSILENE",
    "SOM EXPRESS", "TIME ENG", "TIME OBRAS", "VERO"
  ];

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
  const [clienteExpandido, setClienteExpandido] = useState(null); // Estado para controlar a lista suspensa
  const fileRef = useRef(null);

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
      setMensagem("Erro ao carregar banco. Verifique o Supabase.");
      return;
    }

    setClientes(clientesDb || []);
    setLancamentos(lancamentosDb || []);

    if ((clientesDb || []).length === 0) {
      setMensagem("Banco conectado, mas ainda sem clientes importados");
    } else {
      setMensagem(`${clientesDb.length} clientes carregados do Supabase`);
    }
  }

  async function salvarClientes(clientesImportados) {
    const { error } = await supabase
      .from("clientes")
      .upsert(clientesImportados, { onConflict: "nome" });

    if (error) {
      alert("Erro ao salvar clientes: " + error.message);
    }
  }

  async function salvarLancamentos(lancamentosImportados) {
    const { error } = await supabase
      .from("lancamentos")
      .upsert(lancamentosImportados, { onConflict: "cliente,mes" });

    if (error) {
      alert("Erro ao salvar lançamentos: " + error.message);
    }
  }

  async function importarExcel(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMensagem("Importando planilha...");

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);

    const clientesImportados = [];
    const lancamentosImportados = [];

    workbook.SheetNames.forEach(sheetName => {
      const nomeAba = normalizar(sheetName);

      if (
        nomeAba.includes("PAINEL") ||
        nomeAba.includes("DASHBOARD") ||
        nomeAba.includes("GERAL") ||
        nomeAba.includes("TABELA")
      ) {
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) return;

      const nomeCliente = sheetName.trim();
      const regime = descobrirRegime(nomeCliente);

      let faturamentoTotal = 0;
      let statusCliente = "Pendente";

      rows.forEach(row => {
        const mesRaw =
          acharValor(row, ["MÊS", "MES", "Mês", "Mes"]) ||
          acharValor(row, ["COMPETÊNCIA", "COMPETENCIA"]);

        const mes = normalizar(mesRaw);

        if (!MESES.includes(mes)) return;

        const vendas = numero(acharValor(row, ["VENDAS", "VENDA"]));
        const servicos = numero(acharValor(row, ["SERVIÇOS", "SERVICOS", "SERVICO"]));
        const faturamento =
          numero(acharValor(row, ["FATURAMENTO", "TOTAL", "RECEITA"])) ||
          vendas + servicos;

        const das = numero(acharValor(row, ["DAS", "TRIBUTOS", "IMPOSTO"]));
        const inss = numero(acharValor(row, ["INSS"]));
        const fgts = numero(acharValor(row, ["FGTS"]));
        const folha = numero(acharValor(row, ["FOLHA LÍQUIDA", "FOLHA LIQUIDA"]));
        const proLabore = numero(acharValor(row, ["PRO LABORE", "PRÓ-LABORE"]));

        const status =
          acharValor(row, ["STATUS", "SITUAÇÃO", "SITUACAO"]) || "Pendente";

        faturamentoTotal += faturamento;

        if (normalizar(status).includes("CONCL")) {
          statusCliente = "Concluído";
        }

        lancamentosImportados.push({
          cliente: nomeCliente,
          mes,
          regime,
          vendas,
          servicos,
          faturamento,
          das,
          inss,
          fgts,
          folha_liquida: folha,
          pro_labore: proLabore,
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

    if (!clientesImportados.length) {
      setMensagem("Nenhum cliente encontrado na planilha.");
      return;
    }

    await salvarClientes(clientesImportados);
    await salvarLancamentos(lancamentosImportados);

    setClientes(clientesImportados);
    setLancamentos(lancamentosImportados);

    setMensagem(
      `${clientesImportados.length} clientes e ${lancamentosImportados.length} lançamentos salvos no Supabase`
    );

    e.target.value = "";
  }

  const totais = useMemo(() => {
    const faturamento = lancamentos.reduce((s, l) => s + Number(l.faturamento || 0), 0);
    const tributos = lancamentos.reduce((s, l) => s + Number(l.das || 0), 0);
    const pendentes = lancamentos.filter(l => normalizar(l.status).includes("PEND")).length;

    const porRegime = {};
    clientes.forEach(c => {
      porRegime[c.regime] = (porRegime[c.regime] || 0) + 1;
    });

    return { faturamento, tributos, pendentes, porRegime };
  }, [clientes, lancamentos]);

  if (!logado) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Sempre Assessoria Contábil</h1>
        <p>Sistema de Gestão 2026</p>
        <input placeholder="E-mail" defaultValue="contato@sempreassessoriacontabil.com.br" />
        <br /><br />
        <input placeholder="Senha" type="password" />
        <br /><br />
        <button onClick={() => setLogado(true)}>Entrar</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial" }}>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={importarExcel}
      />

      <aside style={{ width: 260, background: "#22316C", color: "#fff", padding: 20 }}>
        <h2>Sempre</h2>
        <p>Assessoria Contábil</p>

        <h4>Clientes por Regime</h4>

        {["MEI", "Simples Nacional", "Lucro Presumido"].map(regime => (
          <div key={regime} style={{ marginBottom: 20 }}>
            <strong>{regime}</strong>
            <ul>
              {clientes
                .filter(c => c.regime === regime)
                .map(c => (
                  <li key={c.nome}>{c.nome}</li>
                ))}
            </ul>
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: 30, background: "#f4f6f9" }}>
        <h1>Dashboard</h1>
        <p>Sempre Assessoria Contábil · {mensagem}</p>

        <button 
          onClick={() => fileRef.current.click()}
          style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          Importar Excel
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 25 }}>
          <div style={card}>
            <small>Total de Clientes</small>
            <h2>{clientes.length}</h2>
          </div>

          <div style={card}>
            <small>Faturamento Total</small>
            <h2>{moeda(totais.faturamento)}</h2>
          </div>

          <div style={card}>
            <small>DAS / Tributos</small>
            <h2>{moeda(totais.tributos)}</h2>
          </div>

          <div style={card}>
            <small>Pendências</small>
            <h2>{totais.pendentes}</h2>
          </div>
        </div>

        <h2 style={{ marginTop: 40 }}>Tabela Geral</h2>

        <table width="100%" cellPadding="10" style={{ background: "#fff", borderRadius: 10, borderCollapse: "collapse", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
              <th align="left">Cliente</th>
              <th align="left">Regime</th>
              <th align="right">Faturamento Anual</th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <React.Fragment key={c.nome}>
                <tr 
                  onClick={() => setClienteExpandido(clienteExpandido === c.nome ? null : c.nome)}
                  style={{ 
                    cursor: "pointer", 
                    borderBottom: "1px solid #e2e8f0",
                    background: clienteExpandido === c.nome ? "#f1f5f9" : "transparent",
                    transition: "background 0.2s"
                  }}
                >
                  <td>
                    <strong style={{ color: "#2563eb", marginRight: "10px", display: "inline-block", width: "15px" }}>
                      {clienteExpandido === c.nome ? "▼" : "▶"}
                    </strong> 
                    {c.nome}
                  </td>
                  <td>{c.regime}</td>
                  <td align="right"><strong>{moeda(c.faturamento)}</strong></td>
                  <td>
                    <span style={{ 
                      background: c.status.includes("Pendente") ? "#fef3c7" : "#dcfce7", 
                      color: c.status.includes("Pendente") ? "#92400e" : "#166534",
                      padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold"
                    }}>
                      {c.status}
                    </span>
                  </td>
                </tr>

                {clienteExpandido === c.nome && (
                  <tr>
                    <td colSpan="4" style={{ padding: 0, borderBottom: "2px solid #cbd5e1" }}>
                      <div style={{ background: "#f8fafc", padding: "20px 40px", borderLeft: "4px solid #2563eb" }}>
                        <h4 style={{ margin: "0 0 15px 0", color: "#334155" }}>Controle Mensal de Faturamento</h4>
                        
                        <table width="100%" cellPadding="8" style={{ fontSize: "14px", borderCollapse: "collapse", background: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9", color: "#64748b", borderBottom: "1px solid #cbd5e1" }}>
                              <th align="left">Mês</th>
                              <th align="right">Faturamento</th>
                              <th align="right">DAS / Tributos</th>
                              <th align="left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lancamentos
                              .filter(l => l.cliente === c.nome)
                              .map(l => (
                                <tr key={l.mes} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <td><strong>{l.mes}</strong></td>
                                  <td align="right">{moeda(l.faturamento)}</td>
                                  <td align="right">{moeda(l.das)}</td>
                                  <td>
                                    <span style={{ 
                                      background: l.status.includes("Pendente") ? "#fef3c7" : "#dcfce7", 
                                      color: l.status.includes("Pendente") ? "#92400e" : "#166534",
                                      padding: "4px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold"
                                    }}>
                                      {l.status}
                                    </span>
                                  </td>
                                </tr>
                            ))}
                            {lancamentos.filter(l => l.cliente === c.nome).length === 0 && (
                              <tr>
                                <td colSpan="4" align="center" style={{ padding: "20px", color: "#94a3b8" }}>Nenhum lançamento encontrado para este cliente.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
  boxShadow: "0 8px 18px rgba(0,0,0,.06)"
};
