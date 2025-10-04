"use client";

import React, { useState } from "react";
import Header from "../Header";
import Input from "../input/input";
import MatriculaInput from "../input/matriculaInput";

const CadastroFuncionario: React.FC = () => {
  const [form, setForm] = useState({
    MATRICULA: "",
    NOME: "",
    CARGO: "",
    TELEFONE: "",
    CPF: "",
    EMAIL: "",
    GERENCIA: "", // aqui deve ser o id da gerência (string que representa número)
  });

  const [cargoSugestoes, setCargoSugestoes] = useState<string[]>([]);
  const [nivelSugestoes, setNivelSugestoes] = useState<string[]>([]);

  // Atualiza os valores do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

  };

  // Submissão com envio ao backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricula: form.MATRICULA,
          senha: form.MATRICULA, // senha inicial = matricula
          nome: form.NOME,
          email: form.EMAIL,
          id_gerencia: Number(form.GERENCIA), // converte para número
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert("Erro ao cadastrar: " + (errorData.error || "Erro desconhecido"));
        return;
      }

      alert("Funcionário cadastrado com sucesso!");
      // Limpar formulário (opcional)
      setForm({
        MATRICULA: "",
        NOME: "",
        CARGO: "",
        TELEFONE: "",
        CPF: "",
        EMAIL: "",
        GERENCIA: "",
      });
    } catch (error) {
      console.error("Erro ao conectar com backend:", error);
      alert("Erro ao conectar com servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
        <h1 className="text-2xl font-bold mb-4 text-[#023472]">
          Cadastro de Funcionário
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <MatriculaInput 
          name="MATRICULA"
          value={form.MATRICULA} onChange={handleChange} />

          <Input
            type="text"
            id="NOME"
            name="NOME"
            placeholder="Digite o nome completo"
            value={form.NOME}
            onChange={handleChange}
            required
          />
          <Input
            type="text"
            id="CPF"
            name="CPF"
            placeholder="CPF"
            value={form.CPF}
            onChange={handleChange}
            required
          />
          <Input
            type="tel"
            id="TELEFONE"
            name="TELEFONE"
            placeholder="Telefone"
            value={form.TELEFONE}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            id="EMAIL"
            name="EMAIL"
            placeholder="E-mail"
            value={form.EMAIL}
            onChange={handleChange}
            required
          />

          {/* Troque o input gerencia por select para evitar erro */}
          <select
            id="GERENCIA"
            name="GERENCIA"
            value={form.GERENCIA}
            onChange={handleChange}
            required
            className="p-2 w-full  focus:ring-blue-500w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-black"
          >
            <option value="">Selecione a gerência</option>
            <option value="1">1- CIJ</option>
            <option value="2">2- GA</option>
            <option value="3">3- GACD</option>
            <option value="4">4- GAF</option>
            <option value="5">5- GFTM</option>
            <option value="6">6- GTI</option>
            <option value="7">7- PFM</option>
            <option value="8">8- GAB SEREC</option>
            <option value="9">9- GAB SEFAZ</option>
            <option value="10">10- GCONT</option>
            <option value="11">11- GPEC</option>
            <option value="12">12- GEPF</option>
            <option value="13">13- GPAG</option>
            <option value="14">14- GCONF</option>
            <option value="15">15- GAB SEFIN</option>
            <option value="16">16- 2 INST</option>
          </select>

          <button
            type="submit"
            className="w-full bg-[#023472] text-white py-2 rounded mt-4"
          >
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
};
export default CadastroFuncionario;
