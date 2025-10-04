'use client';

import { useEffect, useState } from 'react';

type StatusGerencia = 'pendente' | 'aprovado' | 'reprovado';
const STATUS_OPTIONS: StatusGerencia[] = ['pendente', 'aprovado', 'reprovado'];

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

interface FeriasApiResponse {
  id?: string | number;
  _id?: string;
  colaborador?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  statusGerencia?: StatusGerencia | null;
  observacaoGerencia?: string | null;
  servidor?: string | null;
}

interface Ferias {
  id: string;
  colaborador: string;
  dataInicio: string;
  dataFim: string;
  statusGerencia: StatusGerencia;
  observacaoGerencia?: string;
  servidor?: string;
}

interface UpdateState {
  status: StatusGerencia;
  observacao: string;
  isSaving: boolean;
  feedback: FeedbackState | null;
}

const API_URL = 'http://localhost:3001/api/ferias';

const STATUS_STYLES: Record<StatusGerencia, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  reprovado: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<StatusGerencia, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const getDefaultUpdateState = (item?: Ferias): UpdateState => ({
  status: item?.statusGerencia ?? 'pendente',
  observacao: item?.observacaoGerencia ?? '',
  isSaving: false,
  feedback: null,
});

const createUpdateState = (items: Ferias[]): Record<string, UpdateState> =>
  items.reduce((acc, item) => {
    acc[item.id] = getDefaultUpdateState(item);
    return acc;
  }, {} as Record<string, UpdateState>);

const fallbackFerias: Ferias[] = [
  {
    id: 'fallback-1',
    colaborador: 'Joao',
    dataInicio: '2025-11-01',
    dataFim: '2025-11-15',
    statusGerencia: 'pendente',
    observacaoGerencia: '',
  },
  {
    id: 'fallback-2',
    colaborador: 'Maria',
    dataInicio: '2025-12-05',
    dataFim: '2025-12-18',
    statusGerencia: 'aprovado',
    observacaoGerencia: 'Aprovado sem pendencias.',
  },
  {
    id: 'fallback-3',
    colaborador: 'Carlos',
    dataInicio: '2025-10-10',
    dataFim: '2025-10-25',
    statusGerencia: 'reprovado',
    observacaoGerencia: 'Rever datas devido a demanda do time.',
  },
];

const isStatusGerencia = (value: unknown): value is StatusGerencia =>
  value === 'pendente' || value === 'aprovado' || value === 'reprovado';

const normalizeFerias = (data: FeriasApiResponse[]): Ferias[] =>
  data.map((item, index) => {
    const status = isStatusGerencia(item.statusGerencia) ? item.statusGerencia : 'pendente';

    return {
      id: String(item.id ?? item._id ?? `${item.colaborador ?? 'solicitacao'}-${item.dataInicio ?? index}`),
      colaborador: item.colaborador ?? 'Nao informado',
      dataInicio: item.dataInicio ?? '',
      dataFim: item.dataFim ?? '',
      statusGerencia: status,
      observacaoGerencia: item.observacaoGerencia ?? undefined,
      servidor: item.servidor ?? undefined,
    };
  });

const formatDate = (value: string) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return DATE_FORMATTER.format(date);
};

interface StatusBadgeProps {
  status: StatusGerencia;
}

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
  >
    {STATUS_LABELS[status]}
  </span>
);

