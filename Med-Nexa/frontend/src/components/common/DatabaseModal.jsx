import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import {
  Database, CheckCircle2, AlertCircle, RefreshCw,
  ExternalLink, Copy, Check, X, FileSpreadsheet, Server, Layers, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const DatabaseModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('supabase'); // 'supabase' | 'sheets'
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/supabase/status');
      setStatus(res.data);
    } catch {
      setStatus({ connected: false, error: 'Could not connect to backend Supabase service' });
    } finally {
      setLoading(false);
    }
  };

  const copyConfig = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Connection string copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: 24,
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: activeTab === 'supabase' ? 'linear-gradient(135deg, #3ecf8e 0%, #059669 100%)' : 'linear-gradient(135deg, #00a651 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}>
              {activeTab === 'supabase' ? <Database size={24} /> : <FileSpreadsheet size={24} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Med-Nexa Database Manager
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Active: Supabase PostgreSQL | Archived: Google Sheets Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            style={{ borderRadius: 8 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: 8,
          background: '#f1f5f9',
          padding: 4,
          borderRadius: 10,
          marginBottom: 20
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: activeTab === 'supabase' ? '#ffffff' : 'transparent',
              color: activeTab === 'supabase' ? '#059669' : '#64748b',
              boxShadow: activeTab === 'supabase' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <Database size={15} /> Supabase (PostgreSQL Active) 🟢
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: activeTab === 'sheets' ? '#ffffff' : 'transparent',
              color: activeTab === 'sheets' ? '#2563eb' : '#64748b',
              boxShadow: activeTab === 'sheets' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <FileSpreadsheet size={15} /> Teacher Reference (Google Sheets)
          </button>
        </div>

        {/* Supabase Tab Content */}
        {activeTab === 'supabase' && (
          <div>
            {/* Status Card */}
            <div style={{
              background: status?.connected ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${status?.connected ? '#a7f3d0' : '#fecaca'}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {status?.connected ? (
                    <CheckCircle2 size={22} color="#059669" />
                  ) : (
                    <AlertCircle size={22} color="#dc2626" />
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: status?.connected ? '#065f46' : '#991b1b' }}>
                      {status?.connected ? '🟢 Connected to Supabase PostgreSQL' : '🔴 Supabase Disconnected'}
                    </h4>
                    <p style={{ margin: 0, fontSize: 12, color: status?.connected ? '#047857' : '#b91c1c' }}>
                      {status?.connected
                        ? `Host: ${status.host} (Port 5432 / PostgreSQL 17)`
                        : (status?.error || 'Cannot establish connection')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={loading}
                  className="btn btn-outline btn-sm"
                  style={{ gap: 6, fontSize: 12, borderColor: '#059669', color: '#059669' }}
                >
                  <RefreshCw size={13} className={loading ? 'spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Table Statistics */}
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} /> PostgreSQL Tables in Supabase
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: 10,
              marginBottom: 20
            }}>
              {[
                { name: 'Users', key: 'users', color: '#3b82f6' },
                { name: 'Doctors', key: 'doctor_profiles', color: '#10b981' },
                { name: 'Appointments', key: 'appointments', color: '#8b5cf6' },
                { name: 'Queues', key: 'queues', color: '#f59e0b' },
                { name: 'Consultations', key: 'consultations', color: '#06b6d4' }
              ].map(tbl => (
                <div key={tbl.key} style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{tbl.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: tbl.color, marginTop: 4 }}>
                    {status?.counts?.[tbl.key] ?? '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Supabase Connection Details (Safe view) */}
            <div style={{
              background: '#0f172a',
              borderRadius: 12,
              padding: 16,
              color: '#e2e8f0',
              fontSize: 12,
              fontFamily: 'monospace'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>Active Supabase Connection Parameters</span>
                <button
                  type="button"
                  onClick={() => copyConfig('postgresql://postgres.uqmicnwvpnsvaskrrsqc:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')}
                  style={{
                    background: 'transparent',
                    border: '1px solid #334155',
                    color: '#38bdf8',
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />} Copy URI
                </button>
              </div>
              <div style={{ color: '#38bdf8' }}>HOST: aws-0-ap-southeast-2.pooler.supabase.com</div>
              <div style={{ color: '#38bdf8' }}>PORT: 5432 / 6543</div>
              <div style={{ color: '#38bdf8' }}>USER: postgres.uqmicnwvpnsvaskrrsqc</div>
              <div style={{ color: '#38bdf8' }}>DB: postgres</div>
              <div style={{ color: '#10b981', marginTop: 4 }}>SSL: require (TLS encrypted)</div>
            </div>
          </div>
        )}

        {/* Teacher Reference Tab Content */}
        {activeTab === 'sheets' && (
          <div>
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 12,
              padding: 16,
              marginBottom: 18
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <ShieldCheck size={22} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e40af' }}>
                    Preserved for Teacher & Viva Examination
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#3b82f6', lineHeight: 1.5 }}>
                    The Google Sheets database code is fully retained and clearly commented across all controllers and service layers. You can walk through the implementation directly with your teacher.
                  </p>
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#0f172a' }}>
              Architecture & Code Locations in Codebase
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a' }}>1. Apps Script Bridge Engine</strong>
                <p style={{ margin: '4px 0', color: '#64748b' }}>
                  <code>google-sheets-database/Code.gs</code>: Contains <code>doPost(e)</code>, dynamic sheet setup, JSON serialization, and table handlers.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a' }}>2. Node.js Service Client</strong>
                <p style={{ margin: '4px 0', color: '#64748b' }}>
                  <code>backend/src/services/googleSheetsService.js</code>: Dispatches HTTP POST requests to Apps Script Web App endpoint.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a' }}>3. Route Handlers & Controllers</strong>
                <p style={{ margin: '4px 0', color: '#64748b' }}>
                  <code>backend/src/routes/sheetsRoutes.js</code> & <code>backend/src/controllers/appointmentController.js</code>: Commented integration hooks ready for live toggle.
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DatabaseModal;
