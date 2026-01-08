import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'offline';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClass = status === 'online' ? 'bg-green-500' : 'bg-gray-400';

  return (
    <div className="relative inline-flex">
      <span
        className={`${sizeClasses[size]} ${colorClass} rounded-full`}
        aria-label={status}
      />
      {status === 'online' && (
        <span
          className={`absolute inset-0 ${colorClass} rounded-full animate-ping opacity-75`}
        />
      )}
    </div>
  );
};
