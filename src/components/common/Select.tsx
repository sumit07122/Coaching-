import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Option[];
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  required = false,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`form-select ${className}`}
        style={error ? { borderColor: 'var(--color-danger)' } : {}}
        required={required}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
      {!error && helperText && <p className="form-helper">{helperText}</p>}
    </div>
  );
};
