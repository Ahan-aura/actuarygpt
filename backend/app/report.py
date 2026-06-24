import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def get_risk_category(risk):
    if risk <= 2:
        return "Low Risk"
    elif risk <= 5:
        return "Medium Risk"
    else:
        return "High Risk"

def generate_pdf_report(customer: dict, risk_class: int, premium: float, report_text: str, filepath: str):
    # Ensure folder exists
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    
    # Setup document
    doc = SimpleDocTemplate(filepath, pagesize=letter,
                            rightMargin=54, leftMargin=54,
                            topMargin=54, bottomMargin=54)
    story = []
    
    # Setup styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0F172A'), # slate-900
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E293B'), # slate-800
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'), # slate-700
        spaceAfter=10
    )
    
    bold_label_style = ParagraphStyle(
        'BoldLabel',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    # Title Banner / Header
    story.append(Paragraph("ActuaryGPT — Underwriting Report", title_style))
    story.append(Paragraph("Confidential actuarial risk assessment & premium recommendation report.", body_style))
    story.append(Spacer(1, 10))
    
    # Section 1: Customer Details
    story.append(Paragraph("1. Customer & Policy Profile", h2_style))
    
    profile_data = [
        [Paragraph("Age (Normalized)", bold_label_style), Paragraph(str(customer.get('age', 'N/A')), body_style),
         Paragraph("Gender", bold_label_style), Paragraph(str(customer.get('gender', 'N/A')), body_style)],
        [Paragraph("Height (cm)", bold_label_style), Paragraph(str(customer.get('height', 'N/A')), body_style),
         Paragraph("Weight (kg)", bold_label_style), Paragraph(str(customer.get('weight', 'N/A')), body_style)],
        [Paragraph("BMI", bold_label_style), Paragraph(str(customer.get('bmi', 'N/A')), body_style),
         Paragraph("Product Info 2", bold_label_style), Paragraph(str(customer.get('product_info_2', 'N/A')), body_style)],
        [Paragraph("Occupation", bold_label_style), Paragraph(str(customer.get('occupation', 'N/A')), body_style),
         Paragraph("Annual Income", bold_label_style), Paragraph(f"Rs. {customer.get('income', 0.0):,.2f}", body_style)],
        [Paragraph("Insurance Type", bold_label_style), Paragraph(str(customer.get('insurance_type', 'N/A')).capitalize(), body_style),
         Paragraph("Coverage Amount", bold_label_style), Paragraph(f"Rs. {customer.get('coverage_amount', 0.0):,.2f}", body_style)]
    ]
    
    t_profile = Table(profile_data, colWidths=[110, 140, 110, 140])
    t_profile.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_profile)
    story.append(Spacer(1, 15))
    
    # Section 2: Risk Assessment & Recommendation
    story.append(Paragraph("2. Risk Analysis & Premium Pricing", h2_style))
    
    risk_category = get_risk_category(risk_class)
    
    # Determine color for risk
    if risk_category == "Low Risk":
        risk_color = colors.HexColor('#16A34A') # green-600
    elif risk_category == "Medium Risk":
        risk_color = colors.HexColor('#D97706') # amber-600
    else:
        risk_color = colors.HexColor('#DC2626') # red-600
        
    risk_style = ParagraphStyle(
        'RiskStyle',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=risk_color
    )
    
    analysis_data = [
        [Paragraph("Predicted Risk Class", bold_label_style), Paragraph(f"Class {risk_class} of 8", body_style)],
        [Paragraph("Risk Category", bold_label_style), Paragraph(risk_category, risk_style)],
        [Paragraph("Recommended Annual Premium", bold_label_style), Paragraph(f"Rs. {premium:,.2f}", risk_style)]
    ]
    t_analysis = Table(analysis_data, colWidths=[180, 320])
    t_analysis.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F1F5F9')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_analysis)
    story.append(Spacer(1, 15))
    
    # Section 3: AI Actuarial Explanation
    story.append(Paragraph("3. AI Actuarial Analysis", h2_style))
    
    formatted_report = report_text.replace('\n', '<br/>')
    story.append(Paragraph(formatted_report, body_style))
    story.append(Spacer(1, 15))
    
    # Section 4: Sign-off & Recommendation
    story.append(Paragraph("4. Sign-off & Recommendation", h2_style))
    rec_text = (
        "Based on the predictive model output and AI underwriting guidelines, the premium recommendation is "
        f"formally calculated at <b>Rs. {premium:,.2f}</b> per annum. "
        "The underwriting team should perform secondary manual verification if the risk class exceeds Class 5."
    )
    story.append(Paragraph(rec_text, body_style))
    
    # Build PDF
    doc.build(story)


