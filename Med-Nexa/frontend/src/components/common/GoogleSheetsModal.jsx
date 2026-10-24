import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw,
  ExternalLink, Copy, Check, X, Database
} from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleSheetsModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sheets/status');
      setStatus(res.data);
    } catch {
      setStatus({ configured: false, message: 'Could not reach server endpoint' });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      const res = await api.post('/sheets/test');
      if (res.data?.connected) {
        toast.success('Google Sheet connection verified!');
      } else {
        toast.error(res.data?.message || 'Connection test failed', { duration: 6000 });
      }
      await checkStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/sheets/sync');
      if (res.data.success) {
        toast.success(res.data.message || 'Synced all records to Google Sheets!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed. Check your Web App URL.');
    } finally {
      setSyncing(false);
    }
  };

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText('GOOGLE_SHEET_WEBAPP_URL=https://script.google.com/macros/s/AKfycbw6qemaJqMtcJnd4-KY0OC6fkFUjPXRquVCxNOzmrH2voAYPM8vW-6j-C44UIJ7D2N2/exec');
    setCopied(true);
    toast.success('Copied .env format to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const isConnected = Boolean(status?.connected);
  const isConfigured = Boolean(status?.configured);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 560, background: '#ffffff', borderRadius: '20px', padding: '28px', color: '#0f172a' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Google Sheets Database</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)' }}>Live spreadsheet data integration</p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Status Box */}
        <div style={{
          background: isConnected ? '#f0fdf4' : (isConfigured ? '#fffbeb' : '#f8fafc'),
          border: `1.5px solid ${isConnected ? '#86efac' : (isConfigured ? '#fde68a' : '#e2e8f0')}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isConnected ? (
                <CheckCircle2 size={18} color="#15803d" />
              ) : (
                <AlertCircle size={18} color={isConfigured ? '#d97706' : '#64748b'} />
              )}
              <strong style={{ fontSize: 14, color: isConnected ? '#15803d' : (isConfigured ? '#b45309' : '#334155') }}>
                {isConnected
                  ? '🟢 Google Sheets Web App Connected'
                  : isConfigured
                    ? '⚠️ Web App Configured (Google Permission Needed)'
                    : '⚪ Google Sheets Not Configured Yet'}
              </strong>
            </div>
            <button
              type="button"
              onClick={checkStatus}
              disabled={loading}
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 8px', fontSize: 11 }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Check Status
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.5, color: isConnected ? '#166534' : (isConfigured ? '#92400e' : '#64748b') }}>
            {status?.message || 'Paste your Google Apps Script Web App URL into backend/.env to connect.'}
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            onClick={handleTest}
            disabled={loading}
            className="btn btn-outline btn-sm"
            style={{ flex: 1 }}
          >
            Test Connection
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || !status?.configured}
            className="btn btn-primary btn-sm"
            style={{ flex: 1.5 }}
          >
            <Database size={14} /> {syncing ? 'Syncing...' : 'Sync All Records to Sheet'}
          </button>
        </div>

        {/* 4-Step Quick Setup Guide */}
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', fontSize: 13 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#334155' }}>
            How to Connect Your Google Sheet in 2 Minutes:
          </h4>
          <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, color: '#475569' }}>
            <li>
              Open a new sheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" style={{ color: '#00a651', fontWeight: 700, textDecoration: 'underline' }}>sheets.new <ExternalLink size={11} style={{ display: 'inline' }} /></a>
            </li>
            <li>
              Click <strong>Extensions &gt; Apps Script</strong> and paste the contents of <code>google-sheets-database/Code.gs</code>.
            </li>
            <li>
              Select function <strong>setupDatabase</strong> from the dropdown and click <strong>Run</strong> (automatically creates the 5 styled tabs and doctor data).
            </li>
            <li>
              Click <strong>Deploy &gt; New deployment</strong> &gt; Select type <strong>Web app</strong> &gt; Set access to <strong>Anyone</strong> &gt; Deploy and copy the URL.
            </li>
            <li>
              Paste into <code>backend/.env</code> as:
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', fontSize: 11, fontFamily: 'monospace', marginTop: 4 }}>
                <span>GOOGLE_SHEET_WEBAPP_URL=https://script...</span>
                <button type="button" onClick={copyEnvSnippet} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
                  {copied ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                </button>
              </div>
            </li>
          </ol>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsModal;
