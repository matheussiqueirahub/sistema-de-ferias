'use client';

import React, { useEffect, useState, useCallback } from "react";
import DashboardCard from "./../../../components/DashboardCard";
import Header from "./../../../components/Header";
import axios, { AxiosResponse } from "axios";

interface DashboardData {
  totalFuncionarios: number;
  feriasMesAtual: number;
  feriasSolicitadas: number;
}

interface RawEmployee {
  // aceitamos várias formas vindas do backend
  MATRICULA_F?: string;
  matricula?: string;
  NOME?: string;
  nome?: string;
  SIGLA_GERENCIA?: string;
  sigla_gerencia?: string;
  MES_INICIO?: string;
  MES_FIM?: string;
  SALDO?: string | number;
  PERCEPCAO?: string
  // campos extras possíveis:
  [k: string]: any;
}

interface Employee {
  MATRICULA_F: string;
  NOME: string;
  SIGLA_GERENCIA: string;
  MES_INICIO?: string;
  MES_FIM?: string ;
  SALDO?: string | number;
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    totalFuncionarios: 0,
    feriasMesAtual: 0,
    feriasSolicitadas: 0
  });

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  // pega os valores dos cards
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          funcionariosTotalRes,
          feriasMesAtualRes,
          feriasSolicitadasRes
        ] = await Promise.all([
          axios.get("http://localhost:3001/tela/funcionarios/count"),
          axios.get("http://localhost:3001/tela/ferias/mes-atual"),
          axios.get("http://localhost:3001/tela/ferias/solicitacoes")
        ]);

        setData({
          totalFuncionarios: funcionariosTotalRes?.data?.total ?? 0,
          feriasMesAtual: feriasMesAtualRes?.data?.total ?? 0,
          feriasSolicitadas: feriasSolicitadasRes?.data?.total ?? 0
        });
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard", err);
      }
    };

    fetchData();
  }, []);

  // Normaliza diferentes formatos de resposta para array de funcionários
  const normalizeResponseToEmployees = (res: AxiosResponse<any>): RawEmployee[] => {
    const d = res?.data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.data)) return d.data;
    // se o backend retornar { funcionarios: [...] }
    if (Array.isArray(d.funcionarios)) return d.funcionarios;
    // se retornar objeto único (um funcionário), transformamos em array
    if (typeof d === "object") {
      // tentar extrair arrays de propriedades comuns
      const possibleArrays = ["items", "results", "rows"];
      for (const key of possibleArrays) {
        if (Array.isArray(d[key])) return d[key];
      }
      // fallback: se objeto tem chaves de funcionário, colocamos ele só
      return [d];
    }
    return [];
  };

  const normalizeEmployee = (raw: RawEmployee): Employee => {
    return {
      MATRICULA_F: raw.MATRICULA_F ?? raw.matricula ?? raw.MATRICULA ?? raw.id ?? "",
      NOME: raw.NOME ?? raw.nome ?? raw.NOME_COMPLETO ?? "",
      SIGLA_GERENCIA: raw.SIGLA_GERENCIA ?? raw.sigla_gerencia ?? raw.gerencia ?? "",
      MES_INICIO: raw.MES_INICIO ?? raw.mes_inicio ?? raw.MES_INICIO_FORMATADO ?? null,
      MES_FIM: raw.MES_FIM ?? raw.mes_fim ?? raw.MES_FIM_FORMATADO ?? null,
      SALDO: raw.SALDO ?? raw.saldo ?? null
    };
  };

  // tenta uma lista de endpoints, retorna no primeiro que responder 200
  const tryEndpoints = async (endpoints: string[]) => {
    for (const url of endpoints) {
      try {
        const res = await axios.get(url);
        return res;
      } catch (err: any) {
        // 404/other -> tenta próximo
        console.warn(`Request ${url} falhou:`, err?.response?.status ?? err.message);
        continue;
      }
    }
    throw new Error("Nenhum endpoint disponível");
  };

  const getEmployeesForType = useCallback(async (type: string) => {
    // Escolhe candidatos por tipo (ordem de tentativa)
    const candidates: Record<string, string[]> = {
      totalFuncionarios: [
        "http://localhost:3001/tela/funcionarios",
        "http://localhost:3001/funcionarios",
        "http://localhost:3001/gerencias/funcionarios"
      ],
      feriasMesAtual: [
        "http://localhost:3001/tela/funcionarios/ferias-mes-atual",
        "http://localhost:3001/funcionarios/ferias-mes-atual",
        "http://localhost:3001/gerencias/emferias"
      ],
      feriasSolicitadas: [
        "http://localhost:3001/tela/funcionarios/ferias-solicitadas",
        "http://localhost:3001/funcionarios/ferias-solicitadas",
        "http://localhost:3001/soli"
      ],
    };

    const endpoints = candidates[type] ?? candidates.totalFuncionarios;
    const res = await tryEndpoints(endpoints);
    const rawEmployees = normalizeResponseToEmployees(res);
    return rawEmployees.map(normalizeEmployee);
  }, []);

  const handleCardClick = async (type: string) => {
    setSelectedCard(type);
    setEmployees([]);
    setEmployeesError(null);
    setLoadingEmployees(true);

    try {
      const emps = await getEmployeesForType(type);
      setEmployees(emps);
    } catch (err: any) {
      console.error("Erro ao buscar funcionários:", err);
      setEmployeesError("Não foi possível carregar a lista. Verifique se o backend tem a rota correta.");
    } finally {
      setLoadingEmployees(false);
    }
  };

  // fechar com ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCard(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const titleFor = (card: string | null) => {
    if (card === "feriasMesAtual") return "Funcionários em Férias no Mês Atual";
    if (card === "feriasSolicitadas") return "Solicitações de Férias em Aberto";
    return "Todos os Funcionários";
  };

  return (
    <div className="min-h-screen bg-white flow-root ">
      <Header />
      <h2 className="mt-10 text-2xl font-bold mb-6 text-center text-[#023472]">
        Resumo de Férias - SEREC

      </h2>

      <div className="flex flex-wrap gap-6 justify-center">
        <div onClick={() => handleCardClick("totalFuncionarios")} className="cursor-pointer">
          <DashboardCard
            title="Funcionários SEREC"
            value={data.totalFuncionarios}
            color="bg-yellow-400"
          />
        </div>

        <div onClick={() => handleCardClick("feriasMesAtual")} className="cursor-pointer">
          <DashboardCard
            title="Funcionários em Férias"
            value={data.feriasMesAtual}
            color="bg-yellow-400"
          />
        </div>

        <div onClick={() => handleCardClick("feriasSolicitadas")} className="cursor-pointer">
          <DashboardCard
            title="Solicitações em Aberto"
            value={data.feriasSolicitadas}
            color="bg-yellow-400"
          />
        </div>
      </div>

      {selectedCard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-16 z-50"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white rounded-lg text-black shadow-lg max-w-5xl w-[95%] p-6 relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              aria-label="Fechar"
            >
              &times;
            </button>

            <h3 className="text-xl font-bold mb-4 text-[#023472]">{titleFor(selectedCard)}</h3>

            {loadingEmployees ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin border-4 border-t-transparent rounded-full w-10 h-10 border-yellow-400" />
              </div>
            ) : employeesError ? (
              <p className="text-red-500">{employeesError}</p>
            ) : employees.length === 0 ? (
              <p className="text-center text-gray-500">Nenhum funcionário encontrado.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border text-black px-3 py-2">Matrícula</th>
                      <th className="border text-black px-3 py-2">Nome</th>
                      <th className="border text-black px-3 py-2">Gerência</th>
                      <th className="border text-black px-3 py-2">Início</th>
                      <th className="border text-black px-3 py-2">Fim</th>
                      <th className="border text-black px-3 py-2">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((f) => (
                      <tr key={f.MATRICULA_F || `${f.NOME}-${Math.random()}`} className="text-center even:bg-white odd:bg-gray-50">
                        <td className="border px-3 py-2">{f.MATRICULA_F || "-"}</td>
                        <td className="border px-3 py-2">{f.NOME || "-"}</td>
                        <td className="border px-3 py-2">{f.SIGLA_GERENCIA || "-"}</td>
                        <td className="border px-3 py-2">{f.MES_INICIO ?? "-"}</td>
                        <td className="border px-3 py-2">{f.MES_FIM ?? "-"}</td>
                        <td className="border px-3 py-2">{f.SALDO ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
