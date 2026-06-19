import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-2.5-flash")

def explain(customer: dict, risk: int, premium: float, confidence: float, similar_cases: list):
    similar_cases_str = ""
    if similar_cases:
        similar_cases_str = "\n".join([
            f"- Application {c['id']}: Client: {c['client']}, Similarity: {c['similarity']}%, Risk Class: {c['risk_class']}, Premium: ${c['premium']:.2f}, Status: {c['status']}"
            for c in similar_cases
        ])
    else:
        similar_cases_str = "No similar cases found."

    prompt = f"""
You are an expert insurance actuarial AI agent.
Evaluate the following insurance application:

Current Applicant details:
{customer}

Machine Learning Classifier Output:
- Predicted Risk Class: {risk} (out of 8, lower is better)
- Prediction Probability/Confidence: {confidence}%
- Calculated Annual Premium: ${premium:.2f}

Top Similar Historical Approved Cases (RAG Context):
{similar_cases_str}

Please generate a professional actuarial report that includes:
1. Risk Assessment: Evaluate the applicant's key risk factors (Age, BMI, Smoking status, occupation, previous claims, etc.).
2. Comparative Analysis: Compare the current application with the top similar historical cases. Detail why the current case matches or differs from them.
3. Anomaly & Fraud Detection: Note any potential anomalies, such as high claims history, unusual BMI, high coverage amount vs income, or inconsistent smoking/lifestyle indicators.
4. Premium Recommendation: Justify the calculated premium of ${premium:.2f} based on the risk class, prediction confidence, and historical comparison.
5. Underwriting Decision Recommendation: Recommend whether to approve, reject, or refer for manual review.

Keep the tone professional, concise, and structured. Use Markdown formatting.
"""
    response = model.generate_content(prompt)
    return response.text

def chat_with_agent(message: str, history: list, context: dict = None):
    system_instruction = (
        "You are an expert actuarial AI assistant. You help insurance underwriters analyze policy applications, "
        "evaluate risk, check historical similarities, and make underwriting decisions. Be professional, concise, and helpful."
    )
    
    prompt = f"{system_instruction}\n\n"
    if context:
        prompt += f"Context of the application currently under review:\n{context}\n\n"
        
    prompt += "Conversation history:\n"
    for turn in history:
        role_label = "User" if turn.get("role") == "user" else "Assistant"
        prompt += f"{role_label}: {turn.get('content')}\n"
        
    prompt += f"User: {message}\n"
    prompt += "Assistant:"
    
    response = model.generate_content(prompt)
    return response.text
