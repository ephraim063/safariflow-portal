import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export default function Toast({ toasts, removeToast }) {
  if (!toasts.length) return null

  const icons = {
    success: <CheckCircle size={16} color="var(--sage-light)" />,
    error: <XCircle size={16} color="var(--ember)" />,
    info: <Info size={16} color="var(--gold)" />,
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {icons[toast.type]}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
