import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Home, Users, DollarSign, FileText, Settings, LogOut, Search, Plus, UploadCloud, ChevronDown, Lock, Calculator, TrendingUp, AlertCircle, FileDigit, Save, Info, Table } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const MESES = ['JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

function br(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function norm(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim(); }

function App() {
  const [logged, setLogged] = useState(false);
  const [page, setPage] = useState('Dashboard');
  const [selectedMonth, setSelectedMonth] = useState('Todos os meses');
  const [clients, setClients] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [expandedRegime, setExpandedRegime] = useState({ MEI: true, 'Simples Nacional': true, 'Lucro Presumido': true });

  useEffect(() => { if (logged) loadData(); }, [logged]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    const { data: c } = await supabase.from('clientes').select('*').order('nome');
    const { data: l } = await supabase.from('lancamentos').select('*');
    setClients(c || []);
    setLancamentos(l || []);
    setLoading(false);
  }

  // Filtragem dos lançamentos baseada no seletor global de meses
  const filteredLancamentos = useMemo(() => {
    if (selectedMonth === 'Todos os meses') return lancamentos;
    return lancamentos.filter(l => norm(l.mes) === norm(selectedMonth));
  }, [lancamentos, selectedMonth]);

  if (!logged) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[32px] w-full max-w-md shadow-2xl text-center">
        <div className="bg-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 text-white font-black text-3xl mx-auto">S</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Sistema de Gestão 2026</h1>
        <p className="text-slate-500 mb-8 font-medium">Sempre Assessoria Contábil</p>
        <button onClick={() => setLogged(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20">Acessar Sistema</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      
      {/* SIDEBAR COM PASTAS */}
      <aside className="w-72 bg-[#1e293b] text-white flex flex-col shrink-0 overflow-y-auto border-r border-slate-800">
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-orange-500 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white">S</div>
            <div><h2 className="font-bold text-sm">Sempre</h2><p className="text-[10px] text-orange-400 font-medium tracking-tight">Assessoria Contábil</p></div>
          </div>
          <h1 className="text-xl font-bold mt-4">Gestão 2026</h1>
        </div>

        <nav className="p-4 space-y-1">
          <NavItem name="Dashboard" icon={Home} active={page === 'Dashboard'} onClick={() => {setPage('Dashboard'); setSelectedClient(null);}} />
          <NavItem name="Painel MEI" icon={TrendingUp} active={page === 'Painel MEI'} onClick={() => {setPage('Painel MEI'); setSelectedClient(null);}} />
          <NavItem name="Simples Nacional" icon={Calculator} active={page === 'Simples Nacional'} onClick={() => {setPage('Simples Nacional'); setSelectedClient(null);}} />
          <NavItem name="Lucro Presumido" icon={FileDigit} active={page === 'Lucro Presumido'} onClick={() => {setPage('Lucro Presumido'); setSelectedClient(null);}} />
        </nav>

        <div className="p-4 overflow-y-auto flex-1">
          <p className="px-4 py-2 text-[10px] font-bold text-slate-500 tracking-widest uppercase">Carteira de Clientes</p>
          <Folder name="MEI" color="bg-purple-500" items={clients.filter(c => c.regime === 'MEI')} expanded={expandedRegime.MEI} setExpanded={(v) => setExpandedRegime(p=>({...p, MEI:v}))} onSelect={(c) => {setSelectedClient(c); setPage('Detalhes Cliente');}} selected={selectedClient} />
          <Folder name="Simples Nacional" color="bg-blue-500" items={clients.filter(c => c.regime === 'Simples Nacional')} expanded={expandedRegime['Simples Nacional']} setExpanded={(v) => setExpandedRegime(p=>({...p, 'Simples Nacional':v}))} onSelect={(c) => {setSelectedClient(c); setPage('Detalhes Cliente');}} selected={selectedClient} />
          <Folder name="Lucro Presumido" color="bg-orange-500" items={clients.filter(c => c.regime === 'Lucro Presumido')} expanded={expandedRegime['Lucro Presumido']} setExpanded={(v) => setExpandedRegime(p=>({...p, 'Lucro Presumido':v}))} onSelect={(c) => {setSelectedClient(c); setPage('Detalhes Cliente');}} selected={selectedClient} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER COM SELETOR DE MÊS */}
        <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 shrink-0 shadow-sm z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-800 capitalize">{page === 'Detalhes Cliente' ? selectedClient?.nome : page}</h1>
            <p className="text-xs text-slate-400 font-medium">Visão Geral — {selectedMonth}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-4 py-2.5 outline-none hover:bg-slate-100 transition-all cursor-pointer appearance-none pr-10"
              >
                <option>Todos os meses</option>
                {MESES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
            </div>
            <button onClick={() => setShowNewClient(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all">
              <Plus size={16}/> NOVO CLIENTE
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 space-y-8 bg-[#f8fafc]">
          
          {page === 'Dashboard' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm grid grid-cols-4 gap-6">
                 <KPICard title="TOTAL CLIENTES" value={clients.length} sub="Empresas Ativas" />
                 <KPICard title="FATURAMENTO" value={br(filteredLancamentos.reduce((acc,l)=>acc+Number(l.faturamento||0),0))} sub={selectedMonth} />
                 <KPICard title="IMPOSTOS (DAS)" value={br(filteredLancamentos.reduce((acc,l)=>acc+Number(l.iss||0)+Number(l.pis||0),0))} sub="Total Calculado" />
                 <KPICard title="PENDÊNCIAS" value={clients.length - new Set(filteredLancamentos.map(l=>l.cliente)).size} sub="Empresas sem Faturamento" alert />
              </div>
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
                <AlertCircle className="text-orange-500" size={20} />
                <p className="text-sm font-medium text-orange-800"><b>DICA:</b> Selecione um mês específico no topo para ver os resultados detalhados.</p>
              </div>
            </div>
          )}

          {page === 'Painel MEI' && <RegimeView regime="MEI" limit={81000} clients={clients.filter(c=>c.regime==='MEI')} lancamentos={lancamentos} selectedMonth={selectedMonth} />}
          {page === 'Simples Nacional' && <RegimeView regime="Simples Nacional" limit={3600000} clients={clients.filter(c=>c.regime==='Simples Nacional')} lancamentos={lancamentos} selectedMonth={selectedMonth} isSublimit />}
          {page === 'Lucro Presumido' && <RegimeView regime="Lucro Presumido" limit={78000000} clients={clients.filter(c=>c.regime==='Lucro Presumido')} lancamentos={lancamentos} selectedMonth={selectedMonth} />}

          {page === 'Detalhes Cliente' && selectedClient && (
            <ClientDetailsTabs client={selectedClient} lancamentos={lancamentos} supabase={supabase} onRefresh={loadData} />
          )}

        </div>
      </main>
    </div>
  );
}

// --- MONITOR DE REGIME COM BARRA DE PROGRESSO ---
function RegimeView({ regime, limit, clients, lancamentos, selectedMonth, isSublimit }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {clients.map(c => {
        const moves = lancamentos.filter(l => norm(l.cliente) === norm(c.nome));
        // Se selecionar um mês, calculamos o acumulado até aquele mês para a barra ser real
        const acum = moves.reduce((acc, l) => acc + Number(l.faturamento || 0), 0);
        const perc = (acum / limit) * 100;
        
        return (
          <div key={c.nome} className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm space-y-4">
             <div className="flex justify-between items-start">
               <h3 className="font-bold text-slate-800 leading-tight w-2/3">{c.nome}</h3>
               <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded-full uppercase">{regime}</span>
             </div>
             <div className="space-y-1">
               <div className="flex justify-between text-[10px] font-bold">
                 <span className="text-slate-400">STATUS DO LIMITE</span>
                 <span className={perc > 90 ? 'text-red-600' : 'text-green-600'}>{perc.toFixed(1)}%</span>
               </div>
               <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                 <div className={`h-full transition-all duration-1000 ${perc > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${perc}%` }}></div>
               </div>
             </div>
             <div className="flex justify-between pt-4 border-t border-slate-50 text-[11px]">
               <div><p className="text-slate-400 text-[9px] font-bold uppercase">Acumulado</p><p className="font-bold text-slate-800">{br(acum)}</p></div>
               <div className="text-right"><p className="text-slate-400 text-[9px] font-bold uppercase">Restante</p><p className="font-bold text-slate-800">{br(limit - acum)}</p></div>
             </div>
          </div>
        );
      })}
    </div>
  );
}

// --- FICHA DO CLIENTE (CADASTRO + TABELA HORIZONTAL) ---
function ClientDetailsTabs({ client, lancamentos, supabase, onRefresh }) {
  const [tab, setTab] = useState('faturamento');
  const [grid, setGrid] = useState([]);

  useEffect(() => {
    const cMov = lancamentos.filter(l => norm(l.cliente) === norm(client.nome));
    const newGrid = MESES.map(mes => {
      const dbRow = cMov.find(l => norm(l.mes) === norm(mes)) || {};
      return { mes, servicos: dbRow.servicos || 0, vendas: dbRow.vendas || 0, faturamento: dbRow.faturamento || (Number(dbRow.servicos||0) + Number(dbRow.vendas||0)) || 0, iss: dbRow.iss || 0, irpj: dbRow.irpj || 0 };
    });
    setGrid(newGrid);
  }, [lancamentos, client]);

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col min-h-[600px] overflow-hidden">
      <div className="flex bg-slate-50/50 border-b border-slate-100">
        <TabButton active={tab === 'faturamento'} icon={Table} label="Faturamento Horizontal" onClick={()=>setTab('faturamento')} />
        <TabButton active={tab === 'cadastro'} icon={Info} label="Dados e Senhas" onClick={()=>setTab('cadastro')} />
      </div>

      <div className="p-10 flex-1">
        {tab === 'cadastro' ? (
          <div className="grid grid-cols-2 gap-10">
             <div className="space-y-6">
                <h3 className="font-bold text-slate-800 border-b pb-2">Informações da Empresa</h3>
                <DataField label="CNPJ" value={client.cnpj || 'Não Informado'} />
                <DataField label="CPF do Responsável" value={client.responsavel_cpf || 'Não Cadastrado'} />
                <DataField label="Regime" value={client.regime} />
             </div>
             <div className="bg-slate-50 p-8 rounded-3xl space-y-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><Lock size={18}/> Cofre de Senhas</h3>
                <DataField label="Senha GOV.br" value={client.senha_gov || '---'} isPassword />
                <DataField label="Senha Prefeitura" value={client.senha_prefeitura || '---'} isPassword />
             </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-100">
            <table className="w-full text-[11px] font-medium">
              <thead className="bg-[#1e293b] text-white">
                <tr>
                  <th className="p-4 text-left">MÊS</th>
                  <th className="p-4">SERVIÇOS</th>
                  <th className="p-4">VENDAS</th>
                  <th className="p-4 bg-blue-600/20">TOTAL</th>
                  <th className="p-4">ISS/ICMS</th>
                  <th className="p-4 bg-orange-600/20">IRPJ/CSLL (TRI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grid.map((r, idx) => {
                  const isTri = [2, 5, 8, 11].includes(idx);
                  return (
                    <tr key={r.mes} className="hover:bg-slate-50">
                      <td className="p-4 font-black text-slate-800">{r.mes}</td>
                      <td className="p-4 text-center">{br(r.servicos)}</td>
                      <td className="p-4 text-center">{br(r.vendas)}</td>
                      <td className="p-4 text-center font-black text-blue-600">{br(r.faturamento)}</td>
                      <td className="p-4 text-center">{br(r.iss)}</td>
                      <td className={`p-4 text-center ${isTri ? 'bg-orange-50 text-orange-600 font-bold' : 'opacity-20'}`}>{isTri ? br(r.irpj) : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
const NavItem = ({ name, icon: Icon, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${active ? 'bg-orange-500/10 text-orange-500 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}><Icon size={18} /><span>{name}</span></button>
);

const Folder = ({ name, color, items, expanded, setExpanded, onSelect, selected }) => (
  <div className="mt-2">
    <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300">
      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${color}`}></div>{name}</div>
      <ChevronDown size={12} className={expanded ? 'rotate-180' : ''} />
    </button>
    {expanded && (
      <div className="ml-8 mt-1 space-y-1 border-l border-slate-800">
        {items.map(i => (
          <button key={i.nome} onClick={() => onSelect(i)} className={`block w-full text-left px-4 py-2 text-xs truncate transition-all ${selected?.nome === i.nome ? 'text-orange-500 font-bold bg-orange-500/5' : 'text-slate-400 hover:text-white'}`}>• {i.nome}</button>
        ))}
      </div>
    )}
  </div>
);

const KPICard = ({ title, value, sub, alert }) => (
  <div className="p-2 border-r border-slate-100 last:border-none">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <h3 className={`text-2xl font-black ${alert ? 'text-orange-500' : 'text-slate-900'}`}>{value}</h3>
    <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
  </div>
);

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button onClick={onClick} className={`px-10 py-5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${active ? 'bg-white text-orange-500 border-orange-500 shadow-sm' : 'text-slate-400 border-transparent hover:text-slate-600'}`}><Icon size={16}/> {label}</button>
);

const DataField = ({ label, value, isPassword }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
    <p className={`text-sm font-bold ${isPassword ? 'text-blue-600' : 'text-slate-800'}`}>{value}</p>
  </div>
);

createRoot(document.getElementById('root')).render(<App />);
