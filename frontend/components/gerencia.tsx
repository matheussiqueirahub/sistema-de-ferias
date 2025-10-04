'use client'
import React, { useEffect, useState } from 'react';
import Header from './Header';
import axios from 'axios';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Gerencia {
  ID_GERENCIA: number;
  GERENCIA: string;
  SIGLA_GERENCIA: string;
}

interface Funcionario {
  MATRICULA_F: string;
  NOME: string;
  GERENCIA: string;
  SIGLA_GERENCIA: string;
  STATUS: string;
  PERIODO_AQUISITIVO_EM_ABERTO: string;
  GOZO: string;
  TIPO: string;
  ID_PERIODO?: string | null;
  MES_FORMATADO?: string;
  DIA_EM_MES?: string;
  SALDO?: string;
  FIM?: string;
}

interface Gozo {
  ID: string;
  MES_INICIO: string;
  MES_FIM: string;
  TIPO: string;
  PERCEPCAO: string;
  ANO: string;
  SALDO: string;
}

const Gerencias: React.FC = () => {
  const [gerencias, setGerencias] = useState<Gerencia[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionariosEmFerias, setFuncionariosEmFerias] = useState<Gozo[]>([]);
  const [filteredFuncionarios, setFilteredFuncionarios] = useState<Funcionario[]>([]);
  const [selectedSigla, setSelectedSigla] = useState<string>('');
  const [selectedMes, setSelectedMes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const meses = [
    "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];

  const mapFuncionariosComMes = (funcs: Funcionario[], ferias: Gozo[]) => {
    return funcs.map(f => {
      const feriasFuncionario = ferias.find(g => g.ID === f.ID_PERIODO);

      let mesFormatado = '-';
      let diaEMes = '-';
      let fimFormatado = '-';

      if (feriasFuncionario?.MES_INICIO) {
        const inicio = parseISO(feriasFuncionario.MES_INICIO); // data ISO real
        diaEMes = format(inicio, "dd/MM", { locale: ptBR });
        mesFormatado = format(inicio, "MMMM", { locale: ptBR }); // mês por extenso
      }

      if (feriasFuncionario?.MES_FIM) {
        const fim = parseISO(feriasFuncionario.MES_FIM);
        fimFormatado = format(fim, 'dd/MM');
      }

      return {
        ...f,
        MES_FORMATADO: mesFormatado,
        DIA_EM_MES: diaEMes,
        SALDO: feriasFuncionario ? feriasFuncionario.SALDO : '-',
        FIM: fimFormatado,
      };
    });
  };

  useEffect(() => {
    axios.get('http://localhost:3001/gerencias')
      .then(res => setGerencias(res.data))
      .catch(err => console.error('Erro ao buscar gerências:', err));

    axios.get('http://localhost:3001/gerencias/funcionarios')
      .then(res => setFuncionarios(res.data))
      .catch(err => console.error('Erro ao buscar funcionários:', err));

    axios.get('http://localhost:3001/gerencias/emferias')
      .then(res => setFuncionariosEmFerias(res.data))
      .catch(err => console.error('Erro ao buscar funcionários em férias:', err));
  }, []);

  useEffect(() => {
    const funcsComMes = mapFuncionariosComMes(funcionarios, funcionariosEmFerias);
    const filtered = funcsComMes.filter(f =>
      (selectedSigla === '' || f.SIGLA_GERENCIA === selectedSigla) &&
      (selectedMes === '' || f.MES_FORMATADO?.toLowerCase() === selectedMes.toLowerCase()) &&
      (searchQuery === '' || f.NOME.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredFuncionarios(filtered);
  }, [funcionarios, funcionariosEmFerias, selectedSigla, selectedMes, searchQuery]);

  const handleFilterByGerencia = (sigla: string) => {
    setSelectedSigla(sigla);
  };

  const handleFilterByMes = (mes: string) => {
    setSelectedMes(mes);
  };

  const handleSearchByName = (query: string) => {
    setSearchQuery(query);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-[#023472] text-center mb-6">
          Funcionários por Gerência
        </h1>

        <div className="flex flex-wrap gap-4 items-center mb-4">
          {/* Filtro por Gerência */}
          <div className="flex gap-4 items-center">
            <label className="font-semibold text-gray-700">Filtrar por Gerência:</label>
            <select
              onChange={(e) => handleFilterByGerencia(e.target.value)}
              value={selectedSigla}
              className="p-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {gerencias.map(g => (
                <option key={g.ID_GERENCIA} value={g.SIGLA_GERENCIA}>
                  {g.GERENCIA}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro por Mês */}
          <div className="flex gap-4 items-center">
            <label className="font-semibold text-gray-700">Filtrar por Mês:</label>
            <select
              onChange={(e) => handleFilterByMes(e.target.value)}
              value={selectedMes}
              className="p-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {meses.slice(1).map((mes) => (
                <option key={mes} value={mes}>
                  {mes.charAt(0).toUpperCase() + mes.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Nome */}
          <div className="flex gap-4 items-center">
            <label className="font-semibold text-gray-700">Pesquisar por Nome:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchByName(e.target.value)}
              placeholder="Nome"
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
        </div>

        {/* Tabela */}
        <table className="w-full text-sm text-black text-center border mt-4">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Matrícula</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Gerência</th>
              <th className="p-2">Período</th>
              <th className="p-2">Saldo</th>
              <th className="p-2">Início</th>
              <th className="p-2">Fim</th>
            </tr>
          </thead>
          <tbody>
            {filteredFuncionarios
              .sort((a, b) => (a.NOME || '').localeCompare(b.NOME || ''))
              .map(f => (
                <tr key={f.MATRICULA_F}>
                  <td className="p-2">{f.MATRICULA_F}</td>
                  <td className="p-2">{f.NOME}</td>
                  <td className="p-2">{f.SIGLA_GERENCIA}</td>
                  <td className="p-2">{f.PERIODO_AQUISITIVO_EM_ABERTO}</td>
                  <td className="p-2">{f.SALDO || '-'}</td>
                  <td className="p-2">{f.DIA_EM_MES || '-'}</td>
                  <td className="p-2">{f.FIM || '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Gerencias;
