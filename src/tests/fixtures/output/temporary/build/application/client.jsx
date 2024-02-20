import React from 'react';
import { hydrate } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { loadableReady } from '@loadable/component';

import Application from './application';

loadableReady(() => {
  const root = document.getElementById('app');
  hydrate(
    <BrowserRouter>
      <Application />
    </BrowserRouter>,
    root,
  );
});
