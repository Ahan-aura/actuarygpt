import React, { useState } from 'react';
import { History, ClipboardList, Car, UserCheck, Download } from 'lucide-react';
import { downloadPDF } from '../utils/download';

export default function HistoryPage({ 
  processedApps = [], 
  processedVehicleApps = [], 
  API_BASE 
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
                  <th>ID</th>
                  <th>Applicant Name</th>
                  <th>Type</th>
                  <th>Coverage Amount</th>
                  <th>Risk Class</th>
                  <th>Risk Category</th>
                  <th>Calculated Premium</th>
                  <th>Review Status</th>
                  <th>Date</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {processedApps.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{p.id}</td>
                    <td>{p.client}</td>
                    <td>{p.insurance_type}</td>
                    <td>₹{p.coverage_amount?.toLocaleString()}</td>
                    <td>{p.risk_class ? `Class ${p.risk_class}` : 'N/A'}</td>
                    <td>
                      {p.risk_category ? (
                        <span className={`risk-badge ${p.risk_category.toLowerCase().replace(' ', '')}`}>
                          {p.risk_category}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{p.premium ? `₹${p.premium.toLocaleString()}` : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${p.status}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.date}</td>
                    <td>
                      {p.pdf_url ? (
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            downloadPDF(`${API_BASE}${p.pdf_url}`);
                          }}
                          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          PDF
                        </a>
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))}
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
                  <th>Vehicle</th>
                  <th>Claim Amount</th>
                  <th>Fraud Classification</th>
                  <th>Fraud Score</th>
                  <th>Underwriter Decision</th>
                  <th>Date</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {processedVehicleApps.map(p => {
                  const isFraud = p.fraud_reported === 'Y';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{p.id}</td>
                      <td>{p.client}</td>
                      <td>{p.auto_make} {p.auto_model} ({p.auto_year})</td>
                      <td style={{ fontWeight: 600 }}>₹{p.total_claim_amount?.toLocaleString()}</td>
                      <td>
                        {p.fraud_reported ? (
                          <span className={`risk-badge ${isFraud ? 'high' : 'low'}`} style={{ backgroundColor: isFraud ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)', color: isFraud ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                            {isFraud ? 'Flagged Fraud' : 'Verified OK'}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td>{p.confidence ? `${p.confidence}%` : 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${p.status}`}>
                          {p.status === 'pending' && p.underwriting_decision === 'Referred for Manual Underwriting' 
                            ? 'Referred' 
                            : p.status}
                        </span>
                      </td>
                      <td>{p.date}</td>
                      <td>
                        {p.pdf_url ? (
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              downloadPDF(`${API_BASE}${p.pdf_url}`);
                            }}
                            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                          >
                            PDF
                          </a>
                        ) : 'N/A'}
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
