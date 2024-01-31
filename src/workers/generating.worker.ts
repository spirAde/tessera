import { runProjectPageGenerating } from '../services/page/page.service';
import { Page } from '../models';

module.exports = async function processProjectPageGenerating({
  pageId,
  designSystemComponentsMap,
}: {
  pageId: number;
  designSystemComponentsMap: Map<string, string>;
}) {
  const page = await Page.findByPk(pageId, { rejectOnEmpty: true });
  return runProjectPageGenerating(page, designSystemComponentsMap);
};
