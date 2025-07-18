import React, { useState, useEffect, useRef } from 'react';

interface DebugLog {
  timestamp: number;
  message: string;
  type: 'render' | 'state' | 'animation' | 'error';
}

interface DebugPanelProps {
  isVisible?: boolean;
}

let startTime = Date.now();
let logs: DebugLog[] = [];

export const debugLog = (message: string, type: DebugLog['type'] = 'render') => {
  const timestamp = Date.now() - startTime;
  const log = { timestamp, message, type };
  logs.push(log);
  console.log(`[${timestamp}ms] [${type.toUpperCase()}] ${message}`);
  
  // Trigger re-render of debug panel
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('debugLog', { detail: log }));
  }
};

const DebugPanel: React.FC<DebugPanelProps> = ({ isVisible = true }) => {
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>(logs);
  const [isExpanded, setIsExpanded] = useState(true);
  const renderCountRef = useRef(0);

  useEffect(() => {
    const handleDebugLog = () => {
      // Debounce updates to avoid excessive re-renders
      setTimeout(() => setDebugLogs([...logs]), 0);
    };

    window.addEventListener('debugLog', handleDebugLog as EventListener);
    return () => window.removeEventListener('debugLog', handleDebugLog as EventListener);
  }, []);

  // Don't log the DebugPanel's own renders to avoid infinite loops
  useEffect(() => {
    renderCountRef.current++;
  });

  const clearLogs = () => {
    logs = [];
    setDebugLogs([]);
    startTime = Date.now();
    renderCountRef.current = 0;
    debugLog('Logs cleared', 'state');
  };

  const getLogColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'render': return '#e3f2fd';
      case 'state': return '#f3e5f5';
      case 'animation': return '#e8f5e8';
      case 'error': return '#ffebee';
      default: return '#f5f5f5';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: isExpanded ? '350px' : '120px',
        maxHeight: '500px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        zIndex: 9999,
        fontSize: '12px',
        fontFamily: 'monospace',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          padding: '10px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <strong>Debug Panel ({debugLogs.length} logs)</strong>
        <span>{isExpanded ? '−' : '+'}</span>
      </div>
      
      {isExpanded && (
        <>
          <div
            style={{
              maxHeight: '350px',
              overflowY: 'auto',
              padding: '10px',
            }}
          >
            {debugLogs.map((log, index) => (
              <div
                key={index}
                style={{
                  margin: '3px 0',
                  padding: '5px',
                  borderRadius: '3px',
                  backgroundColor: getLogColor(log.type),
                  borderLeft: `3px solid ${log.type === 'error' ? '#f44336' : '#2196f3'}`,
                }}
              >
                <div style={{ fontWeight: 'bold' }}>
                  [{log.timestamp}ms] [{log.type.toUpperCase()}]
                </div>
                <div>{log.message}</div>
              </div>
            ))}
          </div>
          
          <div
            style={{
              padding: '10px',
              borderTop: '1px solid #eee',
              display: 'flex',
              gap: '10px',
            }}
          >
            <button
              onClick={clearLogs}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
              }}
            >
              Clear Logs
            </button>
            <button
              onClick={() => {
                const logText = debugLogs
                  .map(log => `[${log.timestamp}ms] [${log.type.toUpperCase()}] ${log.message}`)
                  .join('\n');
                navigator.clipboard.writeText(logText);
                debugLog('Logs copied to clipboard', 'state');
              }}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
              }}
            >
              Copy Logs
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DebugPanel;