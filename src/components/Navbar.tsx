import React, { useState } from 'react';
import {
  Mail,
  ShieldCheck,
  ShoppingBag,
  PlusCircle,
  Clock,
  Briefcase,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  FileText,
  Database,
  Activity
} from 'lucide-react';
import { UserProfile, AppNotification } from '../types';

interface NavbarProps {
  currentUser: UserProfile | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onOpenTerms: () => void;
  onOpenFirebaseConfig?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onSignOut,
  notifications,
  onMarkNotificationAsRead,
  onOpenTerms,
  onOpenFirebaseConfig,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.lu).length;
  const isAdmin = currentUser?.role === 'admin' ||
    currentUser?.email?.toLowerCase() === 'horlandobe@gmail.com' ||
    currentUser?.email?.toLowerCase() === 'madanexora@gmail.com';
  // Allow logout for all users
  const canSeeLogout = Boolean(currentUser);

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  BOUTIQUE <span className="text-blue-600">E-MAIL</span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                  MADA
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block -mt-0.5">
                Achat, Vente & Solutions E-mail Professionnelles
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => handleNav('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'home'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              Accueil
            </button>

            <button
              onClick={() => handleNav('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </button>

            <button
              onClick={() => handleNav('marketplace')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'marketplace'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              Boutique E-mail
            </button>

            <button
              onClick={() => handleNav('email_pro')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'email_pro'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              <span>Email Pro</span>
            </button>

            {currentUser && (
              <>
                <button
                  onClick={() => handleNav('sell')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentView === 'sell'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  <span>Vendre un email</span>
                </button>

                <button
                  onClick={() => handleNav('purchases')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentView === 'purchases'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Mes achats</span>
                </button>

                <button
                  onClick={() => handleNav('orders')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'orders'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  Commandes
                </button>
              </>
            )}

            <button
              onClick={() => handleNav('history')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                currentView === 'history'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Historique</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'bg-indigo-600 text-white'
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Administration</span>
              </button>
            )}
          </nav>

          {/* User actions & Notifications */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 relative">
                {/* Firebase Connection Status Button */}
                {onOpenFirebaseConfig && (
                  <button
                    onClick={onOpenFirebaseConfig}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                    title="État de connexion Firebase"
                  >
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                    <span>Firebase</span>
                  </button>
                )}

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown notifications */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        <span className="text-xs text-blue-600 font-semibold">{unreadCount} non lue(s)</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 py-2">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            Aucune notification pour le moment.
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.notificationId}
                              onClick={() => {
                                onMarkNotificationAsRead(n.notificationId);
                                if (n.type === 'commande') handleNav('orders');
                                if (n.type === 'validation') handleNav('purchases');
                              }}
                              className={`p-3 rounded-xl cursor-pointer transition-colors ${
                                n.lu ? 'hover:bg-slate-50 opacity-75' : 'bg-blue-50/50 hover:bg-blue-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <h4 className="text-xs font-bold text-slate-900">{n.titre}</h4>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(n.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Pill */}
                <div
                  onClick={() => handleNav('dashboard')}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors border border-slate-200"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.nomComplet.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-800 max-w-[120px] truncate">
                    {currentUser.nomComplet}
                  </span>
                  {currentUser.badgeBleu && (
                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Vendeur Vérifié (Badge Bleu)" />
                  )}
                </div>

                {canSeeLogout && (
                  <button
                    onClick={onSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                    title="Se déconnecter de votre compte"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Se déconnecter</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('auth_login')}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => handleNav('auth_signup')}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
                >
                  Créer un compte
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
          {currentUser && (
            <div className="p-3 bg-slate-50 rounded-xl mb-3 flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {currentUser.nomComplet.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">{currentUser.nomComplet}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                </div>
              </div>
              {currentUser.badgeBleu && (
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Badge Bleu
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => handleNav('home')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Accueil
          </button>
          <button
            onClick={() => handleNav('dashboard')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-blue-600 bg-blue-50/60 hover:bg-blue-50 flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Tableau de bord & Statistiques</span>
          </button>
          <button
            onClick={() => handleNav('marketplace')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Boutique E-mail
          </button>
          <button
            onClick={() => handleNav('email_pro')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Service Email Pro
          </button>

          {currentUser && (
            <>
              <button
                onClick={() => handleNav('sell')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50"
              >
                + Ajouter un email à vendre
              </button>
              <button
                onClick={() => handleNav('purchases')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Mes achats (Télécharger PDF)
              </button>
              <button
                onClick={() => handleNav('orders')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Gestion des commandes
              </button>
            </>
          )}

          <button
            onClick={() => handleNav('history')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Historique des ventes
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenTerms();
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Conditions Générales</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              Panneau d'Administration
            </button>
          )}

          {canSeeLogout && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
