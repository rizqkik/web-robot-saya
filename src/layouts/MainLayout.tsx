import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
