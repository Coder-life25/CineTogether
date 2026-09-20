import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Room from './pages/Room';
import NotFound from './pages/NotFound';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/layout/Layout';

function App() {
  const location = useLocation();

  return (
    <ToastProvider>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </ToastProvider>
  );
}

export default App;
