import React from 'react';
import { 
  FileSpreadsheet, 
  DollarSign, 
  Activity, 
  UserCheck, 
  Users, 
  TrendingUp, 
  History 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';

export default function Analytics({
  totalPolicies,
  totalPremiums,
  avgRiskClass,
  triageApprovalRate,
  riskChartData = [],
  typeChartData = [],
  premiumTrendData = []
}) {
  return (
    <div className="officer-analytics-view animate-fade-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <FileSpreadsheet size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Approved Policies</span>
            <span className="stat-value">{totalPolicies}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--risk-low)' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Volume Pricing</span>
            <span className="stat-value">₹{totalPremiums.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--risk-medium)' }}>
            <Activity size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Average Risk Index</span>
            <span className="stat-value">Class {avgRiskClass}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
            <UserCheck size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Triage Approval Rate</span>
            <span className="stat-value">{triageApprovalRate}%</span>
          </div>
        </div>
      </div>

      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        <div className="glass-card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            Portfolio Classification Distribution
          </h3>
          <div className="chart-container" style={{ minHeight: '260px', marginTop: '1rem' }}>
            {riskChartData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No policies available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={riskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="custom-tooltip" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px' }}>
                            <p className="custom-tooltip-label" style={{ fontWeight: 600 }}>{payload[0].name}</p>
                            <p className="custom-tooltip-value">Count: {payload[0].value} Policies</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            Premiums Volume by Product Type
          </h3>
          <div className="chart-container" style={{ minHeight: '260px', marginTop: '1rem' }}>
            {typeChartData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No policies available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeChartData}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="custom-tooltip" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px' }}>
                            <p className="custom-tooltip-label" style={{ fontWeight: 600 }}>{payload[0].payload.name}</p>
                            <p className="custom-tooltip-value">Total: ₹{payload[0].value?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Premium" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card analytics-full-width" style={{ gridColumn: '1 / -1' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} style={{ color: 'var(--primary)' }} />
            Underwriting Ledger History
          </h3>
          <div className="chart-container" style={{ minHeight: '200px', marginTop: '1rem' }}>
            {premiumTrendData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No pricing trends data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={premiumTrendData}>
                  <XAxis dataKey="index" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="custom-tooltip" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '4px' }}>
                            <p className="custom-tooltip-label">{payload[0].payload.client}</p>
                            <p className="custom-tooltip-value">Premium: ₹{payload[0].value?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="premium" stroke="var(--secondary)" fill="rgba(168, 85, 247, 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
