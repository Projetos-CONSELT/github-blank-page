import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Truck,
  Bell,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  BarChart3,
  ClipboardList,
  Heart,
  Wrench,
  Headphones,
  ListOrdered,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch (e) {
        console.log('Not logged in');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard, group: null },
    { name: 'Atendimento', href: 'Atendimento', icon: Headphones, group: 'Operacional' },
    { name: 'Pessoas', href: 'Pessoas', icon: Users, group: 'Operacional' },
    { name: 'Solicitações', href: 'Solicitacoes', icon: ClipboardList, group: 'Operacional' },
    { name: 'Fila', href: 'Fila', icon: ListOrdered, group: 'Operacional' },
    { name: 'Empréstimos', href: 'Emprestimos', icon: Truck, group: 'Operacional' },
    { name: 'Equipamentos', href: 'Equipamentos', icon: Package, group: 'Estoque' },
    { name: 'Doações', href: 'Doacoes', icon: Heart, group: 'Estoque' },
    { name: 'Manutenção', href: 'Manutencao', icon: Wrench, group: 'Estoque' },
    { name: 'Notificações', href: 'Notificacoes', icon: Send, group: 'Comunicação' },
    { name: 'Relatórios', href: 'Relatorios', icon: BarChart3, group: 'Gestão' },
    { name: 'Configurações', href: 'Configuracoes', icon: Settings, group: 'Gestão' },
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: 217 91% 60%;
          --primary-foreground: 0 0% 100%;
        }
      `}</style>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-lg">CB</span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg tracking-tight">Clube da Bengala</h1>
                <p className="text-slate-400 text-xs">Sistema de Gestão</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {(() => {
              const groups = ['null', 'Operacional', 'Estoque', 'Comunicação', 'Gestão'];
              return groups.map(group => {
                const items = navigation.filter(n => String(n.group) === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="mb-4">
                    {group !== 'null' && (
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 mb-1">{group}</p>
                    )}
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const isActive = currentPageName === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={createPageUrl(item.href)}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                              transition-all duration-200
                              ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                              }
                            `}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </nav>

          {/* User section */}
          {user && (
            <div className="px-3 py-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700/30">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {user.full_name || 'Usuário'}
                  </p>
                  <p className="text-slate-400 text-xs truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-semibold text-slate-800">
                {navigation.find(n => n.href === currentPageName)?.name || 'Painel'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{user?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Configuracoes')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}