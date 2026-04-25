import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Home, Users, DollarSign, FileText, Settings, Menu, Moon, Sun, Search, Plus, ShieldCheck, LogOut, UploadCloud, ChevronDown, Eye } from 'lucide-react';
import './style.css';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const MESES = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
const SYSTEM_SHEETS = ['📊 VISÃO GERAL','PAINEL GERAL 2026','EXPORT_N8N','🔗 LINKS DOS CLIENTES'];

// Funções Utilitárias
function money(v){ if(typeof v==='number') return v; return Number(String(v||'0').replace(/[R$\s]/g,'').replace(/\./g,'').replace(',','.')) || 0; }
function br(n){ return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function norm(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim(); }
function cellNumber(sheet, addr){ const c=sheet[addr]; if(!c) return 0; if(typeof c.v==='number') return c.v; return money(c.v ?? c.w); }
function cellText(sheet, addr){ const c=sheet[addr]; return String(c?.v ?? c?.w ?? '').trim(); }

function getRegimesFromPainel(wb){
  const map = {};
  const ws = wb.Sheets['Painel Geral 2026'];
  if(!ws) return map;
  const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
  rows.slice(3).forEach(r => { if(r[0]) map[String(r[0]).trim()] = String(r[1] || 'Não informado').trim(); });
  return map;
}

function parseClientSheet(wb, sheetName, regimeFromPanel){
  const ws = wb.Sheets[sheetName];
  const title = norm(cellText(ws,'A1'));
  let regime = regimeFromPanel || 'Não informado';
  if(title.includes('MEI')) regime = 'MEI';
  if(title.includes('SIMPLES')) regime = 'Simples Nacional';
  if(title.includes('LUCRO PRESUMIDO')) regime = 'Lucro Presumido';

  const meses = [];
  for(let r=4; r<=15; r++){
    const mes = norm(cellText(ws,`A${r}`));
    if(!MESES.includes(mes)) continue;
    let rec = { cliente: sheetName, mes, regime, vendas:0, servicos:0, faturamento:0, das:0, inss:0, fgts:0, folha_liquida:0, pro_labore:0, status:'Pendente' };
    if(regime === 'MEI'){
      rec.faturamento = cellNumber(ws,`B${r}`);
      rec.das = cellNumber(ws,`C${r}`);
      rec.inss = cellNumber(ws,`D${r}`);
      rec.fgts = cellNumber(ws,`E${r}`);
      rec.folha_liquida = cellNumber(ws,`F${r}`);
      rec.pro_labore = cellNumber(ws,`G${r}`);
      rec.status = cellText(ws,`H${r}`) || 'Pendente';
    } else if(regime === 'Simples Nacional'){
      rec.vendas = cellNumber(ws,`B${r}`);
      rec.servicos = cellNumber(ws,`C${r}`);
      rec.faturamento = cellNumber(ws,`D${r}`) || rec.vendas + rec.servicos;
      rec.das = cellNumber(ws,`E${r}`);
      rec.inss = cellNumber(ws,`F${r}`);
      rec.fgts = cellNumber(ws,`G${r}`);
      rec.folha_liquida = cellNumber(ws,`H${r}`);
      rec.pro_labore = cellNumber(ws,`I${r}`);
      rec.status = cellText(ws,`J${r}`) || 'Pendente';
    } else {
      rec.servicos = cellNumber(ws,`B${r}`);
      rec.vendas = cellNumber(ws,`C${r}`);
      rec.faturamento = cellNumber(ws,`D${r}`) || rec.vendas + rec.servicos;
      rec.das = cellNumber(ws,`E${r}`) + cellNumber(ws,`F${r}`) + cellNumber(ws,`G${r}`) + cellNumber(ws,`H${r}`) + cellNumber(ws,`I${r}`) + cellNumber(ws,`J${r}`);
      rec.inss = cellNumber(ws,`K${r}`);
      rec.fgts = cellNumber(ws,`L${r}`);
      rec.folha_liquida = cellNumber(ws,`M${r}`);
      rec.pro_labore = cellNumber(ws,`N${r}`);
      rec.status = cellText(ws,`O${r}`) || 'Pendente';
    }
    meses.push(rec);
  }
  const totalFat = meses.reduce((s,m)=>s+m.faturamento,0);
  const totalDas = meses.reduce((s,m)=>s+m.das,0);
  const latest = [...meses].reverse().find(m => m.faturamento || m.das || m.status) || meses[0];
  return { nome: sheetName, regime, faturamento: totalFat, das: totalDas, status: latest?.status || 'Pendente', meses };
}

function parseWorkbook(workbook){
  const regimes = getRegimesFromPainel(workbook);
  const clientSheetNames = workbook.SheetNames.filter(n => !SYSTEM_SHEETS.includes(norm(n)) && workbook.Sheets[n]);
  const clients = clientSheetNames.map(name => parseClientSheet(workbook, name, regimes[name])).filter(c=>c.nome && c.meses.length);
  return clients.sort((a,b)=>a.nome.localeCompare(b.nome));
}

// Componentes UI
function Button({ children, className='', variant='primary', ...props }){ return <button className={`btn ${variant==='outline'?'btn-outline':'btn-primary'} ${className}`} {...props}>{children}</button>; }
function Card({ children, className='' }){ return <div className={`card ${className}`}>{children}</div>; }
function Input(props){ return <input className='input' {...props}/>; }

function App(){
  const [logged,setLogged] = useState(false);
  const [open,setOpen] = useState(true);
  const [page,setPage] = useState('Dashboard');
  const [dark,setDark] = useState(false);
  const [query,setQuery] = useState('');
  const [clients,setClients] = useState([]);
  const [importInfo,setImportInfo] = useState('Carregando banco de dados...');
  const [loadingDb,setLoadingDb] = useState(false);
  const [expanded,setExpanded] = useState({MEI:true,'Simples Nacional':true,'Lucro Presumido':true});
  const [selected,setSelected] = useState(null);
  const fileRef = useRef(null);

  useEffect(()=>{ loadFromSupabase(); }, []);

  async function loadFromSupabase(){
    if(!supabase){ setImportInfo('Supabase não configurado'); return; }
    setLoadingDb(true);
    const { data: master, error: e1 } = await supabase.from('clientes').select('*').order('nome');
    const { data: moves, error: e2 } = await supabase.from('lancamentos').select('*');
    
    if(e1 || e2){ 
      setImportInfo('Erro ao carregar dados. Verifique a conexão.'); 
      setLoadingDb(false); 
      return; 
    }

    const grouped = (master||[]).map(c => {
      const meses = (moves||[]).filter(m=>m.cliente===c.nome).map(m=>({
        cliente:m.cliente, mes:m.mes, regime:c.regime, vendas:Number(m.vendas||0), servicos:Number(m.servicos||0), faturamento:Number(m.faturamento||0), das:Number(m.das||0), inss:Number(m.inss||0), fgts:Number(m.fgts||0), folha_liquida:Number(m.folha_liquida||0), pro_labore:Number(m.pro_labore||0), status:m.status||'Pendente'
      }));
      return { nome:c.nome, regime:c.regime||'Não informado', faturamento:Number(c.faturamento||0), das:Number(c.das||0), status:c.status||'Pendente', meses };
    });

    setClients(grouped);
    setImportInfo(grouped.length ? `${grouped.length} clientes carregados da nuvem` : 'Banco conectado, aguardando importação');
    setLoadingDb(false);
  }

  async function saveToSupabase(parsed){
    if(!supabase){ setImportInfo('Supabase não configurado.'); return; }
    setLoadingDb(true);
    
    // Lista de nomes de clientes para apagarmos os antigos
    const clientNames = parsed.map(c => c.nome);
    
    // Preparando os dados (Removido o updated_at dos lançamentos para evitar Erro 400)
    const clientPayload = parsed.map(c=>({ nome:c.nome, regime:c.regime, faturamento:c.faturamento, das:c.das, status:c.status, updated_at:new Date().toISOString() }));
    const movePayload = parsed.flatMap(c=>c.meses.map(m=>({ cliente:c.nome, mes:m.mes, regime:c.regime, vendas:m.vendas, servicos:m.servicos, faturamento:m.faturamento, das:m.das, inss:m.inss, fgts:m.fgts, folha_liquida:m.folha_liquida, pro_labore:m.pro_labore, status:m.status })));
    
    // 1. Atualiza os dados principais dos Clientes
    const { error:e1 } = await supabase.from('clientes').upsert(clientPayload, { onConflict:'nome' });
    
    // 2. A MÁGICA: Apaga os lançamentos velhos para não dar conflito (Erro 409)
    await supabase.from('lancamentos').delete().in('cliente', clientNames);
    
    // 3. Insere os lançamentos novinhos em folha
    const { error:e2 } = await supabase.from('lancamentos').insert(movePayload); 

    if(e1 || e2) setImportInfo('Erro ao gravar: ' + (e1?.message || e2?.message));
    else setImportInfo(`${parsed.length} clientes salvos com sucesso!`);
    
    setLoadingDb(false);
    loadFromSupabase();
  }

  async function handleExcelImport(e){
    const file = e.target.files?.[0];
    if(!file) return;
    setImportInfo('Lendo planilha...');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { cellDates:true });
    const parsed = parseWorkbook(workbook);
    if(parsed.length){ 
      setImportInfo(`Salvando ${parsed.length} clientes no banco...`); 
      await saveToSupabase(parsed); 
    }
    else setImportInfo('Planilha sem abas de clientes válidas.');
    e.target.value='';
  }

  // Cálculos de Totais e Gráficos
  const filtered = (clients||[]).filter(c=>c.nome.toLowerCase().includes(query.toLowerCase()));
  const byRegime = useMemo(()=>['MEI','Simples Nacional','Lucro Presumido'].map(regime=>({regime, items:(clients||[]).filter(c=>c.regime===regime)})), [clients]);
  const monthlyRows = useMemo(()=>(clients||[]).flatMap(c=>c.meses.map(m=>({...m, cliente:c.nome, regime:c.regime}))), [clients]);
  const regimeFilterRows = regime => monthlyRows.filter(m=>m.regime===regime && (!query || m.cliente.toLowerCase().includes(query.toLowerCase())));
  
  const totals = useMemo(()=>{
    const fat = (clients||[]).reduce((s,c)=>s+c.faturamento,0);
    const das = (clients||[]).reduce((s,c)=>s+c.das,0);
    const pend = monthlyRows.filter(m=>String(m.status).toLowerCase().includes('pend')).length;
    const regimes = (clients||[]).reduce((a,c)=>{a[c.regime]=(a[c.regime]||0)+1;return a;},{});
    const status = monthlyRows.reduce((a,m)=>{a[m.status]=(a[m.status]||0)+1;return a;},{});
    return {fat,das,pend,regimes,status};
  },[clients,monthlyRows]);

  const colors = ['#2563eb','#8b5cf6','#f59e0b','#10b981','#ef4444'];
  const regimeData = Object.entries(totals.regimes).map(([name,value],i)=>({name,value,color:colors[i%colors.length]}));
  const statusData = Object.entries(totals.status).map(([name,value])=>({name,value}));
  const areaData = MESES.map(m=>({m:m.slice(0,3), v:monthlyRows.filter(x=>x.mes===m).reduce((s,x)=>s+x.faturamento,0)}));

  if(!logged) return <div className='login-shell'><section className='login-brand'><div className='brand-box'>S</div><h1>Sempre Assessoria Contábil</h1><p>Sistema de Gestão Contábil 2026.</p></section><section className='login-panel'><Card className='login-card'><h2>Entrar</h2><p>Anderson ou Ana Paula</p><Input defaultValue='contato@sempreassessoriacontabil.com.br'/><Input placeholder='Senha' type='password'/><Button onClick={()=>setLogged(true)}>Acessar sistema</Button><small><ShieldCheck size={14}/> Sistema seguro via SSL/Supabase.</small></Card></section></div>;

  const nav = [['Dashboard',Home],['Painel MEI',Users],['Simples Nacional',Users],['Lucro Presumido',Users],['Financeiro',DollarSign],['Tabela Geral',FileText],['Configurações',Settings]];
  
  return <div className={`app ${dark?'dark':''}`}>
    <input ref={fileRef} type='file' accept='.xlsx,.xls,.csv' onChange={handleExcelImport} hidden />
    <aside className={`sidebar ${open?'open':'closed'}`}>
      <div className='side-head'>{open && <><div className='side-logo'>S</div><div><strong>Sempre</strong><span>Assessoria Contábil</span></div></>}<button onClick={()=>setOpen(!open)}><Menu size={18}/></button></div>
      <nav>{nav.map(([n,I])=><button key={n} onClick={()=>setPage(n)} className={page===n?'active':''}><I size={18}/>{open&&<span>{n}</span>}</button>)}</nav>
      {open && <div className='client-folders'><p>CLIENTES POR REGIME</p>{byRegime.map(g=><div key={g.regime} className='folder'><button className='folder-btn' onClick={()=>setExpanded({...expanded,[g.regime]:!expanded[g.regime]})}><span>{g.regime} <b>{g.items.length}</b></span><ChevronDown size={14}/></button>{expanded[g.regime] && <div className='folder-list'>{g.items.map(c=><button key={c.nome} onClick={()=>setSelected(c)}>• {c.nome}</button>)}</div>}</div>)}</div>}
      <footer><button onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>} {open&&<span>{dark?'Tema claro':'Tema escuro'}</span>}</button><button onClick={()=>setLogged(false)}><LogOut size={18}/> {open&&<span>Sair</span>}</button></footer>
    </aside>
    <main>
      <header className='topbar'><div><h1>{page}</h1><p>Sempre Assessoria Contábil · {loadingDb?'Sincronizando...':importInfo}</p></div><div className='actions'><Button onClick={()=>fileRef.current?.click()}><UploadCloud size={16}/> Importar Excel</Button><Button><Plus size={16}/> Novo Cliente</Button><Button variant='outline'>Exportar PDF</Button></div></header>
      
      {page==='Dashboard' && <><section className='kpis'>{[['Clientes',(clients||[]).length,'empresas cadastradas'],['Faturamento',br(totals.fat),'acumulado'],['Total DAS / Tributos',br(totals.das),'acumulado'],['Pendências',totals.pend,'lançamentos pendentes']].map(x=><Card key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small></Card>)}</section><section className='charts'><Card><h3>Clientes por Regime</h3><ResponsiveContainer width='100%' height={250}><PieChart><Pie data={regimeData} dataKey='value' innerRadius={58} outerRadius={95}>{regimeData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></Card><Card><h3>Status dos Clientes</h3><ResponsiveContainer width='100%' height={250}><BarChart data={statusData}><XAxis dataKey='name'/><YAxis/><Tooltip/><Bar dataKey='value' fill='#2563eb' radius={[10,10,0,0]}/></BarChart></ResponsiveContainer></Card><Card><h3>Faturamento por mês</h3><ResponsiveContainer width='100%' height={250}><AreaChart data={areaData}><XAxis dataKey='m'/><YAxis/><Tooltip/><Area dataKey='v' stroke='#2563eb' fill='#2563eb' fillOpacity={0.2}/></AreaChart></ResponsiveContainer></Card></section><TopClients clients={clients}/></>}
      {page==='Painel MEI' && <RegimePanel title='Painel MEI' rows={regimeFilterRows('MEI')} br={br}/>} 
      {page==='Simples Nacional' && <RegimePanel title='Simples Nacional' rows={regimeFilterRows('Simples Nacional')} br={br}/>} 
      {page==='Lucro Presumido' && <RegimePanel title='Lucro Presumido' rows={regimeFilterRows('Lucro Presumido')} br={br}/>} 
      {page==='Tabela Geral' && <ClientsTable clients={filtered} setQuery={setQuery} query={query} br={br} setSelected={setSelected}/>} 
      {page==='Financeiro' && <section className='kpis'>{[['Honorários (est.)',br(totals.fat*.08),'honorários base'],['Tributos',br(totals.das),'DAS/Guias'],['Pendências',totals.pend,'obrigações']].map(x=><Card key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small></Card>)}</section>}
      {page==='Configurações' && <Card><h3>Usuários</h3><p>Anderson · Admin · contato@sempreassessoriacontabil.com.br</p><p>Ana Paula · Operacional · ana@sempreassessoriacontabil.com.br</p></Card>}
    </main>
    {selected && <ClientModal client={selected} onClose={()=>setSelected(null)} br={br}/>} 
  </div>;
}

