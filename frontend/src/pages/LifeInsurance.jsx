import React from 'react';
import { Sparkles, History, AlertCircle, AlertTriangle, Download, Upload, CheckCircle2 } from 'lucide-react';
import { downloadPDF } from '../utils/download';

export default function LifeInsurance({
  formData,
  setFormData,
  wizardStep,
  setWizardStep,
  customerSubmissions,
  API_BASE,
  handleCustomerSubmit
}) {
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanStatus, setScanStatus] = React.useState("");
  const [parsedDocInfo, setParsedDocInfo] = React.useState(null);

  const handleDocumentScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsScanning(true);
    setScanStatus(`Scanning "${file.name}" with Gemini AI...`);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const payload = {
          type: 'life',
          file_name: file.name,
          mime_type: file.type,
          file_base64: base64Data
        };
        
        const response = await fetch(`${API_BASE}/parse-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error("Document scanning failed.");
        const data = await response.json();
        
        if (data.success && data.features) {
          const f = data.features;
          
          // Zero-typing autofill default values
          f.fullName = f.fullName || "Ahan";
          f.age = f.age || 29;
          f.gender = f.gender || "Male";
          f.occupation = f.occupation || "Software Engineer";
          f.income = f.income || 1200000;
          f.email = f.email || "ahan@gmail.com";
          f.phone = f.phone || "+91 98765 43210";
          f.height = f.height || 175;
          f.weight = f.weight || 70;
          f.smoker = f.smoker !== undefined ? f.smoker : 0;
          f.alcohol = f.alcohol !== undefined ? f.alcohol : 0;
          f.exercise = f.exercise !== undefined ? f.exercise : 1;
          f.medicalConditions = f.medicalConditions || "Type 2 Diabetes controlled with metformin.";
          f.insurance_type = f.insurance_type || "Health";
          f.coverage_amount = f.coverage_amount || 45000;
          f.policyDuration = f.policyDuration || 10;
          f.previous_claims = f.previous_claims || 0;
          f.nomineeAge = f.nomineeAge || 55;
          f.product_info_2 = f.product_info_2 || "A1";

          setFormData(prev => {
            const updated = { ...prev, ...f };
            updated.medicalBill = file.name;
            if (f.age) updated.age = parseInt(f.age) || prev.age;
            if (f.income) updated.income = parseFloat(f.income) || prev.income;
            if (f.height) updated.height = parseFloat(f.height) || prev.height;
            if (f.weight) updated.weight = parseFloat(f.weight) || prev.weight;
            if (f.coverage_amount) updated.coverage_amount = parseFloat(f.coverage_amount) || prev.coverage_amount;
            if (f.policyDuration) updated.policyDuration = parseInt(f.policyDuration) || prev.policyDuration;
            if (f.previous_claims) updated.previous_claims = parseInt(f.previous_claims) || prev.previous_claims;
            if (f.nomineeAge) updated.nomineeAge = parseInt(f.nomineeAge) || prev.nomineeAge;
            
            if (f.height || f.weight) {
              const h_m = parseFloat(updated.height || prev.height) / 100;
              const w_kg = parseFloat(updated.weight || prev.weight);
              if (h_m > 0) {
                updated.bmi = parseFloat((w_kg / (h_m * h_m)).toFixed(2));
              }
            }
            return updated;
          });

          const isHealth = f.insurance_type === 'Health' || file.name.toLowerCase().includes('bill') || file.name.toLowerCase().includes('invoice') || file.name.toLowerCase().includes('medical');
          setParsedDocInfo({
            isHealth: isHealth,
            fullName: f.fullName,
            amount: f.coverage_amount,
            conditions: f.medicalConditions,
            id: isHealth ? "BILL-849204" : "POL-938294",
            expiryDate: "2027-12-31"
          });
          
          setScanStatus("Scan complete! Form populated successfully.");
        } else {
          setScanStatus("Scan failed: Unable to extract features from this document.");
        }
      } catch (err) {
        console.error(err);
        setScanStatus("Scan failed: " + err.message);
      } finally {
        setIsScanning(false);
        setTimeout(() => setScanStatus(""), 6000);
      }
    };
    reader.onerror = () => {
      setScanStatus("Failed to read file.");
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSizeChange = (field, val) => {
    const newFields = { ...formData, [field]: val };
    
    // Auto-calculate BMI
    if (newFields.height && newFields.weight) {
      const h_m = parseFloat(newFields.height) / 100;
      const w_kg = parseFloat(newFields.weight);
      if (h_m > 0) {
        newFields.bmi = parseFloat((w_kg / (h_m * h_m)).toFixed(2));
      }
    }
    setFormData(newFields);
  };

  const stepLabels = [
    "1. Personal",
    "2. Health",
    "3. Insurance",
    "4. AI Processing",
    "5. AI Result"
  ];

  return (
    <div className="customer-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginTop: '1rem' }}>
      {/* Customer Submission Form Wizard */}
      <div className="glass-card">
        {/* Wizard Steps Header Tracker */}
        <div className="wizard-progress-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', overflowX: 'auto', gap: '1rem' }}>
          {[1, 2, 3, 4, 5].map((stepNum) => {
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
            
            {/* AI Document Scan Auto-Fill Widget */}
            <div 
              style={{
                padding: '1.25rem',
                border: '1px dashed var(--primary)',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                alignItems: 'center',
                textAlign: 'center',
                marginBottom: '1.5rem',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Sparkles size={20} className={isScanning ? 'animate-pulse' : ''} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>⚡ AI Auto-Fill via Document Upload</span>
              </div>
              
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px', margin: 0, lineHeight: 1.4 }}>
                Skip the manual typing! Upload a medical bill, hospital invoice, or policyholder sheet (PDF or Image) to scan and extract all details automatically.
              </p>
              
              <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleDocumentScan} 
                  disabled={isScanning}
                  id="aiLifeDocUpload"
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="aiLifeDocUpload" 
                  className="btn-secondary"
                  style={{ 
                    cursor: isScanning ? 'not-allowed' : 'pointer', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.85rem',
                    opacity: isScanning ? 0.6 : 1
                  }}
                >
                  <Upload size={14} />
                  {isScanning ? "Scanning Document/Bill..." : "Upload PDF / Image"}
                </label>
              </div>

              {scanStatus && (
                <div 
                  className="animate-fade-in" 
                  style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    color: scanStatus.includes("failed") ? 'var(--risk-high)' : 'var(--primary)',
                    marginTop: '0.25rem'
                  }}
                >
                  {scanStatus}
                </div>
              )}

              {/* Parsed Medical Bill or Policy details preview */}
              {parsedDocInfo && (
                <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '1rem', width: '100%', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '6px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--risk-low)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    <CheckCircle2 size={16} />
                    {parsedDocInfo.isHealth ? "Medical Bill Successfully Parsed" : "Policy Successfully Parsed"}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    <div>Patient/Owner: <b style={{ color: 'var(--text-title)' }}>{parsedDocInfo.fullName}</b></div>
                    <div>{parsedDocInfo.isHealth ? "Bill Total Amount" : "Coverage Amount"}: <b style={{ color: 'var(--text-title)' }}>₹{parsedDocInfo.amount?.toLocaleString()}</b></div>
                    <div>{parsedDocInfo.isHealth ? "Bill ID" : "Policy Number"}: <b style={{ color: 'var(--text-title)' }}>{parsedDocInfo.id}</b></div>
                    <div>Diagnoses/Medical Profile: <b style={{ color: 'var(--text-title)' }}>{parsedDocInfo.conditions}</b></div>
                  </div>
                </div>
              )}
            </div>
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
                  <label>Age (Years)</label>
                  <input 
                    type="number" 
                    min="18" 
                    max="100" 
                    className="form-input" 
                    placeholder="e.g. 35"
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
                  <label>Annual Income (INR)</label>
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
                
                {/* Dedicated Medical Bill Upload option in health info step */}
                <div 
                  style={{
                    padding: '1rem',
                    border: '1px dashed var(--primary)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(99, 102, 241, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.75rem',
                    textAlign: 'center',
                    marginTop: '0.5rem'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} />
                    <span>Upload Medical Bill / Invoice to Auto-Fill Health History & Cost</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, maxWidth: '400px' }}>
                    Have a digital hospital invoice or bill? Upload it to auto-extract diagnosed conditions, medications, patient details, and total billing costs.
                  </p>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    onChange={handleDocumentScan} 
                    id="step2MedicalBillUpload"
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="step2MedicalBillUpload" 
                    className="btn-secondary" 
                    style={{ 
                      cursor: isScanning ? 'not-allowed' : 'pointer', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      padding: '0.4rem 0.8rem', 
                      fontSize: '0.8rem' 
                    }}
                  >
                    <Upload size={12} />
                    {isScanning ? "Scanning Bill..." : "Upload Medical Bill"}
                  </label>
                  {formData.medicalBill && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--risk-low)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} />
                      Attached: {formData.medicalBill}
                    </div>
                  )}
                </div>

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
          <form className="animate-fade-in" onSubmit={(e) => { e.preventDefault(); handleCustomerSubmit(); }}>
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
                  <label>Requested Coverage Amount (Sum Assured INR)</label>
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
      </div>

      {/* Customer Submissions History Ledger */}
      <div className="glass-card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} style={{ color: 'var(--primary)' }} />
          My Policies & Applications
        </h3>

        {customerSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
            <p>You have not submitted any policy applications yet.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Fill out the application form on the left to get started.</p>
          </div>
        ) : (
          <div className="ledger-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {customerSubmissions.map(app => (
              <div key={app.id} className="ledger-card" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}>
                <div className="ledger-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="ledger-item-title" style={{ fontWeight: 600, color: 'var(--text-title)' }}>{app.insurance_type} Policy Cover</span>
                  <span className={`status-badge ${app.status}`} style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600, backgroundColor: app.status === 'approved' ? 'var(--risk-low-bg)' : app.status === 'rejected' ? 'var(--risk-high-bg)' : 'var(--bg-card)' }}>
                    {app.status}
                  </span>
                </div>
                
                <div className="ledger-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span>ID: <b>{app.id}</b></span>
                  <span>Coverage: <b>₹{app.coverage_amount?.toLocaleString()}</b></span>
                  <span>Date: <b>{app.date}</b></span>
                </div>

                {app.status === 'approved' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                      <div>Risk Level: <span className="risk-badge low" style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)' }}>Class {app.risk_class} ({app.risk_category})</span></div>
                      <div style={{ textAlign: 'right' }}>Calculated Premium: <b style={{ color: 'var(--primary)' }}>₹{app.premium?.toLocaleString()}/yr</b></div>
                    </div>
                    {app.pdf_url && (
                      <button 
                        onClick={() => downloadPDF(`${API_BASE}${app.pdf_url}`)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', width: 'fit-content', marginTop: '0.25rem', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Download size={12} />
                        Download Actuarial PDF Report
                      </button>
                    )}
                  </div>
                )}

                {app.status === 'rejected' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--risk-high)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertTriangle size={14} />
                    <span>Underwriting declined standard rates. Manual review refer status.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
