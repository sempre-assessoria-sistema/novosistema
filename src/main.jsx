import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Home, Users, DollarSign, FileText, Settings, LogOut, Search, Plus, ShieldCheck, ChevronDown, Lock, Calculator, TrendingUp, AlertCircle, FileDigit } from 'lucide-react';

// --- CONFIG SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

function br(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function App() {
  const [logged, setLogged] = useState(false);
  const [page, setPage] = useState('Dashboard');
  const [clients, setClients] = useState([]);
  const [lançamentos, setLançamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRegime, setExpandedRegime] = useState({ MEI: true, 'Simples Nacional': false, 'Lucro Presumido': false });
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => { if (logged) loadData(); }, [logged]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    const { data: c } = await supabase.from('clientes').select('*').order('nome');
    const { data: l } = await supabase.from('lancamentos').select('*');
    setClients(c || []);
    setLançamentos(l || []);
    setLoading(false);
  }

  // --- COMPONENTES DE UI ---
  const SidebarItem = ({ name, icon: Icon, active, onClick, count }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${active ? 'bg-orange-500/10 text-orange-500 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
      <div className="flex items-center gap-3"><Icon size={18} /><span>{name}</span></div>
      {count !== undefined && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{count}</span>}
    </button>
  );

  const RegimeFolder = ({ name, color, items }) => (
    <div className="mt-2">
      <button onClick={() => setExpandedRegime(prev => ({ ...prev, [name]: !prev[name] }))} className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`}></div>
          {name} <span className="ml-1 opacity-60">({items.length})</span>
        </div>
        <ChevronDown size={14} className={`transition-transform ${expandedRegime[name] ? 'rotate-180' : ''}`} />
      </button>
      {expandedRegime[name] && (
        <div className="ml-9 mt-1 space-y-1 border-l border-slate-800">
          {items.map(c => (
            <button key={c.nome} onClick={() => { setSelectedClient(c); setPage('Detalhes Cliente'); }} className="block w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-orange-500 truncate">• {c.nome}</button>
          ))}
        </div>
      )}
    </div>
  );

  if (!logged) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[32px] w-full max-w-md shadow-2xl">
        <div className="bg-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 text-white font-black text-3xl">S</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Sistema de Gestão 2026</h1>
        <p className="text-slate-500 mb-8">Sempre Assessoria Contábil</p>
        <button onClick={() => setLogged(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20">Acessar Painel</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* SIDEBAR DARK 2026 */}
      <aside className="w-72 bg-[#1e293b] text-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-orange-500 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm">S</div>
            <div>
              <h2 className="font-bold text-sm">Sempre</h2>
              <p className="text-[10px] text-orange-400 font-medium">Assessoria Contábil</p>
            </div>
          </div>
          <h1 className="text-xl font-bold mt-4">Sistema de Gestão 2026</h1>
        </div>

        <nav className="p-4 space-y-1">
          <SidebarItem name="Dashboard" icon={Home} active={page === 'Dashboard'} onClick={() => setPage('Dashboard')} />
          <SidebarItem name="Painel MEI" icon={TrendingUp} active={page === 'Painel MEI'} onClick={() => setPage('Painel MEI')} />
          <SidebarItem name="Simples Nacional" icon={Calculator} active={page === 'Simples Nacional'} onClick={() => setPage('Simples Nacional')} />
          <SidebarItem name="Lucro Presumido" icon={FileDigit} active={page === 'Lucro Presumido'} onClick={() => setPage('Lucro Presumido')} />
          <SidebarItem name="Financeiro (Asaas)" icon={DollarSign} active={page === 'Financeiro'} onClick={() => setPage('Financeiro')} />
          <SidebarItem name="Tabela Geral" icon={Users} active={page === 'Tabela Geral'} onClick={() => setPage('Tabela Geral')} />
          <SidebarItem name="Cofre de Senhas" icon={Lock} active={page === 'Cofre'} onClick={() => setPage('Cofre')} />
        </nav>

        <div className="p-4 pt-0">
          <p className="px-4 py-2 text-[10px] font-bold text-slate-500 tracking-widest">CLIENTES POR REGIME</p>
          <RegimeFolder name="MEI" color="bg-purple-500" items={clients.filter(c => c.regime === 'MEI')} />
          <RegimeFolder name="Simples Nacional" color="bg-blue-500" items={clients.filter(c => c.regime === 'Simples Nacional')} />
          <RegimeFolder name="Lucro Presumido" color="bg-orange-500" items={clients.filter(c => c.regime === 'Lucro Presumido')} />
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-800/50">
          <button onClick={() => setLogged(false)} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs transition-colors"><LogOut size={16} /> Encerrar Sessão</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER 2026 */}
        <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800 capitalize">{page}</h1>
            <p className="text-xs text-slate-400 font-medium">Visão geral — 2026</p>
          </div>
          <div className="flex items-center gap-6">
            <select className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2 outline-none"><option>Todos os meses</option></select>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"><Plus size={16}/> LANÇAMENTO</button>
            <button onClick={() => setShowNewClient(true)} className="bg-[#1e293b] hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"><Users size={16}/> NOVO CLIENTE</button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 space-y-8">
          {/* BARRA DE PENDÊNCIAS */}
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="text-orange-500" size={20} />
            <p className="text-sm font-medium text-orange-800"><span className="font-bold">PENDÊNCIAS FISCAIS:</span> {clients.length} clientes com status pendente em ALL.</p>
          </div>

          {page === 'Dashboard' && (
            <>
              {/* KPIS 2026 */}
              <div className="grid grid-cols-4 gap-6">
                <KPICard title="TOTAL DE CLIENTES" value={clients.length} sub="empresas cadastradas" />
                <KPICard title="FATURAMENTO TOTAL" value={br(0)} sub="no período" />
                <KPICard title="TOTAL DAS / TRIBUTOS" value={br(0)} sub="no período" />
                <KPICard title="CLIENTES PENDENTES" value={clients.length} sub="no mês selecionado" alert />
              </div>

              {/* GRÁFICOS PLACEHOLDER */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm h-80">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Faturamento por Regime</h3>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm h-80">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Status dos Clientes</h3>
                </div>
              </div>
            </>
          )}

          {/* TABELA HORIZONTAL - SIMPLES / PRESUMIDO */}
          {(page === 'Simples Nacional' || page === 'Lucro Presumido') && (
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider">Lançamentos Horizontais — {page}</h3>
                  <div className="flex gap-2">
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-3 py-1 rounded-full font-bold uppercase">Mensal</span>
                    <span className="bg-orange-100 text-orange-700 text-[10px] px-3 py-1 rounded-full font-bold uppercase">Trimestral</span>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-[11px] font-medium">
                   <thead className="bg-[#1e293b] text-white">
                     <tr>
                       <th className="p-4 text-left">MÊS</th>
                       <th className="p-4 bg-blue-600/20 text-blue-400">SERVIÇOS</th>
                       <th className="p-4 bg-blue-600/20 text-blue-400">VENDAS</th>
                       <th className="p-4">TOTAL</th>
                       <th className="p-4">ISS/ICMS</th>
                       <th className="p-4">PIS/COFINS</th>
                       <th className="p-4 bg-orange-600/20 text-orange-400">IRPJ (TRI)</th>
                       <th className="p-4 bg-orange-600/20 text-orange-400">CSLL (TRI)</th>
                       <th className="p-4">INSS/FGTS</th>
                       <th className="p-4">FOLHA LÍQUIDA</th>
                       <th className="p-4">PRÓ-LABORE</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {MESES.map((mes, idx) => {
                       const isTrimestre = [2, 5, 8, 11].includes(idx);
                       return (
                         <tr key={mes} className="hover:bg-slate-50 transition-colors">
                           <td className="p-4 font-bold text-slate-900 border-r border-slate-100 bg-slate-50/30">{mes}</td>
                           <td className="p-4"><input type="text" className="w-full bg-transparent border-none text-center focus:ring-0" placeholder="0,00" /></td>
                           <td className="p-4"><input type="text" className="w-full bg-transparent border-none text-center focus:ring-0" placeholder="0,00" /></td>
                           <td className="p-4 text-center font-bold">0,00</td>
                           <td className="p-4 text-center">0,00</td>
                           <td className="p-4 text-center">0,00</td>
                           <td className={`p-4 text-center ${isTrimestre ? 'bg-orange-50 font-bold text-orange-600' : 'bg-slate-50/50 text-slate-300'}`}>{isTrimestre ? '0,00' : '-'}</td>
                           <td className={`p-4 text-center ${isTrimestre ? 'bg-orange-50 font-bold text-orange-600' : 'bg-slate-50/50 text-slate-300'}`}>{isTrimestre ? '0,00' : '-'}</td>
                           <td className="p-4 text-center">0,00</td>
                           <td className="p-4 text-center">0,00</td>
                           <td className="p-4 text-center">0,00</td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL NOVO CLIENTE (CADASTRO COMPLETO) */}
      {showNewClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div><h2 className="text-2xl font-bold text-slate-900">Novo Cadastro</h2><p className="text-xs text-slate-400">Preencha os dados da empresa e certificados</p></div>
              <button onClick={() => setShowNewClient(false)} className="text-slate-400 hover:text-slate-900 text-3xl font-light">&times;</button>
            </div>
            <form className="p-8 overflow-y-auto space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Razão Social</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500 transition-all" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">CNPJ</label><input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500 transition-all" placeholder="00.000.000/0001-00" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Regime</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500 transition-all"><option>MEI</option><option>Simples Nacional</option><option>Lucro Presumido</option></select>
                  </div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">CPF Responsável</label><input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500 transition-all" placeholder="000.000.000-00" /></div>
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Validade Certificado</label><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500 transition-all" /></div>
               </div>
               <div className="pt-6 border-t border-slate-100 flex gap-4">
                  <button type="button" onClick={() => setShowNewClient(false)} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancelar</button>
                  <button className="flex-1 bg-orange-500 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all">Salvar Empresa</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const KPICard = ({ title, value, sub, alert }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
    <h3 className={`text-3xl font-black ${alert ? 'text-orange-500' : 'text-slate-900'}`}>{value}</h3>
    <p className="text-xs text-slate-400 mt-1">{sub}</p>
    <div className={`absolute bottom-0 left-0 h-1 transition-all group-hover:w-full w-12 ${alert ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
  </div>
);

createRoot(document.getElementById('root')).render(<App />);
