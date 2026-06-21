import os
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
    story.append(Paragraph("ActuaryGPT — Vehicle Claim Auditing Report", title_style))
    story.append(Paragraph("Confidential claim fraud analysis & risk recommendation report.", body_style))
    story.append(Spacer(1, 10))
    
    # Section 1: Customer Details
    story.append(Paragraph("1. Policyholder & Claim Profile", h2_style))
    
    profile_data = [
        [Paragraph("Age / Months as Cust", bold_label_style), Paragraph(f"{customer.get('age', 'N/A')} yrs / {customer.get('months_as_customer', 'N/A')} mos", body_style),
         Paragraph("Policy State / CSL", bold_label_style), Paragraph(f"{customer.get('policy_state', 'N/A')} / {customer.get('policy_csl', 'N/A')}", body_style)],
        [Paragraph("Incident Type", bold_label_style), Paragraph(str(customer.get('incident_type', 'N/A')), body_style),
         Paragraph("Incident Severity", bold_label_style), Paragraph(str(customer.get('incident_severity', 'N/A')), body_style)],
        [Paragraph("Collision Type", bold_label_style), Paragraph(str(customer.get('collision_type', 'N/A')), body_style),
         Paragraph("Incident Date / Hour", bold_label_style), Paragraph(f"{customer.get('incident_date', 'N/A')} / {customer.get('incident_hour_of_the_day', 'N/A')}:00", body_style)],
        [Paragraph("Total Claim Amount", bold_label_style), Paragraph(f"Rs. {customer.get('total_claim_amount', 0.0):,.2f}", body_style),
         Paragraph("Vehicle Claim", bold_label_style), Paragraph(f"Rs. {customer.get('vehicle_claim', 0.0):,.2f}", body_style)],
        [Paragraph("Auto Make & Model", bold_label_style), Paragraph(f"{customer.get('auto_make', 'N/A')} {customer.get('auto_model', 'N/A')} ({customer.get('auto_year', 'N/A')})", body_style),
         Paragraph("Witnesses / Police Report", bold_label_style), Paragraph(f"{customer.get('witnesses', 0)} / {customer.get('police_report_available', 'N/A')}", body_style)]
    ]
    
    t_profile = Table(profile_data, colWidths=[130, 120, 130, 120])
    t_profile.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_profile)
    story.append(Spacer(1, 15))
    
    # Section 2: Claim Fraud Assessment
    story.append(Paragraph("2. Claim Fraud Assessment", h2_style))
    
    fraud_color = colors.HexColor('#DC2626') if fraud_reported == "Y" else colors.HexColor('#16A34A')
    fraud_style = ParagraphStyle(
        'FraudStyle',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=fraud_color
    )
    
    analysis_data = [
        [Paragraph("AI Fraud Classification", bold_label_style), Paragraph("High Risk - Potential Fraud Flag" if fraud_reported == "Y" else "Low Risk - Verified Claim", fraud_style)],
        [Paragraph("Prediction Confidence", bold_label_style), Paragraph(f"{confidence}%", body_style)],
        [Paragraph("Underwriting Recommendation", bold_label_style), Paragraph("Refer for Manual Audit Investigation" if fraud_reported == "Y" else "Approved for Claim Payout", fraud_style)]
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
    
    # Section 3: AI Claim Analysis & Detail Explanation
    story.append(Paragraph("3. AI Claim Analysis & Detail Explanation", h2_style))
    
    formatted_report = report_text.replace('\n', '<br/>')
    story.append(Paragraph(formatted_report, body_style))
    
    # Build PDF
    doc.build(story)
