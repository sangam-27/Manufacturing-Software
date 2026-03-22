import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { reportsAPI } from '../services/api';
import { Icon, KpiCard, Skeleton, fmt } from '../components/ui';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const NOW = new Date();

function exportCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
}

export default function ReportsPage() {
  const [tab,      setTab]     = useState('gst');        // gst | financial
  const [gstMonth, setGstMonth] = useState(NOW.getMonth() + 1);
  const [gstYear,  setGstYear]  = useState(NOW.getFullYear());
  const [finYear,  setFinYear]  = useState(NOW.getFullYear());
  const [gstData,  setGstData]  = useState(null);
  const [finData,  setFinData]  = useState(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (tab === 'gst')       loadGST();
    if (tab === 'financial') loadFinancial();
  }, [tab, gstMonth, gstYear, finYear]);

  const loadGST = async () => {
    setLoading(true);
    try {
      const { data } = await reportsAPI.getGST({ month: gstMonth, year: gstYear });
      setGstData(data.data);
    } catch { toast.error('Failed to load GST report'); }
    finally { setLoading(false); }
  };

  const loadFinancial = async () => {
    setLoading(true);
    try {
      const { data } = await reportsAPI.getFinancial({ year: finYear });
      setFinData(data.data);
    } catch { toast.error('Failed to load financial report'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">GST reports, P&L, and financial analytics</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, borderBottom:'1px solid var(--border)' }}>
        {[
          { id:'gst',       label:'GST Report',          icon:'billing' },
          { id:'financial', label:'Financial Analytics',  icon:'chart' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="btn btn-ghost"
            style={{ borderBottom: tab===t.id ? '2px solid var(--primary)' : '2px solid transparent',
                     borderRadius:0, color: tab===t.id ? 'var(--primary)' : 'var(--text-secondary)',
                     paddingBottom:12, fontWeight: tab===t.id ? 600 : 400 }}>
            <Icon name={t.icon} size={15}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── GST Tab ── */}
      {tab === 'gst' && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <select className="input" style={{width:140}} value={gstMonth} onChange={e => setGstMonth(Number(e.target.value))}>
              {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="input" style={{width:100}} value={gstYear} onChange={e => setGstYear(Number(e.target.value))}>
              {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={loadGST}><Icon name="refresh" size={14}/>Refresh</button>
            {gstData && (
              <button className="btn btn-secondary" style={{marginLeft:'auto'}}
                onClick={() => exportCSV(gstData.b2bInvoices, `GST_${MONTHS[gstMonth-1]}_${gstYear}.csv`)}>
                <Icon name="download" size={14}/>Export CSV
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid-4 mb-6">{[0,1,2,3].map(i => <Skeleton key={i} height={100}/>)}</div>
          ) : gstData ? (
            <>
              {/* KPI Cards */}
              <div className="grid-4 mb-6">
                <KpiCard label="Output Tax (Sales)" value={fmt.currency(gstData.summary.outputTax)} icon="trending_up" iconColor="var(--success)" iconBg="var(--success-light)"/>
                <KpiCard label="Input Tax Credit"   value={fmt.currency(gstData.summary.inputTax)}  icon="download"    iconColor="var(--primary)" iconBg="var(--primary-light)"/>
                <KpiCard label="Net GST Payable"    value={fmt.currency(gstData.summary.netGSTPayable)} icon="dollar" iconColor={gstData.summary.netGSTPayable>0?'var(--warning)':'var(--success)'} iconBg={gstData.summary.netGSTPayable>0?'var(--warning-light)':'var(--success-light)'}/>
                <KpiCard label="Total Invoices"     value={gstData.summary.totalInvoices}           icon="billing"     iconColor="var(--purple)"  iconBg="var(--purple-light)"/>
              </div>

              <div className="grid-2 mb-6">
                {/* Tax breakdown by rate */}
                <div className="card card-p">
                  <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>GST Rate-wise Breakup</div>
                  {gstData.salesByRate.length === 0 ? (
                    <div style={{color:'var(--text-muted)',fontSize:13}}>No sales this period</div>
                  ) : (
                    <table style={{width:'100%',fontSize:13}}>
                      <thead>
                        <tr style={{borderBottom:'1px solid var(--border)'}}>
                          {['Rate','Taxable Amt','CGST','SGST','Total','Invoices'].map(h => (
                            <th key={h} style={{padding:'8px 6px',textAlign:'right',fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.03em',whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gstData.salesByRate.map((row,i) => (
                          <tr key={i} style={{borderBottom:'1px solid var(--border-light)'}}>
                            <td style={{padding:'10px 6px',fontWeight:600,textAlign:'right'}}>{row.rate}%</td>
                            <td style={{padding:'10px 6px',textAlign:'right'}}>{fmt.currency(row.taxable)}</td>
                            <td style={{padding:'10px 6px',textAlign:'right'}}>{fmt.currency(row.cgst)}</td>
                            <td style={{padding:'10px 6px',textAlign:'right'}}>{fmt.currency(row.sgst)}</td>
                            <td style={{padding:'10px 6px',textAlign:'right',fontWeight:600}}>{fmt.currency(row.total)}</td>
                            <td style={{padding:'10px 6px',textAlign:'right',color:'var(--text-secondary)'}}>{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Monthly trend chart */}
                <div className="card card-p">
                  <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>6-Month Revenue Trend</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={gstData.monthlyTrend.map(d => ({
                      month: MONTHS[(d._id.month||1)-1],
                      revenue: Math.round(d.revenue),
                      gst: Math.round(d.gst),
                    }))}>
                      <defs>
                        <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false}/>
                      <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--text-muted)'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                      <Tooltip formatter={v=>[fmt.currency(v)]} contentStyle={{fontSize:12,borderRadius:8,border:'1px solid var(--border)'}}/>
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revG)"/>
                      <Line type="monotone" dataKey="gst" name="GST" stroke="#F79009" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GSTR-1 B2B Invoice List */}
              <div className="card mb-6">
                <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontWeight:700,fontSize:14}}>B2B Invoice Register (GSTR-1)</div>
                  <span style={{fontSize:12.5,color:'var(--text-secondary)'}}>{gstData.b2bInvoices.length} invoices</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice No.</th><th>Date</th><th>Party</th><th>GST No.</th>
                        <th style={{textAlign:'right'}}>Taxable</th>
                        <th style={{textAlign:'right'}}>CGST</th>
                        <th style={{textAlign:'right'}}>SGST</th>
                        <th style={{textAlign:'right'}}>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstData.b2bInvoices.length === 0 ? (
                        <tr><td colSpan={9} style={{textAlign:'center',padding:'32px',color:'var(--text-muted)',fontSize:13}}>No invoices for this period</td></tr>
                      ) : gstData.b2bInvoices.map((inv,i) => (
                        <tr key={i}>
                          <td><span className="mono">{inv.invoiceNumber}</span></td>
                          <td style={{fontSize:12.5,color:'var(--text-secondary)'}}>{fmt.date(inv.invoiceDate)}</td>
                          <td style={{fontWeight:500}}>{inv.client}</td>
                          <td style={{fontSize:12,color:'var(--text-muted)'}}>{inv.clientGST||'—'}</td>
                          <td style={{textAlign:'right'}}>{fmt.currency(inv.taxable)}</td>
                          <td style={{textAlign:'right',color:'var(--text-secondary)'}}>{fmt.currency(inv.cgst)}</td>
                          <td style={{textAlign:'right',color:'var(--text-secondary)'}}>{fmt.currency(inv.sgst)}</td>
                          <td style={{textAlign:'right',fontWeight:600}}>{fmt.currency(inv.total)}</td>
                          <td>
                            <span className={`badge ${inv.status==='paid'?'badge-success':inv.status==='overdue'?'badge-danger':'badge-warning'}`}>
                              <span className="badge-dot"/>{inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Financial Tab ── */}
      {tab === 'financial' && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <select className="input" style={{width:100}} value={finYear} onChange={e => setFinYear(Number(e.target.value))}>
              {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={loadFinancial}><Icon name="refresh" size={14}/>Refresh</button>
            {finData && (
              <button className="btn btn-secondary" style={{marginLeft:'auto'}}
                onClick={() => exportCSV(finData.monthly, `P&L_${finYear}.csv`)}>
                <Icon name="download" size={14}/>Export P&L
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid-4 mb-6">{[0,1,2,3].map(i=><Skeleton key={i} height={100}/>)}</div>
          ) : finData ? (
            <>
              <div className="grid-4 mb-6">
                <KpiCard label="Total Revenue"    value={fmt.currency(finData.annual.revenue)}     icon="trending_up" iconColor="var(--success)"  iconBg="var(--success-light)"/>
                <KpiCard label="Total Purchases"  value={fmt.currency(finData.annual.purchases)}   icon="package"     iconColor="var(--warning)"  iconBg="var(--warning-light)"/>
                <KpiCard label="Gross Profit"     value={fmt.currency(finData.annual.grossProfit)} icon="dollar"      iconColor="var(--primary)"  iconBg="var(--primary-light)"/>
                <KpiCard label="Gross Margin"     value={`${finData.annual.grossMargin}%`}          icon="chart"       iconColor="var(--purple)"   iconBg="var(--purple-light)"/>
              </div>

              {/* Monthly P&L Chart */}
              <div className="card card-p mb-6">
                <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>Monthly Revenue vs Purchases ({finYear})</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={finData.monthly} margin={{top:5,right:5,left:0,bottom:0}} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false}/>
                    <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--text-muted)'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:11,fill:'var(--text-muted)'}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                    <Tooltip formatter={v=>[fmt.currency(v)]} contentStyle={{fontSize:12,borderRadius:8,border:'1px solid var(--border)'}}/>
                    <Legend wrapperStyle={{fontSize:12}}/>
                    <Bar dataKey="revenue"   name="Revenue"   fill="#2563EB" radius={[3,3,0,0]}/>
                    <Bar dataKey="purchases" name="Purchases" fill="#F79009" radius={[3,3,0,0]}/>
                    <Bar dataKey="grossProfit" name="Gross Profit" fill="#12B76A" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid-2 mb-6">
                {/* Top Products */}
                <div className="card card-p">
                  <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>Top 10 Products by Revenue</div>
                  {finData.topProducts.map((p,i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid var(--border-light)'}}>
                      <div style={{width:20,height:20,borderRadius:6,background:'var(--primary-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--primary)',flexShrink:0}}>{i+1}</div>
                      <div style={{flex:1,fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p._id || 'Unknown'}</div>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--success)',flexShrink:0}}>{fmt.currency(p.revenue)}</div>
                    </div>
                  ))}
                  {finData.topProducts.length === 0 && <div style={{color:'var(--text-muted)',fontSize:13}}>No data</div>}
                </div>

                {/* Top Clients */}
                <div className="card card-p">
                  <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>Top 10 Clients by Revenue</div>
                  {finData.topClients.map((c,i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid var(--border-light)'}}>
                      <div style={{width:20,height:20,borderRadius:6,background:'var(--purple-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'var(--purple)',flexShrink:0}}>{i+1}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500}}>{c._id}</div>
                        <div style={{fontSize:11.5,color:'var(--text-muted)'}}>{c.invoices} invoice{c.invoices!==1?'s':''}</div>
                      </div>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--success)',flexShrink:0}}>{fmt.currency(c.revenue)}</div>
                    </div>
                  ))}
                  {finData.topClients.length === 0 && <div style={{color:'var(--text-muted)',fontSize:13}}>No data</div>}
                </div>
              </div>

              {/* Monthly P&L table */}
              <div className="card">
                <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:14}}>Monthly P&L Statement — {finYear}</div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th style={{textAlign:'right'}}>Revenue</th>
                        <th style={{textAlign:'right'}}>Purchases</th>
                        <th style={{textAlign:'right'}}>Gross Profit</th>
                        <th style={{textAlign:'right'}}>Margin %</th>
                        <th style={{textAlign:'right'}}>Invoices</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finData.monthly.map((m,i) => (
                        <tr key={i}>
                          <td style={{fontWeight:500}}>{m.month}</td>
                          <td style={{textAlign:'right',fontWeight:500}}>{fmt.currency(m.revenue)}</td>
                          <td style={{textAlign:'right',color:'var(--text-secondary)'}}>{fmt.currency(m.purchases)}</td>
                          <td style={{textAlign:'right',fontWeight:600,color:m.grossProfit>=0?'var(--success)':'var(--danger)'}}>{fmt.currency(m.grossProfit)}</td>
                          <td style={{textAlign:'right'}}>
                            <span className={`badge ${m.grossMargin>=30?'badge-success':m.grossMargin>=10?'badge-warning':'badge-danger'}`}>
                              {m.grossMargin}%
                            </span>
                          </td>
                          <td style={{textAlign:'right',color:'var(--text-secondary)'}}>{m.invoiceCount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{background:'var(--bg)',borderTop:'2px solid var(--border)'}}>
                        <td style={{padding:'12px 16px',fontWeight:700}}>Total</td>
                        <td style={{padding:'12px 16px',textAlign:'right',fontWeight:700}}>{fmt.currency(finData.annual.revenue)}</td>
                        <td style={{padding:'12px 16px',textAlign:'right',fontWeight:700}}>{fmt.currency(finData.annual.purchases)}</td>
                        <td style={{padding:'12px 16px',textAlign:'right',fontWeight:700,color:finData.annual.grossProfit>=0?'var(--success)':'var(--danger)'}}>{fmt.currency(finData.annual.grossProfit)}</td>
                        <td style={{padding:'12px 16px',textAlign:'right'}}><span className="badge badge-primary">{finData.annual.grossMargin}%</span></td>
                        <td style={{padding:'12px 16px',textAlign:'right',fontWeight:700}}>{finData.monthly.reduce((s,m)=>s+m.invoiceCount,0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
