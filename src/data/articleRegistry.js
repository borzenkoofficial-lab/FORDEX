import { editorialArticles } from './articles.js';

export const articleRegistry = editorialArticles.map((article) => ({
  ...article,
  contentStatus: 'PUBLISHED',
  sourceLinked: Boolean(article.source),
}));

export const articleById = new Map(articleRegistry.map((article) => [article.id, article]));

export const articleRegistryStats = {
  total: articleRegistry.length,
  published: articleRegistry.filter((article) => article.contentStatus === 'PUBLISHED').length,
  sourceLinked: articleRegistry.filter((article) => article.sourceLinked).length,
};
