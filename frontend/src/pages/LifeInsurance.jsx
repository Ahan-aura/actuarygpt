import React, { useState, useEffect } from 'react';
import { Sparkles, History, AlertCircle, AlertTriangle, Download, Upload, CheckCircle2, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LifeInsurance({
  formData,
  setFormData,
  wizardStep,
  setWizardStep,
  customerSubmissions = [],
  API_BASE,
  handleCustomerSubmit
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [parsedDocInfo, setParsedDocInfo] = useState(null);

  // local states for claim specific fields to sync into formData
  const [claimType, setClaimType] = useState(formData.insurance_type || "Health");
  const [claimId] = useState(() => formData.id || "CLM-" + Math.floor(100000 + Math.random() * 900000));
  
  // Sync claimType to parent formData
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      id: claimId,
      insurance_type: claimType
    }));
  }, [claimType, claimId, setFormData]);

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
          
          // Auto-fill extracted values
          const updatedType = f.insurance_type === 'Life' ? 'Life' : 'Health';
          setClaimType(updatedType);

          setFormData(prev => {
            const updated = {
              ...prev,
              fullName: f.fullName || prev.fullName || "Ahan",
              age: parseInt(f.age) || prev.age || 29,
              gender: f.gender || prev.gender || "Male",
              email: f.email || prev.email || "ahan@gmail.com",
              phone: f.phone || prev.phone || "+91 98765 43210",
              coverage_amount: parseFloat(f.coverage_amount) || prev.coverage_amount || 45000.0,
              medicalConditions: f.medicalConditions || prev.medicalConditions || "",
              medicalBill: file.name,
              insurance_type: updatedType
            };
            return updated;
          });

          setParsedDocInfo({
            isHealth: updatedType === 'Health',
            fullName: f.fullName || "Ahan",
            amount: f.coverage_amount || 45000.0,
            conditions: f.medicalConditions || "Extracted claim documentation review.",
            id: claimId,
            expiryDate: "2027-12-31"
          });
          
          setScanStatus("Scan complete! Claim form populated successfully.");
        } else {
          setScanStatus("Scan failed: Unable to extract claim features.");
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

  const stepLabels = [
    "1. Claim Selection",
    "2. Claim Details",
    "3. Attach Documents"
  ];

  return (
    <div className="customer-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginTop: '1rem' }}>
      {/* Customer Submission Form Wizard */}
      <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--bg-card)' }}>
        
        {/* Wizard Steps Header Tracker */}
        <div className="wizard-progress-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', overflowX: 'auto', gap: '1rem' }}>
          {[1, 2, 3].map((stepNum) => {
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

        {/* STEP 1: Select Claim Type & Common Fields */}
        {wizardStep === 1 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>
              Step 1: Select Claim Type & General Details
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
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Sparkles size={20} className={isScanning ? 'animate-pulse' : ''} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>⚡ AI Auto-Fill via Document Upload</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px', margin: 0, lineHeight: 1.4 }}>
                Upload any Hospital Invoice, Medical Report, or Death Certificate to automatically detect the Claim Type and parse details instantly.
              </p>
              
              <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleDocumentScan} 
                  disabled={isScanning}
                  id="aiClaimDocUpload"
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="aiClaimDocUpload" 
                  className="btn-secondary"
                  style={{ 
                    cursor: isScanning ? 'not-allowed' : 'pointer', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.85rem'
                  }}
                >
                  <Upload size={14} />
                  {isScanning ? "Scanning with Gemini..." : "Upload Document / Certificate"}
                </label>
              </div>

              {scanStatus && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{scanStatus}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Claim Type *</label>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="radio" 
                      name="claim_type" 
                      value="Health"
                      checked={claimType === "Health"} 
                      onChange={(e) => setClaimType(e.target.value)}
                    />
                    Health Insurance Claim
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="radio" 
                      name="claim_type" 
                      value="Life"
                      checked={claimType === "Life"} 
                      onChange={(e) => setClaimType(e.target.value)}
                    />
                    Life Insurance Claim
                  </label>
                </div>
              </div>

              <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Claim ID (Auto-generated)</label>
                  <input type="text" className="form-input" value={claimId} disabled />
                </div>
                <div className="form-group">
                  <label>Policy Number *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. POL-849204" 
                    value={formData.product_info_2 || ""} 
                    onChange={(e) => handleInputChange('product_info_2', e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Policyholder Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Full Name" 
                    value={formData.fullName || ""} 
                    onChange={(e) => handleInputChange('fullName', e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Nominee Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Beneficiary Name" 
                    value={formData.nomineeName || ""} 
                    onChange={(e) => handleInputChange('nomineeName', e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="e.g. +91 98765 43210" 
                    value={formData.phone || ""} 
                    onChange={(e) => handleInputChange('phone', e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. ahan@gmail.com" 
                    value={formData.email || ""} 
                    onChange={(e) => handleInputChange('email', e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Aadhaar / ID Number *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Aadhaar / National ID" 
                    value={formData.aadhaarId || ""} 
                    onChange={(e) => handleInputChange('aadhaarId', e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Claim Amount Requested (INR) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="₹ Claim amount" 
                    value={formData.coverage_amount || ""} 
                    onChange={(e) => handleInputChange('coverage_amount', e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bank Account Details (IFSC & Account No) *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. HDFC0000123 - A/C 50100239102" 
                  value={formData.bankDetails || ""} 
                  onChange={(e) => handleInputChange('bankDetails', e.target.value)} 
                  required 
                />
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={() => {
                    if (!formData.product_info_2 || !formData.fullName || !formData.phone || !formData.email || !formData.coverage_amount) {
                      alert("Please complete all required fields (*).");
                      return;
                    }
                    setWizardStep(2);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Next Step
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Claim Type Specific Fields */}
        {wizardStep === 2 && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>
              Step 2: Specific Details for {claimType} Insurance Claim
            </h3>

            {claimType === "Health" ? (
              /* Health Insurance Fields */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Hospital Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Hospital Name" 
                      value={formData.hospitalName || ""} 
                      onChange={(e) => handleInputChange('hospitalName', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Hospital Provider ID</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Hospital ID" 
                      value={formData.hospitalId || ""} 
                      onChange={(e) => handleInputChange('hospitalId', e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Admission Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formData.admissionDate || ""} 
                      onChange={(e) => handleInputChange('admissionDate', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Discharge Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formData.dischargeDate || ""} 
                      onChange={(e) => handleInputChange('dischargeDate', e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Diagnosis *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Acute Appendicitis" 
                      value={formData.medicalConditions || ""} 
                      onChange={(e) => handleInputChange('medicalConditions', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Treatment Type *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Appendectomy surgery" 
                      value={formData.treatmentType || ""} 
                      onChange={(e) => handleInputChange('treatmentType', e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Doctor / Consultant Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Dr. Full Name" 
                      value={formData.doctorName || ""} 
                      onChange={(e) => handleInputChange('doctorName', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Hospital Bill Amount (INR) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="₹ Hospital bill total" 
                      value={formData.hospitalBillAmount || ""} 
                      onChange={(e) => handleInputChange('hospitalBillAmount', e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Life Insurance Fields */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Date of Death *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formData.dateOfDeath || ""} 
                      onChange={(e) => handleInputChange('dateOfDeath', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Cause of Death *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Cardiorespiratory arrest" 
                      value={formData.medicalConditions || ""} 
                      onChange={(e) => handleInputChange('medicalConditions', e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Place of Death *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Hospital or residence city" 
                      value={formData.placeOfDeath || ""} 
                      onChange={(e) => handleInputChange('placeOfDeath', e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship of Nominee to Deceased *</label>
                    <select 
                      className="form-select" 
                      value={formData.relationshipOfNominee || "Spouse"} 
                      onChange={(e) => handleInputChange('relationshipOfNominee', e.target.value)}
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Son / Daughter</option>
                      <option value="Parent">Father / Mother</option>
                      <option value="Sibling">Brother / Sister</option>
                      <option value="Other">Other Legal Heir</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Accident Details (if accidental death)</label>
                  <textarea 
                    className="form-input" 
                    placeholder="Briefly describe accident collision details if reported in FIR..." 
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={formData.accidentDetails || ""} 
                    onChange={(e) => handleInputChange('accidentDetails', e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label>Witness Details (optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Name and contact details of witness" 
                    value={formData.witnessDetails || ""} 
                    onChange={(e) => handleInputChange('witnessDetails', e.target.value)} 
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn-secondary" onClick={() => setWizardStep(1)}>
                Previous
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => {
                  if (claimType === "Health") {
                    if (!formData.hospitalName || !formData.admissionDate || !formData.dischargeDate || !formData.medicalConditions || !formData.doctorName || !formData.hospitalBillAmount) {
                      alert("Please fill in all required Health fields (*).");
                      return;
                    }
                  } else {
                    if (!formData.dateOfDeath || !formData.medicalConditions || !formData.placeOfDeath) {
                      alert("Please fill in all required Death particulars (*).");
                      return;
                    }
                  }
                  setWizardStep(3);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Next Step
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Supporting Documents & Submit */}
        {wizardStep === 3 && (
          <form className="animate-fade-in" onSubmit={(e) => { e.preventDefault(); handleCustomerSubmit(); }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>
              Step 3: Attach Claim Documents & File
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Supporting Documents (Common) */}
              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Supporting ID / Policy Document *</label>
                <div style={{ border: '1px dashed var(--border)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-input)' }}>
                  <Upload size={20} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Identity card or original policy copy</span>
                  <input type="file" required style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('medicalBill', e.target.files[0]?.name || "")} />
                </div>
              </div>

              {claimType === "Health" ? (
                /* Health Insurance Uploads */
                <>
                  <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Medical Diagnosis Reports *</label>
                      <input type="file" required style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('medicalReportsFile', e.target.files[0]?.name || "")} />
                    </div>
                    <div className="form-group">
                      <label>Discharge Summary *</label>
                      <input type="file" required style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('dischargeSummaryFile', e.target.files[0]?.name || "")} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Doctor's Prescription *</label>
                    <input type="file" required style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('prescriptionFile', e.target.files[0]?.name || "")} />
                  </div>
                </>
              ) : (
                /* Life Insurance Uploads */
                <>
                  <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Death Certificate Copy *</label>
                      <input type="file" required style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('deathCertificateFile', e.target.files[0]?.name || "")} />
                    </div>
                    <div className="form-group">
                      <label>Nominee ID Proof *</label>
                      <input type="file" required style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('nomineeIdProofFile', e.target.files[0]?.name || "")} />
                    </div>
                  </div>

                  <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Hospital Medical Records (optional)</label>
                      <input type="file" style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('hospitalRecordsFile', e.target.files[0]?.name || "")} />
                    </div>
                    <div className="form-group">
                      <label>Police FIR (if accidental death)</label>
                      <input type="file" style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('policeFirFile', e.target.files[0]?.name || "")} />
                    </div>
                  </div>

                  <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Postmortem Report (if applicable)</label>
                      <input type="file" style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('postmortemReportFile', e.target.files[0]?.name || "")} />
                    </div>
                    <div className="form-group">
                      <label>Funeral / Cremation Certificate</label>
                      <input type="file" style={{ fontSize: '0.8rem' }} onChange={(e) => handleInputChange('funeralCertificateFile', e.target.files[0]?.name || "")} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn-secondary" onClick={() => setWizardStep(2)}>
                  Previous
                </button>
                <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} />
                  Submit Claim to AI Auditor
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Customer Claims Ledger on the Right side */}
      <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--bg-card)' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>
          <History size={18} style={{ color: 'var(--primary)' }} />
          My Filed Claims
        </h3>

        {customerSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
            <p>You have not filed any claims yet.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Complete the wizard on the left to file your first claim.</p>
          </div>
        ) : (
          <div className="ledger-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {customerSubmissions.map(app => (
              <div key={app.id} className="ledger-card" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}>
                <div className="ledger-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="ledger-item-title" style={{ fontWeight: 600, color: 'var(--text-title)', fontSize: '0.85rem' }}>
                    {app.insurance_type} Claim
                  </span>
                  <span className={`status-badge ${app.status}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, backgroundColor: app.status === 'approved' ? 'var(--risk-low-bg)' : app.status === 'rejected' ? 'var(--risk-high-bg)' : 'var(--border)' }}>
                    {app.status}
                  </span>
                </div>
                
                <div className="ledger-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>ID: <b>{app.id}</b></span>
                  <span>Claimed: <b>₹{parseFloat(app.coverage_amount || 0).toLocaleString()}</b></span>
                  <span>Date: <b>{app.date}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
