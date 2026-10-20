import React, { useState, useEffect, useRef } from 'react';
import Header from './components/common/Header';
import MetricStats from './components/analytics/MetricStats';
import JobList from './components/jobs/JobList';
import JobInspector from './components/console/JobInspector';
import ConnectionList from './components/connections/ConnectionList';
import TriggerJobModal from './components/jobs/TriggerJobModal';
import AddConnectionModal from './components/connections/AddConnectionModal';
import ToastContainer from './components/common/ToastContainer';
import { useApp } from './context/AppContext';
import { TABS } from './constants/appConfig';

export const App = () => {
  const { activeTab } = useApp();
  const inspectorWrapperRef = useRef(null);
  const [inspectorHeight, setInspectorHeight] = useState(null);

  // Measure console log section height in real-time so JobList cards scroll
  // precisely when reaching the bottom of the console log section on any screen size.
  useEffect(() => {
    if (!inspectorWrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setInspectorHeight(Math.round(entry.contentRect.height));
        }
      }
    });
    observer.observe(inspectorWrapperRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Header />

      {/* Main Responsive Body */}
      <main className="main-content">
        {/* Analytics Metric Bar */}
        <MetricStats />

        {/* Tab 1: Pipelines (Split-pane Dashboard with dynamic height alignment) */}
        {activeTab === TABS.PIPELINES && (
          <div className="split-dashboard">
            <JobList inspectorHeight={inspectorHeight} />
            <div ref={inspectorWrapperRef} className="inspector-column-wrapper">
              <JobInspector />
            </div>
          </div>
        )}

        {/* Tab 2: Full-width Live Inspector */}
        {activeTab === TABS.INSPECTOR && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <JobInspector />
          </div>
        )}

        {/* Tab 3: Connected Repositories */}
        {activeTab === TABS.CONNECTIONS && (
          <ConnectionList />
        )}
      </main>

      {/* Modals & Overlays */}
      <TriggerJobModal />
      <AddConnectionModal />
      <ToastContainer />
    </div>
  );
};

export default App;