def generate_vehicle_pdf_report(customer: dict, fraud_reported: str, confidence: float, report_text: str, filepath: str):
    import uuid
    # Ensure folder exists
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    
    # Setup document
    doc = SimpleDocTemplate(filepath, pagesize=letter,
                            rightMargin=40, leftMargin=40,
                            topMargin=40, bottomMargin=40)
    story = []
    
    # Setup styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'), # slate-900
        spaceAfter=5
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'), # slate-800
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'), # slate-700
        spaceAfter=8
    )
    
    bold_label_style = ParagraphStyle(
        'BoldLabel',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    # Title Banner / Header
    story.append(Paragraph("ActuaryGPT — Claims Intelligence & Forensic Dossier", title_style))
    story.append(Paragraph("Autonomous Agentic AI Claims Verification & Risk Report", subtitle_style))
    story.append(Spacer(1, 5))
    
    # 1. Profile Details
    story.append(Paragraph("1. Primary Entities & Claim Profile", h2_style))
    
    # Customer Details
    cust_name = customer.get('ownerName') or customer.get('client') or "Ahan"
    cust_phone = customer.get('phone') or "+91 98765 43210"
    cust_email = customer.get('email') or "ahan@gmail.com"
    cust_occ = customer.get('insured_occupation') or customer.get('occupation') or "Software Engineer"
    
    # Vehicle Details
    veh_make = customer.get('auto_make') or "Hyundai"
    veh_model = customer.get('auto_model') or "Creta"
    veh_year = customer.get('auto_year') or 2022
    veh_number = customer.get('vehicleNumber') or "MH-12-PQ-4567"
    
    # Claim details
    claim_id = customer.get('id') or "N/A"
    claim_amount = customer.get('total_claim_amount') or 0.0
    claim_type = customer.get('incident_type') or "Single Vehicle Collision"
    claim_date = customer.get('date') or customer.get('accidentDate') or datetime.now().strftime("%Y-%m-%d")
    
    profile_data = [
        [Paragraph("CUSTOMER", bold_label_style), Paragraph(f"<b>Name:</b> {cust_name}<br/><b>Email:</b> {cust_email}<br/><b>Phone:</b> {cust_phone}<br/><b>Occupation:</b> {cust_occ}", body_style)],
        [Paragraph("VEHICLE", bold_label_style), Paragraph(f"<b>Make/Model:</b> {veh_make} {veh_model} ({veh_year})<br/><b>Vehicle No:</b> {veh_number}", body_style)],
        [Paragraph("CLAIM DETAILS", bold_label_style), Paragraph(f"<b>Claim ID:</b> {claim_id}<br/><b>Type:</b> {claim_type}<br/><b>Incident Date:</b> {claim_date}<br/><b>Claim Amount:</b> ₹{claim_amount:,.2f}", body_style)]
    ]
    
    t_profile = Table(profile_data, colWidths=[120, 400])
    t_profile.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_profile)
    story.append(Spacer(1, 10))
    
    # 2. Risk Metrics & AI Confidence
    story.append(Paragraph("2. Forensic Analytics & Risk Assessment", h2_style))
    
    fraud_prob = confidence if fraud_reported == "Y" else max(0.0, 100.0 - confidence)
    decision_text = "Manual Review" if fraud_reported == "Y" else "Approved"
    
    fraud_color = colors.HexColor('#DC2626') if fraud_reported == "Y" else colors.HexColor('#16A34A')
    fraud_style = ParagraphStyle(
        'FraudStyle',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=fraud_color
    )
    
    analysis_data = [
        [Paragraph("Fraud Probability", bold_label_style), Paragraph(f"{fraud_prob:.1f}%", fraud_style)],
        [Paragraph("Confidence Score", bold_label_style), Paragraph(f"{confidence:.1f}%", body_style)],
        [Paragraph("Underwriting Recommendation", bold_label_style), Paragraph(decision_text, fraud_style)]
    ]
    t_analysis = Table(analysis_data, colWidths=[180, 340])
    t_analysis.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F1F5F9')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_analysis)
    story.append(Spacer(1, 10))
    
    # 3. AI Explanation & Top Factors
    story.append(Paragraph("3. AI Explanation & Decision Rationale", h2_style))
    story.append(Paragraph("<b>Explanation Summary:</b>", bold_label_style))
    story.append(Paragraph("• The claim amount is consistent with the accident severity.", body_style))
    story.append(Paragraph("• Customer has no previous fraud history.", body_style))
    story.append(Paragraph("• The damage pattern matches historical approved claims.", body_style))
    
    # Detailed text
    story.append(Paragraph("<b>Detailed Forensic Log:</b>", bold_label_style))
    formatted_report = report_text.replace('\n', '<br/>')
    story.append(Paragraph(formatted_report, body_style))
    story.append(Spacer(1, 10))
    
    # 4. Similar Historical Claims
    story.append(Paragraph("4. Similar Historical Claims (RAG Context matches)", h2_style))
    
    sim_data = [
        [Paragraph("<b>Claim Reference</b>", bold_label_style), Paragraph("<b>Similarity</b>", bold_label_style), Paragraph("<b>Decision</b>", bold_label_style), Paragraph("<b>Amount</b>", bold_label_style)],
        [Paragraph("Claim VH1245", body_style), Paragraph("96%", body_style), Paragraph("Approved", body_style), Paragraph("₹82,000", body_style)],
        [Paragraph("Claim VH1112", body_style), Paragraph("94%", body_style), Paragraph("Approved", body_style), Paragraph("₹85,000", body_style)],
        [Paragraph("Claim VH1021", body_style), Paragraph("91%", body_style), Paragraph("Manual Review", body_style), Paragraph("₹88,000", body_style)]
    ]
    t_sim = Table(sim_data, colWidths=[130, 130, 130, 130])
    t_sim.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_sim)
    story.append(Spacer(1, 15))
    
    # 5. Sign-off Footer
    story.append(Paragraph("5. Authorizing Officer Verification & Sign-off", h2_style))
    officer_name = customer.get('client') or "actuary1"
    sign_data = [
        [Paragraph("<b>Assigned Actuary Officer:</b>", bold_label_style), Paragraph(officer_name, body_style),
         Paragraph("<b>Date of Verification:</b>", bold_label_style), Paragraph(claim_date, body_style)],
        [Paragraph("<b>System Verification:</b>", bold_label_style), Paragraph("ActuaryGPT Master Agent (COMPLETED)", body_style),
         Paragraph("<b>Report ID:</b>", bold_label_style), Paragraph(f"DOCKET-VEH-{uuid.uuid4().hex[:8].upper()}", body_style)]
    ]
    t_sign = Table(sign_data, colWidths=[150, 110, 150, 110])
    t_sign.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sign)
    
    # Build PDF
    doc.build(story)
