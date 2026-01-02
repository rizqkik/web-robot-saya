import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Bot, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const navItems = [
  { 
    title: 'AREA CONTROL', 
    path: '/', 
    icon: LayoutDashboard,
    description: 'Dashboard'
  },
  { 
    title: 'REAL-TIME GAS', 
    path: '/data-logs', 
    icon: Activity,
    description: 'Data Logs'
  },
];

const Sidebar = ({ open = true, onClose, isMobile = false }: SidebarProps) => {
  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col transform transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`
    : 'w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col';

  return (
    <>
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      <aside className={sidebarClasses}>
        {/* Header with Close Button for Mobile */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground tracking-tight">RESCUE BOT</h1>
              <p className="text-xs text-muted-foreground">Gas Detection System</p>
            </div>
          </div>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={isMobile ? onClose : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/30 glow-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{item.title}</span>
                  <span className="text-xs opacity-70">{item.description}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Status Indicator */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sidebar-accent">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">System Online</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
