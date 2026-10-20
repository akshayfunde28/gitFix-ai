import React from 'react';
import {
  Zap,
  Plus,
  RefreshCw,
  GitBranch,
  Terminal,
  Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TABS } from '../../constants/appConfig';

export const Header = () => {
  const {
    activeTab,
    setActiveTab,
    setIsTriggerModalOpen,
    setIsConnectModalOpen,
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    systemHealth,
    refreshAll,
    isJobsLoading,
  } = useApp();

  const isHealthUp = systemHealth.status === 'UP';

  return (
    <header className="header">
      {/* Brand & Tabs */}
      <div className="header-left">
        <div className="logo-container" onClick={() => setActiveTab(TABS.PIPELINES)}>
          <div className="logo-icon-wrapper">
            <Zap size={22} color="#fff" />
          </div>
          <div className="logo-text">
            <span>GitFix</span>
            <span style={{ color: 'var(--cyan-400)' }}>AI</span>
            <span className="logo-badge">Autonomous</span>
          </div>
        </div>

        {/* Navigation Tabs (Architecture removed as requested) */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === TABS.PIPELINES ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.PIPELINES)}
          >
            <Activity size={16} />
            <span>Pipelines</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === TABS.INSPECTOR ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.INSPECTOR)}
          >
            <Terminal size={16} />
            <span>Live Inspector</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === TABS.CONNECTIONS ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.CONNECTIONS)}
          >
            <GitBranch size={16} />
            <span>Repositories ({connections.length})</span>
          </button>
        </nav>
      </div>

      {/* Controls & Quick Actions */}
      <div className="header-right">
        {/* Backend Health Badge */}
        <div
          className="health-pill"
          title={`Backend status: ${systemHealth.status}. DB: ${
            systemHealth.components?.db?.details?.database || 'PostgreSQL'
          }`}
        >
          <span className={`health-dot ${isHealthUp ? 'up' : 'down'}`} />
          <span>{isHealthUp ? 'Engine Online' : 'Engine Offline'}</span>
        </div>

        {/* Repo Filter Selector */}
        <div className="repo-select-wrapper">
          <select
            className="repo-select"
            value={selectedConnectionId}
            onChange={(e) => setSelectedConnectionId(e.target.value)}
            aria-label="Filter by repository"
          >
            <option value="all">All Repositories</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.repoFullName}
              </option>
            ))}
          </select>
        </div>

        {/* Global Refresh Button */}
        <button
          className="btn-icon-only"
          onClick={refreshAll}
          title="Refresh feeds & sync backend data"
          disabled={isJobsLoading}
          id="btn-header-refresh"
        >
          <RefreshCw size={16} className={isJobsLoading ? 'spin-icon' : ''} />
        </button>

        {/* Add Repo Button */}
        <button
          className="btn btn-secondary"
          onClick={() => setIsConnectModalOpen(true)}
          title="Connect GitHub Repository"
          id="btn-header-connect-repo"
        >
          <Plus size={16} />
          <span>Connect Repo</span>
        </button>

        {/* Trigger Fix Primary Action */}
        <button
          className="btn btn-glow-cyan"
          onClick={() => setIsTriggerModalOpen(true)}
          title="Trigger autonomous issue resolution"
          id="btn-header-trigger-fix"
        >
          <Zap size={16} />
          <span>Trigger Fix</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
