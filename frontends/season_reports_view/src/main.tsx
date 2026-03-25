import React, {StrictMode} from 'react';
import { BrowserRouter as Router} from 'react-router-dom';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Router basename='/seasonal_report'>
           <App show_side_bar={true} />
      </Router>
  </StrictMode>,
);
