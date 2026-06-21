import React, { useState } from 'react';
import { Sparkles, Car, ShieldAlert, History, Upload, FileText, CheckCircle2, Camera, AlertTriangle } from 'lucide-react';


const DEFAULT_VEHICLE_FORM = {
  client: "",
  months_as_customer: "",
  age: "",
  policy_state: "",
  policy_csl: "250/500",
  policy_deductable: "",
  policy_annual_premium: "",
  umbrella_limit: "",
  insured_sex: "MALE",
  insured_education_level: "MD",
  insured_occupation: "",
  insured_hobbies: "reading",
  insured_relationship: "husband",
  capital_gains: "",
  capital_loss: "",
  incident_type: "Single Vehicle Collision",
  collision_type: "Side Collision",
  incident_severity: "Minor Damage",
  authorities_contacted: "Police",
  incident_state: "",
  incident_city: "",
  incident_hour_of_the_day: "",
  number_of_vehicles_involved: "",
  property_damage: "NO",
  bodily_injuries: "",
  witnesses: "",
  police_report_available: "NO",
  total_claim_amount: "",
  injury_claim: "",
  property_claim: "",
  vehicle_claim: "",
  auto_make: "",
  auto_model: "",
  auto_year: ""
};

export default function VehicleInsurance({
  API_BASE,
  user,
  vehicleSubmissions = [],
  handleVehicleSubmit,
  wizardStep,
  setWizardStep
}) {
  const [formData, setFormData] = useState({ 
    ...DEFAULT_VEHICLE_FORM, 
    client: user?.name === 'officer_override' ? '' : (user?.name || "") 
  });
  
  // Custom non-ML model variables for visual alignment
  const [ownerName, setOwnerName] = useState(user?.name === 'officer_override' ? '' : (user?.name || ""));
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [accidentDate, setAccidentDate] = useState("");
  const [accidentTime, setAccidentTime] = useState("");
  const [accidentDesc, setAccidentDesc] = useState("");

  const [uploadedFiles, setUploadedFiles] = useState({
    images: false,
    fir: false,
    insurance: false
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");

  // AI Damage Scanner State
  const [isDamageScanning, setIsDamageScanning] = useState(false);
  const [damageScanStatus, setDamageScanStatus] = useState("");
  const [damageScanResult, setDamageScanResult] = useState(null);
  const [damageImageUrl, setDamageImageUrl] = useState("");

  const handleDamageScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsDamageScanning(true);
    setDamageScanStatus(`Uploading and scanning vehicle image...`);
    setDamageScanResult(null);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        setDamageImageUrl(base64Data);
        
        const payload = {
          file_name: file.name,
          mime_type: file.type,
          file_base64: base64Data
        };
        
        const response = await fetch(`${API_BASE}/analyze-damage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error("Damage scan failed.");
        const data = await response.json();
        
        if (data.success && data.result) {
          const res = data.result;
          setDamageScanResult(res);
          
          // Auto fill damage details
          setFormData(prev => {
            const updated = { ...prev };
            
            // Map severity to valid HTML select options: "Trivial Damage", "Minor Damage", "Major Damage", "Total Loss"
            if (res.severity) {
              const validSeverities = ["Trivial Damage", "Minor Damage", "Major Damage", "Total Loss"];
              // Find matching or default to Minor
              const matched = validSeverities.find(s => s.toLowerCase() === res.severity.toLowerCase()) || "Minor Damage";
              updated.incident_severity = matched;
            }
            
            if (res.estimated_repair_cost !== undefined) {
              updated.vehicle_claim = parseFloat(res.estimated_repair_cost) || 0;
            }
            
            // Recalculate total claim
            updated.total_claim_amount = 
              (parseFloat(updated.injury_claim) || 0) + 
              (parseFloat(updated.property_claim) || 0) + 
              (parseFloat(updated.vehicle_claim) || 0);
              
            return updated;
          });
          
          setUploadedFiles(prev => ({ ...prev, images: true }));
          setDamageScanStatus("AI Auto-Scan complete! Damage values applied.");
        } else {
          setDamageScanStatus("Damage scan failed: No result returned from AI model.");
        }
      } catch (err) {
        console.error(err);
        setDamageScanStatus("Damage scan failed: " + err.message);
      } finally {
        setIsDamageScanning(false);
      }
    };
    reader.onerror = () => {
      setDamageScanStatus("Failed to read image file.");
      setIsDamageScanning(false);
    };
    reader.readAsDataURL(file);
  };

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
          type: 'vehicle',
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
          
          // Populate local states
          if (f.ownerName) setOwnerName(f.ownerName);
          if (f.phone) setPhone(f.phone);
          if (f.email) setEmail(f.email);
          if (f.vehicleNumber) setVehicleNumber(f.vehicleNumber);
          if (f.policyNumber) setPolicyNumber(f.policyNumber);
          if (f.accidentDate) setAccidentDate(f.accidentDate);
          if (f.accidentTime) setAccidentTime(f.accidentTime);
          if (f.accidentDesc) setAccidentDesc(f.accidentDesc);
          
          // Populate ML form data
          setFormData(prev => {
            const updated = { ...prev, ...f };
            // Ensure values are numbers where appropriate
            if (f.age) updated.age = parseInt(f.age) || prev.age;
            if (f.months_as_customer) updated.months_as_customer = parseInt(f.months_as_customer) || prev.months_as_customer;
            if (f.policy_deductable) updated.policy_deductable = parseFloat(f.policy_deductable) || prev.policy_deductable;
            if (f.policy_annual_premium) updated.policy_annual_premium = parseFloat(f.policy_annual_premium) || prev.policy_annual_premium;
            if (f.umbrella_limit) updated.umbrella_limit = parseFloat(f.umbrella_limit) || prev.umbrella_limit;
            if (f.capital_gains) updated.capital_gains = parseFloat(f.capital_gains) || prev.capital_gains;
            if (f.capital_loss) updated.capital_loss = parseFloat(f.capital_loss) || prev.capital_loss;
            if (f.witnesses) updated.witnesses = parseInt(f.witnesses) || prev.witnesses;
            if (f.property_claim) updated.property_claim = parseFloat(f.property_claim) || prev.property_claim;
            if (f.vehicle_claim) updated.vehicle_claim = parseFloat(f.vehicle_claim) || prev.vehicle_claim;
            if (f.injury_claim) updated.injury_claim = parseFloat(f.injury_claim) || prev.injury_claim;
            
            // Auto calculate total claim amount
            updated.total_claim_amount = 
              (parseFloat(updated.injury_claim) || 0) + 
              (parseFloat(updated.property_claim) || 0) + 
              (parseFloat(updated.vehicle_claim) || 0);
              
            return updated;
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
        setTimeout(() => setScanStatus(""), 4000);
      }
    };
    reader.onerror = () => {
      setScanStatus("Failed to read file.");
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field, val) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: val };
      
      // Auto-compute total claim amount if component claims change
      if (field === 'injury_claim' || field === 'property_claim' || field === 'vehicle_claim') {
        updated.total_claim_amount = 
          (parseFloat(updated.injury_claim) || 0) + 
          (parseFloat(updated.property_claim) || 0) + 
          (parseFloat(updated.vehicle_claim) || 0);
      }
      return updated;
    });
  };

  const steps = [
    "Step 1: Customer & Vehicle",
    "Step 2: Accident Details",
    "Step 3: Claim Details"
  ];

  const onSubmit = (e) => {
    e.preventDefault();
    // Parse time hour
    let hour = 12;
    try {
      hour = parseInt(accidentTime.split(":")[0]) || 12;
    } catch (_) {}
    
    const finalPayload = {
      client: ownerName || formData.client || (user?.name || ""),
      months_as_customer: parseInt(formData.months_as_customer) || 24,
      age: parseInt(formData.age) || 35,
      policy_state: formData.policy_state || "MH",
      policy_csl: formData.policy_csl || "250/500",
      policy_deductable: parseFloat(formData.policy_deductable) || 500.0,
      policy_annual_premium: parseFloat(formData.policy_annual_premium) || 1000.0,
      umbrella_limit: parseFloat(formData.umbrella_limit) || 0.0,
      insured_sex: formData.insured_sex || "MALE",
      insured_education_level: formData.insured_education_level || "MD",
      insured_occupation: formData.insured_occupation || "professional",
      insured_hobbies: formData.insured_hobbies || "reading",
      insured_relationship: formData.insured_relationship || "husband",
      capital_gains: parseFloat(formData.capital_gains) || 0.0,
      capital_loss: parseFloat(formData.capital_loss) || 0.0,
      incident_type: formData.incident_type || "Single Vehicle Collision",
      collision_type: formData.collision_type || "Side Collision",
      incident_severity: formData.incident_severity || "Minor Damage",
      authorities_contacted: formData.authorities_contacted || "Police",
      incident_state: formData.incident_state || "MH",
      incident_city: formData.incident_city || "Mumbai",
      incident_hour_of_the_day: hour,
      number_of_vehicles_involved: parseInt(formData.number_of_vehicles_involved) || 1,
      property_damage: formData.property_damage || "NO",
      bodily_injuries: parseInt(formData.bodily_injuries) || 0,
      witnesses: parseInt(formData.witnesses) || 0,
      police_report_available: formData.police_report_available || "NO",
      total_claim_amount: parseFloat(formData.total_claim_amount) || 0.0,
      injury_claim: parseFloat(formData.injury_claim) || 0.0,
      property_claim: parseFloat(formData.property_claim) || 0.0,
      vehicle_claim: parseFloat(formData.vehicle_claim) || 0.0,
      auto_make: formData.auto_make || "Unknown",
      auto_model: formData.auto_model || "Unknown",
      auto_year: parseInt(formData.auto_year) || 2015,
      date: accidentDate
    };
    handleVehicleSubmit(finalPayload);
  };

  const triggerUpload = (type) => {
    setUploadedFiles(prev => ({ ...prev, [type]: true }));
  };

  return (
    <div className="customer-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginTop: '1rem' }}>
      {/* Wizard Form Card */}
      <div className="glass-card">
        <div className="wizard-progress-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', gap: '1rem' }}>
          {[1, 2, 3].map((stepNum) => {
            let color = 'var(--text-muted)';
            let weight = 500;
            if (wizardStep === stepNum) {
              color = 'var(--secondary)';
              weight = 700;
            } else if (stepNum < wizardStep) {
              color = 'var(--risk-low)';
              weight = 600;
            }
            return (
              <div key={stepNum} style={{ fontSize: '0.85rem', fontWeight: weight, color, display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  fontSize: '0.75rem',
                  backgroundColor: wizardStep === stepNum ? 'var(--secondary)' : stepNum < wizardStep ? 'var(--risk-low-bg)' : 'var(--bg-input)',
                  border: `1px solid ${wizardStep === stepNum ? 'var(--secondary)' : stepNum < wizardStep ? 'var(--risk-low)' : 'var(--border)'}`,
                  color: wizardStep === stepNum ? '#fff' : stepNum < wizardStep ? 'var(--risk-low)' : 'var(--text-muted)'
                }}>
                  {stepNum < wizardStep ? '✓' : stepNum}
                </span>
                {steps[stepNum - 1]}
              </div>
            );
          })}
        </div>

        {/* STEP 1: Customer & Vehicle Details */}
        {wizardStep === 1 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>🚙 Step 1: Customer & Vehicle Details</h3>
            
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
                marginBottom: '0.5rem',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Sparkles size={20} className={isScanning ? 'animate-pulse' : ''} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>⚡ AI Auto-Fill via Document Upload</span>
              </div>
              
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px', margin: 0, lineHeight: 1.4 }}>
                Don't want to type? Upload an accident report, claims form, or policy document (PDF or Image) to automatically scan and extract all details.
              </p>
              
              <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleDocumentScan} 
                  disabled={isScanning}
                  id="aiDocUpload"
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="aiDocUpload" 
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
                  {isScanning ? "Scanning Document..." : "Upload PDF / Image"}
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
            </div>

            <div style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem', borderBottom: '1px dashed var(--border)' }}>Customer Information</div>
            <div className="form-group-row">
              <div className="form-group">
                <label>Owner Name</label>
                <input type="text" className="form-input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input type="number" className="form-input" value={formData.age} onChange={(e) => handleInputChange('age', parseInt(e.target.value))} required />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Gender</label>
                <select className="form-select" value={formData.insured_sex} onChange={(e) => handleInputChange('insured_sex', e.target.value)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Occupation</label>
                <input type="text" className="form-input" value={formData.insured_occupation} onChange={(e) => handleInputChange('insured_occupation', e.target.value)} required />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem', borderBottom: '1px dashed var(--border)', marginTop: '0.5rem' }}>Vehicle Information</div>
            <div className="form-group-row">
              <div className="form-group">
                <label>Vehicle Number</label>
                <input type="text" className="form-input" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input type="text" className="form-input" value={formData.auto_make} onChange={(e) => handleInputChange('auto_make', e.target.value)} required />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Model</label>
                <input type="text" className="form-input" value={formData.auto_model} onChange={(e) => handleInputChange('auto_model', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Manufacturing Year</label>
                <input type="number" className="form-input" value={formData.auto_year} onChange={(e) => handleInputChange('auto_year', parseInt(e.target.value))} required />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Policy Number</label>
                <input type="text" className="form-input" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Annual Premium (INR)</label>
                <input type="number" className="form-input" value={formData.policy_annual_premium} onChange={(e) => handleInputChange('policy_annual_premium', parseFloat(e.target.value))} required />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setWizardStep(2)}>Next step →</button>
            </div>
          </div>
        )}

        {/* STEP 2: Accident Details */}
        {wizardStep === 2 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>🚨 Step 2: Accident Details</h3>
            
            <div className="form-group-row">
              <div className="form-group">
                <label>Accident Date</label>
                <input type="date" className="form-input" value={accidentDate} onChange={(e) => setAccidentDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Accident Time</label>
                <input type="time" className="form-input" value={accidentTime} onChange={(e) => setAccidentTime(e.target.value)} required />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>City</label>
                <input type="text" className="form-input" value={formData.incident_city} onChange={(e) => handleInputChange('incident_city', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" className="form-input" value={formData.incident_state} onChange={(e) => handleInputChange('incident_state', e.target.value)} required />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Incident Type</label>
                <select className="form-select" value={formData.incident_type} onChange={(e) => handleInputChange('incident_type', e.target.value)}>
                  <option value="Single Vehicle Collision">Single Vehicle Collision</option>
                  <option value="Multi-vehicle Collision">Multi-vehicle Collision</option>
                  <option value="Parked Car">Parked Car</option>
                  <option value="Vehicle Theft">Vehicle Theft</option>
                </select>
              </div>
              <div className="form-group">
                <label>Collision Type</label>
                <select className="form-select" value={formData.collision_type} onChange={(e) => handleInputChange('collision_type', e.target.value)}>
                  <option value="Side Collision">Side Collision</option>
                  <option value="Rear Collision">Rear Collision</option>
                  <option value="Front Collision">Front Collision</option>
                  <option value="?">Unknown (?)</option>
                </select>
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Incident Severity</label>
                <select className="form-select" value={formData.incident_severity} onChange={(e) => handleInputChange('incident_severity', e.target.value)}>
                  <option value="Trivial Damage">Trivial Damage</option>
                  <option value="Minor Damage">Minor Damage</option>
                  <option value="Major Damage">Major Damage</option>
                  <option value="Total Loss">Total Loss</option>
                </select>
              </div>
              <div className="form-group">
                <label>Property Damage (Y/N)</label>
                <select className="form-select" value={formData.property_damage} onChange={(e) => handleInputChange('property_damage', e.target.value)}>
                  <option value="NO">No (N)</option>
                  <option value="YES">Yes (Y)</option>
                  <option value="?">Unknown (?)</option>
                </select>
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Police Report Available (Y/N)</label>
                <select className="form-select" value={formData.police_report_available} onChange={(e) => handleInputChange('police_report_available', e.target.value)}>
                  <option value="NO">No (N)</option>
                  <option value="YES">Yes (Y)</option>
                  <option value="?">Unknown (?)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bodily Injuries (Count)</label>
                <input type="number" className="form-input" value={formData.bodily_injuries} onChange={(e) => handleInputChange('bodily_injuries', parseInt(e.target.value) || 0)} required />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Authorities Contacted</label>
                <select className="form-select" value={formData.authorities_contacted} onChange={(e) => handleInputChange('authorities_contacted', e.target.value)}>
                  <option value="Police">Police</option>
                  <option value="Fire">Fire</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Other">Other</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div className="form-group">
                <label>Witnesses</label>
                <input type="number" className="form-input" value={formData.witnesses} onChange={(e) => handleInputChange('witnesses', parseInt(e.target.value))} required />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-secondary" onClick={() => setWizardStep(1)}>← Previous</button>
              <button className="btn-primary" onClick={() => setWizardStep(3)}>Next step →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Claim Details */}
        {wizardStep === 3 && (
          <form className="animate-fade-in" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)' }}>💸 Step 3: Claim Details</h3>

            {/* AI Vehicle Damage Auto-Scanner & Estimator */}
            <div 
              style={{
                padding: '1.25rem',
                border: '1px dashed var(--secondary)',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', alignSelf: 'center' }}>
                <Camera size={20} className={isDamageScanning ? 'animate-pulse' : ''} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>📸 AI Vehicle Damage Auto-Scanner & Estimator</span>
              </div>
              
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '420px', margin: '0 auto', lineHeight: 1.4 }}>
                Upload a picture of the damaged vehicle. Gemini AI will instantly calculate the damage percentage, severity tier, and estimated repair cost.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.25rem' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleDamageScan} 
                  disabled={isDamageScanning}
                  id="aiDamageUpload"
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="aiDamageUpload" 
                  className="btn-primary"
                  style={{ 
                    cursor: isDamageScanning ? 'not-allowed' : 'pointer', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.5rem 1.25rem', 
                    fontSize: '0.85rem',
                    opacity: isDamageScanning ? 0.6 : 1,
                    backgroundColor: 'var(--secondary)'
                  }}
                >
                  <Upload size={14} />
                  {isDamageScanning ? "Scanning Vehicle..." : "Upload Vehicle Photo"}
                </label>
              </div>

              {damageScanStatus && (
                <div 
                  className="animate-fade-in" 
                  style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    color: damageScanStatus.includes("failed") ? 'var(--risk-high)' : 'var(--secondary)',
                    textAlign: 'center',
                    marginTop: '0.25rem'
                  }}
                >
                  {damageScanStatus}
                </div>
              )}

              {/* Display Result Details if available */}
              {damageScanResult && (
                <div 
                  className="animate-fade-in" 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: '1rem',
                    marginTop: '0.75rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    border: '1px solid var(--border)'
                  }}
                >
                  {/* Left Column: Image Preview */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {damageImageUrl ? (
                      <img 
                        src={damageImageUrl} 
                        alt="Vehicle Damage" 
                        style={{ 
                          width: '100%', 
                          height: '95px', 
                          objectFit: 'cover', 
                          borderRadius: '4px',
                          border: '1px solid var(--border)'
                        }} 
                      />
                    ) : (
                      <div style={{ width: '100%', height: '95px', backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                        <Car size={24} style={{ opacity: 0.3 }} />
                      </div>
                    )}
                  </div>

                  {/* Right Column: AI Metrics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DAMAGE PROFILE</span>
                      <span className={`status-badge ${
                        damageScanResult.severity?.toLowerCase() === 'trivial damage' ? 'pending' : 
                        damageScanResult.severity?.toLowerCase() === 'minor damage' ? 'approved' : 
                        'rejected'
                      }`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {damageScanResult.severity}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span>Damage Severity:</span>
                        <span style={{ color: 'var(--secondary)' }}>{damageScanResult.damage_percentage}% Damaged</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${damageScanResult.damage_percentage}%`, 
                          height: '100%', 
                          background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)`,
                          borderRadius: '3px',
                          transition: 'width 1s ease-in-out'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      <span>Estimated Repair Cost:</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-title)' }}>
                        ₹{damageScanResult.estimated_repair_cost?.toLocaleString()}
                      </span>
                    </div>

                    {damageScanResult.analysis_summary && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0', lineHeight: 1.3, fontStyle: 'italic' }}>
                        " {damageScanResult.analysis_summary} "
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-group-row">
              <div className="form-group">
                <label>Property Claim Amount (INR)</label>
                <input type="number" className="form-input" value={formData.property_claim} onChange={(e) => handleInputChange('property_claim', parseFloat(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Vehicle Claim Amount (INR)</label>
                <input type="number" className="form-input" value={formData.vehicle_claim} onChange={(e) => handleInputChange('vehicle_claim', parseFloat(e.target.value))} required />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Injury Claim Amount (INR)</label>
                <input type="number" className="form-input" value={formData.injury_claim} onChange={(e) => handleInputChange('injury_claim', parseFloat(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Total Claim Amount (Auto-Calculated)</label>
                <input type="number" className="form-input" value={formData.total_claim_amount} disabled style={{ opacity: 0.8, backgroundColor: 'rgba(0,0,0,0.15)', cursor: 'not-allowed' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Accident Description</label>
              <textarea className="form-input" rows={3} style={{ resize: 'none' }} value={accidentDesc} onChange={(e) => setAccidentDesc(e.target.value)} required />
            </div>

            <div style={{ padding: '0.5rem 0', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem', borderBottom: '1px dashed var(--border)' }}>Attachments (Forensics)</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '0.25rem' }}>
              <div 
                onClick={() => triggerUpload('images')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', border: '1px dashed var(--border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: uploadedFiles.images ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-input)', transition: 'all 0.2s' }}
              >
                {uploadedFiles.images ? <CheckCircle2 size={24} style={{ color: 'var(--risk-low)', marginBottom: '0.5rem' }} /> : <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />}
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{uploadedFiles.images ? "Images Uploaded" : "Upload Images"}</span>
              </div>

              <div 
                onClick={() => triggerUpload('fir')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', border: '1px dashed var(--border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: uploadedFiles.fir ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-input)', transition: 'all 0.2s' }}
              >
                {uploadedFiles.fir ? <CheckCircle2 size={24} style={{ color: 'var(--risk-low)', marginBottom: '0.5rem' }} /> : <FileText size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />}
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{uploadedFiles.fir ? "FIR Uploaded" : "Upload FIR"}</span>
              </div>

              <div 
                onClick={() => triggerUpload('insurance')}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', border: '1px dashed var(--border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: uploadedFiles.insurance ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-input)', transition: 'all 0.2s' }}
              >
                {uploadedFiles.insurance ? <CheckCircle2 size={24} style={{ color: 'var(--risk-low)', marginBottom: '0.5rem' }} /> : <FileText size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />}
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{uploadedFiles.insurance ? "Policy Copy Uploaded" : "Upload Policy Copy"}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn-secondary" onClick={() => setWizardStep(2)}>← Previous</button>
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} />
                🤖 Analyze Claim
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Claims submissions history ledger */}
      <div className="glass-card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} style={{ color: 'var(--primary)' }} />
          Claim History List
        </h3>

        {vehicleSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Car size={32} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
            <p>No claims submitted yet.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Use the wizard form on the left to file a new claim.</p>
          </div>
        ) : (
          <div className="ledger-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {vehicleSubmissions.map(app => (
              <div key={app.id} className="ledger-card" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-input)' }}>
                <div className="ledger-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="ledger-item-title" style={{ fontWeight: 600, color: 'var(--text-title)', fontSize: '0.85rem' }}>Claim: {app.auto_make} {app.auto_model}</span>
                  <span className={`status-badge ${app.status}`} style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600, backgroundColor: app.status === 'approved' ? 'var(--risk-low-bg)' : app.status === 'rejected' ? 'var(--risk-high-bg)' : 'var(--bg-card)', color: app.status === 'approved' ? 'var(--risk-low)' : app.status === 'rejected' ? 'var(--risk-high)' : 'var(--text-muted)' }}>
                    {app.status}
                  </span>
                </div>
                
                <div className="ledger-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span>ID: <b>{app.id}</b></span>
                  <span>Claim Amount: <b>₹{app.total_claim_amount?.toLocaleString()}</b></span>
                  <span>Date: <b>{app.date}</b></span>
                </div>

                {app.fraud_reported && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                      <div>Fraud Flag: <span className="risk-badge" style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', backgroundColor: app.fraud_reported === 'Y' ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)', color: app.fraud_reported === 'Y' ? 'var(--risk-high)' : 'var(--risk-low)' }}>{app.fraud_reported === 'Y' ? 'FLAGGED FRAUD' : 'VERIFIED OK'}</span></div>
                      <div style={{ textAlign: 'right' }}>Confidence: <b>{app.confidence}%</b></div>
                    </div>
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
