import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  FileText, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  AlertTriangle, 
  DollarSign, 
  UserCheck, 
  Plus, 
  History,
  LogOut,
  User,
  Users2,
  FileSpreadsheet,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Send,
  Database,
  Search,
  Check,
  PlusCircle,
  HelpCircle,
  Bot
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
import './App.css';

const API_BASE = "https://actuarygpt-backend.onrender.com";

const DEFAULT_BLANK_FORM = {
  fullName: "",
  age: "",
  gender: "Male",
  occupation: "",
  income: "",
  email: "",
  phone: "",
  height: "",
  weight: "",
  bmi: 0,
  smoker: 0,
  alcohol: 0,
  exercise: 1, // 0 = Rarely, 1 = Weekly, 2 = Daily
  medicalConditions: "",
  insurance_type: "Life",
  coverage_amount: "",
  policyDuration: 10,
  previous_claims: 0, // 0, 1, 2
  family_history: 0,
  nomineeAge: "",
  product_info_2: "A1"
};

const getMatchingFeatures = (app, ref) => {
  if (!app || !ref) return "general profile features";
  const matches = [];
  if (app.smoker === ref.smoker) matches.push("Smoking Status (" + (app.smoker ? "Smoker" : "Non-smoker") + ")");
  if (app.bmi && ref.bmi && Math.abs(app.bmi - ref.bmi) < 2.0) matches.push(`BMI parity (diff < 2)`);
  if (app.previous_claims === ref.previous_claims) matches.push(`Claims History (${app.previous_claims} claims)`);
  if (app.family_history === ref.family_history) matches.push("Family History (" + (app.family_history ? "Yes" : "No") + ")");
  if (app.insurance_type === ref.insurance_type) matches.push(`Insurance Type (${app.insurance_type})`);
  if (app.age && ref.age && Math.abs(app.age - ref.age) < 0.1) matches.push(`Age bracket`);
  return matches.length > 0 ? matches.join(", ") : "general profile parameters";
};

