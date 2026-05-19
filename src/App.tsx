import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import MitgliederPage from '@/pages/MitgliederPage';
import TarifePage from '@/pages/TarifePage';
import MitgliedschaftenPage from '@/pages/MitgliedschaftenPage';
import PublicFormMitglieder from '@/pages/public/PublicForm_Mitglieder';
import PublicFormTarife from '@/pages/public/PublicForm_Tarife';
import PublicFormMitgliedschaften from '@/pages/public/PublicForm_Mitgliedschaften';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/6a0c2b4c5c4cd2c79db7c141" element={<PublicFormMitglieder />} />
              <Route path="public/6a0c2b50f91169e570c6a82c" element={<PublicFormTarife />} />
              <Route path="public/6a0c2b50b7d1077ae5c66890" element={<PublicFormMitgliedschaften />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
                <Route path="mitglieder" element={<MitgliederPage />} />
                <Route path="tarife" element={<TarifePage />} />
                <Route path="mitgliedschaften" element={<MitgliedschaftenPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