const ListaFerias = () => {
  const [ferias, setFerias] = useState<Ferias[]>(fallbackFerias);
  const [updates, setUpdates] = useState<Record<string, UpdateState>>(
    () => createUpdateState(fallbackFerias),
  );
  const [isUsingFallback, setIsUsingFallback] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFerias = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_URL, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Nao foi possivel carregar as solicitacoes (status ${response.status}).`);
        }

        const payload = await response.json();

        if (!Array.isArray(payload)) {
          throw new Error('Formato de resposta invalido. Era esperado um array.');
        }

        const normalized = normalizeFerias(payload);
        setFerias(normalized);
        setUpdates(createUpdateState(normalized));
        setIsUsingFallback(false);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          err instanceof Error ? err.message : 'Erro inesperado ao carregar as solicitacoes.';
        setError(message);
        setFerias(fallbackFerias);
        setUpdates(createUpdateState(fallbackFerias));
        setIsUsingFallback(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchFerias();

    return () => {
      controller.abort();
    };
  }, []);

  const updateRowState = (id: string, updater: (state: UpdateState) => UpdateState) => {
    setUpdates((prev) => {
      const currentItem = ferias.find((row) => row.id === id);
      const currentState = prev[id] ?? getDefaultUpdateState(currentItem);
      return {
        ...prev,
        [id]: updater(currentState),
      };
    });
  };

  const handleStatusChange = (id: string, status: StatusGerencia) => {
    updateRowState(id, (state) => ({
      ...state,
      status,
      feedback: null,
    }));
  };

  const handleObservacaoChange = (id: string, observacao: string) => {
    updateRowState(id, (state) => ({
      ...state,
      observacao,
      feedback: null,
    }));
  };

  const handleSalvar = async (item: Ferias) => {
    const currentState = updates[item.id] ?? getDefaultUpdateState(item);
    const desiredStatus = currentState.status;
    const desiredObservacao = currentState.observacao;
    const hasChanges =
      item.statusGerencia !== desiredStatus ||
      (item.observacaoGerencia ?? '') !== desiredObservacao;

    if (!hasChanges) {
      updateRowState(item.id, (state) => ({
        ...state,
        feedback: { type: 'error', message: 'Nenhuma alteracao para salvar.' },
      }));
      return;
    }

    updateRowState(item.id, (state) => ({
      ...state,
      isSaving: true,
      feedback: null,
    }));

    try {
      const response = await fetch(`${API_URL}/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statusGerencia: desiredStatus,
          observacaoGerencia: desiredObservacao,
        }),
      });

      let body: Record<string, unknown> | null = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      if (!response.ok) {
        const message =
          typeof body?.error === 'string'
            ? body.error
            : `Falha ao atualizar a solicitacao (status ${response.status}).`;
        throw new Error(message);
      }

      const nextStatus = isStatusGerencia(body?.statusGerencia)
        ? body.statusGerencia
        : desiredStatus;
      const nextObservacao =
        typeof body?.observacaoGerencia === 'string'
          ? body.observacaoGerencia
          : desiredObservacao;

      setFerias((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                statusGerencia: nextStatus,
                observacaoGerencia: nextObservacao,
              }
            : row,
        ),
      );

      updateRowState(item.id, (state) => ({
        ...state,
        status: nextStatus,
        observacao: nextObservacao,
        isSaving: false,
        feedback: { type: 'success', message: 'Atualizacao salva.' },
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro inesperado ao atualizar a solicitacao.';

      updateRowState(item.id, (state) => ({
        ...state,
        isSaving: false,
        feedback: { type: 'error', message },
      }));
    }
  };

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-[#023472]">Solicitacoes de ferias</h2>
        <p className="text-sm text-gray-600">
          Acompanhe o status das solicitacoes avaliadas pela gerencia.
        </p>
      </header>

      {isLoading && (
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          Carregando solicitacoes...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          {isUsingFallback && (
            <span className="mt-2 block text-xs text-red-600/80">
              Exibindo dados de exemplo enquanto a API nao responde.
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white text-sm text-gray-900">
          <thead className="bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Colaborador</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Fim</th>
              <th className="px-4 py-3">Status da gerencia</th>
              <th className="px-4 py-3">Observacao</th>
              <th className="px-4 py-3">Atualizar aprovacao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ferias.map((item) => {
              const rowState = updates[item.id] ?? getDefaultUpdateState(item);
              const desiredStatus = rowState.status;
              const desiredObservacao = rowState.observacao;
              const hasChanges =
                item.statusGerencia !== desiredStatus ||
                (item.observacaoGerencia ?? '') !== desiredObservacao;
              const disableActions = isUsingFallback;

              return (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.colaborador}</td>
                  <td className="px-4 py-3">{formatDate(item.dataInicio)}</td>
                  <td className="px-4 py-3">{formatDate(item.dataFim)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.statusGerencia} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.observacaoGerencia?.trim() ? item.observacaoGerencia : '-'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-2">
                      <label
                        className="text-xs font-semibold text-gray-500"
                        htmlFor={`status-${item.id}`}
                      >
                        Status da gerencia
                      </label>
                      <select
                        id={`status-${item.id}`}
                        value={desiredStatus}
                        onChange={(event) =>
                          handleStatusChange(item.id, event.target.value as StatusGerencia)
                        }
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={disableActions || rowState.isSaving}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>

                      <label
                        className="text-xs font-semibold text-gray-500"
                        htmlFor={`observacao-${item.id}`}
                      >
                        Observacao da gerencia
                      </label>
                      <textarea
                        id={`observacao-${item.id}`}
                        value={desiredObservacao}
                        onChange={(event) => handleObservacaoChange(item.id, event.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Adicione uma observacao para o colaborador"
                        disabled={disableActions || rowState.isSaving}
                      />

                      <button
                        type="button"
                        onClick={() => handleSalvar(item)}
                        disabled={disableActions || rowState.isSaving || !hasChanges}
                        className="inline-flex items-center justify-center rounded-md bg-[#023472] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#034594] disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {rowState.isSaving ? 'Salvando...' : 'Salvar aprovacao'}
                      </button>

                      {rowState.feedback && (
                        <p
                          className={`text-xs ${
                            rowState.feedback.type === 'success' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {rowState.feedback.message}
                        </p>
                      )}

                      {disableActions && (
                        <span className="text-xs text-gray-500">
                          Edicao desabilitada para os dados de exemplo.
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!ferias.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  Nenhuma solicitacao encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {isUsingFallback && !isLoading && !error && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500">
            Exibindo dados de exemplo. Atualizacoes estao desabilitadas ate que a API responda.
          </div>
        )}
      </div>
    </section>
  );
};

export default ListaFerias;
