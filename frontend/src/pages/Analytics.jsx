import React from 'react';
import { 
  FileSpreadsheet, 
  DollarSign, 
  Activity, 
  UserCheck, 
  TrendingUp, 
  History,
  TrendingDown,
  Car,
  PieChart as PieIcon,
  BarChart as BarIcon
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
  Area,
  LineChart,
  Line
} from 'recharts';

// Custom metrics data
const claimsByMonthData = [
  { month: 'Jan', Claims: 45 },
  { month: 'Feb', Claims: 52 },
  { month: 'Mar', Claims: 68 },
  { month: 'Apr', Claims: 85 },
  { month: 'May', Claims: 94 },
  { month: 'Jun', Claims: 120 }
];

const fraudTrendData = [
  { month: 'Jan', 'Fraud Rate (%)': 4.2 },
  { month: 'Feb', 'Fraud Rate (%)': 4.8 },
  { month: 'Mar', 'Fraud Rate (%)': 5.5 },
  { month: 'Apr', 'Fraud Rate (%)': 6.1 },
  { month: 'May', 'Fraud Rate (%)': 5.9 },
  { month: 'Jun', 'Fraud Rate (%)': 6.0 }
];

const topVehicleBrandsData = [
  { brand: 'Hyundai', Claims: 32 },
  { brand: 'Maruti', Claims: 28 },
  { brand: 'Tata', Claims: 25 },
  { brand: 'Mahindra', Claims: 22 },
  { brand: 'Honda', Claims: 18 }
];

const claimAmountDistributionData = [
  { range: 'Under ₹25k', 'Claims Count': 40 },
  { range: '₹25k-50k', 'Claims Count': 65 },
  { range: '₹50k-1L', 'Claims Count': 95 },
  { range: '₹1L-2L', 'Claims Count': 50 },
  { range: 'Over ₹2L', 'Claims Count': 20 }
];

const commonAccidentTypesData = [
  { name: 'Single Collision', value: 55, color: '#6366f1' },
  { name: 'Multi Collision', value: 35, color: '#a855f7' },
  { name: 'Parked Car', value: 18, color: '#10b981' },
  { name: 'Theft', value: 8, color: '#ef4444' }
];

export default function Analytics({
  totalPolicies,
  totalPremiums,
  avgRiskClass,
  triageApprovalRate
}) {
  return (
    <div className="officer-analytics-view animate-fade-in">
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <FileSpreadsheet size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Claims Processed</span>
            <span className="stat-value">152</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--risk-low)' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Claim Volume</span>
            <span className="stat-value">₹1,27,68,000</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--risk-medium)' }}>
            <Activity size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Average Risk Index</span>
            <span className="stat-value">Class 3.2</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
            <UserCheck size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Underwriting Approval Rate</span>
            <span className="stat-value">82.8%</span>
          </div>
        </div>
      </div>

      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Claims by Month */}
        <div className="glass-card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            Claims by Month
          </h3>
          <div className="chart-container" style={{ minHeight: '260px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={claimsByMonthData}>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                  labelStyle={{ fontWeight: 600, color: 'var(--text-title)' }}
                />
                <Area type="monotone" dataKey="Claims" stroke="var(--primary)" fill="rgba(99, 102, 241, 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Trend */}
        <div className="glass-card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <TrendingDown size={18} style={{ color: 'var(--risk-high)' }} />
            Fraud Trend
          </h3>
          <div className="chart-container" style={{ minHeight: '260px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={fraudTrendData}>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                  labelStyle={{ fontWeight: 600, color: 'var(--text-title)' }}
                />
                <Line type="monotone" dataKey="Fraud Rate (%)" stroke="var(--risk-high)" strokeWidth={3} dot={{ fill: 'var(--risk-high)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vehicle Brands */}
        <div className="glass-card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <Car size={18} style={{ color: 'var(--secondary)' }} />
            Top Vehicle Brands Awaiting Claims
          </h3>
          <div className="chart-container" style={{ minHeight: '260px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topVehicleBrandsData} layout="vertical">
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis dataKey="brand" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                />
                <Bar dataKey="Claims" fill="var(--secondary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Claim Amount Distribution */}
        <div className="glass-card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <BarIcon size={18} style={{ color: 'var(--primary)' }} />
            Claim Amount Distribution
          </h3>
          <div className="chart-container" style={{ minHeight: '260px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={claimAmountDistributionData}>
                <XAxis dataKey="range" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                />
                <Bar dataKey="Claims Count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Common Accident Types */}
        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <PieIcon size={18} style={{ color: 'var(--primary)' }} />
            Most Common Accident Types
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center', marginTop: '1rem' }}>
            <div className="chart-container" style={{ minHeight: '240px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={commonAccidentTypesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {commonAccidentTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {commonAccidentTypesData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '3px', backgroundColor: item.color }} />
                  <span style={{ color: 'var(--text-main)', flex: 1 }}>{item.name}</span>
                  <b style={{ color: 'var(--text-title)' }}>{item.value}%</b>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
