import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, LockKeyhole, Play, RefreshCw, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { companyRegistry, companyRegistryStats } from './data/companyRegistry.js';
import { evidenceRegistryStats } from './data/evidenceRegistry.js';
import { editorialArticles } from './data/articles.js';
import { rankedStartupIndex, rankingModel } from './lib/rankingEngine.js';
import { agentRoles, agentWorkflow } from './data/agentFoundation.js';
import { buildAgentControlSnapshot } from './lib/agentPipeline.js';
import { getModelGatewayStatus, runEditorModel, runResearchAdapter } from './ai/runtimeClient.js';

const STORAGE_KEY = 'fordex-ai-control-room-drafts';

const roleLabels = {
  ORCHESTRATOR: 'Оркестратор',
  RESEARCH: 'Исследование',
  EVIDENCE: 'Evidence',
  DATA: 'Данные',
  RANKING: 'Рейтинг',
  NEWS: 'Новости',
  VISUAL: 'Визуал',
  QUALITY: 'Контроль качества',
  PUBLISHER: 'Публикация',
};

const TEST_OBJECTIVES = {
  MARKET_SCAN: 'Найди актуальное событие российского AI-рынка за последние 7 дней. Верни только проверяемые факты и источники.',
  COMPANY_RESEARCH: 'Проведи исследование выбранной AI-компании: новые события, сделки, продукты, traction и любые изменения, которые могут быть релевантны рейтингу FORDEX.',
  CREATE_POST: 'На основе предоставленного исследования подготовь черновик короткого делового поста для FORDEX. Не выдумывай факты. Для каждого существенного утверждения укажи источник.',
};

