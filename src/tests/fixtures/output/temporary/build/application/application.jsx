import 'regenerator-runtime/runtime';
 import React from 'react';
 import { Route, Routes } from 'react-router-dom';
 import { ThemeProvider } from 'styled-components';
import loadable from '@loadable/component';

import { Project } from '@/components/inner/Project/Project';
import { ProjectContextProvider } from '@/contexts/ProjectContext/ProjectContextProvider';

const PageMain = loadable(() => import('/home/spirade/WebstormProjects/tessera/output/temporary/build/pages/index.jsx'))
const PageService = loadable(() => import('/home/spirade/WebstormProjects/tessera/output/temporary/build/pages/service/index.jsx'))
const PageAboutCompany = loadable(() => import('/home/spirade/WebstormProjects/tessera/output/temporary/build/pages/about-company/index.jsx'))

 if (typeof window === "undefined") {
   React.useLayoutEffect = () => {};
 }

export default function Application() {
	return (
	  <ThemeProvider theme={{ theme: 'main' }}>
	    <ProjectContextProvider store={{"systemData":{"mediaHost":"https://admin.t1-academy.ru/api/mediastorage"}}} pages={{}}>
         <Project>
           <Routes>
             <Route exact path="/" element={<PageMain />} />
<Route exact path="/service" element={<PageService />} />
<Route exact path="/about-company" element={<PageAboutCompany />} />
           </Routes>
         </Project>
       </ProjectContextProvider>
     </ThemeProvider>
	);
}