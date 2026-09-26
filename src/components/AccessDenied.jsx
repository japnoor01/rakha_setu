import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_DETAILS } from '../types/roles';

export default function AccessDenied({ attemptedTab, onReturn }) {
  const { user, getDefaultTabForRole } = useAuth();
  const roleDetail = user ? ROLE_DETAILS[user.role] : null;

  const handleReturn = () => {
    if (onReturn) {
      onReturn(getDefaultTabForRole());
    }
  };

  return (
    <div className="access-denied-container animate-fade-in">
      <div className="access-denied-card">
        <div className="denied-icon-wrap">
          <ShieldAlert size={54} className="icon-denied-pulse" />
          <div className="lock-sub-icon">
            <Lock size={20} />
          </div>
        </div>

        <div className="denied-header">
          <span className="denied-code-tag">HTTP 403 • FORBIDDEN</span>
          <h1 className="denied-title">403 – Access Denied</h1>
          <p className="denied-message">
            You do not have permission to access this resource.
          </p>
        </div>

        <div className="denied-details-box">
          <div className="detail-row">
            <span className="detail-label">Your Authenticated Role:</span>
            <span
              className="role-pill-badge"
              style={{
                color: roleDetail?.color || '#38BDF8',
                background: roleDetail?.bg || 'rgba(56, 189, 248, 0.15)',
                borderColor: roleDetail?.border || 'rgba(56, 189, 248, 0.35)',
              }}
            >
              {roleDetail?.badgeLabel || user?.role}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Attempted Destination:</span>
            <span className="restricted-path">
              /{attemptedTab ? `${attemptedTab}/dashboard` : 'restricted-resource'}
            </span>
          </div>

          <div className="security-notice">
            <AlertTriangle size={15} color="#F59E0B" />
            <span>
              Raksha-Setu National Emergency Protocol enforces strict Role-Based Access Control (RBAC).
              Unauthorized privilege escalation attempts are logged in the immutable security audit bus.
            </span>
          </div>
        </div>

        <div className="denied-actions">
          <button className="btn-return-dashboard" onClick={handleReturn}>
            <ArrowLeft size={18} />
            <span>Return to {roleDetail?.name || 'My'} Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
