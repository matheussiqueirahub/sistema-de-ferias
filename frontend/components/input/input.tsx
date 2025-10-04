import React from 'react';

interface InputProps {
  type: string;
  id: string;
  name: string;
  placeholder: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  readonly?: boolean;
  maxLength?: number;  // maxLength agora é opcional
  autoComplete?: string;
}

const Input: React.FC<InputProps> = ({
  type, id, name, placeholder, value,
  onChange, required = false, readonly = false, maxLength, autoComplete = "off",
}) => {
  return (
    <input
    type={type}
    id={id}
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
    readOnly={readonly}
      maxLength={type === 'number' ? 6 : maxLength}  // Aplica o maxLength apenas para número
      autoComplete={autoComplete}
      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-black"
    />
  );
};

export default Input;
