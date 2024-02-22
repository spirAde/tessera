import { stripIndent } from 'common-tags';

const _applicationTemplateContent = `
  import 'regenerator-runtime/runtime';
  import React from 'react';
  import { Route, Routes } from 'react-router-dom';
  import { ThemeProvider } from 'styled-components';
	import loadable from '@loadable/component';
	
	import { Project } from '@/components/inner/Project/Project';
	import { ProjectContextProvider } from '@/contexts/ProjectContext/ProjectContextProvider';

	__PROJECT_PAGES_LOADABLE_COMPONENTS__

  if (typeof window === "undefined") {
    React.useLayoutEffect = () => {};
  }

	export default function Application() {
		return (
		  <ThemeProvider theme={{ theme: 'main' }}>
		    <ProjectContextProvider store={__PROJECT_INITIAL_STORE__} pages={{}}>
          <Project>
            <Routes>
              __PROJECT_ROUTES__
            </Routes>
          </Project>
        </ProjectContextProvider>
      </ThemeProvider>
		);
	}
`;

export function getApplicationFileContent({
  loadableComponents,
  projectInitialStore,
  routes,
}: {
  loadableComponents: string;
  projectInitialStore: string;
  routes: string;
}) {
  return stripIndent(_applicationTemplateContent)
    .replace('__PROJECT_PAGES_LOADABLE_COMPONENTS__', loadableComponents)
    .replace('__PROJECT_ROUTES__', routes)
    .replace('__PROJECT_INITIAL_STORE__', projectInitialStore);
}
