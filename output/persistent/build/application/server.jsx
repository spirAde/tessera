import React from 'react';
import { StaticRouter } from 'react-router-dom/server';

import Application from './application';

const ServerApplication = ({ url }) => (
  <StaticRouter location={url}>
    <Application />
  </StaticRouter>
);

export default ServerApplication;
