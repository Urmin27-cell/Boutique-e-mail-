/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, AppNotification } from './types';
import {
  subscribeAuth,
  signOutUser,
  getUserNotifications,
  markNotificationAsRead
} from './services/firebase';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { TermsModal } from './components/TermsModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SuspendedAccountNotice } from './components/SuspendedAccountNotice';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';

import { HomeView } from './views/HomeView';
import { MarketplaceView } from './views/MarketplaceView';
import { SellEmailView } from './views/SellEmailView';
import { DashboardView } from './views/DashboardView';
import { OrdersView } from './views/OrdersView';
import { MyPurchasesView } from './views/MyPurchasesView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { EmailProView } from './views/EmailProView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AuthView } from './views/AuthView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<string>('home');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isFirebaseConfigModalOpen, setIsFirebaseConfigModalOpen] = useState(false);

  // Subscribe to real-time auth state
  useEffect(() => {
    const unsubscribe = subscribeAuth((user) => {
      setCurrentUser(user);
      if (user) {
        getUserNotifications(user.uid).then(setNotifications);
      } else {
        setNotifications([]);
      }
    });

    const handleUpdate = () => {
      if (currentUser) {
        getUserNotifications(currentUser.uid).then(setNotifications);
      }
    };
    window.addEventListener('boutique_email_data_updated', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('boutique_email_data_updated', handleUpdate);
    };
  }, [currentUser?.uid]);

  const handleNavigate = (view: string) => {
    // Protected routes check
    if (['sell', 'purchases', 'orders'].includes(view) && !currentUser) {
      setCurrentView('auth_login');
      return;
    }
    if (view === 'admin') {
      const isAdmin = currentUser?.role === 'admin' ||
        currentUser?.email?.toLowerCase() === 'horlandobe@gmail.com' ||
        currentUser?.email?.toLowerCase() === 'madanexora@gmail.com';
      if (!isAdmin) {
        alert("Accès réservé exclusivement aux comptes administrateurs.");
        return;
      }
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = () => {
    signOutUser();
    setCurrentView('home');
  };

  const handleMarkNotification = async (id: string) => {
    await markNotificationAsRead(id);
    if (currentUser) {
      const updated = await getUserNotifications(currentUser.uid);
      setNotifications(updated);
    }
  };

  // Render view router
  const renderCurrentView = () => {
    // If user is suspended, show suspension notice on dashboard/selling routes
    if (currentUser && currentUser.statutCompte === 'suspendu' && ['sell', 'dashboard'].includes(currentView)) {
      return (
        <SuspendedAccountNotice
          currentUser={currentUser}
          onRefreshUser={() => {
            if (currentUser) {
              getUserNotifications(currentUser.uid).then(setNotifications);
            }
          }}
        />
      );
    }

    switch (currentView) {
      case 'home':
        return (
          <HomeView
            onNavigate={handleNavigate}
            onOpenTerms={() => setIsTermsOpen(true)}
            isAuthenticated={Boolean(currentUser)}
          />
        );

      case 'marketplace':
        return (
          <MarketplaceView
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      case 'sell':
        if (!currentUser) return null;
        return (
          <SellEmailView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          />
        );

      case 'dashboard':
        return (
          <DashboardView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          />
        );

      case 'orders':
        if (!currentUser) return null;
        return (
          <OrdersView
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      case 'purchases':
        if (!currentUser) return null;
        return (
          <MyPurchasesView
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      case 'history':
        return (
          <SalesHistoryView
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      case 'email_pro':
        return (
          <EmailProView
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      case 'admin':
        if (!currentUser) return null;
        return (
          <AdminDashboardView
            currentUser={currentUser}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
          />
        );

      case 'auth_login':
        return (
          <AuthView
            mode="login"
            onNavigate={handleNavigate}
            onAuthSuccess={(user) => {
              if (user.role === 'admin' || user.email === 'horlandobe@gmail.com' || user.email === 'madanexora@gmail.com') {
                setCurrentView('admin');
              } else {
                setCurrentView('dashboard');
              }
            }}
            onOpenTerms={() => setIsTermsOpen(true)}
          />
        );

      case 'auth_signup':
        return (
          <AuthView
            mode="signup"
            onNavigate={handleNavigate}
            onAuthSuccess={(user) => {
              setCurrentView('dashboard');
            }}
            onOpenTerms={() => setIsTermsOpen(true)}
          />
        );

      default:
        return (
          <HomeView
            onNavigate={handleNavigate}
            onOpenTerms={() => setIsTermsOpen(true)}
            isAuthenticated={Boolean(currentUser)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotification}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenFirebaseConfig={() => setIsFirebaseConfigModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {renderCurrentView()}
      </main>

      {/* Footer */}
      <Footer
        onOpenTerms={() => setIsTermsOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Floating WhatsApp Support Action */}
      <WhatsAppButton variant="floating" />

      {/* Terms and Conditions Modal */}
      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      {/* Seller Subscription Modal */}
      {currentUser && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Firebase Cloud Connection & Inspect Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseConfigModalOpen}
        onClose={() => setIsFirebaseConfigModalOpen(false)}
      />
    </div>
  );
}
