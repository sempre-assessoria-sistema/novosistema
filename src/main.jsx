import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Home, Users, DollarSign, FileText, Settings, LogOut, Search, Plus, ShieldCheck, UploadCloud, FileWarning, CheckCircle, AlertTriangle, XCircle, FileDigit } from 'lucide-react';
import './style.css';

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// --- FUNÇÕES UTILITÁRIAS ---
function br(n) { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function getCertStatus(validade) {
  if (!validade) return { text: 'Sem Certificado', color: 'bg-gray-100 text-gray-500', icon: FileWarning, status: 'none' };
  
  const hoje = new Date();
  const dataVal = new Date(validade);
  const diffDias = Math.ceil((dataVal - hoje) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return { text: 'Vencido', color: 'bg-red-100 text-red-700', icon: XCircle, status: 'red' };
  if (diffDias <= 30) return { text: `Vence em ${diffDias} dias`, color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, status: 'yellow' };
  return { text: 'Válido', color: 'bg-green-100 text-green-700', icon: CheckCircle, status: 'green' };
}

function App() {
  const [logged, setLogged] = useState(false);
  const [page, setPage] = useState('Dashboard');
  const [clients, setClients] = useState([]);
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCert, setFilterCert] = useState(false);
  
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewGuia, setShowNewGuia] = useState(false);

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => { if (logged) loadData(); }, [logged]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    
    // Puxa Clientes
    const { data: dbClients } = await supabase.from('clientes').select('*').order('nome');
    setClients(dbClients || []);
    
    // Puxa Guias
    const { data: dbGuias } = await supabase.from('guias').select('*').order('vencimento');
    setGuias(dbGuias || []);
    
    setLoading(false);
  }

  // --- AÇÕES DO BANCO DE DADOS ---
  async function handleCreateClient(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const novoCliente = {
      nome: formData.get('nome').toUpperCase(),
      cnpj: formData.get('cnpj'),
      cpf: formData.get('cpf'),
      regime: formData.get('regime'),
      certificado_emissao: formData.get('cert_emissao') || null,
      certificado_validade: formData.get('cert_validade') || null,
      faturamento: Number(formData.get('faturamento') || 0),
      status: 'Ativo',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('clientes').upsert([novoCliente], { onConflict: 'nome' });
    if (!error) { setShowNewClient(false); loadData(); } else alert("Erro: " + error.message);
  }

  async function handleCreateGuia(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const novaGuia = {
      cliente: formData.get('cliente'),
      competencia: formData.get('competencia'),
      tipo: formData.get('tipo'),
      valor: Number(formData.get('valor') || 0),
      vencimento: formData.get('vencimento'),
      status: 'Pendente'
    };

    const { error } = await supabase.from('guias').insert([novaGuia]);
    if (!error) { setShowNewGuia(false); loadData(); } else alert("Erro: " + error.message);
  }

  async function toggleGuiaStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Pendente' ? 'Pago' : 'Pendente';
    await supabase.from('guias').update({ status: newStatus }).eq('id', id);
    loadData();
  }

  // --- SIMULADOR MÁGICO ---
  function simularCertificado() {
    const validadeInput = document.getElementById('cert_validade');
    const emissaoInput = document.getElementById('cert_emissao');
    const hoje = new Date();
    
    // Sorteia para gerar testes diferentes (Vencido, Vai Vencer ou Válido)
    const sorteio = Math.random();
    let dias = sorteio > 0.6 ? -10 : sorteio > 0.3 ? 15 : 300; 
    
    hoje.setDate(hoje.getDate() + dias);
    validadeInput.value = hoje.toISOString().split('T')[0];
    
    const emissao = new Date(hoje);
    emissao.setFullYear(emissao.getFullYear() - 1);
    emissaoInput.value = emissao.toISOString().split('T')[0];
  }

  // --- ESTATÍSTICAS PARA OS GRÁFICOS ---
  const pendentes = guias.filter(g => g.status === 'Pendente').length;
  const pagas = guias.filter(g => g.status === 'Pago').length;
  const totalGuiasValor = guias.filter(g => g.status === 'Pendente').reduce((acc, g) => acc + Number(g.valor), 0);
  
  const certAlertas = clients.filter(c => {
    const s = getCertStatus(c.certificado_validade).status;
    return s === 'red' || s === 'yellow';
  }).length;

  // --- TELA DE LOGIN ---
  if (!logged) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div className="flex justify-center mb-6"><div className="bg-blue-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold">S</div></div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">MonitorHub Contábil</h1>
          <p className="text-center text-gray-500 mb-8">Gestão Inteligente Sempre Assessoria</p>
          <button onClick={() => setLogged(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
            <ShieldCheck size={20} /> Entrar Seguramente
          </button>
        </div>
      </div>
    );
  }

  // --- LAYOUT PRINCIPAL ---
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      
      {/* SIDEBAR ESCURA (MonitorHub Style) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-500 text-white w-8 h-8 rounded flex items-center justify-center font-bold">S</div>
          <div><h2 className="font-bold leading-tight">Sempre</h2><span className="text-xs text-slate-400">MonitorHub ERP</span></div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { name: 'Dashboard', icon: Home },
            { name: 'Gestão de Guias', icon: FileDigit },
            { name: 'Tabela Geral', icon: Users },
            { name: 'Financeiro', icon: DollarSign },
            { name: 'Configurações', icon: Settings }
          ].map((item) => (
            <button key={item.name} onClick={() => setPage(item.name)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${page === item.name ? 'bg-blue-600 text-white font-medium shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}>
              <item.icon size={18} /> {item.name}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={() => setLogged(false)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"><LogOut size={16} /> Sair</button></div>
      </aside>

      {/* ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-lg w-96">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="Buscar no ERP..." className="bg-transparent border-none outline-none w-full text-sm" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block"><p className="text-sm font-bold text-gray-800">Anderson / Ana</p><p className="text-xs text-gray-500">MonitorHub Admin</p></div>
            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">A</div>
          </div>
        </header>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-auto p-8">
          
          <div className="flex justify-between items-center mb-8">
            <div><h1 className="text-2xl font-bold text-gray-800">{page}</h1><p className="text-sm text-gray-500">{loading ? 'Sincronizando...' : 'Sistema operando normalmente'}</p></div>
            <div className="flex gap-3">
              {page === 'Gestão de Guias' ? (
                <button onClick={() => setShowNewGuia(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"><Plus size={16} /> Lançar Guia</button>
              ) : (
                <button onClick={() => setShowNewClient(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"><Plus size={16} /> Novo Cliente</button>
              )}
            </div>
          </div>

          {/* DASHBOARD VIEW */}
          {page === 'Dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Total de Clientes</p>
                  <h3 className="text-3xl font-bold text-gray-800">{clients.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Guias Pendentes</p>
                  <h3 className="text-3xl font-bold text-red-600">{pendentes}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Valor em Aberto (DAS/Guias)</p>
                  <h3 className="text-2xl font-bold text-gray-800">{br(totalGuiasValor)}</h3>
                </div>
                <div className={`p-6 rounded-xl shadow-sm border ${certAlertas > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <p className={`text-sm mb-1 ${certAlertas > 0 ? 'text-red-600' : 'text-green-600'}`}>Alerta de Certificados</p>
                  <div className="flex items-center gap-3">
                    <h3 className={`text-3xl font-bold ${certAlertas > 0 ? 'text-red-700' : 'text-green-700'}`}>{certAlertas}</h3>
                    <span className="text-sm">{certAlertas > 0 ? 'Exigem atenção!' : 'Tudo ok'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Status Financeiro (Guias)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[{name: 'Pagas', value: pagas}, {name: 'Pendentes', value: pendentes}]}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* GESTÃO DE GUIAS VIEW */}
          {page === 'Gestão de Guias' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-gray-800">Controle de Impostos e Obrigações</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr><th className="py-3 px-6">Cliente</th><th className="py-3 px-6">Competência</th><th className="py-3 px-6">Tipo</th><th className="py-3 px-6">Vencimento</th><th className="py-3 px-6 text-right">Valor</th><th className="py-3 px-6 text-center">Status (Checklist)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {guias.map(g => (
                      <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 font-bold text-gray-800">{g.cliente}</td>
                        <td className="py-4 px-6">{g.competencia}</td>
                        <td className="py-4 px-6"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{g.tipo}</span></td>
                        <td className="py-4 px-6">{new Date(g.vencimento).toLocaleDateString('pt-BR')}</td>
                        <td className="py-4 px-6 text-right font-medium">{br(g.valor)}</td>
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => toggleGuiaStatus(g.id, g.status)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${g.status === 'Pago' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                            {g.status === 'Pago' ? '✓ Pago' : '⚠ Pendente'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {guias.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-gray-400">Nenhuma guia lançada.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABELA GERAL & CLIENTES VIEW */}
          {page === 'Tabela Geral' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">Ficha Geral de Clientes</h3>
                <button onClick={() => setFilterCert(!filterCert)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCert ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}>
                  {filterCert ? 'Mostrar Todos' : 'Filtrar: Certificados a Vencer'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-100 text-gray-600 font-medium border-b border-gray-200">
                    <tr><th className="py-3 px-6">Cliente</th><th className="py-3 px-6">CNPJ/CPF</th><th className="py-3 px-6">Regime</th><th className="py-3 px-6">Certificado Digital</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clients.filter(c => filterCert ? getCertStatus(c.certificado_validade).status !== 'green' : true).map(c => {
                      const cert = getCertStatus(c.certificado_validade);
                      const Icon = cert.icon;
                      return (
                        <tr key={c.nome} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 font-bold text-gray-800">{c.nome}</td>
                          <td className="py-4 px-6">{c.cnpj || c.cpf || 'Não inf.'}</td>
                          <td className="py-4 px-6"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">{c.regime}</span></td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cert.color}`}>
                              <Icon size={14} /> {cert.text}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL NOVO CLIENTE (COM CERTIFICADO E BOTÃO MÁGICO) */}
      {showNewClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="font-bold text-xl text-gray-800">Cadastrar Novo Cliente</h2>
              <button onClick={() => setShowNewClient(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateClient} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label><input required name="nome" type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label><input name="cnpj" type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50" placeholder="00.000.000/0001-00"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">CPF do Responsável</label><input name="cpf" type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50" placeholder="000.000.000-00"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Regime Tributário</label><select name="regime" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50"><option value="MEI">MEI</option><option value="Simples Nacional">Simples Nacional</option><option value="Lucro Presumido">Lucro Presumido</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Faturamento Base (Opcional)</label><input name="faturamento" type="number" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50" /></div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><FileDigit size={18} className="text-blue-600"/> Certificado Digital</h3>
                  <button type="button" onClick={simularCertificado} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-200 font-bold">🪄 Simular Leitura do A1</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</label><input id="cert_emissao" name="cert_emissao" type="date" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Data de Validade</label><input id="cert_validade" name="cert_validade" type="date" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50" /></div>
                </div>
              </div>

              <div className="pt-8 flex gap-3 justify-end border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowNewClient(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg">Salvar Ficha Completa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVA GUIA */}
      {showNewGuia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-xl text-gray-800">Lançar Nova Guia</h2>
              <button onClick={() => setShowNewGuia(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateGuia} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Cliente</label>
                <select name="cliente" required className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50">
                  {clients.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Competência</label><input required name="competencia" type="text" placeholder="Ex: 04/2026" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-gray-50" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Guia</label><select name="tipo" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-gray-50"><option>DAS</option><option>FGTS</option><option>GPS</option><option>IRPJ</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label><input required name="vencimento" type="date" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-gray-50" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label><input required name="valor" type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-gray-50" /></div>
              </div>
              <div className="pt-6 flex gap-3 justify-end border-t border-gray-100 mt-4">
                <button type="button" onClick={() => setShowNewGuia(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg">Gerar Pendência</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
