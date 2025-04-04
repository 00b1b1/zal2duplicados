
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User } from 'lucide-react';
import NotificationsMenu from './NotificationsMenu';

const NavBar = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Sesión cerrada",
      description: "Ha cerrado sesión correctamente",
    });
  };

  return (
    <header className="bg-dhl-yellow py-6 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-dhl-red">Pedidos Duplicados - ZAL Seco</h1>
          <div className="flex items-center gap-4">
            <NotificationsMenu />
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md text-dhl-darkgray">
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                  <span className="text-xs bg-dhl-red text-white px-2 py-0.5 rounded">
                    {user.role}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-dhl-red hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <p className="text-dhl-darkgray mt-2">Procesador de Pedidos Excel a PDF</p>
      </div>
    </header>
  );
};

export default NavBar;
