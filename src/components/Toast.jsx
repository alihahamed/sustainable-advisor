import { useEffect } from 'react';
import { CheckCheck, TriangleAlert, X } from 'lucide-react';
function Toast({ message, type = 'success', onClose, isVisible }) {
  const bgColor = type === 'success' ? 'bg-teal-200' : type === 'error' ? 'bg-red-500' : 'bg-orange-500';
  const icon = type === 'success' ? <CheckCheck /> : type === 'error' ? <X /> : <TriangleAlert />;

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div
      className={`fixed top-6 right-6 ${bgColor} border-4 border-black p-6 transition-all duration-300 z-50 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
      style={{
        boxShadow: '12px 12px 0px #000',
        transform: isVisible ? 'rotate(-2deg)' : 'rotate(-2deg) translateX(100%)',
        maxWidth: '300px'
      }}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <p className="font-black uppercase text-sm leading-tight tracking-wide text-black">
            {message}
          </p>
          <button
            onClick={onClose}
            className="mt-3 bg-black text-white px-3 py-1 text-xs font-black uppercase border-2 border-black hover:bg-gray-800 transition-colors"
          >
            <X className='inline-block' /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default Toast;
