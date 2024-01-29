import 'regenerator-runtime/runtime';
 import React from 'react';
 import { Route, Routes } from 'react-router-dom';
 import { ThemeProvider } from 'styled-components';
import loadable from '@loadable/component';

import { Body } from '@/components/Body';
import { ProjectContextProvider } from '@/contexts/ProjectContext/ProjectContextProvider';

const Main = loadable(() => import('/home/spirade/WebstormProjects/tessera/output/temporary/build/pages/index.jsx'))
const Service = loadable(() => import('/home/spirade/WebstormProjects/tessera/output/temporary/build/pages/service/index.jsx'))
const AboutCompany = loadable(() => import('/home/spirade/WebstormProjects/tessera/output/temporary/build/pages/about-company/index.jsx'))

 if (typeof window === "undefined") {
   React.useLayoutEffect = () => {};
 }

export default function Application() {
	return (
	  <ThemeProvider theme={{ theme: 'main' }}>
	    <ProjectContextProvider store={{"systemData":{"mediaHost":"https://admin.t1-academy.ru/api/mediastorage"}}}>
         <Body>
           <Routes>
             <Route exact path="/" element={<Main />} />
<Route exact path="/service" element={<Service />} />
<Route exact path="/about-company" element={<AboutCompany />} />
           </Routes>
         </Body>
       </ProjectContextProvider>
     </ThemeProvider>
	);
}