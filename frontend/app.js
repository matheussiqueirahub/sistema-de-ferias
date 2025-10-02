const API = (path, opts = {}) => fetch(`http://localhost:3000${path}`, {
  headers: { 'Content-Type': 'application/json', ...(localStorage.token ? { Authorization: `Bearer ${localStorage.token}` } : {}) },
  ...opts,
});

const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));\nlet selectedRange = [];\nconst fp = window.flatpickr ? flatpickr('#range', { mode: 'range', inline: true, locale: flatpickr.l10ns.pt, dateFormat: 'Y-m-d', onChange: (sel) => { selectedRange = sel; } }) : null;

const elLogin = qs('#login-section');
const elDash = qs('#dashboard');
const elWelcome = qs('#welcome');
const elRoleInfo = qs('#role-info');
const elServidor = qs('#servidor-area');
const elGerente = qs('#gerente-area');
const elExec = qs('#exec-area');
const elNotifs = qs('#notificacoes');

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

async function login(email, password) {
  const resp = await API('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!resp.ok) throw new Error('Falha no login');
  const data = await resp.json();
  localStorage.token = data.token;
  localStorage.user = JSON.stringify(data.user);
}

function formatDate(d) { return new Date(d).toLocaleDateString('pt-BR'); }

function badge(status) {
  const cls = status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'pending';
  const txt = status === 'APPROVED' ? 'Aprovado' : status === 'REJECTED' ? 'Reprovado' : 'Pendente';
  return `<span class="badge ${cls}">${txt}</span>`;
}

async function loadNotifications() {
  const resp = await API('/notifications');
  if (!resp.ok) return;
  const list = await resp.json();
  elNotifs.innerHTML = list.map(n => `<li>${new Date(n.createdAt).toLocaleString('pt-BR')}: ${n.message}${n.read ? '' : ' •'}</li>`).join('');
}

async function loadServidor() {
  const resp = await API('/ferias/mine');
  const list = await resp.json();
  const table = qs('#minhas-solicitacoes');
  table.innerHTML = `
    <tr><th>Início</th><th>Fim</th><th>Status</th><th>Obs.</th></tr>
    ${list.map(x => `<tr><td>${formatDate(x.inicio)}</td><td>${formatDate(x.fim)}</td><td>${badge(x.status)}</td><td>${x.observation ?? ''}</td></tr>`).join('')}
  `;
}

async function loadGerente() {
  const cont = qs('#pendentes');
  const resp = await API('/ferias/pending');
  const list = await resp.json();
  cont.innerHTML = list.map(x => `
    <div class="card-item">
      <div><strong>${x.servidor.name}</strong> — ${formatDate(x.inicio)} a ${formatDate(x.fim)}</div>
      <div class="actions">
        <button class="btn" data-approve="${x.id}">Aprovar</button>
        <button class="btn" data-reject="${x.id}">Reprovar</button>
        <input type="text" placeholder="Observação" data-obs="${x.id}" style="flex:1"/>
      </div>
    </div>
  `).join('');
  cont.onclick = async (e) => {
    const id = e.target.getAttribute('data-approve') || e.target.getAttribute('data-reject');
    if (!id) return;
    const approved = !!e.target.getAttribute('data-approve');
    const obs = cont.querySelector(`[data-obs="${id}"]`).value;
    const resp = await API(`/ferias/${id}/decide`, { method: 'POST', body: JSON.stringify({ approved, observacao: obs }) });
    if (resp.ok) { await loadGerente(); await loadNotifications(); alert('Decisão registrada'); }
  };
}

async function loadExec() {
  const resp = await API('/ferias/all');
  const list = await resp.json();
  const table = qs('#todas-solicitacoes');
  table.innerHTML = `
    <tr><th>Servidor</th><th>Início</th><th>Fim</th><th>Status</th></tr>
    ${list.map(x => `<tr><td>${x.servidor.name}</td><td>${formatDate(x.inicio)}</td><td>${formatDate(x.fim)}</td><td>${badge(x.status)}</td></tr>`).join('')}
  `;
}

async function boot() {
  const user = localStorage.user ? JSON.parse(localStorage.user) : null;
  if (!user) { hide(elDash); show(elLogin); return; }
  hide(elLogin); show(elDash);
  elWelcome.textContent = `Bem-vindo(a), ${user.name}`;
  elRoleInfo.textContent = `Perfil: ${user.role.replace('_', ' ')}`;

  if (user.role === 'SERVIDOR') { show(elServidor); await loadServidor(); }
  if (user.role === 'GERENTE') { show(elGerente); await loadGerente(); }
  if (user.role === 'SECRETARIO_EXECUTIVO') { show(elExec); await loadExec(); }

  await loadNotifications();
}

qs('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = qs('#email').value; const password = qs('#password').value;
  try { await login(email, password); await boot(); } catch { alert('Usuário ou senha inválidos'); }
});

qs('#ferias-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
    const sel = selectedRange;
  if (!sel || sel.length < 2) { alert('Selecione um período no calendário'); return; }
  const i = sel[0];
  const f = sel[1];
  const resp = await API('/ferias', { method: 'POST', body: JSON.stringify({ inicio: new Date(i).toISOString(), fim: new Date(f).toISOString() }) });
    await loadServidor();
    await loadNotifications();
  } catch (e) { alert(e.message); }
});

qs('#logout').addEventListener('click', () => { localStorage.clear(); location.reload(); });

boot();