function loadDrafts() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/\`\`\`json\\s*([\\s\\S]*?)\`\`\`/i);
  const raw = fenced?.[1] || text;
  try { return JSON.parse(raw); } catch { return null; }
}

function normalizeResearch(text) {
  const parsed = extractJson(text);
  if (parsed) return parsed;
  return {
    summary: text,
    facts: [],
    sources: [],
    post: '',
  };
}

export function AgentControlRoom() {
  const snapshot = buildAgentControlSnapshot();
  const [provider, setProvider] = useState('anymodel');
  const [model, setModel] = useState('');
  const [testKey, setTestKey] = useState('');
  const [operation, setOperation] = useState('MARKET_SCAN');
  const [companyId, setCompanyId] = useState('');
  const [objective, setObjective] = useState(TEST_OBJECTIVES.MARKET_SCAN);
  const [gateway, setGateway] = useState({ status: 'CHECKING', providers: [] });
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState(loadDrafts);

  const selectedCompany = useMemo(
    () => companyRegistry.find((company) => company.id === companyId) || null,
    [companyId],
  );

  useEffect(() => {
    getModelGatewayStatus()
      .then((status) => setGateway(status))
      .catch((err) => setGateway({ status: 'ERROR', providers: [], error: err.message }));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    if (operation === 'MARKET_SCAN') {
      setCompanyId('');
      setObjective(TEST_OBJECTIVES.MARKET_SCAN);
    }
    if (operation === 'COMPANY_RESEARCH') {
      setObjective(TEST_OBJECTIVES.COMPANY_RESEARCH);
    }
    if (operation === 'CREATE_POST') {
      setObjective(TEST_OBJECTIVES.CREATE_POST);
    }
  }, [operation]);

  const configured = gateway.providers?.find((item) => item.provider === provider)?.configured ?? false;
  const testKeyActive = Boolean(testKey.trim());

  async function runAI() {
    setLoading(true);
    setError('');
    try {
      let research = lastRun?.research || null;
      if (operation === 'MARKET_SCAN' || operation === 'COMPANY_RESEARCH') {
        research = await runResearchAdapter({
          objective: objective.trim(),
          company: selectedCompany
            ? { id: selectedCompany.id, name: selectedCompany.name, sector: selectedCompany.sector }
            : null,
        });
      }

      const context = {
        language: 'ru',
        requiresEvidence: true,
        operation,
        company: selectedCompany
          ? { id: selectedCompany.id, name: selectedCompany.name, sector: selectedCompany.sector }
          : null,
        previousResearch: lastRun?.output || null,
        discoveredSources: research?.sources || [],
        responseFormat: operation === 'CREATE_POST'
          ? 'Return a JSON object with summary, facts[], sources[], and post.'
          : 'Return a JSON object with summary, facts[], sources[].',
      };

      const result = await runEditorModel({
        objective: objective.trim(),
        companyId: selectedCompany?.id || null,
        context,
        provider,
        model: model.trim() || null,
        testKey,
      });

      const normalized = normalizeResearch(result.output);
      const safeNormalized = operation === 'CREATE_POST' && !normalized.post
        ? {
            ...normalized,
            post: result.output,
            sources: normalized.sources?.length ? normalized.sources : (lastRun?.research?.sources || []),
          }
        : normalized;
      const run = {
        id: result.responseId || 'run-' + Date.now(),
        at: new Date().toISOString(),
        operation,
        provider: result.provider,
        model: result.model,
        output: result.output,
        normalized: safeNormalized,
        usage: result.usage || null,
        research,
      };

      setLastRun(run);

      if (operation === 'CREATE_POST' && safeNormalized.post) {
        setDrafts((current) => [
          {
            id: run.id,
            createdAt: run.at,
            title: safeNormalized.facts?.[0]?.title || selectedCompany?.name || 'AI draft',
            post: safeNormalized.post,
            sources: Array.isArray(safeNormalized.sources) ? safeNormalized.sources : [],
            status: 'WAITING_APPROVAL',
          },
          ...current.filter((draft) => draft.id !== run.id),
        ]);
      }
    } catch (err) {
      setError(err.message || 'AI_REQUEST_FAILED');
    } finally {
      setLoading(false);
    }
  }

  function approveDraft(id) {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, status: 'APPROVED', approvedAt: new Date().toISOString() } : draft));
  }

  function rejectDraft(id) {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, status: 'REJECTED', rejectedAt: new Date().toISOString() } : draft));
  }

  return (
    <main className="agent-control">
      <section className="agent-control-hero">
        <div>
          <span>FORDEX / AI CONTROL ROOM</span>
          <h1>AI-РЕДАКЦИЯ<br />TEST WORKSPACE.</h1>
          <p>Здесь подключается модель, запускаются исследовательские задания и проверяется полный путь от источника до черновика публикации. Публичный FORDEX при этом остаётся за защищённым approval gate.</p>
        </div>
        <div className={gateway.status === 'READY' ? 'agent-status agent-status-ready' : 'agent-status'}>
          <Activity size={16} />
          <strong>{gateway.status || 'CHECKING'}</strong>
          <span>{configured ? provider.toUpperCase() + ' · КЛЮЧ НА СЕРВЕРЕ' : 'ПРОВАЙДЕР НЕ НАСТРОЕН'}</span>
        </div>
      </section>

      <section className="agent-workspace-panel">
        <div className="agent-panel-head">
          <span>MODEL LAB / RUN A JOB</span>
          <strong>{loading ? 'RUNNING' : 'READY'}</strong>
        </div>
        <div className="agent-workspace-grid">
          <div className="agent-form">
            <label>
              <span>ОПЕРАЦИЯ</span>
              <select value={operation} onChange={(event) => setOperation(event.target.value)}>
                <option value="MARKET_SCAN">MARKET SCAN</option>
                <option value="COMPANY_RESEARCH">COMPANY RESEARCH</option>
                <option value="CREATE_POST">CREATE POST</option>
              </select>
            </label>
            <label>
              <span>ПРОВАЙДЕР</span>
              <select value={provider} onChange={(event) => setProvider(event.target.value)}>
                {(gateway.providers?.length ? gateway.providers : [{ provider: 'anymodel', configured: false, model: 'gpt-5.6-luna' }, { provider: 'astra', configured: false, model: 'gpt-6-astra' }]).map((item) => (
                  <option key={item.provider} value={item.provider}>{item.provider.toUpperCase()} · {item.configured ? 'READY' : 'NOT CONFIGURED'}</option>
                ))}
              </select>
            </label>
            <label className="agent-key-field">
              <span>ВРЕМЕННЫЙ API KEY / ТОЛЬКО ДЛЯ ТЕСТА</span>
              <div className="agent-key-wrap">
                <input
                  type="password"
                  value={testKey}
                  onChange={(event) => setTestKey(event.target.value)}
                  placeholder="Вставь ключ здесь"
                  autoComplete="off"
                  spellCheck="false"
                />
                {testKey && <button type="button" onClick={() => setTestKey('')} aria-label="Очистить временный ключ">×</button>}
              </div>
              <small>Ключ не сохраняется в localStorage и не показывается в интерфейсе после ввода.</small>
            </label>
            <label>
              <span>МОДЕЛЬ / ОПЦИОНАЛЬНО</span>
              <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Использовать модель провайдера по умолчанию" />
            </label>
            {operation !== 'MARKET_SCAN' && (
              <label>
                <span>КОМПАНИЯ</span>
                <select value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
                  <option value="">Выбрать компанию</option>
                  {rankedStartupIndex.map((item) => <option key={item.id} value={item.id}>#{item.rank} · {item.name}</option>)}
                </select>
              </label>
            )}
            <label className="agent-form-wide">
              <span>ЗАДАЧА</span>
              <textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={5} />
            </label>
            <button className="agent-run-button" type="button" onClick={runAI} disabled={loading || !objective.trim()}>
              {loading ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
              {loading ? 'ВЫПОЛНЯЕТСЯ…' : 'ЗАПУСТИТЬ ИИ'}
            </button>
            {error && <div className="agent-error"><XCircle size={15} /><span>{error}</span></div>}
          </div>

          <div className="agent-runtime-card">
            <div className="agent-runtime-head">
              <Sparkles size={16} />
              <div><strong>RUNTIME</strong><span>/api/ai/editor</span></div>
            </div>
            <div className="agent-runtime-row"><span>Gateway</span><b>{gateway.status || '—'}</b></div>
            <div className="agent-runtime-row"><span>Provider</span><b>{provider}</b></div>
            <div className="agent-runtime-row"><span>Model</span><b>{model || gateway.providers?.find((item) => item.provider === provider)?.model || 'default'}</b></div>
            <div className="agent-runtime-row"><span>Credential</span><b className="agent-green-text">{testKeyActive ? 'TEMPORARY / MEMORY ONLY' : configured ? 'SERVER ENV' : 'MISSING'}</b></div>
            <div className="agent-runtime-row"><span>Publish permission</span><b>DENIED</b></div>
            <div className="agent-runtime-row"><span>Score override</span><b>DENIED</b></div>
            <div className="agent-runtime-row"><span>Formula change</span><b>DENIED</b></div>
          </div>
        </div>
      </section>

      <section className="agent-kpis">
        <Metric label="КОМПАНИИ" value={companyRegistryStats.total} note="registry" />
        <Metric label="EVIDENCE" value={evidenceRegistryStats.total} note="linked records" />
        <Metric label="В ИНДЕКСЕ" value={rankedStartupIndex.length} note={'model ' + rankingModel.version} />
        <Metric label="AI DRAFTS" value={drafts.length} note="local approval queue" />
      </section>

      <section className="agent-control-grid">
        <div className="agent-panel">
          <div className="agent-panel-head"><span>AGENT ROSTER</span><strong>{agentRoles.length} РОЛЕЙ</strong></div>
          <div className="agent-roles">{agentRoles.map((role) => (
            <div className="agent-role" key={role}><span>{role}</span><strong>{roleLabels[role] || role}</strong><em>{role === 'PUBLISHER' ? 'GATED' : 'READY'}</em></div>
          ))}</div>
        </div>
        <div className="agent-panel">
          <div className="agent-panel-head"><span>PUBLICATION GATE</span><strong>ACTIVE</strong></div>
          <div className="agent-gates">
            <Gate label="Evidence required" />
            <Gate label="Conflicts block publication" />
            <Gate label="Ranking formula is read-only for agents" />
            <Gate label="Human approval required" />
          </div>
          <div className="agent-warning"><LockKeyhole size={15} /><span>AI может исследовать и готовить draft, но не получает право публиковать или менять Score напрямую.</span></div>
        </div>
      </section>

      <section className="agent-panel agent-result-panel">
        <div className="agent-panel-head"><span>LAST AI RUN</span><strong>{lastRun ? new Date(lastRun.at).toLocaleString('ru-RU') : 'NO RUN YET'}</strong></div>
        {!lastRun ? (
          <div className="agent-empty">Запусти первую задачу выше — результат появится здесь.</div>
        ) : (
          <div className="agent-result-grid">
            <div className="agent-result-main">
              <div className="agent-result-meta">
                <span>{lastRun.operation}</span>
                <span>{lastRun.provider} / {lastRun.model}</span>
                <span>{lastRun.research?.sourceCount ?? 0} SOURCES</span>
              </div>
              <div className="agent-result-block">
                <span>SUMMARY</span>
                <p>{lastRun.normalized.summary || 'Модель вернула результат без отдельного summary.'}</p>
              </div>
              {Array.isArray(lastRun.normalized.facts) && lastRun.normalized.facts.length > 0 && (
                <div className="agent-result-block">
                  <span>FACTS</span>
                  {lastRun.normalized.facts.map((fact, index) => (
                    <div className="agent-fact" key={fact.id || index}>
                      <strong>{fact.title || fact.statement || 'Fact'}</strong>
                      <p>{fact.statement || fact.text || '—'}</p>
                      {fact.confidence != null && <em>confidence {fact.confidence}</em>}
                    </div>
                  ))}
                </div>
              )}
              {lastRun.research?.sources?.length > 0 && (
                <div className="agent-result-block">
                  <span>DISCOVERED SOURCES / RESEARCH ADAPTER</span>
                  {lastRun.research.sources.map((source, index) => (
                    <a key={'discovered-' + (source.url || index)} className="agent-source-link" href={source.url} target="_blank" rel="noreferrer">
                      <strong>{source.sourceName || 'NEWS SOURCE'}</strong>
                      <span>{source.title || source.url}</span>
                    </a>
                  ))}
                </div>
              )}
              {Array.isArray(lastRun.normalized.sources) && lastRun.normalized.sources.length > 0 && (
                <div className="agent-result-block">
                  <span>MODEL SOURCES</span>
                  {lastRun.normalized.sources.map((source, index) => (
                    <a key={source.url || index} className="agent-source-link" href={source.url} target="_blank" rel="noreferrer">
                      <strong>{source.name || source.sourceName || 'SOURCE'}</strong>
                      <span>{source.title || source.url}</span>
                    </a>
                  ))}
                </div>
              )}
              {lastRun.normalized.post && (
                <div className="agent-result-block agent-post-preview">
                  <span>POST DRAFT</span>
                  <p>{lastRun.normalized.post}</p>
                </div>
              )}
              <details className="agent-raw">
                <summary>Показать raw output</summary>
                <pre>{lastRun.output}</pre>
              </details>
            </div>
            <div className="agent-result-side">
              <div className="agent-side-card"><span>RESPONSE ID</span><strong>{lastRun.id}</strong></div>
              <div className="agent-side-card"><span>USAGE</span><strong>{lastRun.usage ? JSON.stringify(lastRun.usage) : '—'}</strong></div>
              <div className="agent-side-card"><span>SELECTED COMPANY</span><strong>{selectedCompany?.name || 'MARKET'}</strong></div>
              <div className="agent-side-card"><span>RESEARCH SOURCES</span><strong>{lastRun.research?.sourceCount ?? 0}</strong></div>
              <div className="agent-side-card"><span>PUBLICATION</span><strong>WAITING FOR HUMAN APPROVAL</strong></div>
            </div>
          </div>
        )}
      </section>

      <section className="agent-panel agent-drafts-panel">
        <div className="agent-panel-head"><span>APPROVAL QUEUE</span><strong>{drafts.length ? drafts.length + ' DRAFTS' : 'EMPTY'}</strong></div>
        {!drafts.length ? (
          <div className="agent-empty">Черновики появятся после операции CREATE POST.</div>
        ) : drafts.map((draft) => (
          <article className="agent-draft" key={draft.id}>
            <div className="agent-draft-copy">
              <div className="agent-draft-top"><span>{draft.status}</span><time>{new Date(draft.createdAt).toLocaleString('ru-RU')}</time></div>
              <h3>{draft.title}</h3>
              <p>{draft.post}</p>
              {draft.sources?.length > 0 && <div className="agent-draft-sources">{draft.sources.map((source, index) => <a key={source.url || index} href={source.url} target="_blank" rel="noreferrer">{source.name || source.sourceName || source.title || 'Источник'}</a>)}</div>}
            </div>
            <div className="agent-draft-actions">
              <button type="button" onClick={() => approveDraft(draft.id)} disabled={draft.status !== 'WAITING_APPROVAL'}><CheckCircle2 size={15} /> APPROVE</button>
              <button type="button" onClick={() => rejectDraft(draft.id)} disabled={draft.status !== 'WAITING_APPROVAL'}><XCircle size={15} /> REJECT</button>
            </div>
          </article>
        ))}
      </section>

      <section className="agent-workflow">
        <div className="agent-panel">
          <div className="agent-panel-head"><span>AUTONOMOUS WORKFLOW</span><strong>SEQUENTIAL</strong></div>
          <div className="agent-steps">{agentWorkflow.map((step, index) => <div className="agent-step" key={step}><b>{String(index + 1).padStart(2, '0')}</b><span>{step}</span></div>)}</div>
        </div>
      </section>

      <section className="agent-control-grid">
        <div className="agent-panel">
          <div className="agent-panel-head"><span>SYSTEM SNAPSHOT</span><strong>LIVE DATA LAYER</strong></div>
          <div className="agent-table">
            <Row label="Companies" value={snapshot.companies} />
            <Row label="Evidence records" value={snapshot.existingEvidence} />
            <Row label="Published articles" value={snapshot.publishedArticles} />
            <Row label="Ranked companies" value={snapshot.rankedCompanies} />
            <Row label="Ranking model" value={snapshot.rankingModelVersion} />
            <Row label="Ranking status" value={snapshot.rankingStatus} />
          </div>
        </div>
        <div className="agent-panel">
          <div className="agent-panel-head"><span>MODEL CONTRACT</span><strong>{rankingModel.status}</strong></div>
          <div className="agent-contract">
            <p><strong>Score 0–100</strong> · {rankingModel.weights.map((item) => item.label + ' ' + item.value + '%').join(' · ')}</p>
            <p>Источники, evidence и история изменений должны сохраняться отдельно от вычисленного Score.</p>
            <div className="agent-safe"><ShieldCheck size={15} /><span>Детерминированный ranking engine остаётся источником истины для Score.</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, note }) {
  return <div className="agent-metric"><span>{label}</span><strong>{value}</strong><em>{note}</em></div>;
}
function Gate({ label }) {
  return <div className="agent-gate"><CheckCircle2 size={15} /><span>{label}</span></div>;
}
function Row({ label, value }) {
  return <div className="agent-row"><span>{label}</span><strong>{value}</strong></div>;
}
