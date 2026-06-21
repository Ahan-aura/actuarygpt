import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Loader from './components/Loader';
import AIThinking from './components/AIThinking';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LifeInsurance from './pages/LifeInsurance';
import VehicleInsurance from './pages/VehicleInsurance';
import LifeResult from './pages/LifeResult';
import VehicleResult from './pages/VehicleResult';
import HistoryPage from './pages/History';
import Analytics from './pages/Analytics';
import Chatbot from './pages/Chatbot';
import SettingsPage from './pages/Settings';
import Landing from './pages/Landing';
import ClaimProcessingScreen from './components/ClaimProcessingScreen';

import { 
  Shield, 
  Activity, 
  Sparkles, 
  ClipboardList, 
  AlertTriangle,
  UserCheck,
  Bot
} from 'lucide-react';
import './App.css';

const API_BASE = "http://127.0.0.1:8000";

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
  previous_claims: 0, 
  family_history: 0,
  nomineeAge: "",
  product_info_2: "A1",
  medicalBill: ""
};

function App({ user, handleLogout }) {
  // Shared States
  const [pendingApps, setPendingApps] = useState([]);
  const [pendingVehicleApps, setPendingVehicleApps] = useState([]);
  const [customerSubmissions, setCustomerSubmissions] = useState([]);
  const [customerVehicleSubmissions, setCustomerVehicleSubmissions] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);

  // Customer Wizard Toggles & Form
  const [customerFormTab, setCustomerFormTab] = useState('landing'); // 'landing', 'life', 'vehicle', 'analytics', 'chatbot'
  const [formData, setFormData] = useState(DEFAULT_BLANK_FORM);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardResult, setWizardResult] = useState(null);
  const [wizardIsProcessing, setWizardIsProcessing] = useState(false);
  const [pendingWizardResult, setPendingWizardResult] = useState(null);

  // Officer States
  const [officerTab, setOfficerTab] = useState('dashboard');
  const [selectedApp, setSelectedApp] = useState(null);
  const [agentResult, setAgentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [expandedSimCaseId, setExpandedSimCaseId] = useState(null);

  // Chat/Assistant Co-pilot States
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', content: 'Hello! I am your ActuaryGPT Underwriting Co-Pilot. How can I assist you with insurance evaluations, risk guidelines, or reference database lookups today?' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // AI Pipeline Loader Steps
  const [pipelineSteps, setPipelineSteps] = useState([
    { key: 'validate', label: "Document Validation", status: 'pending' },
    { key: 'ocr', label: "OCR Extraction", status: 'pending' },
    { key: 'verification', label: "Vehicle Information Verification", status: 'pending' },
    { key: 'policy', label: "Policy Verification", status: 'pending' },
    { key: 'analysis', label: "Damage Analysis", status: 'pending' },
    { key: 'ml', label: "CatBoost Fraud Prediction", status: 'pending' },
    { key: 'rag', label: "Similar Case Retrieval", status: 'pending' },
    { key: 'calc', label: "Premium / Claim Calculation", status: 'pending' },
    { key: 'explain', label: "Gemini Explanation", status: 'pending' },
    { key: 'pdf', label: "PDF Report Generation", status: 'pending' }
  ]);

  // Sync API Handlers
  const fetchCustomerSubmissions = async () => {
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

  const fetchCustomerVehicleSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/applications/vehicle?client=${user.name}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerVehicleSubmissions(data);
      }
    } catch (err) {
      console.error("Error fetching vehicle submissions:", err);
    }
  };

  const fetchPendingApps = async () => {
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

  const fetchPendingVehicleApps = async () => {
    try {
      const res = await fetch(`${API_BASE}/applications/vehicle?status=pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingVehicleApps(data);
      }
    } catch (err) {
      console.error("Error fetching pending vehicle claims:", err);
    }
  };

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

  // Customer submission triggers
  const handleCustomerSubmit = async () => {
    setWizardStep(4);
    setWizardIsProcessing(true);
    setWizardResult(null);

    const wizardProgressMock = [
      { label: "Validating applicant parameters", status: 'active' },
      { label: "Predicting actuarial risk class", status: 'pending' },
      { label: "Running similarity match audit", status: 'pending' },
      { label: "Compiling actuarial brief", status: 'pending' }
    ];
    setWizardStepsProgress(wizardProgressMock);

    // Scaling raw inputs to normal distributions in backend automatically
    const payload = {
      client: user.name,
      age: parseFloat(formData.age) || 35.0,
      height: parseFloat(formData.height) || 170.0,
      weight: parseFloat(formData.weight) || 70.0,
      bmi: parseFloat(formData.bmi) || 24.2,
      product_info_2: formData.product_info_2,
      occupation: formData.occupation,
      income: parseFloat(formData.income) || 50000.0,
      smoker: parseInt(formData.smoker) || 0,
      previous_claims: parseInt(formData.previous_claims) || 0,
      family_history: parseInt(formData.family_history) || 0,
      insurance_type: formData.insurance_type,
      coverage_amount: parseFloat(formData.coverage_amount) || 100000.0,
      exercise: parseInt(formData.exercise) || 1,
      alcohol: parseInt(formData.alcohol) || 0,
      gender: formData.gender,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      medical_conditions: formData.medicalConditions,
      policy_duration: parseInt(formData.policyDuration),
      nominee_age: parseInt(formData.nomineeAge),
      medical_bill: formData.medicalBill || null
    };

    try {
      // Step 1 complete
      setTimeout(() => {
        setWizardStepsProgress(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'completed' } : i === 1 ? { ...s, status: 'active' } : s));
      }, 700);

      const res = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create application");
      const newApp = await res.json();

      // Step 2 complete -> Step 3 active (trigger evaluate)
      setTimeout(() => {
        setWizardStepsProgress(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'completed' } : i === 2 ? { ...s, status: 'active' } : s));
      }, 1400);

      const evalRes = await fetch(`${API_BASE}/applications/${newApp.id}/evaluate`, {
        method: "POST"
      });
      if (!evalRes.ok) throw new Error("AI Evaluation agent pipeline crashed.");

      // Step 3 complete -> Step 4 active
      setTimeout(() => {
        setWizardStepsProgress(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'completed' } : i === 3 ? { ...s, status: 'active' } : s));
      }, 2100);

      const evalResult = await evalRes.json();

      setTimeout(() => {
        setWizardStepsProgress(prev => prev.map(s => ({ ...s, status: 'completed' })));
        setWizardResult(evalResult);
        setWizardIsProcessing(false);
        setWizardStep(5);
        fetchCustomerSubmissions();
      }, 2800);

    } catch (err) {
      console.error(err);
      alert(err.message);
      setWizardStep(3);
    }
  };

  const handleVehicleSubmit = async (vehicleFormData) => {
    setWizardStep(4);
    setWizardIsProcessing(true);
    setWizardResult(null);
    setPendingWizardResult(null);

    try {
      const res = await fetch(`${API_BASE}/applications/vehicle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleFormData)
      });
      if (!res.ok) throw new Error("Failed to file claim");
      const newApp = await res.json();

      const evalRes = await fetch(`${API_BASE}/applications/vehicle/${newApp.id}/evaluate`, {
        method: "POST"
      });
      if (!evalRes.ok) throw new Error("Automated forensic engine failed.");
      const evalResult = await evalRes.json();

      setPendingWizardResult({
        ...evalResult,
        risk_class: evalResult.risk_class || (evalResult.fraud_reported === 'Y' ? 8 : 1)
      });
      fetchCustomerVehicleSubmissions();
    } catch (err) {
      console.error(err);
      alert(err.message);
      setWizardStep(1);
      setWizardIsProcessing(false);
    }
  };

  const handleClaimAnimationComplete = () => {
    const checkAndTransition = () => {
      if (pendingWizardResult) {
        setWizardResult(pendingWizardResult);
        setWizardIsProcessing(false);
        setWizardStep(5);
      } else {
        setTimeout(checkAndTransition, 200);
      }
    };
    checkAndTransition();
  };

  const [wizardStepsProgress, setWizardStepsProgress] = useState([]);

  // Underwriter queue pipeline profiling execution
  const runActuarialAgent = async (app) => {
    setIsLoading(true);
    setAgentResult(null);
    setBackendError(null);
    
    const isVehicle = app.id.startsWith('VEH');
    
    const initialSteps = [
      { key: 'validate', label: "Document Validation", status: 'active' },
      { key: 'ocr', label: "OCR Extraction", status: 'pending' },
      { key: 'verification', label: isVehicle ? "Vehicle Information Verification" : "Applicant Information Verification", status: 'pending' },
      { key: 'policy', label: "Policy Verification", status: 'pending' },
      { key: 'analysis', label: isVehicle ? "Damage Analysis" : "Health Risk Analysis", status: 'pending' },
      { key: 'ml', label: isVehicle ? "CatBoost Fraud Prediction" : "CatBoost Risk Prediction", status: 'pending' },
      { key: 'rag', label: "Similar Case Retrieval", status: 'pending' },
      { key: 'calc', label: "Premium / Claim Calculation", status: 'pending' },
      { key: 'explain', label: "Gemini Explanation", status: 'pending' },
      { key: 'pdf', label: "PDF Report Generation", status: 'pending' }
    ];
    
    setPipelineSteps(initialSteps);
    
    let resultData = null;
    let apiDone = false;
    let apiError = null;

    const endpoint = isVehicle ? `/applications/vehicle/${app.id}/evaluate` : `/applications/${app.id}/evaluate`;
    
    fetch(`${API_BASE}${endpoint}`, { method: "POST" })
      .then(res => {
        if (!res.ok) throw new Error("Actuarial server endpoint evaluation error.");
        return res.json();
      })
      .then(data => {
        resultData = data;
        apiDone = true;
      })
      .catch(err => {
        apiError = err;
        apiDone = true;
      });

    let currentIdx = 0;
    const timer = setInterval(() => {
      setPipelineSteps(prev => {
        if (currentIdx >= 9) {
          if (apiDone) {
            clearInterval(timer);
            if (apiError) {
              setBackendError(apiError.message);
              setIsLoading(false);
            } else {
              setAgentResult(resultData);
              setIsLoading(false);
              return prev.map(s => ({ ...s, status: 'completed' }));
            }
          }
          return prev;
        }
        
        const nextSteps = prev.map((s, idx) => {
          if (idx < currentIdx + 1) return { ...s, status: 'completed' };
          if (idx === currentIdx + 1) return { ...s, status: 'active' };
          return s;
        });
        currentIdx++;
        return nextSteps;
      });
    }, 250);
  };

  // Underwriter decisions approve/reject
  const handleTriageDecision = async (decision, modifiedAmount = null) => {
    if (!selectedApp) return;
    const isVehicle = selectedApp.id.startsWith('VEH');
    const endpoint = isVehicle 
      ? `/applications/vehicle/${selectedApp.id}/decide`
      : `/applications/${selectedApp.id}/decide`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, modified_amount: modifiedAmount })
      });
      if (!res.ok) throw new Error("Decision request rejected by server.");
      
      setSelectedApp(null);
      setAgentResult(null);
      alert(`Decision registered successfully.`);
      
      if (isVehicle) {
        fetchPendingVehicleApps();
      } else {
        fetchPendingApps();
      }
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Co-Pilot Chat
  const handleSendChatMessage = async (e, textOverride = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const messageText = textOverride !== null ? textOverride : chatInput;
    if (!messageText.trim()) return;

    const userMsg = { role: 'user', content: messageText };
    setChatMessages(prev => [...prev, userMsg]);
    if (textOverride === null) {
      setChatInput("");
    }
    setIsChatLoading(true);

    const chatHistory = chatMessages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      content: msg.content
    }));

    try {
      const res = await fetch(`${API_BASE}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: chatHistory,
          context: selectedApp || null,
          role: user.role
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', content: "Failed to connect to ActuaryGPT agent server. Please confirm the backend server is running." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Intervals trigger
  useEffect(() => {
    if (user) {
      if (user.role === 'customer') {
        fetchCustomerSubmissions();
        fetchCustomerVehicleSubmissions();
        const interval = setInterval(() => {
          fetchCustomerSubmissions();
          fetchCustomerVehicleSubmissions();
        }, 5000);
        return () => clearInterval(interval);
      } else {
        fetchPendingApps();
        fetchPendingVehicleApps();
        fetchAnalytics();
        const interval = setInterval(() => {
          fetchPendingApps();
          fetchPendingVehicleApps();
          fetchAnalytics();
        }, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [user]);

  // Sync calculations from state
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

  // Renders customer layout view
  if (user.role === 'customer') {
    return (
      <div className="client-portal-wrapper">
        <Navbar user={user} onLogoutClick={handleLogout} />
        
        {/* Portal switcher */}
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            className={`btn-${customerFormTab === 'landing' ? 'primary' : 'secondary'}`}
            onClick={() => { setCustomerFormTab('landing'); setWizardStep(1); setWizardResult(null); }}
          >
            Home Menu
          </button>
          <button 
            className={`btn-${customerFormTab === 'life' ? 'primary' : 'secondary'}`}
            onClick={() => { setCustomerFormTab('life'); setWizardStep(1); setWizardResult(null); }}
          >
            Life Insurance
          </button>
          <button 
            className={`btn-${customerFormTab === 'vehicle' ? 'primary' : 'secondary'}`}
            onClick={() => { setCustomerFormTab('vehicle'); setWizardStep(1); setWizardResult(null); }}
          >
            Vehicle Claim
          </button>

          <button 
            className={`btn-${customerFormTab === 'chatbot' ? 'primary' : 'secondary'}`}
            onClick={() => { setCustomerFormTab('chatbot'); setWizardStep(1); setWizardResult(null); }}
          >
            AI Assistant
          </button>
        </div>

        <main className="dashboard-content animate-fade-in" style={{ padding: '2rem' }}>
          {customerFormTab === 'landing' && (
            <Landing 
              setTab={setCustomerFormTab} 
              setWizardStep={setWizardStep} 
              setWizardResult={setWizardResult} 
            />
          )}

          {wizardStep === 4 && customerFormTab === 'life' && (
            <Loader message="Processing policy application..." />
          )}

          {wizardStep === 4 && customerFormTab === 'vehicle' && (
            <ClaimProcessingScreen onComplete={handleClaimAnimationComplete} />
          )}
          
          {wizardStep === 5 && wizardResult && (
            customerFormTab === 'vehicle' ? (
              <VehicleResult 
                agentResult={wizardResult} 
                selectedApp={wizardResult} 
                API_BASE={API_BASE} 
                isOfficer={false}
              />
            ) : (
              <LifeResult 
                agentResult={wizardResult} 
                selectedApp={formData} 
                API_BASE={API_BASE} 
                isOfficer={false}
              />
            )
          )}

          {wizardStep < 4 && customerFormTab === 'life' && (
            <LifeInsurance
              formData={formData}
              setFormData={setFormData}
              wizardStep={wizardStep}
              setWizardStep={setWizardStep}
              customerSubmissions={customerSubmissions}
              API_BASE={API_BASE}
              handleCustomerSubmit={handleCustomerSubmit}
            />
          )}

          {wizardStep < 4 && customerFormTab === 'vehicle' && (
            <VehicleInsurance
              API_BASE={API_BASE}
              user={user}
              vehicleSubmissions={customerVehicleSubmissions}
              handleVehicleSubmit={handleVehicleSubmit}
              wizardStep={wizardStep}
              setWizardStep={setWizardStep}
            />
          )}



          {customerFormTab === 'chatbot' && (
            <Chatbot
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              isChatLoading={isChatLoading}
              selectedApp={null}
              handleSendChatMessage={handleSendChatMessage}
              isOfficer={false}
            />
          )}
        </main>
      </div>
    );
  }

  // Renders officer layouts
  return (
    <div className="officer-workspace-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar 
        user={user} 
        officerTab={officerTab} 
        setOfficerTab={(tab) => { setOfficerTab(tab); setSelectedApp(null); setAgentResult(null); setWizardStep(1); }} 
        pendingAppsCount={pendingApps.length + pendingVehicleApps.length} 
        onLogoutClick={handleLogout} 
      />

      <main className="officer-main-pane" style={{ flex: 1, padding: '2rem', overflowY: 'auto', height: '100vh' }}>
        {officerTab === 'dashboard' && (
          <Dashboard
            totalPolicies={totalPolicies}
            totalPremiums={totalPremiums}
            avgRiskClass={avgRiskClass}
            triageApprovalRate={triageApprovalRate}
            pendingApps={pendingApps}
            pendingVehicleApps={pendingVehicleApps}
            processedApps={analyticsSummary?.processed_list || []}
            vehicleClaimCount={analyticsSummary?.vehicle_metrics?.total_claims || 0}
            vehicleFraudRate={analyticsSummary?.vehicle_metrics?.fraud_rate || 0.0}
            setOfficerTab={setOfficerTab}
          />
        )}

        {officerTab === 'new_life_app' && (
          <div className="glass-card" style={{ maxWidth: '650px' }}>
            <h3 className="card-title">Initiate Policy Underwriting (Life & Health)</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const payload = {
                client: document.getElementById('officerFormClient').value,
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
              const res = await fetch(`${API_BASE}/applications`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
              });
              if (res.ok) {
                alert("Life application queued.");
                setFormData(DEFAULT_BLANK_FORM);
                fetchPendingApps();
                setOfficerTab('triage');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Customer Username</label>
                <input type="text" id="officerFormClient" className="form-input" required />
              </div>
              <div className="form-group-row">
                <div className="form-group"><label>Age (Years)</label><input type="number" className="form-input" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} required /></div>
                <div className="form-group"><label>Gender</label><select className="form-select" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}><option value="Male">Male</option><option value="Female">Female</option></select></div>
              </div>
              <div className="form-group-row">
                <div className="form-group"><label>Height (cm)</label><input type="number" className="form-input" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} required /></div>
                <div className="form-group"><label>Weight (kg)</label><input type="number" className="form-input" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} required /></div>
              </div>
              <div className="form-group-row">
                <div className="form-group"><label>BMI</label><input type="number" className="form-input" value={formData.bmi} onChange={(e) => setFormData({...formData, bmi: e.target.value})} required /></div>
                <div className="form-group"><label>Occupation</label><input type="text" className="form-input" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} required /></div>
              </div>
              <div className="form-group-row">
                <div className="form-group"><label>Income</label><input type="number" className="form-input" value={formData.income} onChange={(e) => setFormData({...formData, income: e.target.value})} required /></div>
                <div className="form-group"><label>Sum Assured Coverage</label><input type="number" className="form-input" value={formData.coverage_amount} onChange={(e) => setFormData({...formData, coverage_amount: e.target.value})} required /></div>
              </div>
              <button type="submit" className="btn-primary">Queue Application</button>
            </form>
          </div>
        )}

        {officerTab === 'new_vehicle_claim' && (
          <div className="glass-card" style={{ maxWidth: '650px' }}>
            <h3 className="card-title">Initiate Vehicle Claim filing</h3>
            <VehicleInsurance
              API_BASE={API_BASE}
              user={{ name: "officer_override" }}
              vehicleSubmissions={[]}
              handleVehicleSubmit={async (vData) => {
                const res = await fetch(`${API_BASE}/applications/vehicle`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(vData)
                });
                if (res.ok) {
                  alert("Vehicle claim queued.");
                  fetchPendingVehicleApps();
                  setOfficerTab('triage');
                }
              }}
              wizardStep={wizardStep}
              setWizardStep={setWizardStep}
            />
          </div>
        )}

        {officerTab === 'triage' && (
          <div className="officer-triage-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '2rem' }}>
            <div className="glass-card">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
                Submissions Queue ({pendingApps.length + pendingVehicleApps.length})
              </h3>
              
              {pendingApps.length === 0 && pendingVehicleApps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--risk-low)', opacity: 0.8 }} />
                  <p>All queue applications triaged!</p>
                </div>
              ) : (
                <div className="triage-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {pendingApps.map(app => (
                    <div 
                      key={app.id} 
                      className={`triage-item ${selectedApp?.id === app.id ? 'active' : ''}`}
                      onClick={() => { setSelectedApp(app); setAgentResult(null); setBackendError(null); }}
                      style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedApp?.id === app.id ? 'var(--primary-glow)' : 'var(--bg-input)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{app.client}</span>
                        <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>{app.id}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Life Policy • sum assured ₹{app.coverage_amount?.toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {pendingVehicleApps.map(app => (
                    <div 
                      key={app.id} 
                      className={`triage-item ${selectedApp?.id === app.id ? 'active' : ''}`}
                      onClick={() => { setSelectedApp(app); setAgentResult(null); setBackendError(null); }}
                      style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedApp?.id === app.id ? 'var(--primary-glow)' : 'var(--bg-input)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{app.client}</span>
                        <span style={{ color: 'var(--secondary)', fontSize: '0.8rem' }}>{app.id}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Vehicle Claim • claim amount ₹{app.total_claim_amount?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card" style={{ minHeight: '550px' }}>
              {!selectedApp ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
                  <Shield size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Select a pending transaction from the queue to start automated auditing profiling.</p>
                </div>
              ) : (
                <div className="animate-slide-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', color: 'var(--text-title)' }}>Applicant: {selectedApp.client}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {selectedApp.id} | Date: {selectedApp.date}</span>
                    </div>
                    {!isLoading && !agentResult && (
                      <button className="btn-primary" onClick={() => runActuarialAgent(selectedApp)}>
                        <Sparkles size={16} />
                        Run AI Profiler
                      </button>
                    )}
                  </div>

                  {!selectedApp.id.startsWith('VEH') ? (
                    /* Life workstation details */
                    <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div className="detail-box"><span className="detail-label">Age Index</span><span className="detail-val">{selectedApp.age}</span></div>
                      <div className="detail-box"><span className="detail-label">Gender</span><span className="detail-val">{selectedApp.gender}</span></div>
                      <div className="detail-box"><span className="detail-label">Height / Weight</span><span className="detail-val">{selectedApp.height}cm / {selectedApp.weight}kg</span></div>
                      <div className="detail-box"><span className="detail-label">BMI</span><span className="detail-val">{selectedApp.bmi}</span></div>
                      <div className="detail-box"><span className="detail-label">Income</span><span className="detail-val">₹{selectedApp.income?.toLocaleString()}</span></div>
                      <div className="detail-box"><span className="detail-label">Smoker</span><span className="detail-val">{selectedApp.smoker ? 'Yes' : 'No'}</span></div>
                      <div className="detail-box"><span className="detail-label">Claims History</span><span className="detail-val">{selectedApp.previous_claims} claims</span></div>
                      <div className="detail-box"><span className="detail-label">Type / Sum Assured</span><span className="detail-val">{selectedApp.insurance_type} / ₹{selectedApp.coverage_amount?.toLocaleString()}</span></div>
                      {selectedApp.medical_bill && (
                        <div className="detail-box" style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.04)', border: '1px dashed var(--primary)' }}>
                          <span className="detail-label" style={{ margin: 0 }}>Attached Medical Bill:</span>
                          <span className="detail-val" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>📄 {selectedApp.medical_bill}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Vehicle workstation details */
                    <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div className="detail-box"><span className="detail-label">Age</span><span className="detail-val">{selectedApp.age} yr</span></div>
                      <div className="detail-box"><span className="detail-label">Gender</span><span className="detail-val">{selectedApp.insured_sex}</span></div>
                      <div className="detail-box"><span className="detail-label">Occupation</span><span className="detail-val">{selectedApp.insured_occupation}</span></div>
                      <div className="detail-box"><span className="detail-label">Policy State / CSL</span><span className="detail-val">{selectedApp.policy_state} / {selectedApp.policy_csl}</span></div>
                      <div className="detail-box"><span className="detail-label">Annual Premium</span><span className="detail-val">₹{selectedApp.policy_annual_premium?.toLocaleString()}</span></div>
                      <div className="detail-box"><span className="detail-label">Deductible</span><span className="detail-val">{selectedApp.policy_deductable ? `₹${selectedApp.policy_deductable.toLocaleString()}` : '₹0'}</span></div>
                      <div className="detail-box"><span className="detail-label">Incident Severity</span><span className="detail-val">{selectedApp.incident_severity}</span></div>
                      <div className="detail-box"><span className="detail-label">Collision Type</span><span className="detail-val">{selectedApp.collision_type}</span></div>
                      <div className="detail-box"><span className="detail-label">Property Damage</span><span className="detail-val">{selectedApp.property_damage}</span></div>
                      <div className="detail-box"><span className="detail-label">Police Report</span><span className="detail-val">{selectedApp.police_report_available}</span></div>
                      <div className="detail-box"><span className="detail-label">Bodily Injuries</span><span className="detail-val">{selectedApp.bodily_injuries}</span></div>
                      <div className="detail-box"><span className="detail-label">Claim Payout</span><span className="detail-val" style={{ color: 'var(--primary)', fontWeight: 700 }}>₹{selectedApp.total_claim_amount?.toLocaleString()}</span></div>
                    </div>
                  )}

                  {backendError && (
                    <div style={{ padding: '1.5rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--risk-high-border)', borderRadius: 8, color: 'var(--risk-high)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={18} />
                        FastAPI Backend Server Offline
                      </div>
                      <p>{backendError}</p>
                    </div>
                  )}

                  {isLoading && <AIThinking pipelineSteps={pipelineSteps} />}
                  
                  {agentResult && !isLoading && !selectedApp.id.startsWith('VEH') && (
                    <LifeResult 
                      agentResult={agentResult} 
                      selectedApp={selectedApp} 
                      API_BASE={API_BASE} 
                      isOfficer={true} 
                      onApprove={(amt) => handleTriageDecision('approve', amt)}
                      onReject={() => handleTriageDecision('reject')}
                      onManualReview={() => handleTriageDecision('manual_review')}
                      expandedSimCaseId={expandedSimCaseId}
                      setExpandedSimCaseId={setExpandedSimCaseId}
                      processedApps={analyticsSummary?.processed_list || []}
                    />
                  )}

                  {agentResult && !isLoading && selectedApp.id.startsWith('VEH') && (
                    <VehicleResult 
                      agentResult={agentResult} 
                      selectedApp={selectedApp} 
                      API_BASE={API_BASE} 
                      isOfficer={true} 
                      onApprove={(amt) => handleTriageDecision('approve', amt)}
                      onReject={() => handleTriageDecision('reject')}
                      onManualReview={() => handleTriageDecision('manual_review')}
                      processedVehicleApps={analyticsSummary?.processed_vehicle_list || []}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {officerTab === 'history' && (
          <HistoryPage 
            processedApps={analyticsSummary?.processed_list?.filter(p => p.insurance_type !== 'Vehicle') || []} 
            processedVehicleApps={analyticsSummary?.processed_vehicle_list || []} 
            API_BASE={API_BASE} 
            onViewApp={(app, runProfiler = false) => {
              setSelectedApp(app);
              setOfficerTab('triage');
              if (app.report) {
                setAgentResult({
                  success: true,
                  fraud_reported: app.fraud_reported || 'N',
                  confidence: app.confidence || 92,
                  underwriting_decision: app.underwriting_decision || app.status,
                  report: app.report,
                  pdf_url: app.pdf_url,
                  similar_cases: app.similar_cases ? JSON.parse(app.similar_cases) : []
                });
              } else {
                setAgentResult(null);
              }
              if (runProfiler) {
                runActuarialAgent(app);
              }
            }}
          />
        )}

        {officerTab === 'analytics' && (
          <Analytics
            totalPolicies={totalPolicies}
            totalPremiums={totalPremiums}
            avgRiskClass={avgRiskClass}
            triageApprovalRate={triageApprovalRate}
            riskChartData={riskChartData}
            typeChartData={typeChartData}
            premiumTrendData={premiumTrendData}
          />
        )}

        {officerTab === 'assistant' && (
          <Chatbot
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isChatLoading={isChatLoading}
            selectedApp={selectedApp}
            handleSendChatMessage={handleSendChatMessage}
            isOfficer={true}
          />
        )}

        {officerTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

// Wrapper for Auth context holding current logged in state
export default function AppWrapper() {
  const savedUser = localStorage.getItem('actuary_auth_user');
  const [currentUser, setCurrentUser] = useState(savedUser ? JSON.parse(savedUser) : null);

  const handleLoginSuccess = (loggedInUser) => {
    setCurrentUser(loggedInUser);
    localStorage.setItem('actuary_auth_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('actuary_auth_user');
  };

  if (!currentUser) {
    return <Login API_BASE={API_BASE} onLoginSuccess={handleLoginSuccess} />;
  }

  return <App user={currentUser} handleLogout={handleLogout} />;
}
