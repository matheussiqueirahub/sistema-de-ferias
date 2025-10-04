"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../input/input";
import MatriculaInput from "../input/matriculaInput";

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter();

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!username || !password) {
    setError("Preencha todos os campos.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3001/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula: username, senha: password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.error || "Erro no login");
      return;
    }

    const data = await response.json();

    if (data.senhaPadrao) {
      router.push("/alterar-senha?matricula=" + encodeURIComponent(username));
      return;
    }

    setError(""); // limpa erro
    router.push("/tela");
  } catch (err) {
    console.error("Erro ao conectar ao backend:", err);
    setError("Erro ao conectar ao servidor.");
  }
};

  return (
    <div className="flex justify-center items-center min-h-screen bg-yellow-500">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="text-center">
          <img
            src="/logoprefeitura.jpeg"
            alt="Logo"
            width={160}
            height={144}
            className="mx-auto"
          />
          <h3 className="mt-4 text-2xl font-bold text-[#023472]">
            Sistema de Férias PMJG
          </h3>
          <div className="mt-4">
            <MatriculaInput
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
            />
          </div>
          <div className="mt-2">
            <Input
              type="password"
              id="inputpassword"
              name="password"
              placeholder="Senha"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>
          <button
            type="submit"
            className="mt-4 w-full px-4 py-2 bg-[#023472] text-white rounded-md shadow-md transition duration-300"
          >
            Entrar
          </button>
        </form>
        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default LoginForm;
