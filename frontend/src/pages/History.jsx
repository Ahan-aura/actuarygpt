import React, { useState } from 'react';
import { History, ClipboardList, Car, UserCheck, Download } from 'lucide-react';
import { downloadPDF } from '../utils/download';

export default function HistoryPage({ 
  processedApps = [], 
  processedVehicleApps = [], 
  API_BASE,
  onViewApp
}) {
  const [subTab, setSubTab] = useState('life'); // 'life' or 'vehicle'

  return (
    <div className="glass-card analytics-full-width animate-fade-in">
      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} style={{ color: 'var(--primary)' }} />
          Processed Transactions Ledger
        </div>
        
        {/* Sub-tab selector */}
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
          <button 
            className={`btn-${subTab === 'life' ? 'primary' : 'secondary'}`} 
            onClick={() => setSubTab('life')}
            style={{ padding: '0.35rem 1rem' }}
          >
            <UserCheck size={14} style={{ marginRight: '0.25rem', display: 'inline', verticalAlign: 'middle' }} />
            Life & Health
          </button>
          <button 
            className={`btn-${subTab === 'vehicle' ? 'primary' : 'secondary'}`} 
            onClick={() => setSubTab('vehicle')}
            style={{ padding: '0.35rem 1rem' }}
          >
            <Car size={14} style={{ marginRight: '0.25rem', display: 'inline', verticalAlign: 'middle' }} />
            Vehicle Claims
          </button>
        </div>
      </h3>

      {subTab === 'life' ? (
        <div className="portfolio-table-wrapper">
          {processedApps.length === 0 ? (
            <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No processed Life or Health policies found.
            </div>
          ) : (
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Customer</th>
                  <th>Fraud Score</th>
                  <th>Decision</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedApps.map(p => {
                  const fraudScore = p.confidence ? `${Math.round(p.confidence)}%` : (p.risk_category || 'N/A');
                  const decision = p.underwriting_decision || p.status;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{p.id}</td>
                      <td>{p.client}</td>
                      <td>{fraudScore}</td>
                      <td>
                        <span className={`status-badge ${p.status}`} style={{ textTransform: 'capitalize' }}>
                          {decision}
                        </span>
                      </td>
                      <td>{p.date}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => onViewApp && onViewApp(p)}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)', cursor: 'pointer' }}
                          >
                            View
                          </button>
                          {p.pdf_url ? (
                            <button
                              onClick={() => downloadPDF(`${API_BASE}${p.pdf_url}`)}
                              className="btn-secondary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)', cursor: 'pointer' }}
                            >
                              Download
                            </button>
                          ) : null}
                          <button
                            onClick={() => onViewApp && onViewApp(p, true)}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)', cursor: 'pointer' }}
                          >
                            Analyze Again
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="portfolio-table-wrapper">
          {processedVehicleApps.length === 0 ? (
            <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No processed Vehicle Claims found.
            </div>
          ) : (
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Customer</th>
                  <th>Fraud Score</th>
                  <th>Decision</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedVehicleApps.map(p => {
                  const fraudScore = p.confidence ? `${Math.round(p.confidence)}%` : 'N/A';
                  const decision = p.underwriting_decision || p.status;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{p.id}</td>
                      <td>{p.client}</td>
                      <td>{fraudScore}</td>
                      <td>
                        <span className={`status-badge ${p.status}`} style={{ textTransform: 'capitalize' }}>
                          {decision}
                        </span>
                      </td>
                      <td>{p.date}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => onViewApp && onViewApp(p)}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)', cursor: 'pointer' }}
                          >
                            View
                          </button>
                          {p.pdf_url ? (
                            <button
                              onClick={() => downloadPDF(`${API_BASE}${p.pdf_url}`)}
                              className="btn-secondary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)', cursor: 'pointer' }}
                            >
                              Download
                            </button>
                          ) : null}
                          <button
                            onClick={() => onViewApp && onViewApp(p, true)}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', border: '1px solid var(--border)', cursor: 'pointer' }}
                          >
                            Analyze Again
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
