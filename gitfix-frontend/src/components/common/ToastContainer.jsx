import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = 'var(--sky-400)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'var(--emerald-400)';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          iconColor = 'var(--rose-400)';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'var(--amber-400)';
        }

        return (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <Icon size={20} color={iconColor} style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
