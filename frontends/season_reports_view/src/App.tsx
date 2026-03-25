import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthWrapper } from './AuthWrapper';
import DeputyReportsPage from './pages/DeputyReportsPage';
import ReportViewPage from './pages/ReportViewPage';
import './index.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App({ show_side_bar = false }: { show_side_bar?: boolean }) {
  return (
      <>
    {/*// <Router>*/}
      <ScrollToTop />
      <AuthWrapper>
        <Routes>
          {/*<Route path="/" element={<Navigate to="seasonal_report" replace />} />*/}
          <Route index element={<DeputyReportsPage showSidebar={show_side_bar} />} />
          <Route path="view_report/:id" element={<ReportViewPage showSidebar={show_side_bar} />} />
        </Routes>
      </AuthWrapper>
    {/*// </Router>*/}
      </>
  );
}
