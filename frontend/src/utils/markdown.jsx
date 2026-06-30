import React from 'react';

export const renderMarkdown = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  let inTable = false;
  let tableRows = [];
  const elements = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for tables
    if (line.startsWith('|')) {
      if (line.includes(':---') || line.includes('---:')) {
        continue;
      }
      
      inTable = true;
      const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cells.length > 0) {
        tableRows.push(cells);
      }
      continue;
    } else {
      if (inTable && tableRows.length > 0) {
        // Render the collected table rows
        const currentTableRows = [...tableRows];
        elements.push(
          <div key={`table-${i}`} style={{ overflowX: 'auto', margin: '1rem 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(99, 102, 241, 0.06)', borderBottom: '1px solid var(--border)' }}>
                  {currentTableRows[0].map((cell, idx) => (
                    <th key={idx} style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--text-title)', textAlign: 'left', borderRight: '1px solid var(--border)' }}>
                      {cell.replace(/\*\*/g, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTableRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                    {row.map((cell, cIdx) => {
                      let content = cell;
                      let isBadge = false;
                      let badgeColor = 'var(--text-main)';
                      let badgeBg = 'rgba(255,255,255,0.05)';
                      
                      if (cell.startsWith('`') && cell.endsWith('`')) {
                        content = cell.slice(1, -1);
                        isBadge = true;
                        if (content === 'SUCCESS' || content === 'PASSED') {
                          badgeColor = '#10b981';
                          badgeBg = 'rgba(16, 185, 129, 0.1)';
                        } else if (content === 'WARNING_CORRECTED') {
                          badgeColor = '#f59e0b';
                          badgeBg = 'rgba(245, 158, 11, 0.1)';
                        } else if (content === 'SIGNED_OFF') {
                          badgeColor = 'var(--primary)';
                          badgeBg = 'rgba(99, 102, 241, 0.15)';
                        }
                      }
                      
                      return (
                        <td key={cIdx} style={{ padding: '0.5rem 0.75rem', color: 'var(--text-main)', borderRight: '1px solid var(--border)' }}>
                          {isBadge ? (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: badgeBg, color: badgeColor, fontWeight: 700 }}>
                              {content}
                            </span>
                          ) : (
                            cell.startsWith('**') && cell.endsWith('**') ? <strong>{cell.slice(2, -2)}</strong> : cell
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    }
    
    // Check for headers
    if (line.startsWith('###')) {
      elements.push(<h4 key={i} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)', margin: '1.25rem 0 0.5rem 0' }}>{line.slice(3).trim()}</h4>);
    } else if (line.startsWith('##')) {
      elements.push(<h3 key={i} style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-title)', margin: '1.5rem 0 0.75rem 0', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>{line.slice(2).trim()}</h3>);
    } else if (line.startsWith('#')) {
      elements.push(<h2 key={i} style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)', margin: '1.75rem 0 1rem 0' }}>{line.slice(1).trim()}</h2>);
    } else if (line.startsWith('*') && line.endsWith('*') && !line.includes('|')) {
      elements.push(<p key={i} style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0' }}>{line.slice(1, -1).trim()}</p>);
    } else if (line.startsWith('*') || line.startsWith('-')) {
      const itemText = line.slice(1).trim();
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(itemText)) !== null) {
        if (match.index > lastIndex) {
          parts.push(itemText.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < itemText.length) {
        parts.push(itemText.substring(lastIndex));
      }
      
      elements.push(
        <li key={i} style={{ marginLeft: '1rem', listStyleType: 'disc', color: 'var(--text-main)', margin: '0.25rem 0' }}>
          {parts.length > 0 ? parts : itemText}
        </li>
      );
    } else if (line === '---') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />);
    } else if (line !== '') {
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      elements.push(
        <p key={i} style={{ margin: '0.5rem 0', color: 'var(--text-main)' }}>
          {parts.length > 0 ? parts : line}
        </p>
      );
    }
  }
  
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>{elements}</div>;
};
