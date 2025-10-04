"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import Input from "./input/input";
import axios from "axios";
import { useRouter } from "next/navigation";

const AlterarSenha: React.FC<{ matricula: string }> = ({ matricula }) => {
  const [form, setForm] = useState({
    novaSenha: "",
    confirmeSenha: ""
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.novaSenha !== form.confirmeSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    try {
      await axios.post("http://localhost:3001/nova-senha", {
        matricula,
        novaSenha: form.novaSenha
      });

      alert("Senha alterada com sucesso!");
      router.push("/login"); // redireciona para login
    } catch (error) {
      console.error(error);
      alert("Erro ao alterar a senha.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
        <h1 className="text-2xl font-bold mb-4 text-[#023472]">
          Alterar Senha
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            id="novaSenha"
            name="novaSenha"
            placeholder="Digite a nova senha"
            value={form.novaSenha}
            onChange={handleChange}
            required
          />

          <Input
            type="password"
            id="confirmeSenha"
            name="confirmeSenha"
            placeholder="Confirme a nova senha"
            value={form.confirmeSenha}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="w-full bg-[#023472] text-white py-2 rounded mt-4"
          >
            Alterar Senha
          </button>
        </form>
      </div>
    </div>
  );
};

export default AlterarSenha;
