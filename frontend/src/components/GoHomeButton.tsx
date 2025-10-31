import { useNavigate } from 'react-router-dom';

export default function GoHomeButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      style={{
        border: 'none',
        background: '#2563eb',
        color: '#ffffff',
        padding: '0.75rem 1.5rem',
        borderRadius: '9999px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      Go home
    </button>
  );
}
