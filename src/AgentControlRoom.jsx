import { Activity, CheckCircle2, LockKeyhole, ShieldCheck, AlertTriangle } from 'lucide-react';
import { companyRegistryStats } from './data/companyRegistry.js';
import { evidenceRegistryStats } from './data/evidenceRegistry.js';
import { editorialArticles } from './data/articles.js';
import { rankedStartupIndex, rankingModel } from './lib/rankingEngine.js';
import { agentRoles, agentWorkflow, agentControlPlane } from './data/agentFoundation.js';
import { buildAgentControlSnapshot } from './lib/agentPipeline.js';

const snapshot = buildAgentControlSnapshot();

const roleLabels = {
  ORCHESTRATOR: 'Оркестратор', RESEARCH: 'Исследование', EVIDENCE: 'Evidence', DATA: 'Данные',
  RANKING: 'Рейтинг', NEWS: 'Новости', VISUAL: 'Визуал', QUALITY: 'Контроль качества', PUBLISHER: 'Публикация',
};

export function AgentControlRoom() {
  return (
    <main className="agent-control">
      <section className="agent-control-hero">
        <div>
          <span>FORDEX / CONTROL ROOM</span>
          <h1>AI-РЕДАКЦИЯ<br />И ИНДЕКС.</h1>
          <p>Контур будущих агентов: поиск фактов, проверка evidence, обновление данных, пересчёт рейтинга и подготовка публикаций.</p>
        </div>
        <div className="agent-status"><Activity size={16} /><strong>FOUNDATION {agentControlPlane.version}</strong><span>ГОТОВ К ПОДКЛЮЧЕНИЮ МОДЕЛИ</span></div>
      </section>
      <section className="agent-kpis">
        <Metric label="КОМПАНИИ" value={companyRegistryStats.total} note="registry" />
        <Metric label="EVIDENCE" value={evidenceRegistryStats.total} note="linked records" />
        <Metric label="В ИНДЕКСЕ" value={rankedStartupIndex.length} note={'model ' + rankingModel.version} />
        <Metric label="NEWS" value={editorialArticles.length} note="published" />
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
            <Gate label="Evidence required" /><Gate label="Conflicts block publication" /><Gate label="Ranking formula is read-only for agents" /><Gate label="Human approval required" />
          </div>
          <div className="agent-warning"><LockKeyhole size={15} /><span>AI получает право предлагать изменения, но не право менять опубликованный Score напрямую.</span></div>
        </div>
      </section>
      <section className="agent-panel agent-workflow">
        <div className="agent-panel-head"><span>AUTONOMOUS WORKFLOW</span><strong>SEQUENTIAL</strong></div>
        <div className="agent-steps">{agentWorkflow.map((step, index) => <div className="agent-step" key={step}><b>{String(index + 1).padStart(2, '0')}</b><span>{step}</span></div>)}</div>
      </section>
      <section className="agent-control-grid">
        <div className="agent-panel">
          <div className="agent-panel-head"><span>SYSTEM SNAPSHOT</span><strong>LIVE DATA LAYER</strong></div>
          <div className="agent-table">
            <Row label="Companies" value={snapshot.companies} /><Row label="Evidence records" value={snapshot.existingEvidence} />
            <Row label="Published articles" value={snapshot.publishedArticles} /><Row label="Ranked companies" value={snapshot.rankedCompanies} />
            <Row label="Ranking model" value={snapshot.rankingModelVersion} /><Row label="Ranking status" value={snapshot.rankingStatus} />
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
function Metric({ label, value, note }) { return <div className="agent-metric"><span>{label}</span><strong>{value}</strong><em>{note}</em></div>; }
function Gate({ label }) { return <div className="agent-gate"><CheckCircle2 size={15} /><span>{label}</span></div>; }
function Row({ label, value }) { return <div className="agent-row"><span>{label}</span><strong>{value}</strong></div>; }
