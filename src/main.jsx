import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { 
  Home, Users, DollarSign, FileText, Settings, LogOut, Search, 
  Plus, UploadCloud, ChevronDown, Lock, Calculator, TrendingUp, 
  AlertCircle, FileDigit, Save, Info, Table, Building2, Key 
} from 'lucide-react';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const MESES = [
  'JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

function br(n) { 
  return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
}

function norm(s) { 
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim(); 
}

function App() {
  const [logged, setLogged] = useState(false);
  const [page, setPage] = useState('Dashboard');
  const [selectedMonth, setSelectedMonth] = useState('Todos os meses');
  const [clients, setClients] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [expandedRegime, setExpandedRegime] = useState({ 
    MEI: true, 'Simples Nacional': true, 'Lucro Presumido': true 
  });

  const certRef = useRef(null);

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

  async function handleCreateClient(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const novoCliente = {
      nome: fd.get('nome').toUpperCase().trim(),
      razao_social: fd.get('razao_social'),
      valor_honorarios: Number(fd.get('valor_honorarios') || 0),
      cnpj: fd.get('cnpj'),
      inscricao_estadual: fd.get('inscricao_estadual'),
      inscricao_municipal: fd.get('inscricao_municipal'),
      cnae: fd.get('cnae'),
      regime: fd.get('regime'),
      tipo: fd.get('tipo'),
      anexo: fd.get('anexo'),
      responsavel_nome: fd.get('responsavel_nome'),
      responsavel_cpf: fd.get('responsavel_cpf'),
      senha_sefaz: fd.get('senha_sefaz'),
      senha_prefeitura: fd.get('senha_prefeitura'),
      senha_gov: fd.get('senha_gov'),
      codigo_simples: fd.get('codigo_simples'),
      status: 'Ativo',
      updated_at: new Date().toISOString()
    };
    
    setLoading(true);
    const { error } = await supabase.from('clientes').upsert([novoCliente], { onConflict: 'nome' });
    setLoading(false);
    
    if (error) {
      alert("Erro ao salvar! Rode o SQL no Supabase. Erro: " + error.message);
    } else { 
      setShowNewClient(false); 
      loadData(); 
    }
  }

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
      
      <aside className="w-72 bg-[#1e293b] text-white flex flex-col shrink-0 overflow-y-auto border-r border-slate-800">
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-orange-500 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white">S</div>
            <div>
              <h2 className="font-bold text-sm">Sempre</h2>
              <p className="text-[10px] text-orange-400 font-medium tracking-tight">Assessoria Contábil</p>
            </div>
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
          
          <Folder 
            name="MEI" color="bg-purple-500" 
            items={clients.filter(c => c.regime === 'MEI')} 
            expanded={expandedRegime.MEI} 
            setExpanded={(v) => setExpandedRegime(p=>({...p, MEI:v}))} 
            onSelect={(c) => {setSelectedClient(c); setPage('Detalhes Cliente');}} 
            selected={selectedClient} 
          />
          
          <Folder 
            name="Simples Nacional" color="bg-blue-500" 
            items={clients.filter(c => c.regime === 'Simples Nacional')} 
            expanded={expandedRegime['Simples Nacional']} 
            setExpanded={(v) => setExpandedRegime(p=>({...p, 'Simples Nacional':v}))} 
            onSelect={(c) => {setSelectedClient(c); setPage('Detalhes Cliente');}} 
            selected={selectedClient} 
          />
          
          <Folder 
            name="Lucro Presumido" color="bg-orange-500" 
            items={clients.filter(c => c.regime === 'Lucro Presumido')} 
            expanded={expandedRegime['Lucro Presumido']} 
            setExpanded={(v) => setExpandedRegime(p=>({...p, 'Lucro Presumido':v}))} 
            onSelect={(c) => {setSelectedClient(c); setPage('Detalhes Cliente');}} 
            selected={selectedClient} 
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-10 shrink-0 shadow-sm z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-800 capitalize">
              {page === 'Detalhes Cliente' ? selectedClient?.nome : page}
            </h1>
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
            
            <button 
              onClick={() => setShowNewClient(true)} 
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all"
            >
              <Plus size={16}/> NOVO CLIENTE
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-[#f8fafc]">
          {page === 'Dashboard' && (
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm grid grid-cols-4 gap-6">
                 <KPICard title="TOTAL CLIENTES" value={clients.length} sub="Empresas Ativas" />
                 <KPICard title="FATURAMENTO" value={br(filteredLancamentos.reduce((acc,l)=>acc+Number(l.faturamento||0),0))} sub={selectedMonth} />
                 <KPICard title="IMPOSTOS (DAS)" value={br(filteredLancamentos.reduce((acc,l)=>acc+Number(l.iss||0)+Number(l.pis||0),0))} sub="Total Calculado" />
                 <KPICard title="PENDÊNCIAS" value={clients.length - new Set(filteredLancamentos.map(l=>l.cliente)).size} sub="Empresas sem Faturamento" alert />
            </div>
          )}

          {page === 'Painel MEI' && <RegimeView regime="MEI" limit={81000} clients={clients.filter(c=>c.regime==='MEI')} lancamentos={lancamentos} />}
          {page === 'Simples Nacional' && <RegimeView regime="Simples Nacional" limit={3600000} clients={clients.filter(c=>c.regime==='Simples Nacional')} lancamentos={lancamentos} />}
          {page === 'Lucro Presumido' && <RegimeView regime="Lucro Presumido" limit={78000000} clients={clients.filter(c=>c.regime==='Lucro Presumido')} lancamentos={lancamentos} />}

          {page === 'Detalhes Cliente' && selectedClient && (
            <ClientDetailsTabs client={selectedClient} lancamentos={lancamentos} supabase={supabase} onRefresh={loadData} />
          )}
        </div>
      </main>

      {/* MODAL: NOVO CLIENTE */}
      {showNewClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Novo Cliente</h2>
              <button onClick={() => setShowNewClient(false)} className="text-slate-400 hover:text-slate-900 text-3xl font-light">&times;</button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-8 overflow-y-auto space-y-8">
               <div className="space-y-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                   <Building2 size={18} className="text-orange-500"/> Identificação
                 </h3>
                 
                 <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-5">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Nome *</label>
                      <input name="nome" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500" />
                    </div>
                    
                    <div className="col-span-12 md:col-span-7">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Razão Social</label>
                      <input name="razao_social" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500" />
                    </div>
                    
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Valor Honorários R$</label>
                      <input name="valor_honorarios" type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500" />
                    </div>
                    
                    <div className="col-span-12 md:col-span-8 flex items-end">
                      <input type="file" ref={certRef} accept=".pfx,.p12" className="hidden" onChange={() => alert('Certificado carregado!')} />
                      <button type="button" onClick={() => certRef.current?.click()} className="h-[42px] px-6 w-full rounded-lg font-bold text-sm bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-2 transition-all">
                        ✨ Importar do Certificado (.pfx)
                      </button>
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">CNPJ</label>
                      <input name="cnpj" placeholder="00.000.000/0001-00" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500" />
                    </div>
                    
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Insc. Estadual</label>
                      <input name="inscricao_estadual" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500" />
                    </div>
                    
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Insc. Municipal</label>
                      <input name="inscricao_municipal" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500" />
                    </div>
                    
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">CNAE Principal</label>
                      <input name="cnae" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500" />
                    </div>

                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Regime *</label>
                      <select name="regime" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500">
                        <option>MEI</option>
                        <option>Simples Nacional</option>
                        <option>Lucro Presumido</option>
                      </select>
                    </div>
                    
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Tipo</label>
                      <select name="tipo" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500">
                        <option>Comércio</option>
                        <option>Serviço</option>
                        <option>Misto</option>
                      </select>
                    </div>
                    
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Anexo (Simples)</label>
                      <select name="anexo" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500">
                        <option>Não se aplica</option>
                        <option>Anexo I</option>
                        <option>Anexo II</option>
                        <option>Anexo III</option>
                      </select>
                    </div>

                    <div className="col-span-12 md:col-span-8">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Responsável</label>
                      <input name="responsavel_nome" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500" />
                    </div>
                    
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">CPF do Responsável</label>
                      <input name="responsavel_cpf" placeholder="000.000.000-00" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500" />
                    </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                   <Key size={18} className="text-blue-500"/> Acessos
                 </h3>
                 <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Senha SEFAZ</label>
                      <input name="senha_sefaz" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Senha Prefeitura</label>
                      <input name="senha_prefeitura" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Senha GOV.br</label>
                      <input name="senha_gov" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Código Simples</label>
                      <input name="codigo_simples" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500" />
                    </div>
                 </div>
               </div>

               <div className="pt-6 flex gap-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowNewClient(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-10 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-all">{loading ? 'Salvando...' : 'Criar'}</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FICHA DO CLIENTE E TABELAS COM GRADE ESTILO EXCEL ---
function ClientDetailsTabs({ client, lancamentos, supabase, onRefresh }) {
  const [tab, setTab] = useState('faturamento');
  const [grid, setGrid] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cMov = lancamentos.filter(l => norm(l.cliente) === norm(client.nome));
    const newGrid = MESES.map(mes => {
      const dbRow = cMov.find(l => norm(l.mes) === norm(mes)) || {};
      return { 
        mes, 
        servicos: dbRow.servicos || 0, 
        vendas: dbRow.vendas || 0, 
        faturamento: dbRow.faturamento || (Number(dbRow.servicos||0) + Number(dbRow.vendas||0)) || 0, 
        icms: dbRow.icms || 0, 
        iss: dbRow.iss || 0, 
        pis: dbRow.pis || 0, 
        cofins: dbRow.cofins || 0, 
        irpj: dbRow.irpj || 0, 
        csll: dbRow.csll || 0, 
        inss: dbRow.inss || 0, 
        fgts: dbRow.fgts || 0, 
        folha_liquida: dbRow.folha_liquida || 0, 
        pro_labore: dbRow.pro_labore || 0,
        rbt12: dbRow.rbt12 || 0, 
        aliq_venda: dbRow.aliq_venda || 0, 
        aliq_servico: dbRow.aliq_servico || 0, 
        das: dbRow.das || 0, 
        status: dbRow.status || 'Pendente'
      };
    });
    setGrid(newGrid);
  }, [lancamentos, client]);

  const handleChange = (idx, field, value) => {
    const val = Number(value.replace(',', '.')) || 0;
    setGrid(prev => {
      const c = [...prev];
      c[idx][field] = val;
      if(field === 'servicos' || field === 'vendas') {
        c[idx].faturamento = c[idx].servicos + c[idx].vendas;
      }
      return c;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('lancamentos').delete().eq('cliente', client.nome);
    const payload = grid.map(r => ({ ...r, cliente: client.nome, regime: client.regime }));
    await supabase.from('lancamentos').insert(payload);
    setSaving(false);
    alert("✅ Dados salvos com sucesso!");
    onRefresh();
  };

  return (
    <div className="bg-white border border-slate-300 shadow-sm flex flex-col min-h-[600px] overflow-hidden">
      <div className="flex bg-slate-100 border-b border-slate-300">
        <TabButton active={tab === 'faturamento'} icon={Table} label="Movimentação (Lançamentos)" onClick={()=>setTab('faturamento')} />
        <TabButton active={tab === 'cadastro'} icon={Info} label="Dados e Senhas" onClick={()=>setTab('cadastro')} />
      </div>

      <div className="p-6 flex-1">
        {tab === 'cadastro' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold border-b pb-2">
                <Building2 size={16} className="inline mr-2 text-orange-500"/> Informações da Empresa
              </h3>
              <DataField label="CNPJ" value={client.cnpj || '---'} />
              <DataField label="Regime Tributário" value={client.regime} />
              <DataField label="Inscrição Estadual" value={client.inscricao_estadual || '---'} />
              <DataField label="Inscrição Municipal" value={client.inscricao_municipal || '---'} />
              <DataField label="CNAE" value={client.cnae || '---'} />
              <DataField label="CPF do Responsável" value={client.responsavel_cpf || '---'} />
              <DataField label="Honorários" value={br(client.valor_honorarios)} />
            </div>
            <div className="space-y-4">
               <h3 className="font-bold border-b pb-2">
                 <Key size={16} className="inline mr-2 text-blue-500"/> Acessos
               </h3>
               <DataField label="Senha GOV.br" value={client.senha_gov || '---'} isPassword />
               <DataField label="Senha Prefeitura" value={client.senha_prefeitura || '---'} isPassword />
               <DataField label="Senha SEFAZ" value={client.senha_sefaz || '---'} isPassword />
               <DataField label="Código do Simples" value={client.codigo_simples || '---'} isPassword />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">Planilha de {client.regime}</h3>
              <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 text-xs flex items-center gap-2 shadow-sm">
                <Save size={16}/> {saving ? 'Salvando...' : 'SALVAR PLANILHA'}
              </button>
            </div>
            
            <div className="overflow-x-auto border border-slate-300">
              
              {/* TABELA LUCRO PRESUMIDO */}
              {client.regime === 'Lucro Presumido' && (
                <table className="w-full text-[10px] font-medium border-collapse">
                  <thead className="bg-[#1e293b] text-white">
                    <tr>
                      <th className="border border-slate-600 p-2">MÊS</th>
                      <th className="border border-slate-600 p-2">SERVIÇOS</th>
                      <th className="border border-slate-600 p-2">VENDAS</th>
                      <th className="border border-slate-600 p-2 bg-blue-600/30">TOTAL</th>
                      <th className="border border-slate-600 p-2">ICMS</th>
                      <th className="border border-slate-600 p-2">ISS</th>
                      <th className="border border-slate-600 p-2">PIS</th>
                      <th className="border border-slate-600 p-2">COFINS</th>
                      <th className="border border-slate-600 p-2 bg-orange-600/30">IRPJ (TRI)</th>
                      <th className="border border-slate-600 p-2 bg-orange-600/30">CSLL (TRI)</th>
                      <th className="border border-slate-600 p-2">INSS</th>
                      <th className="border border-slate-600 p-2">FGTS</th>
                      <th className="border border-slate-600 p-2">F. LÍQUIDA</th>
                      <th className="border border-slate-600 p-2">PRÓ-LABORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grid.map((r, idx) => {
                      const isTri = [2, 5, 8, 11].includes(idx);
                      return (
                        <tr key={r.mes} className="hover:bg-slate-50">
                          <td className="border border-slate-300 p-1 font-bold bg-slate-100 text-center">{r.mes.slice(0,3)}</td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.servicos} onChange={e=>handleChange(idx,'servicos',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.vendas} onChange={e=>handleChange(idx,'vendas',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                          <td className="border border-slate-300 p-1 text-center font-bold text-blue-700 bg-blue-50/50">
                            {br(r.faturamento)}
                          </td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.icms} onChange={e=>handleChange(idx,'icms',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.iss} onChange={e=>handleChange(idx,'iss',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.pis} onChange={e=>handleChange(idx,'pis',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.cofins} onChange={e=>handleChange(idx,'cofins',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                          <td className={`border border-slate-300 p-0 ${isTri ? 'bg-orange-50' : 'bg-slate-100 opacity-50'}`}>
                            <input disabled={!isTri} value={r.irpj} onChange={e=>handleChange(idx,'irpj',e.target.value)} className="w-full text-center p-1 outline-none bg-transparent font-bold text-orange-700" />
                          </td>
                          <td className={`border border-slate-300 p-0 ${isTri ? 'bg-orange-50' : 'bg-slate-100 opacity-50'}`}>
                            <input disabled={!isTri} value={r.csll} onChange={e=>handleChange(idx,'csll',e.target.value)} className="w-full text-center p-1 outline-none bg-transparent font-bold text-orange-700" />
                          </td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.inss} onChange={e=>handleChange(idx,'inss',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.fgts} onChange={e=>handleChange(idx,'fgts',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.folha_liquida} onChange={e=>handleChange(idx,'folha_liquida',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                          <td className="border border-slate-300 p-0">
                            <input value={r.pro_labore} onChange={e=>handleChange(idx,'pro_labore',e.target.value)} className="w-full text-center p-1 outline-none" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {/* TABELA SIMPLES NACIONAL */}
              {client.regime === 'Simples Nacional' && (
                <table className="w-full text-[10px] font-medium border-collapse">
                  <thead className="bg-[#1e293b] text-white">
                    <tr>
                      <th className="border border-slate-600 p-2">MÊS</th>
                      <th className="border border-slate-600 p-2">RBT12 (Calc)</th>
                      <th className="border border-slate-600 p-2">ALÍQ. VENDA</th>
                      <th className="border border-slate-600 p-2">ALÍQ. SERV</th>
                      <th className="border border-slate-600 p-2">VENDAS</th>
                      <th className="border border-slate-600 p-2">SERVIÇOS</th>
                      <th className="border border-slate-600 p-2 bg-blue-600/30">VALOR DAS</th>
                      <th className="border border-slate-600 p-2">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grid.map((r, idx) => (
                      <tr key={r.mes} className="hover:bg-slate-50">
                        <td className="border border-slate-300 p-1 font-bold bg-slate-100 text-center">{r.mes}</td>
                        <td className="border border-slate-300 p-0">
                          <input value={r.rbt12} onChange={e=>handleChange(idx,'rbt12',e.target.value)} className="w-full text-center p-1 outline-none" />
                        </td>
                        <td className="border border-slate-300 p-0">
                          <input value={r.aliq_venda} onChange={e=>handleChange(idx,'aliq_venda',e.target.value)} className="w-full text-center p-1 outline-none" placeholder="0.00%" />
                        </td>
                        <td className="border border-slate-300 p-0">
                          <input value={r.aliq_servico} onChange={e=>handleChange(idx,'aliq_servico',e.target.value)} className="w-full text-center p-1 outline-none" placeholder="0.00%" />
                        </td>
                        <td className="border border-slate-300 p-0">
                          <input value={r.vendas} onChange={e=>handleChange(idx,'vendas',e.target.value)} className="w-full text-center p-1 outline-none text-blue-700 font-bold" />
                        </td>
                        <td className="border border-slate-300 p-0">
                          <input value={r.servicos} onChange={e=>handleChange(idx,'servicos',e.target.value)} className="w-full text-center p-1 outline-none text-blue-700 font-bold" />
                        </td>
                        <td className="border border-slate-300 p-0">
                          <input value={r.das} onChange={e=>handleChange(idx,'das',e.target.value)} className="w-full text-center p-1 outline-none font-bold text-red-600 bg-red-50/30" />
                        </td>
                        <td className="border border-slate-300 p-1 text-center">
                          <select className="bg-transparent outline-none">
                            <option>Pendente</option>
                            <option>Concluído</option>
                            <option>Entregue</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---
const RegimeView = ({ regime, limit, clients, lancamentos }) => (
  <div className="p-10 text-slate-400 text-center text-xl font-bold">
    Painel de Monitoramento: {regime} Ativo
  </div>
);

const NavItem = ({ name, icon: Icon, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${active ? 'bg-orange-500/10 text-orange-500 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
    <Icon size={18} /><span>{name}</span>
  </button>
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
          <button key={i.nome} onClick={() => onSelect(i)} className={`block w-full text-left px-4 py-2 text-xs truncate transition-all ${selected?.nome === i.nome ? 'text-orange-500 font-bold bg-orange-500/5' : 'text-slate-400 hover:text-white'}`}>
            • {i.nome}
          </button>
        ))}
      </div>
    )}
  </div>
);

const KPICard = ({ title, value, sub }) => (
  <div className="p-2 border-r border-slate-100 last:border-none">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-2xl font-black text-slate-900">{value}</h3>
    <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
  </div>
);

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button onClick={onClick} className={`px-8 py-4 text-xs font-bold flex items-center gap-2 transition-all ${active ? 'bg-white text-orange-500 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-600'}`}>
    <Icon size={16}/> {label}
  </button>
);

const DataField = ({ label, value, isPassword }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
    <p className={`text-sm font-bold ${isPassword ? 'text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded inline-block' : 'text-slate-800'}`}>
      {value}
    </p>
  </div>
);

createRoot(document.getElementById('root')).render(<App />);
