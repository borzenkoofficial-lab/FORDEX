import { companyRegistry, companyRegistryStats } from '../src/data/companyRegistry.js;
import { founderRegistry, founderRegistryStats } from '../src/data/founderRegistry.js;
import { evidenceRegistry, evidenceRegistryStats } from '../src/data/evidenceRegistry.js;
import { emergingStartups } from '../src/data/emergingStartups.js';
import { editorialArticles } from '../src/data/articles.js';

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

const founderKeys = founderRegistry.map((item) => item.company.toLowerCase() + '::' + item.name.toLowerCase());
if (new Set(founderKeys).size !== founderKeys.length) fail('duplicate founder-company entity');

for (const evidence of evidenceRegistry) {
  if (!companyRegistry.some((company) => company.id === evidence.companyId)) fail(evidence.id + ': orphan evidence');
  if (!evidence.source) fail(evidence.id + ': missing evidence source');
  if (!evidence.lastVerified) fail(evidence.id + ': missing evidence review date');
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
  evidenceRegistryStats.total, 'evidence records'
);
