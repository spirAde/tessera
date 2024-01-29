import { stripIndent } from 'common-tags';

const _pageTemplateContent = `
  import 'regenerator-runtime/runtime';
  import React, { useContext } from 'react';
  import { Helmet } from 'react-helmet';

	__PAGE_IMPORTS__

  import { ProjectContext } from '@/contexts/ProjectContext/ProjectContext';
	
	export default function __PAGE_NAME__() {
	  const projectContext = useContext(ProjectContext);

		return (
		  <>
		    __PAGE_CONTENT__
      </>
		);
	}
`;

export function getApplicationPageFileContent({
  imports,
  pageName,
  pageContent,
  pageFooter,
  colorTheme,
  businessTheme,
}: {
  imports: string;
  pageName: string;
  pageContent: string;
  pageFooter: string;
  colorTheme: string;
  businessTheme: string;
}) {
  return stripIndent(_pageTemplateContent)
    .replace('__PAGE_IMPORTS__', imports)
    .replace('__PAGE_NAME__', pageName)
    .replace('__PAGE_CONTENT__', pageContent)
    .replace('__PAGE_FOOTER__', pageFooter)
    .replace('__COLOR_THEME__', colorTheme)
    .replace('__BUSINESS_THEME__', businessTheme);
}
