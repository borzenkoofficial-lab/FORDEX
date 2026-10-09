import { companyRegistry, companyRegistryStats } from '../src/data/companyRegistry.js';
import { founderRegistry, founderRegistryStats } from '../src/data/founderRegistry.js';
import { evidenceRegistry, evidenceRegistryStats } from '../src/data/evidenceRegistry.js';
import { emergingStartups } from '../src/data/emergingStartups.js';
import { youngLeaderRankings } from '../src/data/youngLeaders.js';
import { editorialArticles } from '../src/data/articles.js';
import { dealRegistry } from '../src/data/dealRegistry.js';
import { articleRegistry } from '../src/data/articleRegistry.js';

const fail = (message) => {
  throw new Error('[DATA VERIFY] ' + message);
};

const ids = companyRegistry.map((item) => item.id);
if (ids.some((id) => !id)) fail('company without id');
if (new Set(ids).size !== ids.length) fail('duplicate company id');

for (const company of companyRegistry) {
  if (!company.name) fail('company without name');
  if (!company.source) fail(company.name + ': missing source');
  if (!company.lastVerified) fail(company.name + ': missing lastVerified');
  if (!company.verificationLevel) fail(company.name + ': missing verificationLevel');
}

const emergingFounders = emergingStartups.filter((item) => item.founder).map((item) => item.founder);
const uniqueEmergingFounders = new Set(emergingFounders);
if (emergingStartups.length < 50) fail('emerging startup universe below 50');
if (uniqueEmergingFounders.size < 50) fail('unique emerging founders below 50');

function normalizeEvidenceUrl(value, label) {
  try {
    const url = new URL(String(value || ''));
    if (!['http:', 'https:'].includes(url.protocol)) fail(label + ': source must use HTTP(S)');
    return url.href.replace(/\/$/, '');
  } catch (error) {
    fail(label + ': invalid source URL');
  }
}

const quantitativeClaimPattern = /\b\d[\d\s.,]*(?:%|₽|руб(?:лей|ля|ль)?|млн|тыс(?:\.|яч)?|пользоват|плательщик|MRR|ARR|клиент|сотрудник|проект|договор|заказ|клиник|раунд|финансирован|активн|скачиван)/i;

for (const startup of emergingStartups) {
  const label = startup.name || startup.id || 'unnamed startup';
  normalizeEvidenceUrl(startup.source, label);
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(String(startup.lastVerified || ''))) {
    fail(label + ': lastVerified must use YYYY-MM');
  }
  if (startup.founderAge != null) {
    if (!startup.founderAgeSource) fail(label + ': founderAge requires a separate source');
    normalizeEvidenceUrl(startup.founderAgeSource, label + ' founder age');
  }
  if (quantitativeClaimPattern.test(String(startup.evidence || '')) && startup.website) {
    const evidenceUrl = normalizeEvidenceUrl(startup.source, label);
    const websiteUrl = normalizeEvidenceUrl(startup.website, label + ' website');
    if (evidenceUrl === websiteUrl) {
      fail(label + ': quantitative evidence must link to a specific source, not only the company homepage');
    }
  }
}

for (const leader of youngLeaderRankings) {
  const label = leader.name || leader.id || 'unnamed leader';
  if (!leader.source) fail(label + ': quantitative youth ranking requires a source');
  normalizeEvidenceUrl(leader.source, label + ' youth ranking source');

  const hasComparableSignal = [leader.capitalM, leader.valuationM, leader.usersK, leader.mrrK]
    .some((value) => value != null && Number.isFinite(Number(value)) && Number(value) > 0);
  if (!hasComparableSignal || !(Number(leader.signal) > 0)) {
    fail(label + ': youth ranking must not include a record without comparable quantitative signals');
  }
  if (leader.website) {
    const sourceUrl = normalizeEvidenceUrl(leader.source, label + ' youth ranking source');
    const websiteUrl = normalizeEvidenceUrl(leader.website, label + ' website');
    if (sourceUrl === websiteUrl) {
      fail(label + ': quantitative signals require a specific source page, not the company homepage');
    }
  }
}

const founderKeys = founderRegistry.map((item) => item.company.toLowerCase() + '::' + item.name.toLowerCase());
if (new Set(founderKeys).size !== founderKeys.length) fail('duplicate founder-company entity');

for (const evidence of evidenceRegistry) {
  if (!companyRegistry.some((company) => company.id === evidence.companyId)) fail(evidence.id + ': orphan evidence');
  if (!evidence.source) fail(evidence.id + ': missing evidence source');
  if (!evidence.lastVerified) fail(evidence.id + ': missing evidence review date');
}

const dealIds = dealRegistry.map((deal) => deal.id);
if (dealIds.some((id) => !id)) fail('deal entity missing id');
if (new Set(dealIds).size !== dealIds.length) fail('duplicate deal id');

const dealDatePattern = /^(?:20\d{2}|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) 20\d{2}|\d{2} (?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) 20\d{2})$/;

for (const deal of dealRegistry) {
  if (!deal.company) fail(deal.id + ': company missing');
  if (!deal.source) fail(deal.id + ': deal source missing');
  normalizeEvidenceUrl(deal.source, deal.id + ' deal');
  if (!dealDatePattern.test(String(deal.date || ''))) {
    fail(deal.id + ': date must use year, month-year, or day-month-year precision');
  }
  if (!deal.lead) fail(deal.id + ': investor/lead attribution missing');
  const hasExactValue = deal.valueM != null;
  const hasCapValue = deal.valueCapM != null;
  if (hasExactValue && (!Number.isFinite(Number(deal.valueM)) || Number(deal.valueM) <= 0)) {
    fail(deal.id + ': exact numeric deal value is invalid');
  }
  if (hasCapValue && (!Number.isFinite(Number(deal.valueCapM)) || Number(deal.valueCapM) <= 0)) {
    fail(deal.id + ': numeric deal value cap is invalid');
  }
  if (!hasExactValue && !hasCapValue) {
    fail(deal.id + ': exact deal value or explicit value cap is required');
  }
  if (hasExactValue && hasCapValue) {
    fail(deal.id + ': exact deal value and value cap must not be set together');
  }
  if (hasCapValue && !/^(?:ДО\b|UP TO\b)/i.test(String(deal.value || ''))) {
    fail(deal.id + ': upper-bound numeric value must be labelled as a cap');
  }
  if (/^(?:ДО\b|UP TO\b)/i.test(String(deal.value || '')) && hasExactValue) {
    fail(deal.id + ': upper-bound amount must not be counted as exact disclosed capital');
  }
}

for (const article of articleRegistry) {
  if (!article.id || article.contentStatus !== 'PUBLISHED') fail(article.id + ': invalid article registry status');
  if (!article.sourceLinked) fail(article.id + ': article source link missing');
}

for (const article of editorialArticles) {
  if (!article.source) fail(article.id + ': article source missing');
  if (!article.sections?.length) fail(article.id + ': article has no sections');
}

console.log(
  'Data verified:',
  companyRegistryStats.total, 'companies ·',
  founderRegistryStats.total, 'founder records ·',
  uniqueEmergingFounders.size, 'unique emerging founders ·',
  evidenceRegistryStats.total, 'evidence records ·',
  dealRegistry.length, 'deal records ·',
  articleRegistry.length, 'article records'
);
