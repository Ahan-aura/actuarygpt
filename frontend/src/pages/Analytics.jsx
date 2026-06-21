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
  BarChart as BarIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle
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

// Custom metrics data for Officer view
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

const incidentCitiesData = [
  { name: 'Pune', value: 38, color: '#6366f1' },
  { name: 'Mumbai', value: 27, color: '#a855f7' },
  { name: 'Delhi', value: 20, color: '#10b981' },
  { name: 'Bangalore', value: 15, color: '#f59e0b' },
  { name: 'Hyderabad', value: 10, color: '#ef4444' }
];

export default function Analytics({
  totalPolicies,
  totalPremiums,
  avgRiskClass,
  triageApprovalRate,
  pendingApps = [],
  pendingVehicleApps = [],
  processedApps = [],
  isCustomerView = false
}) {
  const totalClaimsCount = (processedApps?.length || 0) + pendingApps.length + pendingVehicleApps.length;
  const approvedCount = processedApps?.filter(app => app.status === 'approved').length || 0;
  const rejectedCount = processedApps?.filter(app => app.status === 'rejected').length || 0;
  
  const manualReviewCount = pendingApps.filter(app => app.underwriting_decision === 'Referred for Manual Underwriting').length + 
                             pendingVehicleApps.filter(app => app.underwriting_decision === 'Referred for Manual Underwriting').length;

  const fraudClaimsCount = processedApps?.filter(app => app.insurance_type === 'Vehicle' && app.fraud_reported === 'Y').length || 0;
  const totalVehicleClaims = processedApps?.filter(app => app.insurance_type === 'Vehicle').length + pendingVehicleApps.length;
  const fraudRate = totalVehicleClaims > 0 ? Math.round((fraudClaimsCount / totalVehicleClaims) * 100) : 6;

  const approvedClaims = processedApps?.filter(app => app.status === 'approved') || [];
  const claimAmounts = approvedClaims.map(app => app.insurance_type === 'Vehicle' ? (app.total_claim_amount || 0) : (app.coverage_amount || 0));
  const totalClaimAmount = claimAmounts.reduce((sum, amt) => sum + amt, 0);
  const avgClaimValue = approvedClaims.length > 0 ? Math.round(totalClaimAmount / approvedClaims.length) : 84000;

  // RENDER CUSTOMER-Appropriate Personal Dashboard
  if (isCustomerView) {
    return (
      <div className="officer-analytics-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)', margin: 0 }}>
          My Portfolio Analytics & Summaries
        </h3>
        
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          
          {/* My Applications */}
          <div className="stat-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'center' }}>
            <div className="stat-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
              <FileSpreadsheet size={20} />
            </div>
            <div className="stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>My Applications</span>
              <span className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-title)' }}>{totalPolicies}</span>
            </div>
          </div>

          {/* Annualized Premium */}
          <div className="stat-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'center' }}>
            <div className="stat-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--risk-low)' }}>
              <DollarSign size={20} />
            </div>
            <div className="stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annualized Premium</span>
              <span className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-title)' }}>₹{totalPremiums?.toLocaleString()}</span>
            </div>
          </div>

        </div>

        <div className="glass-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--risk-low)' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)', margin: 0 }}>Portfolio Security Overview</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px', margin: 0, lineHeight: 1.5 }}>
            Your submitted insurance policies and claims are safely queued in the ActuaryGPT automated underwriting database. Standard risk dashboards and fraud metrics are restricted to underwriting officers.
          </p>
        </div>
      </div>
    );
  }

  // RENDER OFFICER Global Analytics Dashboard
  return (
    <div className="officer-analytics-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 6 METRICS CARDS */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        
        {/* Total Claims */}
        <div className="stat-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'center' }}>
          <div className="stat-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <FileSpreadsheet size={20} />
          </div>
          <div className="stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Claims</span>
            <span className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-title)' }}>{totalClaimsCount}</span>
          </div>
        </div>

        {/* Approved */}
        <div className="stat-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'center' }}>
          <div className="stat-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--risk-low)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved</span>
            <span className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-title)' }}>{totalPolicies}</span>
          </div>
        </div>

        {/* Rejected */}
        <div className="stat-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'center' }}>
          <div className="stat-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--risk-high)' }}>
            <XCircle size={20} />
          </div>
          <div className="stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rejected</span>
            <span className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-title)' }}>{rejectedCount}</span>
          </div>
        </div>

        {/* Manual Review */}
        <div className="stat-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'center' }}>
          <div className="stat-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--risk-medium)' }}>
            <Activity size={20} />
          </div>
          <div className="stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manual Review</span>
            <span className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-title)' }}>{manualReviewCount}</span>
          </div>
        </div>

        {/* Fraud Rate */}
        <div className="stat-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'center' }}>
          <div className="stat-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--risk-high)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fraud Rate</span>
            <span className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-title)' }}>{fraudRate}%</span>
          </div>
        </div>

        {/* Average Claim */}
        <div className="stat-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', alignItems: 'center' }}>
          <div className="stat-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--risk-low)' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Claim</span>
            <span className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-title)' }}>₹{avgClaimValue.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Claims by Month */}
        <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0 }}>
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
        <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0 }}>
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

        {/* Vehicle Brands */}
        <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0 }}>
            <Car size={18} style={{ color: 'var(--secondary)' }} />
            Vehicle Brands
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
        <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0 }}>
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

        {/* Incident Cities */}
        <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0 }}>
            <PieIcon size={18} style={{ color: 'var(--primary)' }} />
            Incident Cities
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center', marginTop: '1rem' }}>
            <div className="chart-container" style={{ minHeight: '240px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={incidentCitiesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {incidentCitiesData.map((entry, index) => (
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
              {incidentCitiesData.map((item, idx) => (
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
