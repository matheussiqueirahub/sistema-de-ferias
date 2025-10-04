'use client'
import React, { useState, useEffect } from "react";
import Header from "./Header";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

interface FormState {
  dataInicio: string;
  dataFim: string;
  periodoAquisitivo: string;
  dataAno: string;
}

interface Periodo {
  periodo: string;
  STATUS: number;
}

const SolicitacaoFerias: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    dataInicio: "",
    dataFim: "",
    periodoAquisitivo: "",
    dataAno: ""
  });

  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const matricula = '916286'; // substituir pelo usuário logado

  useEffect(() => {
    fetch(`http://localhost:3001/solicitar-ferias/periodos/${matricula}`)
      .then((res) => res.json())
      .then((data) => {
        // Filtra apenas períodos em aberto (STATUS = 2)
        const lista = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        const periodosAbertos = lista.filter((p: Periodo) => p.STATUS === 2);
        setPeriodos(periodosAbertos);
      })
      .catch((err) => console.error("Erro ao buscar períodos:", err));
  }, [matricula]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      matricula,
      periodo: form.periodoAquisitivo,
      dataInicio: form.dataInicio,
      dataFim: form.dataFim,
      ano: form.dataAno
    };

    try {
      const res = await fetch("http://localhost:3001/solicitar-ferias/solicitacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erro ao enviar solicitação");

      alert("Solicitação enviada com sucesso!");
      setForm({ dataInicio: "", dataFim: "", periodoAquisitivo: "", dataAno: "" });
    } catch (error) {
      alert("Erro ao enviar solicitação: " + getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-[#023472]">
          Solicitação de Férias
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700">Período Aquisitivo</label>
            <select
              name="periodoAquisitivo"
              value={form.periodoAquisitivo}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 text-black"
              required
            >
              <option value="">Selecione um Período</option>
              {periodos.map((p, index) => (
                <option key={`${p.periodo}-${index}`} value={p.periodo}>
                  {p.periodo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700">Data de Início</label>
            <input
              name="dataInicio"
              type="date"
              value={form.dataInicio}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 text-black"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700">Data de Fim</label>
            <input
              name="dataFim"
              type="date"
              value={form.dataFim}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 text-black"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700">Ano de Gozo</label>
            <input
              name="dataAno"
              placeholder="Ano"
              value={form.dataAno}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300 text-black"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#023472] text-white p-2 rounded-md hover:bg-blue-700 transition"
          >
            Enviar Solicitação
          </button>
        </form>
      </div>
    </div>
  );
};

export default SolicitacaoFerias;