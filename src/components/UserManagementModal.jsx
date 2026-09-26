import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { ROLES, ROLE_DETAILS } from '../types/roles';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  ShieldCheck,
  Search,
  Filter,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  Building2,
  Mail,
  Lock
} from 'lucide-react';

export default function UserManagementModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.RESPONDER,
    unit: '',
    badgeId: '',
    phone: '',
    department: '',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      if (data.success) {
        setUsers(data.users || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      setActionError(err.message || 'Failed fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to revoke and delete account for "${userName}"?`)) {
      return;
    }
    setActionError(null);
    try {
      await api.deleteUser(userId);
      setActionNotice(`User "${userName}" account revoked successfully.`);
      loadUsers();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed deleting user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await api.createUser(newUser);
      setActionNotice(`New ${newUser.role} user "${newUser.name}" provisioned successfully.`);
      setShowCreateForm(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: ROLES.RESPONDER,
        unit: '',
        badgeId: '',
        phone: '',
        department: '',
      });
      loadUsers();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed creating user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'ALL' || u.role?.toUpperCase() === filterRole;
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.badgeId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return createPortal(
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-card user-mgmt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header user-mgmt-header">
          <div className="title-with-icon">
            <Users size={22} className="text-purple" />
            <div>
              <h2>Command Center User & Access Management</h2>
              <p>National Disaster Response Force • Verified RBAC Directory</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Notices */}
        {actionNotice && (
          <div className="mgmt-notice-banner notice-success animate-slide-down">
            <CheckCircle2 size={16} />
            <span>{actionNotice}</span>
          </div>
        )}
        {actionError && (
          <div className="mgmt-notice-banner notice-error animate-slide-down">
            <AlertTriangle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Quick Stats Header */}
        {stats && (
          <div className="user-stats-strip">
            <div className="stat-pill">
              <span>Total Accounts:</span> <strong>{stats.totalUsers}</strong>
            </div>
            <div className="stat-pill pill-admin">
              <span>🏛️ Admins:</span> <strong>{stats.adminsCount}</strong>
            </div>
            <div className="stat-pill pill-responder">
              <span>🚑 Responders:</span> <strong>{stats.respondersCount}</strong>
            </div>
            <div className="stat-pill pill-citizen">
              <span>👤 Citizens:</span> <strong>{stats.citizensCount}</strong>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="user-mgmt-controls-bar">
          <div className="search-wrap">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or badge ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mgmt-search-input"
            />
          </div>

          <div className="filter-role-group">
            <button
              className={`btn-role-filter ${filterRole === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterRole('ALL')}
            >
              All ({users.length})
            </button>
            <button
              className={`btn-role-filter ${filterRole === ROLES.CITIZEN ? 'active' : ''}`}
              onClick={() => setFilterRole(ROLES.CITIZEN)}
            >
              Citizens
            </button>
            <button
              className={`btn-role-filter ${filterRole === ROLES.RESPONDER ? 'active' : ''}`}
              onClick={() => setFilterRole(ROLES.RESPONDER)}
            >
              Responders
            </button>
            <button
              className={`btn-role-filter ${filterRole === ROLES.ADMIN ? 'active' : ''}`}
              onClick={() => setFilterRole(ROLES.ADMIN)}
            >
              Admins
            </button>
          </div>

          <button
            className="btn-create-user-toggle"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <UserPlus size={16} />
            <span>{showCreateForm ? 'Close Form' : 'Provision User'}</span>
          </button>
        </div>

        {/* Create User Form Sub-Drawer */}
        {showCreateForm && (
          <form onSubmit={handleCreateUser} className="create-user-subform animate-slide-down">
            <h4>➕ Provision Official System Account</h4>
            <div className="subform-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Capt. Sunita Rao"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Official Email *</label>
                <input
                  type="email"
                  placeholder="e.g. s.rao@ndrf.gov.in"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Initial Password *</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>System Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-select"
                >
                  <option value={ROLES.RESPONDER}>🚑 Emergency Responder</option>
                  <option value={ROLES.CITIZEN}>👤 Citizen (Civilian)</option>
                  <option value={ROLES.ADMIN}>🏛️ Command Administrator</option>
                </select>
              </div>

              {newUser.role === ROLES.RESPONDER && (
                <>
                  <div className="form-group">
                    <label>Battalion / Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. NDRF Team Beta (Unit 2)"
                      value={newUser.unit}
                      onChange={(e) => setNewUser({ ...newUser, unit: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Badge / Service ID</label>
                    <input
                      type="text"
                      placeholder="e.g. NDRF-BETA-09"
                      value={newUser.badgeId}
                      onChange={(e) => setNewUser({ ...newUser, badgeId: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="subform-actions">
              <button type="submit" className="btn-save-new-user">
                <UserPlus size={16} /> Confirm Provisioning
              </button>
              <button
                type="button"
                className="btn-cancel-subform"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="user-table-scroll-wrap">
          {loading ? (
            <div className="loading-users-pill">Loading verified directory from secure store...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-users-box">No accounts match the current filter criteria.</div>
          ) : (
            <table className="user-directory-table">
              <thead>
                <tr>
                  <th>User / Official</th>
                  <th>Assigned Role</th>
                  <th>Affiliation / Unit</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const roleDetail = ROLE_DETAILS[u.role] || {};
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell-name">
                          <strong>{u.name}</strong>
                          <span className="user-email-text">{u.email}</span>
                          <span className="user-id-mono">{u.id}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="table-role-badge"
                          style={{
                            color: roleDetail.color,
                            backgroundColor: roleDetail.bg,
                            borderColor: roleDetail.border,
                          }}
                        >
                          {roleDetail.badgeLabel || u.role}
                        </span>
                      </td>
                      <td>
                        <div className="user-unit-info">
                          <span>{u.unit || u.department || u.location || 'Civilian'}</span>
                          {u.badgeId && <span className="badge-tag">ID: {u.badgeId}</span>}
                        </div>
                      </td>
                      <td>
                        <span className="date-text">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-delete-user"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          title="Revoke and delete this account"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
