import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useData, DataProvider } from './context/DataContext';
import PasswordModal from './components/PasswordModal';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/ClientList';
import ClientDetail from './pages/ClientDetail';
import Analysis from './pages/Analysis';
import ProductAnalysis from './pages/ProductAnalysis';
import Simulator from './pages/Simulator';
import Campaigns from './pages/Campaigns';

function AppContent() {
  const { password, setPassword } = useData();

  if (!password) {
    return <PasswordModal onPasswordSubmit={setPassword} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="analysis/product/:productName" element={<ProductAnalysis />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="settings" element={<div className="p-8 text-center text-gray-500">Paramètres (En construction)</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
