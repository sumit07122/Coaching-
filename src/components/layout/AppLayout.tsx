import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ReceiptModal } from '../receipt/ReceiptModal';
import { RecordPaymentModal } from '../fees/RecordPaymentModal';
import { ArchitectureModal } from '../architecture/ArchitectureModal';
import { NotificationCenterModal } from '../notifications/NotificationCenterModal';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div>
      <DemoBanner />
      <div className="app-layout">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="app-main">
          <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
          <main className="page-container">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Modals */}
      <ReceiptModal />
      <RecordPaymentModal />
      <ArchitectureModal />
      <NotificationCenterModal />
    </div>
  );
};
