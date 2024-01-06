import { stripIndent } from 'common-tags';

export const _pageTemplateContent = `
  import 'regenerator-runtime/runtime';
  import React, { useContext } from 'react';

	__PAGE_IMPORTS__

  import { PlatformContext } from '@/contexts/platform.context';
	
	export default function __PAGE_NAME__() {
	  const platformContext = useContext(PlatformContext);

		return (
		  <>
		    __PAGE_CONTENT__
      </>
		);
	}
`;

export function getApplicationPageFileContent({
  imports,
  loadableComponents,
  pageName,
  pageContent,
  pageFooter,
  // pageBreadcrumbs,
  colorTheme,
  businessTheme,
}: {
  imports: string;
  loadableComponents: string;
  pageName: string;
  pageContent: string;
  pageFooter: string;
  // pageBreadcrumbs: string;
  colorTheme: string;
  businessTheme: string;
}) {
  return (
    stripIndent(_pageTemplateContent)
      .replace('__PAGE_IMPORTS__', imports)
      .replace('__PAGE_NAME__', pageName)
      .replace('__PAGE_CONTENT__', pageContent)
      .replace('__PAGE_FOOTER__', pageFooter)
      // .replace('__PAGE_BREADCRUMBS__', pageBreadcrumbs)
      .replace('__COLOR_THEME__', colorTheme)
      .replace('__BUSINESS_THEME__', businessTheme)
  );
}
