import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required = false,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`form-input ${error ? 'input-error' : ''} ${className}`}
        style={error ? { borderColor: 'var(--color-danger)' } : {}}
        required={required}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
      {!error && helperText && <p className="form-helper">{helperText}</p>}
    </div>
  );
};