function TopClients({clients}){ const top=[...(clients||[])].sort((a,b)=>b.faturamento-a.faturamento).slice(0,10); return <Card className='table-card'><h3>Top 10 – Maior Faturamento</h3><table><thead><tr><th>Cliente</th><th>Regime</th><th>Faturamento</th><th>DAS / Tributos</th></tr></thead><tbody>{top.map(c=><tr key={c.nome}><td>{c.nome}</td><td>{c.regime}</td><td>{br(c.faturamento)}</td><td>{br(c.das)}</td></tr>)}</tbody></table></Card> }
function RegimePanel({title, rows, br}){ const total=rows.reduce((s,r)=>s+r.faturamento,0), das=rows.reduce((s,r)=>s+r.das,0); return <><section className='kpis'>{[['Lançamentos',rows.length,'linhas mensais'],['Faturamento',br(total),'período'],['DAS / Tributos',br(das),'período'],['INSS + FGTS',br(rows.reduce((s,r)=>s+r.inss+r.fgts,0)),'folha']].map(x=><Card key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small></Card>)}</section><Card className='table-card'><h3>{title}</h3><table><thead><tr><th>Cliente</th><th>Mês</th><th>Faturamento</th><th>DAS/Tributos</th><th>INSS</th><th>FGTS</th><th>Status</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.cliente+r.mes+i}><td>{r.cliente}</td><td>{r.mes}</td><td>{br(r.faturamento)}</td><td>{br(r.das)}</td><td>{br(r.inss)}</td><td>{br(r.fgts)}</td><td><span className='badge'>{r.status}</span></td></tr>)}</tbody></table></Card></> }
function ClientsTable({clients,query,setQuery,br,setSelected}){ return <Card className='table-card'><div className='table-head'><h3>Clientes Cadastrados</h3><div className='search'><Search size={16}/><Input placeholder='Procurar cliente...' value={query} onChange={e=>setQuery(e.target.value)}/></div></div><table><thead><tr><th>Cliente</th><th>Regime</th><th>Faturamento</th><th>Status</th><th>Ação</th></tr></thead><tbody>{(clients||[]).map(c=><tr key={c.nome}><td>{c.nome}</td><td>{c.regime}</td><td>{br(c.faturamento)}</td><td><span className='badge'>{c.status}</span></td><td><Button variant='outline' onClick={()=>setSelected(c)}><Eye size={14}/> Abrir</Button></td></tr>)}</tbody></table></Card> }
function ClientModal({client,onClose,br}){ return <div className='modal-bg'><div className='modal'><div className='modal-head'><div><h2>{client.nome}</h2><p>{client.regime}</p></div><button onClick={onClose}>×</button></div><section className='kpis mini'>{[['Faturamento',br(client.faturamento)],['Tributos',br(client.das)],['Status',client.status]].map(x=><Card key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong></Card>)}</section><table><thead><tr><th>Mês</th><th>Faturamento</th><th>DAS/Tributos</th><th>INSS</th><th>FGTS</th><th>Status</th></tr></thead><tbody>{client.meses.map(m=><tr key={m.mes}><td>{m.mes}</td><td>{br(m.faturamento)}</td><td>{br(m.das)}</td><td>{br(m.inss)}</td><td>{br(m.fgts)}</td><td>{m.status}</td></tr>)}</tbody></table></div></div> }

createRoot(document.getElementById('root')).render(<App/>);
