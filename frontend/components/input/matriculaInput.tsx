import React from "react";

interface MatriculaInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string; // <- Adicionado
}

const MatriculaInput: React.FC<MatriculaInputProps> = ({ value, onChange, name }) => {
    return (
        <input
            type="text"
            id="matricula"
            name={name} // 
            placeholder="Digite a matrícula"
            value={value}
            onChange={(e) => {
                // Permite apenas números e limita a 6 caracteres
                if (/^\d{0,7}$/.test(e.target.value)) {
                    onChange(e);
                }
            }}
            required
            maxLength={7}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-black"
        />
    );
};

export default MatriculaInput;