function App({ user, handleLogout }) {
  // Application Data States (fetched from Real-time Backend)
  const [pendingApps, setPendingApps] = useState([]);
  const [customerSubmissions, setCustomerSubmissions] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);

  // Form State
  const [formData, setFormData] = useState(DEFAULT_BLANK_FORM);
  const [customerSuccessAlert, setCustomerSuccessAlert] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardResult, setWizardResult] = useState(null);
  const [wizardIsProcessing, setWizardIsProcessing] = useState(false);
  const [wizardStepsProgress, setWizardStepsProgress] = useState([
    { label: "Customer data validated", status: "pending" },
    { label: "BMI calculated", status: "pending" },
    { label: "Building feature vector", status: "pending" },
    { label: "Running CatBoost model", status: "pending" },
    { label: "Searching similar historical cases", status: "pending" },
    { label: "Calculating premium", status: "pending" },
    { label: "Generating actuarial explanation", status: "pending" },
    { label: "Creating underwriting recommendation", status: "pending" },
  ]);

  // Officer States
  const [selectedApp, setSelectedApp] = useState(null);
  const [officerTab, setOfficerTab] = useState('dashboard'); // Default to dashboard
  const [isLoading, setIsLoading] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [officerFormClient, setOfficerFormClient] = useState("");
  const [expandedSimCaseId, setExpandedSimCaseId] = useState(null);

  // Chat/Assistant States
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', content: 'Hello! I am your ActuaryGPT Underwriting Co-Pilot. How can I assist you with insurance evaluations, risk guidelines, or RAG reference database lookups today?' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [pipelineSteps, setPipelineSteps] = useState([
    { key: 'validation', label: '1. Validating Applicant Parameters', status: 'pending' },
    { key: 'preprocess', label: '2. Preprocessing & Padding Data (121 Features)', status: 'pending' },
    { key: 'predict', label: '3. Machine Learning Risk Classification Inference', status: 'pending' },
    { key: 'premium', label: '4. Rules-Engine Actuarial Premium Calculation', status: 'pending' },
    { key: 'gemini', label: '5. Running Actuarial Agent Gemini Explanation', status: 'pending' },
    { key: 'report', label: '6. Generating PDF Actuarial Report', status: 'pending' },
  ]);

  // Sync data automatically depending on active user and tab
  useEffect(() => {
    if (!user) return;

    if (user.role === 'customer') {
      fetchCustomerSubmissions();
      const interval = setInterval(fetchCustomerSubmissions, 5000);
      return () => clearInterval(interval);
    } else {
      // Sync pending queue & analytics in background for Officer
      fetchPendingApplications();
      fetchAnalytics();
      const interval = setInterval(() => {
        fetchPendingApplications();
        fetchAnalytics();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const onLogoutClick = () => {
    setFormData(DEFAULT_BLANK_FORM);
    setAgentResult(null);
    setSelectedApp(null);
    setBackendError(null);
    setOfficerFormClient("");
    setChatMessages([
      { role: 'model', content: 'Hello! I am your ActuaryGPT Underwriting Co-Pilot. How can I assist you with insurance evaluations or risk guidelines today?' }
    ]);
    handleLogout();
  };

  const isCustomer = user && user.role === 'customer';

  // API Call: Fetch Customer Personal Submissions
  const fetchCustomerSubmissions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/applications?client=${user.name}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerSubmissions(data);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  // API Call: Fetch Pending Officer Queue
  const fetchPendingApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/applications?status=pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingApps(data);
      }
    } catch (err) {
      console.error("Error fetching pending queue:", err);
    }
  };

  // API Call: Fetch Analytics and Approved/Declined list
  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/summary`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsSummary(data);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  // Recalculate BMI Helper when Height/Weight updates
  const handleSizeChange = (field, val) => {
    const numericVal = parseFloat(val) || "";
    const newFields = { ...formData, [field]: numericVal };
    if (field === 'height' || field === 'weight') {
      if (newFields.height && newFields.weight) {
        const h_m = parseFloat(newFields.height) / 100;
        const w_kg = parseFloat(newFields.weight);
        newFields.bmi = parseFloat((w_kg / (h_m * h_m)).toFixed(1));
      } else {
        newFields.bmi = 0;
      }
    }
    setFormData(newFields);
  };

  const handleInputChange = (field, val) => {
    const numFields = ['age', 'income', 'coverage_amount', 'smoker', 'previous_claims', 'family_history', 'exercise', 'alcohol'];
    let formattedVal = val;
    if (numFields.includes(field)) {
      formattedVal = val === "" ? "" : parseFloat(val);
    }
    setFormData(prev => ({ ...prev, [field]: formattedVal }));
  };

  // Customer: Submit New Application
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Reset wizard states
    setWizardIsProcessing(true);
    setWizardStep(4);
    setWizardResult(null);

    const steps = [
      "Customer data validated",
      "BMI calculated",
      "Building feature vector",
      "Running CatBoost model",
      "Searching similar historical cases",
      "Calculating premium",
      "Generating actuarial explanation",
      "Creating underwriting recommendation"
    ];

    setWizardStepsProgress(steps.map((label, idx) => ({
      label,
      status: idx === 0 ? "active" : "pending"
    })));

    const payload = {
      client: user.name,
      age: parseFloat(formData.age) || 0.45,
      height: parseFloat(formData.height) || 170.0,
      weight: parseFloat(formData.weight) || 70.0,
      bmi: parseFloat(formData.bmi) || 24.2,
      product_info_2: formData.product_info_2 || "A1",
      occupation: formData.occupation || "Engineer",
      income: parseFloat(formData.income) || 1000000.0,
      smoker: parseInt(formData.smoker) || 0,
      previous_claims: parseInt(formData.previous_claims) || 0,
      family_history: parseInt(formData.family_history) || 0,
      insurance_type: formData.insurance_type || "Life",
      coverage_amount: parseFloat(formData.coverage_amount) || 5000000.0,
      exercise: parseInt(formData.exercise) || 1,
      alcohol: parseInt(formData.alcohol) || 0,
      gender: formData.gender || "Male",
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      medical_conditions: formData.medicalConditions,
      policy_duration: parseInt(formData.policyDuration) || 10,
      nominee_age: parseInt(formData.nomineeAge) || 30
    };

    try {
      // 1. Submit Application
      const res = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to submit application");
      const newApp = await res.json();

      // 2. Start evaluation endpoint call
      const evalPromise = fetch(`${API_BASE}/applications/${newApp.id}/evaluate`, {
        method: "POST"
      }).then(r => {
        if (!r.ok) throw new Error("Agent analysis failed");
        return r.json();
      });

      // 3. Animate steps visual progress
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 350));
        setWizardStepsProgress(prev => prev.map((s, idx) => {
          if (idx === i) return { ...s, status: "completed" };
          if (idx === i + 1) return { ...s, status: "active" };
          return s;
        }));
      }

      // Wait for backend evaluation to complete
      const evalResult = await evalPromise;
      
      setWizardResult(evalResult);
      setWizardIsProcessing(false);
      
      // Delay slightly before showing Step 5 results
      await new Promise(r => setTimeout(r, 600));
      setWizardStep(5);
      fetchCustomerSubmissions();
    } catch (err) {
      console.error(err);
      alert(err.message);
      setWizardStep(3); // go back to review on failure
      setWizardIsProcessing(false);
    }
  };

  // Officer: Trigger AI Actuarial Agent Pipeline on Database Item
  const runActuarialAgent = async (application) => {
    setIsLoading(true);
    setAgentResult(null);
    setBackendError(null);

    // Reset pipeline steps
    setPipelineSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    // Step 1: Validation
    setPipelineSteps(prev => prev.map((s, idx) => idx === 0 ? { ...s, status: 'active' } : s));
    await new Promise(r => setTimeout(r, 600));
    setPipelineSteps(prev => prev.map((s, idx) => idx === 0 ? { ...s, status: 'completed' } : idx === 1 ? { ...s, status: 'active' } : s));

    // Step 2: Preprocess Mapping
    await new Promise(r => setTimeout(r, 600));
    setPipelineSteps(prev => prev.map((s, idx) => idx === 1 ? { ...s, status: 'completed' } : idx === 2 ? { ...s, status: 'active' } : s));

    try {
      const response = await fetch(`${API_BASE}/applications/${application.id}/evaluate`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`API evaluate returned status ${response.status}. Please check your backend logs.`);
      }

      const updatedResult = await response.json();

      // Step 4: Premium calculation
      setPipelineSteps(prev => prev.map((s, idx) => idx === 2 ? { ...s, status: 'completed' } : idx === 3 ? { ...s, status: 'active' } : s));
      await new Promise(r => setTimeout(r, 500));

      // Step 5: Gemini explanations
      setPipelineSteps(prev => prev.map((s, idx) => idx === 3 ? { ...s, status: 'completed' } : idx === 4 ? { ...s, status: 'active' } : s));
      await new Promise(r => setTimeout(r, 600));

      // Step 6: PDF Generation
      setPipelineSteps(prev => prev.map((s, idx) => idx === 4 ? { ...s, status: 'completed' } : idx === 5 ? { ...s, status: 'active' } : s));
      await new Promise(r => setTimeout(r, 500));
      setPipelineSteps(prev => prev.map(s => s.key === 'report' ? { ...s, status: 'completed' } : s));

      // Render evaluated outputs
      setAgentResult({
        risk_class: updatedResult.risk_class,
        risk_category: updatedResult.risk_category,
        premium: updatedResult.premium,
        report: updatedResult.report,
        pdf_url: updatedResult.pdf_url,
        underwriting_decision: updatedResult.underwriting_decision,
        confidence: updatedResult.confidence,
        similar_cases: updatedResult.similar_cases
      });

      // Synchronize list items
      fetchPendingApplications();
    } catch (err) {
      console.error(err);
      setBackendError(err.message);
      setPipelineSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'pending' } : s));
    } finally {
      setIsLoading(false);
    }
  };

  // Officer: Submit Approval/Rejection Decision to SQLite
  const handleOfficerDecision = async (decisionType) => {
    if (!selectedApp) return;

    try {
      const response = await fetch(`${API_BASE}/applications/${selectedApp.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: decisionType })
      });

      if (!response.ok) throw new Error("Failed to record sign-off decision");

      // Reset workstation states
      setSelectedApp(null);
      setAgentResult(null);
      
      // Refresh database items
      fetchPendingApplications();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // AI Assistant Chat Handler
  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    const contextPayload = selectedApp ? {
      client: selectedApp.client,
      age: selectedApp.age,
      height: selectedApp.height,
      weight: selectedApp.weight,
      bmi: selectedApp.bmi,
      product_info_2: selectedApp.product_info_2,
      occupation: selectedApp.occupation,
      income: selectedApp.income,
      smoker: selectedApp.smoker,
      previous_claims: selectedApp.previous_claims,
      family_history: selectedApp.family_history,
      insurance_type: selectedApp.insurance_type,
      coverage_amount: selectedApp.coverage_amount,
      exercise: selectedApp.exercise,
      alcohol: selectedApp.alcohol,
      gender: selectedApp.gender,
      risk_class: selectedApp.risk_class || null,
      risk_category: selectedApp.risk_category || null,
      premium: selectedApp.premium || null,
      underwriting_decision: selectedApp.underwriting_decision || null
    } : null;

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: chatMessages.slice(-10), // keep history light (last 10 turns)
          context: contextPayload
        })
      });

      if (!res.ok) throw new Error("Agent failed to respond.");

      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', content: "Failed to connect to ActuaryGPT agent server. Please confirm the backend server is running." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Recharts Chart formats
  const totalPolicies = analyticsSummary?.total_policies || 0;
  const totalPremiums = analyticsSummary?.total_premiums || 0;
  const avgRiskClass = analyticsSummary?.avg_risk_class || 0.0;
  const triageApprovalRate = analyticsSummary?.approval_rate || 0;

  const riskChartData = analyticsSummary?.risk_distribution ? [
    { name: 'Low Risk', value: analyticsSummary.risk_distribution['Low Risk'] || 0, color: '#10b981' },
    { name: 'Medium Risk', value: analyticsSummary.risk_distribution['Medium Risk'] || 0, color: '#f59e0b' },
    { name: 'High Risk', value: analyticsSummary.risk_distribution['High Risk'] || 0, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  const typeChartData = analyticsSummary?.type_premiums ? Object.keys(analyticsSummary.type_premiums).map(key => ({
    name: key,
    Premium: analyticsSummary.type_premiums[key]
  })) : [];

  const premiumTrendData = analyticsSummary?.ledger_history ? analyticsSummary.ledger_history.map((p, idx) => ({
    index: `P-${idx+1}`,
    premium: p.premium,
    client: p.client
  })) : [];

  // SUB-RENDER: Officer Dashboard Home
  const renderOfficerDashboard = () => (
    <div className="officer-dashboard-view animate-fade-in">
      <div className="welcome-banner">
        <h2>Underwriter Control Center</h2>
        <p>Real-time machine learning risk models and RAG case comparison database.</p>
      </div>

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
            <span className="stat-label">Total Premiums Booked</span>
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

      <div className="dashboard-double-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* System Health */}
        <div className="glass-card">
          <h3 className="card-title">
            <div className="card-title-left">
              <Database size={18} style={{ color: 'var(--primary)' }} />
              Actuarial System Status
            </div>
          </h3>
          <div className="system-status-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span>FastAPI Backend Server</span>
              <span className="status-indicator online" style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Online (Port 8000)</span>
            </div>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span>SQLite Reference Database</span>
              <span className="status-indicator online" style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Connected (actuary_gpt.db)</span>
            </div>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span>Gemini LLM Orchestrator</span>
              <span className="status-indicator online" style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Ready (gemini-2.5-flash)</span>
            </div>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CatBoost ML Predictor</span>
              <span className="status-indicator online" style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Loaded (risk_model.pkl)</span>
            </div>
          </div>
        </div>

        {/* Quick Triage queue summary */}
        <div className="glass-card">
          <h3 className="card-title">
            <div className="card-title-left">
              <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
              Awaiting Evaluation ({pendingApps.length} applications)
            </div>
          </h3>
          {pendingApps.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>All applications reviewed!</p>
          ) : (
            <div className="quick-queue-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {pendingApps.slice(0, 3).map(app => (
                <div 
                  key={app.id} 
                  className="quick-queue-item" 
                  onClick={() => setOfficerTab('triage')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-title)' }}>{app.client}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.insurance_type} Cover • Requested: ₹{app.coverage_amount?.toLocaleString()}</p>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Evaluate →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // SUB-RENDER: Officer New Application
  const handleOfficerNewAppSubmit = async (e) => {
    e.preventDefault();
    if (!officerFormClient.trim()) {
      alert("Please specify a Customer Username");
      return;
    }
    
    const payload = {
      client: officerFormClient.trim(),
      age: parseFloat(formData.age),
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      bmi: parseFloat(formData.bmi),
      product_info_2: formData.product_info_2,
      occupation: formData.occupation,
      income: parseFloat(formData.income),
      smoker: parseInt(formData.smoker),
      previous_claims: parseInt(formData.previous_claims),
      family_history: parseInt(formData.family_history),
      insurance_type: formData.insurance_type,
      coverage_amount: parseFloat(formData.coverage_amount),
      exercise: parseInt(formData.exercise),
      alcohol: parseInt(formData.alcohol),
      gender: formData.gender
    };

    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create application");

      setFormData(DEFAULT_BLANK_FORM);
      setOfficerFormClient("");
      alert("Application successfully submitted and added to the Triage Queue!");
      fetchPendingApplications();
      setOfficerTab('triage');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const renderOfficerNewApp = () => (
    <div className="glass-card officer-new-app-view animate-fade-in">
      <h3 className="card-title">
        <div className="card-title-left">
          <PlusCircle size={18} style={{ color: 'var(--primary)' }} />
          Create New Client Application Profile
        </div>
      </h3>

      <form className="customer-form" onSubmit={handleOfficerNewAppSubmit}>
        <div className="form-group">
          <label>Client Username (Must match a registered customer)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. customer1" 
            value={officerFormClient} 
            onChange={(e) => setOfficerFormClient(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Age (Normalized 0-1)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              max="1" 
              className="form-input" 
              placeholder="e.g. 0.45"
              value={formData.age} 
              onChange={(e) => handleInputChange('age', e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select 
              className="form-select" 
              value={formData.gender} 
              onChange={(e) => handleInputChange('gender', e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Height (cm)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 175"
              value={formData.height} 
              onChange={(e) => handleSizeChange('height', e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 70"
              value={formData.weight} 
              onChange={(e) => handleSizeChange('weight', e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Calculated BMI</label>
            <input 
              type="number" 
              className="form-input" 
              value={formData.bmi || ""} 
              placeholder="BMI auto-computed"
              disabled 
              style={{ opacity: 0.7, backgroundColor: 'rgba(0,0,0,0.1)' }} 
            />
          </div>
          <div className="form-group">
            <label>Product Category</label>
            <select 
              className="form-select" 
              value={formData.product_info_2} 
              onChange={(e) => handleInputChange('product_info_2', e.target.value)}
            >
              <option value="A1">A1 (Standard Short-Term)</option>
              <option value="D1">D1 (Preferred Multi-Benefit)</option>
              <option value="D2">D2 (Standard Joint Life)</option>
              <option value="E1">E1 (Special Substandard)</option>
            </select>
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Annual Income (INR/USD)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 800000"
              value={formData.income} 
              onChange={(e) => handleInputChange('income', e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Smoker Status</label>
            <select 
              className="form-select" 
              value={formData.smoker} 
              onChange={(e) => handleInputChange('smoker', e.target.value)}
            >
              <option value={0}>Non-Smoker</option>
              <option value={1}>Active Smoker</option>
            </select>
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Insurance Product</label>
            <select 
              className="form-select" 
              value={formData.insurance_type} 
              onChange={(e) => handleInputChange('insurance_type', e.target.value)}
            >
              <option value="Life">Term Life</option>
              <option value="Health">Comprehensive Health</option>
              <option value="Property">Commercial Property</option>
            </select>
          </div>
          <div className="form-group">
            <label>Requested Coverage</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 5000000"
              value={formData.coverage_amount} 
              onChange={(e) => handleInputChange('coverage_amount', e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Exercise Frequency (0-3)</label>
            <input 
              type="number" 
              min="0" 
              max="3" 
              className="form-input" 
              placeholder="e.g. 2"
              value={formData.exercise} 
              onChange={(e) => handleInputChange('exercise', e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Alcohol Intake (0-3)</label>
            <input 
              type="number" 
              min="0" 
              max="3" 
              className="form-input" 
              placeholder="e.g. 0"
              value={formData.alcohol} 
              onChange={(e) => handleInputChange('alcohol', e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Previous Claims Count</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 0"
              value={formData.previous_claims} 
              onChange={(e) => handleInputChange('previous_claims', e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Family Illness History</label>
            <select 
              className="form-select" 
              value={formData.family_history} 
              onChange={(e) => handleInputChange('family_history', e.target.value)}
            >
              <option value={0}>No Chronic History</option>
              <option value={1}>Chronic Family History</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Occupation</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. Software Engineer"
            value={formData.occupation} 
            onChange={(e) => handleInputChange('occupation', e.target.value)} 
            required 
          />
        </div>

        <button type="submit" className="btn-primary">
          <Sparkles size={18} />
          Create and Log Policy File
        </button>
      </form>
    </div>
  );

  // SUB-RENDER: Officer AI Assistant (Chatbot Widget)
  const renderOfficerAIAssistant = () => (
    <div className="glass-card ai-assistant-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '550px' }}>
      <h3 className="card-title" style={{ marginBottom: 0 }}>
        <div className="card-title-left">
          <Bot size={20} style={{ color: 'var(--secondary)' }} />
          ActuaryGPT Underwriting Co-Pilot
        </div>
        {selectedApp && (
          <span className="active-chat-context" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary-glow)', borderRadius: '4px' }}>
            Context: {selectedApp.client} ({selectedApp.id})
          </span>
        )}
      </h3>

      <div className="chat-messages-container" style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`chat-message-bubble ${msg.role}`} style={{ display: 'flex', flexDirection: 'column', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '12px', backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-input)', border: msg.role === 'user' ? 'none' : '1px solid var(--border)', color: 'var(--text-title)' }}>
            <div className="message-header" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
              {msg.role === 'model' ? 'AI Co-Pilot' : 'You'}
            </div>
            <div className="message-body" style={{ fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="chat-message-bubble model loading" style={{ display: 'flex', alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>
            <span className="loading-dots" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>AI Co-Pilot is thinking<span>.</span><span>.</span><span>.</span></span>
          </div>
        )}
      </div>

      <form className="chat-input-row" onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '0.75rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <input 
          type="text" 
          className="form-input chat-text-input" 
          placeholder="Ask questions about risk guidelines, portfolio metrics, or the active evaluation context..." 
          value={chatInput} 
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isChatLoading}
        />
        <button type="submit" className="btn-primary chat-send-btn" style={{ padding: '0.6rem 1.2rem' }} disabled={isChatLoading || !chatInput.trim()}>
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  );

  // SUB-RENDER: Officer Settings View
  const renderOfficerSettings = () => (
    <div className="glass-card officer-settings-view animate-fade-in">
      <h3 className="card-title">
        <div className="card-title-left">
          <Settings size={18} style={{ color: 'var(--primary)' }} />
          ActuaryGPT Control Configurations
        </div>
      </h3>

      <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
        <h4 style={{ color: 'var(--text-title)', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Model Orchestrator</h4>
        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active LLM Model</span>
          <select className="form-select settings-select" style={{ width: '250px' }} disabled>
            <option>Gemini 2.5 Flash (Default)</option>
            <option>Gemini 2.5 Pro (Enterprise)</option>
          </select>
        </div>
        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Classifier Confidence Threshold</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input type="range" className="settings-slider" min="50" max="95" value="85" style={{ width: '150px' }} disabled />
            <span>85%</span>
          </div>
        </div>
      </div>

      <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2.5rem' }}>
        <h4 style={{ color: 'var(--text-title)', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Underwriting Risk Thresholds</h4>
        <div className="threshold-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div className="threshold-box" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="lbl green" style={{ color: 'var(--risk-low)', fontWeight: 700, fontSize: '0.9rem' }}>Low Risk</span>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Class 1 - 2</span>
            <span className="desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatic Premium / Preferred Issue Approval</span>
          </div>
          <div className="threshold-box" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="lbl amber" style={{ color: 'var(--risk-medium)', fontWeight: 700, fontSize: '0.9rem' }}>Medium Risk</span>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Class 3 - 5</span>
            <span className="desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rules-based standard pricing adjustment</span>
          </div>
          <div className="threshold-box" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="lbl red" style={{ color: 'var(--risk-high)', fontWeight: 700, fontSize: '0.9rem' }}>High Risk</span>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Class 6 - 8</span>
            <span className="desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mandatory Manual Underwriting Referral</span>
          </div>
        </div>
      </div>

      <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2.5rem' }}>
        <h4 style={{ color: 'var(--text-title)', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Database Configuration</h4>
        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Database File Path</span>
          <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>ActuaryGPT/backend/app/actuary_gpt.db</code>
        </div>
        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Local Storage Path</span>
          <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>ActuaryGPT/backend/app/static/reports/</code>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {isCustomer ? (
        /* ================= CUSTOMER DASHBOARD ================= */
        <>
          <header className="navbar">
            <div className="nav-brand">
              <Shield size={24} className="icon" style={{ color: 'var(--primary)' }} />
              <h1>ActuaryGPT</h1>
              <span className="brand-badge">Client Portal</span>
            </div>
            <div className="nav-user-info">
              <div className="user-badge">
                <User size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle', display: 'inline' }} />
                {user.name} (Policyholder)
              </div>
              <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={onLogoutClick}>
                <LogOut size={14} style={{ marginRight: '0.25rem' }} />
                Exit
              </button>
            </div>
          </header>

          <main className="dashboard-content animate-fade-in">
            <div className="customer-grid">
              {/* Customer Submission Form Wizard */}
              <div className="glass-card">
                
                {/* Wizard Steps Header Tracker */}
                <div className="wizard-progress-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', overflowX: 'auto', gap: '1rem' }}>
                  {[1, 2, 3, 4, 5].map((stepNum) => {
                    const stepLabels = [
                      "1. Personal",
                      "2. Health",
                      "3. Insurance",
                      "4. AI Processing",
                      "5. AI Result"
                    ];
                    let stepColor = 'var(--text-muted)';
                    let stepWeight = 500;
                    if (wizardStep === stepNum) {
                      stepColor = 'var(--primary)';
                      stepWeight = 700;
                    } else if (stepNum < wizardStep) {
                      stepColor = 'var(--risk-low)';
                      stepWeight = 600;
                    }
                    return (
                      <div 
                        key={stepNum} 
                        style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: stepWeight, 
                          color: stepColor,
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '50%', 
                          fontSize: '0.75rem',
                          backgroundColor: wizardStep === stepNum ? 'var(--primary)' : stepNum < wizardStep ? 'var(--risk-low-bg)' : 'var(--bg-input)',
                          border: `1px solid ${wizardStep === stepNum ? 'var(--primary)' : stepNum < wizardStep ? 'var(--risk-low)' : 'var(--border)'}`,
                          color: wizardStep === stepNum ? '#fff' : stepNum < wizardStep ? 'var(--risk-low)' : 'var(--text-muted)'
                        }}>
                          {stepNum < wizardStep ? '✓' : stepNum}
                        </span>
                        {stepLabels[stepNum - 1]}
                      </div>
                    );
                  })}
                </div>

                {/* STEP 1: Personal Information */}
                {wizardStep === 1 && (
                  <div className="animate-fade-in">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>
                      Personal Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. John Doe"
                          value={formData.fullName} 
                          onChange={(e) => handleInputChange('fullName', e.target.value)} 
                          required 
                        />
                      </div>
                      
                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Age (Normalized 0-1)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            max="1" 
                            className="form-input" 
                            placeholder="e.g. 0.45"
                            value={formData.age} 
                            onChange={(e) => handleInputChange('age', e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label>Gender</label>
                          <select 
                            className="form-select" 
                            value={formData.gender} 
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Occupation</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Software Engineer"
                            value={formData.occupation} 
                            onChange={(e) => handleInputChange('occupation', e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label>Annual Income (INR/USD)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="e.g. 1200000"
                            value={formData.income} 
                            onChange={(e) => handleInputChange('income', e.target.value)} 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Email Address</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            placeholder="e.g. johndoe@example.com"
                            value={formData.email} 
                            onChange={(e) => handleInputChange('email', e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input 
                            type="tel" 
                            className="form-input" 
                            placeholder="e.g. +91 9876543210"
                            value={formData.phone} 
                            onChange={(e) => handleInputChange('phone', e.target.value)} 
                            required 
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn-primary" 
                          onClick={() => {
                            if (!formData.fullName || !formData.age || !formData.occupation || !formData.income || !formData.email || !formData.phone) {
                              alert("Please fill in all fields to proceed.");
                              return;
                            }
                            setWizardStep(2);
                          }}
                        >
                          Next Step
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Health Information */}
                {wizardStep === 2 && (
                  <div className="animate-fade-in">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>
                      Health Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Height (cm)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="e.g. 175"
                            value={formData.height} 
                            onChange={(e) => handleSizeChange('height', e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label>Weight (kg)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="e.g. 70"
                            value={formData.weight} 
                            onChange={(e) => handleSizeChange('weight', e.target.value)} 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Automatically Calculated BMI</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={formData.bmi || ""} 
                          placeholder="BMI auto-computed"
                          disabled 
                          style={{ opacity: 0.8, backgroundColor: 'rgba(0,0,0,0.15)', cursor: 'not-allowed' }} 
                        />
                      </div>

                      <div className="form-group-row" style={{ gap: '2rem' }}>
                        <div className="form-group">
                          <label style={{ marginBottom: '0.5rem', display: 'block' }}>Smoking Habits</label>
                          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input 
                                type="radio" 
                                name="smoker" 
                                checked={formData.smoker === 1} 
                                onChange={() => handleInputChange('smoker', 1)}
                              />
                              Yes
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input 
                                type="radio" 
                                name="smoker" 
                                checked={formData.smoker === 0} 
                                onChange={() => handleInputChange('smoker', 0)}
                              />
                              No
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label style={{ marginBottom: '0.5rem', display: 'block' }}>Alcohol Consumption</label>
                          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input 
                                type="radio" 
                                name="alcohol" 
                                checked={formData.alcohol === 1} 
                                onChange={() => handleInputChange('alcohol', 1)}
                              />
                              Yes
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input 
                                type="radio" 
                                name="alcohol" 
                                checked={formData.alcohol === 0} 
                                onChange={() => handleInputChange('alcohol', 0)}
                              />
                              No
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label style={{ marginBottom: '0.5rem', display: 'block' }}>Exercise Frequency</label>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input 
                              type="radio" 
                              name="exercise" 
                              checked={formData.exercise === 2} 
                              onChange={() => handleInputChange('exercise', 2)}
                            />
                            Daily
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input 
                              type="radio" 
                              name="exercise" 
                              checked={formData.exercise === 1} 
                              onChange={() => handleInputChange('exercise', 1)}
                            />
                            Weekly
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input 
                              type="radio" 
                              name="exercise" 
                              checked={formData.exercise === 0} 
                              onChange={() => handleInputChange('exercise', 0)}
                            />
                            Rarely
                          </label>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Existing Medical Conditions / History</label>
                        <textarea 
                          className="form-input" 
                          style={{ minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                          placeholder="Please detail any pre-existing chronic conditions, medications, or surgical history..."
                          value={formData.medicalConditions} 
                          onChange={(e) => handleInputChange('medicalConditions', e.target.value)} 
                        />
                      </div>

                      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <button className="btn-secondary" onClick={() => setWizardStep(1)}>
                          Previous
                        </button>
                        <button 
                          className="btn-primary" 
                          onClick={() => {
                            if (!formData.height || !formData.weight) {
                              alert("Please fill in height and weight parameters.");
                              return;
                            }
                            setWizardStep(3);
                          }}
                        >
                          Next Step
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Insurance Details */}
                {wizardStep === 3 && (
                  <form className="animate-fade-in" onSubmit={handleCustomerSubmit}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>
                      Insurance Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Policy Type</label>
                          <select 
                            className="form-select" 
                            value={formData.insurance_type} 
                            onChange={(e) => handleInputChange('insurance_type', e.target.value)}
                          >
                            <option value="Life">Term Life Insurance</option>
                            <option value="Health">Comprehensive Health Cover</option>
                            <option value="Property">Commercial Property Cover</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Product Category Code</label>
                          <select 
                            className="form-select" 
                            value={formData.product_info_2} 
                            onChange={(e) => handleInputChange('product_info_2', e.target.value)}
                          >
                            <option value="A1">A1 (Standard Short-Term)</option>
                            <option value="D1">D1 (Preferred Multi-Benefit)</option>
                            <option value="D2">D2 (Standard Joint Life)</option>
                            <option value="E1">E1 (Special Substandard)</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group-row">
                        <div className="form-group">
                          <label>Requested Coverage Amount (Sum Assured INR/USD)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="e.g. 5000000"
                            value={formData.coverage_amount} 
                            onChange={(e) => handleInputChange('coverage_amount', e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label>Policy Duration (Years)</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="e.g. 15"
                            value={formData.policyDuration} 
                            onChange={(e) => handleInputChange('policyDuration', e.target.value)} 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group-row" style={{ gap: '2rem' }}>
                        <div className="form-group">
                          <label style={{ marginBottom: '0.5rem', display: 'block' }}>Previous Insurance Claims</label>
                          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input 
                                type="radio" 
                                name="previous_claims" 
                                checked={formData.previous_claims === 0} 
                                onChange={() => handleInputChange('previous_claims', 0)}
                              />
                              0
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input 
                                type="radio" 
                                name="previous_claims" 
                                checked={formData.previous_claims === 1} 
                                onChange={() => handleInputChange('previous_claims', 1)}
                              />
                              1
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input 
                                type="radio" 
                                name="previous_claims" 
                                checked={formData.previous_claims === 2} 
                                onChange={() => handleInputChange('previous_claims', 2)}
                              />
                              2+
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label style={{ marginBottom: '0.5rem', display: 'block' }}>Family Medical History Risk</label>
                          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input 
                                type="radio" 
                                name="family_history" 
                                checked={formData.family_history === 1} 
                                onChange={() => handleInputChange('family_history', 1)}
                              />
                              Yes
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                              <input 
                                type="radio" 
                                name="family_history" 
                                checked={formData.family_history === 0} 
                                onChange={() => handleInputChange('family_history', 0)}
                              />
                              No
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Nominee Age</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="e.g. 28"
                          value={formData.nomineeAge} 
                          onChange={(e) => handleInputChange('nomineeAge', e.target.value)} 
                          required 
                        />
                      </div>

                      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <button type="button" className="btn-secondary" onClick={() => setWizardStep(2)}>
                          Previous
                        </button>
                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Sparkles size={16} />
                          Analyze Application
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* STEP 4: AI Analysis Processing Screen */}
                {wizardStep === 4 && (
                  <div className="animate-fade-in" style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', marginBottom: '1.5rem' }}>
                      <Bot size={36} className="animate-pulse" />
                    </div>
                    
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-title)' }}>
                      🤖 ActuaryGPT AI Agent
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                      Analyzing Application and computing ML Risk Inference...
                    </p>

                    <div style={{ maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {wizardStepsProgress.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                          {step.status === 'completed' ? (
                            <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                          ) : step.status === 'active' ? (
                            <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                          ) : (
                            <div style={{ width: '14px', height: '14px', border: '1px solid var(--border)', borderRadius: '50%' }}></div>
                          )}
                          <span style={{ 
                            color: step.status === 'completed' ? 'var(--text-main)' : step.status === 'active' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: step.status === 'active' ? 600 : 400
                          }}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                      {wizardIsProcessing ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Running calculations, please wait...</span>
                      ) : (
                        <div style={{ color: 'var(--risk-low)', fontWeight: 600, fontSize: '0.95rem' }} className="animate-pulse">
                          Completed! Finalizing actuarial dossier...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 5: AI Evaluation Results Screen */}
                {wizardStep === 5 && wizardResult && (
                  <div className="animate-fade-in">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldCheck size={20} style={{ color: 'var(--risk-low)' }} />
                      AI Risk Assessment Report
                    </h3>

                    <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Class</span>
                        <span className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0' }}>
                          {wizardResult.risk_class} / 8
                        </span>
                        <span className={`risk-badge class-${wizardResult.risk_class}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '4px', backgroundColor: wizardResult.risk_class <= 2 ? 'var(--risk-low-bg)' : wizardResult.risk_class <= 5 ? 'var(--risk-medium-bg)' : 'var(--risk-high-bg)', color: wizardResult.risk_class <= 2 ? 'var(--risk-low)' : wizardResult.risk_class <= 5 ? 'var(--risk-medium)' : 'var(--risk-high)' }}>
                          Class {wizardResult.risk_class}
                        </span>
                      </div>
                      
                      <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Level</span>
                        <span className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: wizardResult.risk_class > 5 ? 'var(--risk-high)' : wizardResult.risk_class <= 2 ? 'var(--risk-low)' : 'var(--risk-medium)' }}>
                          {wizardResult.risk_class > 5 ? 'HIGH' : wizardResult.risk_class <= 2 ? 'LOW' : 'MEDIUM'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Underwriting Tier</span>
                      </div>

                      <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</span>
                        <span className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--secondary)' }}>
                          {wizardResult.confidence}%
                        </span>
                        <div className="confidence-bar-bg" style={{ width: '100%', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div className="confidence-bar-fg" style={{ width: `${wizardResult.confidence}%`, height: '100%', backgroundColor: 'var(--secondary)' }}></div>
                        </div>
                      </div>

                      <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended Premium</span>
                        <span className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--primary)' }}>
                          ₹{wizardResult.premium?.toLocaleString()}/year
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Annual Cost Basis</span>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>AI Underwriting Recommendation</span>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)', margin: 0 }}>
                        {wizardResult.underwriting_decision}
                      </p>
                    </div>

                    <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '2rem' }}>
                      <span className="metric-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Actuarial Report Justification</span>
                      <div className="report-content" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {wizardResult.report}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setFormData(DEFAULT_BLANK_FORM);
                          setWizardStep(1);
                          setWizardResult(null);
                        }}
                      >
                        Apply for Another Policy
                      </button>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {wizardResult.pdf_url && (
                          <a 
                            href={`${API_BASE}${wizardResult.pdf_url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn-primary"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <Download size={16} />
                            Download Actuarial PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Customer Submissions History Ledger */}
              <div className="glass-card">
                <h3 className="card-title">
                  <div className="card-title-left">
                    <History size={18} style={{ color: 'var(--primary)' }} />
                    My Policies & Applications
                  </div>
                </h3>

                {customerSubmissions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
                    <p>You have not submitted any policy applications yet.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Fill out the application form on the left to get started.</p>
                  </div>
                ) : (
                  <div className="ledger-list">
                    {customerSubmissions.map(app => (
                      <div key={app.id} className="ledger-card">
                        <div className="ledger-row">
                          <span className="ledger-item-title">{app.insurance_type} Policy Cover</span>
                          <span className={`status-badge ${app.status}`}>
                            {app.status}
                          </span>
                        </div>
                        
                        <div className="ledger-meta">
                          <span>Application ID: <b>{app.id}</b></span>
                          <span>Coverage: <b>₹{app.coverage_amount?.toLocaleString()}</b></span>
                          <span>Date: <b>{app.date}</b></span>
                        </div>

                        {app.status === 'approved' && (
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                              <div>Risk Level: <span className="risk-badge low" style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem' }}>Class {app.risk_class} ({app.risk_category})</span></div>
                              <div style={{ textAlign: 'right' }}>Calculated Premium: <b style={{ color: 'var(--primary)' }}>₹{app.premium?.toLocaleString()}/yr</b></div>
                            </div>
                            {app.pdf_url && (
                              <a 
                                href={`${API_BASE}${app.pdf_url}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn-secondary"
                                style={{ textDecoration: 'none', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', width: 'fit-content', marginTop: '0.25rem' }}
                              >
                                <Download size={12} style={{ marginRight: '0.25rem' }} />
                                Download Actuarial PDF Report
                              </a>
                            )}
                          </div>
                        )}

                        {app.status === 'rejected' && (
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--risk-high)' }}>
                            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                            Underwriting declined standard rates. Manual review refer status.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      ) : (
        /* ================= OFFICER / ACTUARY DASHBOARD SIDEBAR LAYOUT ================= */
        <div className="officer-portal-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
          {/* Left Sidebar */}
          <aside className="officer-sidebar" style={{ width: '260px', backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', padding: '1.5rem 1rem' }}>
            <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <Shield size={26} className="sidebar-brand-icon" style={{ color: 'var(--primary)' }} />
              <div className="brand-texts">
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-title)', letterSpacing: '-0.5px' }}>ActuaryGPT</h2>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Underwriter Hub</span>
              </div>
            </div>
            
            <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <button 
                className={`sidebar-link ${officerTab === 'dashboard' ? 'active' : ''}`} 
                onClick={() => setOfficerTab('dashboard')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'none', borderRadius: '8px', color: officerTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)', backgroundColor: officerTab === 'dashboard' ? 'var(--primary-glow)' : 'transparent', fontWeight: 600, fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              
              <button 
                className={`sidebar-link ${officerTab === 'new_app' ? 'active' : ''}`} 
                onClick={() => setOfficerTab('new_app')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'none', borderRadius: '8px', color: officerTab === 'new_app' ? 'var(--primary)' : 'var(--text-muted)', backgroundColor: officerTab === 'new_app' ? 'var(--primary-glow)' : 'transparent', fontWeight: 600, fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <PlusCircle size={18} />
                <span>New Application</span>
              </button>

              <button 
                className={`sidebar-link ${officerTab === 'triage' ? 'active' : ''}`} 
                onClick={() => setOfficerTab('triage')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'none', borderRadius: '8px', color: officerTab === 'triage' ? 'var(--primary)' : 'var(--text-muted)', backgroundColor: officerTab === 'triage' ? 'var(--primary-glow)' : 'transparent', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ClipboardList size={18} />
                  <span>Triage Queue</span>
                </div>
                {pendingApps.length > 0 && (
                  <span className="sidebar-badge" style={{ backgroundColor: 'var(--primary)', color: '#fff', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>{pendingApps.length}</span>
                )}
              </button>

              <button 
                className={`sidebar-link ${officerTab === 'history' ? 'active' : ''}`} 
                onClick={() => setOfficerTab('history')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'none', borderRadius: '8px', color: officerTab === 'history' ? 'var(--primary)' : 'var(--text-muted)', backgroundColor: officerTab === 'history' ? 'var(--primary-glow)' : 'transparent', fontWeight: 600, fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <History size={18} />
                <span>History</span>
              </button>

              <button 
                className={`sidebar-link ${officerTab === 'analytics' ? 'active' : ''}`} 
                onClick={() => setOfficerTab('analytics')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'none', borderRadius: '8px', color: officerTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)', backgroundColor: officerTab === 'analytics' ? 'var(--primary-glow)' : 'transparent', fontWeight: 600, fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <TrendingUp size={18} />
                <span>Analytics</span>
              </button>

              <button 
                className={`sidebar-link ${officerTab === 'assistant' ? 'active' : ''}`} 
                onClick={() => setOfficerTab('assistant')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'none', borderRadius: '8px', color: officerTab === 'assistant' ? 'var(--primary)' : 'var(--text-muted)', backgroundColor: officerTab === 'assistant' ? 'var(--primary-glow)' : 'transparent', fontWeight: 600, fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Bot size={18} />
                <span>AI Assistant</span>
              </button>

              <button 
                className={`sidebar-link ${officerTab === 'settings' ? 'active' : ''}`} 
                onClick={() => setOfficerTab('settings')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'none', borderRadius: '8px', color: officerTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)', backgroundColor: officerTab === 'settings' ? 'var(--primary-glow)' : 'transparent', fontWeight: 600, fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            </nav>
            
            <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '50%', padding: '0.5rem', display: 'flex' }}>
                  <User size={16} style={{ color: 'var(--text-main)' }} />
                </div>
                <div className="user-info">
                  <p className="user-name" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-title)' }}>{user.name}</p>
                  <p className="user-role" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Actuary Officer</p>
                </div>
              </div>
              
              <button 
                className="sidebar-logout-btn" 
                onClick={onLogoutClick}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'none', borderRadius: '6px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', justifyContent: 'center' }}
              >
                <LogOut size={16} />
                <span>Exit Hub</span>
              </button>
            </div>
          </aside>
          
          {/* Main Content Area */}
          <main className="officer-main-pane" style={{ flex: 1, padding: '2rem', overflowY: 'auto', height: '100vh' }}>
            {officerTab === 'dashboard' && renderOfficerDashboard()}
            {officerTab === 'new_app' && renderOfficerNewApp()}
            {officerTab === 'triage' && (
              <div className="officer-triage-grid">
                {/* Left Side: Pending Customer Applications Queue */}
                <div className="glass-card">
                  <h3 className="card-title">
                    <div className="card-title-left">
                      <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
                      Submissions Queue ({pendingApps.length})
                    </div>
                  </h3>

                  {pendingApps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={32} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--risk-low)', opacity: 0.8 }} />
                      <p>All queue applications triaged!</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Awaiting new policy applications from customers.</p>
                    </div>
                  ) : (
                    <div className="triage-list">
                      {pendingApps.map(app => (
                        <div 
                          key={app.id} 
                          className={`triage-item ${selectedApp?.id === app.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedApp(app);
                            setAgentResult(null);
                            setBackendError(null);
                          }}
                        >
                          <div className="triage-item-header">
                            <span className="triage-item-name">{app.client}</span>
                            <span className="status-badge pending" style={{ fontSize: '0.65rem' }}>{app.id}</span>
                          </div>
                          <div className="triage-item-detail">
                            {app.insurance_type} Policy Cover • Requested: <b>₹{app.coverage_amount?.toLocaleString()}</b>
                          </div>
                          <div className="triage-item-detail" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                            Submitted: {app.date}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side: Selected Application Workstation */}
                <div className="glass-card" style={{ minHeight: '550px' }}>
                   <h3 className="card-title">
                     <div className="card-title-left">
                       <Activity size={18} style={{ color: 'var(--primary)' }} />
                       ActuaryGPT AI Evaluation Workstation
                     </div>
                   </h3>

                   {!selectedApp ? (
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
                       <Shield size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                       <p>Select a pending policy application from the queue to start profiling.</p>
                     </div>
                   ) : (
                     <div className="animate-slide-in">
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                         <div>
                           <h4 style={{ fontSize: '1.2rem', color: 'var(--text-title)' }}>Applicant: {selectedApp.client}</h4>
                           <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Application File: {selectedApp.id} | Date: {selectedApp.date}</span>
                         </div>
                         {!isLoading && !agentResult && (
                           <button className="btn-primary" onClick={() => runActuarialAgent(selectedApp)}>
                             <Sparkles size={16} />
                             Run AI Profiler
                           </button>
                         )}
                       </div>

                       <div className="details-grid">
                         <div className="detail-box"><span className="detail-label">Age Index</span><span className="detail-val">{selectedApp.age}</span></div>
                         <div className="detail-box"><span className="detail-label">Gender</span><span className="detail-val">{selectedApp.gender}</span></div>
                         <div className="detail-box"><span className="detail-label">Height / Weight</span><span className="detail-val">{selectedApp.height}cm / {selectedApp.weight}kg</span></div>
                         <div className="detail-box"><span className="detail-label">BMI</span><span className="detail-val">{selectedApp.bmi}</span></div>
                         <div className="detail-box"><span className="detail-label">Income</span><span className="detail-val">₹{selectedApp.income?.toLocaleString()}</span></div>
                         <div className="detail-box"><span className="detail-label">Smoker</span><span className="detail-val">{selectedApp.smoker ? 'Yes' : 'No'}</span></div>
                         <div className="detail-box"><span className="detail-label">Claims History</span><span className="detail-val">{selectedApp.previous_claims} claims</span></div>
                         <div className="detail-box"><span className="detail-label">Type / Coverage</span><span className="detail-val">{selectedApp.insurance_type} / ₹{selectedApp.coverage_amount?.toLocaleString()}</span></div>
                       </div>

                       {backendError && (
                         <div style={{ padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--risk-high-border)', borderRadius: 8, color: 'var(--risk-high)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                           <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                             <AlertTriangle size={18} />
                             FastAPI Backend Server Offline
                           </div>
                           <p>{backendError}</p>
                         </div>
                       )}

                       {isLoading && (
                         <div className="pipeline-card">
                           <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Executing the agentic underwriting pipeline:</p>
                           <div className="pipeline-steps">
                             {pipelineSteps.map(step => (
                               <div key={step.key} className={`pipeline-step ${step.status}`}>
                                 {step.status === 'active' && <div className="spinner"></div>}
                                 {step.status === 'completed' && <CheckCircle2 size={16} />}
                                 {step.status === 'pending' && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--border)' }}></div>}
                                 <span>{step.label}</span>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       {agentResult && !isLoading && (
                         <div className="result-container animate-fade-in">
                           <div className="metrics-row">
                             <div className="metric-box">
                               <span className="metric-label">Predicted Risk Class</span>
                               <span className="metric-value">Class {agentResult.risk_class}</span>
                               <span className={`risk-badge ${agentResult.risk_category?.toLowerCase().replace(' ', '') || 'low'}`}>
                                 {agentResult.risk_category}
                               </span>
                             </div>
                             
                             <div className="metric-box">
                               <span className="metric-label">Predict Confidence</span>
                               <span className="metric-value" style={{ color: 'var(--secondary)' }}>
                                 {agentResult.confidence ? `${agentResult.confidence}%` : '90%'}
                               </span>
                               <div className="confidence-bar-bg" style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                                 <div className="confidence-bar-fg" style={{ width: `${agentResult.confidence || 90}%`, height: '100%', backgroundColor: 'var(--secondary)' }}></div>
                               </div>
                             </div>
                             
                             <div className="metric-box">
                               <span className="metric-label">Actuary Premium Rate</span>
<span className="metric-value" style={{ color: 'var(--primary)' }}>
                                 ₹{agentResult.premium?.toLocaleString()}
                               </span>
                               <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per Annum Pricing</span>
                             </div>
                           </div>

                           <div className="glass-card" style={{ marginTop: '1rem', padding: '1rem' }}>
                             <span className="metric-label">Underwriting Guideline Recommendation</span>
                             <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: agentResult.risk_class > 5 ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                               {agentResult.underwriting_decision}
                             </span>
                           </div>

                           <div className="glass-card similarity-references" style={{ marginTop: '1rem' }}>
                             <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <History size={16} style={{ color: 'var(--primary)' }} />
                               Top Similar Historical Reference Cases (RAG Matches)
                             </h4>
                             {!agentResult.similar_cases || agentResult.similar_cases.length === 0 ? (
                               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No historical matches found in database.</p>
                             ) : (
                               <div className="similarity-cases-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                 {agentResult.similar_cases.map((scase, sidx) => (
                                   <div key={scase.id || sidx} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                                     
                                     <div 
                                       className="similarity-case-row" 
                                       style={{ 
                                         display: 'flex', 
                                         justifyContent: 'space-between', 
                                         alignItems: 'center', 
                                         padding: '0.75rem 0.9rem', 
                                         backgroundColor: expandedSimCaseId === scase.id ? 'var(--bg-card-hover)' : 'var(--bg-input)', 
                                         cursor: 'pointer', 
                                         fontSize: '0.85rem',
                                         transition: 'background-color 0.2s ease'
                                       }}
                                       onClick={() => setExpandedSimCaseId(expandedSimCaseId === scase.id ? null : scase.id)}
                                     >
                                       <div className="sim-case-meta" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                         <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                           {expandedSimCaseId === scase.id ? '▼' : '▶'}
                                         </span>
                                         <span className="sim-case-id" style={{ fontWeight: 600, color: 'var(--primary)' }}>{scase.id}</span>
                                         <span className="sim-case-client" style={{ fontWeight: 500 }}>{scase.client}</span>
                                         <span className="sim-case-type" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{scase.insurance_type}</span>
                                       </div>
                                       <div className="sim-case-metrics" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                         <span className="sim-percent" style={{ fontWeight: 600, color: 'var(--risk-low)' }}>{scase.similarity}% Match</span>
                                         
                                         {scase.status === 'approved' ? (
                                           <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--risk-low-border)', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', borderRadius: '4px' }}>Approved</span>
                                         ) : scase.status === 'rejected' ? (
                                           <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--risk-high-border)', backgroundColor: 'var(--risk-high-bg)', color: 'var(--risk-high)', borderRadius: '4px' }}>Rejected</span>
                                         ) : (
                                           <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '4px' }}>{scase.status || 'Unknown'}</span>
                                         )}

                                         <span className="sim-premium" style={{ fontWeight: 600 }}>₹{scase.premium?.toLocaleString()}</span>
                                         <span className={`risk-badge class-${scase.risk_class}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', backgroundColor: scase.risk_class <= 2 ? 'var(--risk-low-bg)' : scase.risk_class <= 5 ? 'var(--risk-medium-bg)' : 'var(--risk-high-bg)', color: scase.risk_class <= 2 ? 'var(--risk-low)' : scase.risk_class <= 5 ? 'var(--risk-medium)' : 'var(--risk-high)', border: '1px solid transparent', borderRadius: '4px' }}>Class {scase.risk_class}</span>
                                       </div>
                                     </div>

                                     {expandedSimCaseId === scase.id && (
                                       <div className="sim-case-details animate-fade-in" style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0, 0, 0, 0.25)', fontSize: '0.8rem' }}>
                                         <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                           <strong>Key Match Parity:</strong> Shared similarities on <em>{getMatchingFeatures(selectedApp, scase)}</em>.
                                         </div>
                                         
                                         <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parameter</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600, color: 'var(--text-title)' }}>Current Application</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600, color: 'var(--primary)' }}>Historical Ref ({scase.id})</div>

                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Age Index</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{selectedApp.age}</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem', color: Math.abs(selectedApp.age - scase.age) < 0.1 ? 'var(--risk-low)' : 'var(--text-main)' }}>{scase.age}</div>

                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>BMI Rating</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{selectedApp.bmi}</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem', color: Math.abs(selectedApp.bmi - scase.bmi) < 2 ? 'var(--risk-low)' : 'var(--text-main)' }}>{scase.bmi}</div>

                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Height / Weight</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{selectedApp.height}cm / {selectedApp.weight}kg</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{scase.height}cm / {scase.weight}kg</div>

                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Smoking Indicator</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{selectedApp.smoker ? 'Yes (Smoker)' : 'No (Non-smoker)'}</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem', color: selectedApp.smoker === scase.smoker ? 'var(--risk-low)' : 'var(--risk-high)' }}>{scase.smoker ? 'Yes (Smoker)' : 'No (Non-smoker)'}</div>

                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Claims History</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{selectedApp.previous_claims} claims</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem', color: selectedApp.previous_claims === scase.previous_claims ? 'var(--risk-low)' : 'var(--text-main)' }}>{scase.previous_claims} claims</div>

                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Family Medical History</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{selectedApp.family_history ? 'Yes (High Risk)' : 'No (Standard)'}</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem', color: selectedApp.family_history === scase.family_history ? 'var(--risk-low)' : 'var(--text-main)' }}>{scase.family_history ? 'Yes (High Risk)' : 'No (Standard)'}</div>

                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Exercise / Alcohol</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Ex: {selectedApp.exercise} | Alc: {selectedApp.alcohol}</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Ex: {scase.exercise} | Alc: {scase.alcohol}</div>

                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Annual Income</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>₹{selectedApp.income?.toLocaleString()}</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>₹{scase.income?.toLocaleString()}</div>

                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Insurance Sum Assured</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>₹{selectedApp.coverage_amount?.toLocaleString()}</div>
                                           <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>₹{scase.coverage_amount?.toLocaleString()}</div>

                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600 }}>Final Decision Outcome</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Pending Human Review</div>
                                           <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 700, color: scase.status === 'approved' ? 'var(--risk-low)' : 'var(--risk-high)' }}>
                                             {scase.status ? scase.status.toUpperCase() : 'UNKNOWN'}
                                           </div>
                                         </div>
                                       </div>
                                     )}
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>

                           <div className="glass-card" style={{ marginTop: '1rem', padding: '1rem' }}>
                             <span className="metric-label" style={{ marginBottom: '0.5rem', display: 'block' }}>AI Actuarial Report Justification</span>
                             <div className="report-content" style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                               {agentResult.report}
                             </div>
                           </div>

                           <div className="result-actions">
                             <button className="btn-danger" onClick={() => handleOfficerDecision('reject')}>
                               Decline Cover
                             </button>
                             
                             {agentResult.pdf_url && (
                               <a 
                                 href={`${API_BASE}${agentResult.pdf_url}`} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="btn-secondary"
                                 style={{ textDecoration: 'none' }}
                               >
                                 <Download size={16} />
                                 Export PDF
                               </a>
                             )}
                             
                             <button className="btn-success" onClick={() => handleOfficerDecision('approve')}>
                               <UserCheck size={16} />
                               Approve & Sign-off Policy
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
              </div>
            )}
            {officerTab === 'history' && (
              <div className="glass-card analytics-full-width animate-fade-in">
                <h3 className="card-title">
                  <History size={18} style={{ color: 'var(--primary)' }} />
                  Processed Application History
                </h3>
                <div className="portfolio-table-wrapper">
                  {!analyticsSummary?.processed_list || analyticsSummary.processed_list.length === 0 ? (
                    <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No processed files found. Go to Triage or run analytics to synchronize.</div>
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
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsSummary.processed_list.map(p => (
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            {officerTab === 'analytics' && (
              <div>
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

                <div className="analytics-grid">
                  <div className="glass-card">
                    <h3 className="card-title">
                      <Users size={18} style={{ color: 'var(--primary)' }} />
                      Portfolio Classification Distribution
                    </h3>
                    <div className="chart-container">
                      {riskChartData.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>No policies available.</div>
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
                                    <div className="custom-tooltip">
                                      <p className="custom-tooltip-label">{payload[0].name}</p>
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
                    <h3 className="card-title">
                      <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                      Premiums Volume by Product Type
                    </h3>
                    <div className="chart-container">
                      {typeChartData.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>No policies available.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={typeChartData}>
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="custom-tooltip">
                                      <p className="custom-tooltip-label">{payload[0].payload.name}</p>
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

                  <div className="glass-card analytics-full-width">
                    <h3 className="card-title">
                      <History size={18} style={{ color: 'var(--primary)' }} />
                      Underwriting Ledger History
                    </h3>
                    <div className="chart-container" style={{ minHeight: '200px' }}>
                      {premiumTrendData.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>No pricing trends data.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={premiumTrendData}>
                            <XAxis dataKey="index" stroke="var(--text-muted)" fontSize={11} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="custom-tooltip">
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
            )}
            {officerTab === 'assistant' && renderOfficerAIAssistant()}
            {officerTab === 'settings' && renderOfficerSettings()}
          </main>
        </div>
      )}
      {/* Footer */}
      {isCustomer && (
        <footer className="footer">
          <p>© 2026 ActuaryGPT System • Secure AI-Powered Insurance Risk Underwriter Dashboard Co-Pilot</p>
        </footer>
      )}
    </div>
  );
}

// Wrap with custom login/register toggle and UI elements
export default function AppWrapper() {
  const savedUser = localStorage.getItem('actuary_auth_user');
  const [currentUser, setCurrentUser] = useState(savedUser ? JSON.parse(savedUser) : null);

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [roleInput, setRoleInput] = useState("customer");
  const [passkeyInput, setPasskeyInput] = useState("");
  const [authError, setAuthError] = useState(null);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
    const payload = isRegisterMode 
      ? { username: usernameInput, password: passwordInput, role: roleInput, passkey: passkeyInput }
      : { username: usernameInput, password: passwordInput, passkey: passkeyInput };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication request failed.");
      }

      if (isRegisterMode) {
        setIsRegisterMode(false);
        // Auto-login
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameInput, password: passwordInput, passkey: passkeyInput })
        });
        const loginData = await loginResponse.json();
        saveLogin(loginData);
      } else {
        const loginData = await response.json();
        saveLogin(loginData);
      }
    } catch (err) {
      console.error(err);
      setAuthError(err.message);
    }
  };

  const saveLogin = (loginData) => {
    const loggedInUser = {
      name: loginData.username,
      role: loginData.role
    };
    setCurrentUser(loggedInUser);
    localStorage.setItem('actuary_auth_user', JSON.stringify(loggedInUser));
    setUsernameInput("");
    setPasswordInput("");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('actuary_auth_user');
  };

  if (!currentUser) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Shield size={44} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' }} />
            <h2>ActuaryGPT</h2>
            <p>Access the AI-powered Actuarial and Automated Underwriting Portal</p>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter your username..." 
                value={usernameInput} 
                onChange={(e) => setUsernameInput(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                required 
              />
            </div>

            {/* Officer Security Passkey for registration / logins */}
            {isRegisterMode && roleInput === 'officer' && (
              <div className="form-group animate-fade-in">
                <label>Officer Security Passkey</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Required secure officer passkey..." 
                  value={passkeyInput} 
                  onChange={(e) => setPasskeyInput(e.target.value)} 
                  required 
                />
              </div>
            )}

            {!isRegisterMode && (
              <div className="form-group">
                <label>Officer Passkey <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Only required for Actuary Officers)</span></label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Enter passkey if logging in as Actuary..." 
                  value={passkeyInput} 
                  onChange={(e) => setPasskeyInput(e.target.value)} 
                />
              </div>
            )}

            {isRegisterMode && (
              <div className="role-selector">
                <label>Choose Account Type</label>
                <div className="role-options">
                  <div 
                    className={`role-option-card ${roleInput === 'customer' ? 'active' : ''}`}
                    onClick={() => {
                      setRoleInput('customer');
                      setPasskeyInput("");
                    }}
                  >
                    <Users size={20} style={{ color: roleInput === 'customer' ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span className="role-title">Customer</span>
                    <span className="role-desc">Apply for Policies</span>
                  </div>

                  <div 
                    className={`role-option-card ${roleInput === 'officer' ? 'active' : ''}`}
                    onClick={() => setRoleInput('officer')}
                  >
                    <UserCheck size={20} style={{ color: roleInput === 'officer' ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span className="role-title">Underwriter</span>
                    <span className="role-desc">Actuary Officers</span>
                  </div>
                </div>
              </div>
            )}

            {authError && (
              <div style={{ color: 'var(--risk-high)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <AlertTriangle size={14} />
                <span>{authError}</span>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              {isRegisterMode ? "Create Account & Sign In" : "Sign In to Portal"}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isRegisterMode ? "Already have an account?" : "Need a new account?"}
              </span>{" "}
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError(null);
                  setPasskeyInput("");
                }}
              >
                {isRegisterMode ? "Sign In instead" : "Register a new user"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return <App user={currentUser} handleLogout={handleLogout} />;
}
