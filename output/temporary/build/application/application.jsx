import 'regenerator-runtime/runtime';
 import React from 'react';
 import { Route, Routes } from 'react-router-dom';
 import { ThemeProvider } from 'styled-components';
import loadable from '@loadable/component';

import { Body } from '@/components/Body';
import { PlatformProvider } from '@/components/PlatformProvider';

const Main = loadable(() => import('/home/spirade/WebstormProjects/tessera/output/temporary/build/pages/index.jsx'))
const Service = loadable(() => import('/home/spirade/WebstormProjects/tessera/output/temporary/build/pages/service/index.jsx'))
const Cdn = loadable(() => import('/home/spirade/WebstormProjects/tessera/output/temporary/build/pages/service/cdn/index.jsx'))

 if (typeof window === "undefined") {
   React.useLayoutEffect = () => {};
 }

export default function Application() {
	return (
	  <ThemeProvider theme={{ theme: 'main' }}>
	    <PlatformProvider store={{}}>
         <Body>
           <Routes>
             <Route exact path="/" element={<Main />} />
<Route exact path="/service" element={<Service />} />
<Route exact path="/service/cdn" element={<Cdn />} />
           </Routes>
         </Body>
       </PlatformProvider>
     </ThemeProvider>
	);
}