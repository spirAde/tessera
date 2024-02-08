import { Page } from '../models';
import { generatePage } from '../services/pipeline/generating.service';

module.exports = async function generatePageInThread({
  pageId,
  designSystemComponentsMap,
}: {
  pageId: number;
  designSystemComponentsMap: Map<string, string>;
}) {
  const page = await Page.findByPk(pageId, { rejectOnEmpty: true });
  return generatePage(page, designSystemComponentsMap);
};
