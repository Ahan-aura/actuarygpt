import React from 'react';
import { Bot, Send } from 'lucide-react';

export default function Chatbot({
  chatMessages,
  chatInput,
  setChatInput,
  isChatLoading,
  selectedApp,
  handleSendChatMessage
}) {
  const onSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    handleSendChatMessage(e);
  };

  return (
    <div className="glass-card ai-assistant-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '550px' }}>
      <h3 className="card-title" style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-title-left" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              {msg.role === 'model' || msg.role === 'assistant' ? 'AI Co-Pilot' : 'You'}
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

      <form className="chat-input-row" onSubmit={onSubmit} style={{ display: 'flex', gap: '0.75rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <input 
          type="text" 
          className="form-input chat-text-input" 
          placeholder="Ask questions about risk guidelines, portfolio metrics, or the active evaluation context..." 
          value={chatInput} 
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isChatLoading}
        />
        <button type="submit" className="btn-primary chat-send-btn" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} disabled={isChatLoading || !chatInput.trim()}>
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  );
}
