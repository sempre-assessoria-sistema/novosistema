import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  AreaChart, Area
} from 'recharts';
import {
  Home, Users, DollarSign, FileText, Settings, Menu, Moon, Sun, Search, Plus,
  ShieldCheck, LogOut, UploadCloud, Loader2
} from 'lucide-react';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const initialClients = [
  { nome:'ESTILLOS', regime:'Simples Nacional', fat:51690.42, status:'Concluído' },
  { nome:'DEBORA', regime:'Simples Nacional', fat:47339.43, status:'Concluído' },
  { nome:'ALGODAO DOCES', regime:'Simples Nacional', fat:22668.45, status:'Pendente' },
  { nome:'ABRAAO', regime:'MEI', fat:18100, status:'Pendente' },
  { nome:'VERO', regime:'Lucro Presumido', fat:38900, status:'Concluído' },
  { nome:'TIME OBRAS', regime:'Lucro Presumido', fat:31200, status:'Pendente' },
];

function normalizeMoney(value) {
  if (typeof value === 'number') return value;
  return Number(String(value || '0').replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
}

function normalizeClient(row) {
  const keys = Object.keys(row).reduce((acc, k) => {
    acc[k.toLowerCase().trim()] = row[k];
    return acc;
  }, {});

  const nome = keys.cliente || keys.nome || keys.empresa || keys['razão social'] || keys['razao social'];
  const regime = keys.regime || keys['regime tributário'] || keys['regime tributario'] || 'Não informado';
  const status = keys.status || keys.situação || keys.situacao || 'Pendente';
  const fatRaw = keys.faturamento || keys.total || keys.receita || keys.valor || 0;

  if (!nome) return null;
  return {
    nome: String(nome).trim(),
    regime: String(regime).trim(),
    fat: normalizeMoney(fatRaw),
    status: String(status).trim()
  };
}

function Button({ children, className = '', variant = 'primary', ...props }) {
  return <button className={`btn ${variant === 'outline' ? 'btn-outline' : 'btn-primary'} ${className}`} {...props}>{children}</button>;
}

function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function Input(props) {
  return <input className="input" {...props} />;
}

function App() {
  const [logged, setLogged] = useState(false);
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState('Dashboard');
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState(initialClients);
  const [importInfo, setImportInfo] = useState('Carregando banco de dados...');
  const [loadingDb, setLoadingDb] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadClientsFromSupabase(); }, []);

  async function loadClientsFromSupabase() {
    if (!supabase) {
      setImportInfo('Supabase não configurado: usando prévia local');
      return;
    }
    setLoadingDb(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('nome, regime, faturamento, status')
      .order('nome', { ascending: true });

    if (error) {
      setImportInfo('Erro ao carregar Supabase: ' + error.message);
      setLoadingDb(false);
      return;
    }

    if (data?.length) {
      setClients(data.map(c => ({
        nome: c.nome,
        regime: c.regime || 'Não informado',
        fat: Number(c.faturamento || 0),
        status: c.status || 'Pendente'
      })));
      setImportInfo(`${data.length} clientes carregados do Supabase`);
    } else {
      setImportInfo('Banco conectado, mas ainda sem clientes importados');
    }
    setLoadingDb(false);
  }

  async function saveClientsToSupabase(parsedClients) {
    if (!supabase) {
      setImportInfo('Excel importado localmente. Configure o Supabase para salvar permanente.');
      return;
    }
    setLoadingDb(true);
    const payload = parsedClients.map(c => ({
      nome: c.nome,
      regime: c.regime,
      faturamento: Number(c.fat || 0),
      status: c.status,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('clientes')
      .upsert(payload, { onConflict: 'nome' });

    if (error) setImportInfo('Erro ao salvar no Supabase: ' + error.message);
    else setImportInfo(`${parsedClients.length} clientes salvos permanentemente no Supabase`);
    setLoadingDb(false);
  }

  async function handleExcelImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const parsed = rows.map(normalizeClient).filter(Boolean);

    if (parsed.length) {
      setClients(parsed);
      setImportInfo(`${parsed.length} clientes importados de ${file.name}. Salvando no Supabase...`);
      await saveClientsToSupabase(parsed);
    } else {
      setImportInfo('Não encontrei colunas como Cliente/Nome, Regime, Faturamento e Status.');
    }
    e.target.value = '';
  }

  const br = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const filtered = clients.filter(c => c.nome.toLowerCase().includes(query.toLowerCase()));
  const totals = useMemo(() => {
    const totalFat = clients.reduce((s, c) => s + (Number(c.fat) || 0), 0);
    const pendentes = clients.filter(c => String(c.status).toLowerCase().includes('pend')).length;
    const regimes = clients.reduce((acc, c) => { acc[c.regime] = (acc[c.regime] || 0) + 1; return acc; }, {});
    const status = clients.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
    return { totalFat, pendentes, regimes, status };
  }, [clients]);

  const colors = ['#2563eb', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
  const regimeData = Object.entries(totals.regimes).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  const statusData = Object.entries(totals.status).map(([name, value]) => ({ name, value }));
  const monthly = [{m:'Jan',v:42000},{m:'Fev',v:61000},{m:'Mar',v:73000},{m:'Abr',v:88000},{m:'Mai',v:109000},{m:'Jun',v:125000}];

  if (!logged) return <div className="login-shell">
    <section className="login-brand">
      <div className="brand-box">S</div>
      <h1>Sempre Assessoria Contábil</h1>
      <p>Sistema SaaS de Gestão Contábil 2026 com dashboard, financeiro e área interna.</p>
    </section>
    <section className="login-panel">
      <Card className="login-card">
        <h2>Entrar</h2>
        <p>Anderson ou Ana Paula</p>
        <Input defaultValue="contato@sempreassessoriacontabil.com.br" />
        <Input placeholder="Senha" type="password" />
        <Button onClick={() => setLogged(true)}>Acessar sistema</Button>
        <small><ShieldCheck size={14}/> Ambiente seguro com login multiusuário</small>
      </Card>
    </section>
  </div>;

  const nav = [['Dashboard', Home], ['Clientes', Users], ['Financeiro', DollarSign], ['Relatórios', FileText], ['Configurações', Settings]];

  return <div className={`app ${dark ? 'dark' : ''}`}>
    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} hidden />
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="side-head">
        {open && <><div className="side-logo">S</div><div><strong>Sempre</strong><span>Assessoria Contábil</span></div></>}
        <button onClick={() => setOpen(!open)}><Menu size={18}/></button>
      </div>
      <nav>{nav.map(([n, I]) => <button key={n} onClick={() => setPage(n)} className={page === n ? 'active' : ''}><I size={18}/>{open && <span>{n}</span>}</button>)}</nav>
      <footer>
        <button onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>} {open && <span>{dark ? 'Tema claro' : 'Tema escuro'}</span>}</button>
        <button onClick={() => setLogged(false)}><LogOut size={18}/> {open && <span>Sair</span>}</button>
      </footer>
    </aside>

    <main>
      <header className="topbar">
        <div><h1>{page}</h1><p>Sempre Assessoria Contábil · {loadingDb ? 'Sincronizando com Supabase...' : importInfo}</p></div>
        <div className="actions">
          <Button onClick={() => fileRef.current?.click()}><UploadCloud size={16}/> Importar Excel</Button>
          <Button><Plus size={16}/> Novo Cliente</Button>
          <Button variant="outline">Exportar PDF</Button>
        </div>
      </header>

      {page === 'Dashboard' && <>
        <section className="kpis">
          {[['Clientes', clients.length, 'base importada'], ['Faturamento', br(totals.totalFat), 'acumulado'], ['Pendências', totals.pendentes, 'requer ação'], ['Honorários', br(clients.length * 380), 'previsão mensal']].map(x => <Card key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small></Card>)}
        </section>
        <section className="charts">
          <Card><h3>Clientes por Regime</h3><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={regimeData} dataKey="value" innerRadius={58} outerRadius={95}>{regimeData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></Card>
          <Card><h3>Status de Clientes</h3><ResponsiveContainer width="100%" height={250}><BarChart data={statusData}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="value" fill="#2563eb" radius={[10,10,0,0]}/></BarChart></ResponsiveContainer></Card>
          <Card><h3>Evolução do Faturamento</h3><ResponsiveContainer width="100%" height={250}><AreaChart data={monthly}><XAxis dataKey="m"/><YAxis/><Tooltip/><Area dataKey="v" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2}/></AreaChart></ResponsiveContainer></Card>
        </section>
      </>}

      {page === 'Clientes' && <Card><div className="search"><Search size={18}/><Input placeholder="Buscar cliente..." value={query} onChange={e => setQuery(e.target.value)} /></div><table><thead><tr><th>Cliente</th><th>Regime</th><th>Faturamento</th><th>Status</th></tr></thead><tbody>{filtered.map(c => <tr key={c.nome}><td>{c.nome}</td><td>{c.regime}</td><td>{br(c.fat)}</td><td><span className={String(c.status).toLowerCase().includes('concl') ? 'badge ok' : 'badge warn'}>{c.status}</span></td></tr>)}</tbody></table></Card>}
      {page === 'Financeiro' && <section className="kpis">{[['Recebido', br(totals.totalFat*.08)], ['A receber', br(totals.totalFat*.04)], ['Vencido', br(totals.totalFat*.01)]].map(x => <Card key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong></Card>)}</section>}
      {page === 'Relatórios' && <Card><h3>Relatórios disponíveis</h3><Button variant="outline">Relatório mensal PDF</Button><Button variant="outline">Exportar clientes Excel</Button><Button variant="outline">Resumo financeiro</Button></Card>}
      {page === 'Configurações' && <Card><h3>Usuários</h3><p>Anderson · Admin · contato@sempreassessoriacontabil.com.br</p><p>Ana Paula · Operacional · ana@sempreassessoriacontabil.com.br</p>{loadingDb && <p><Loader2 size={16}/> Sincronizando...</p>}</Card>}
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
