
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Key, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const { user, login, isLoading, error, createUser } = useAuth();
  const { toast } = useToast();
  
  // State to track if we're in admin mode
  const isAdminMode = user?.id === 'temp-admin';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error de validación",
        description: "Por favor, ingrese usuario y contraseña",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await login(username, password);
    } catch (error) {
      console.error('Login submission error:', error);
    }
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername || !newPassword || !confirmPassword) {
      toast({
        title: "Error de validación",
        description: "Por favor, complete todos los campos",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error de validación",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (createUser) {
        await createUser(newUsername, newPassword, role);
        
        // Clear form
        setNewUsername('');
        setNewPassword('');
        setConfirmPassword('');
        setRole('user');
        
        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado exitosamente",
        });
      }
    } catch (error) {
      console.error('Create user error:', error);
    }
  };

  // Redirect if user is already logged in and not in admin mode
  if (user && !isAdminMode) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-dhl-yellow rounded-t-lg">
          <CardTitle className="text-2xl text-dhl-red text-center">
            Pedidos Duplicados - ZAL Seco
          </CardTitle>
          <CardDescription className="text-center text-black">
            {isAdminMode 
              ? "Modo Administrador - Crear Usuario" 
              : "Inicie sesión para continuar"}
          </CardDescription>
        </CardHeader>
        
        {isAdminMode ? (
          <form onSubmit={handleCreateUser}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="newUsername">Nombre de Usuario</Label>
                <div className="flex items-center border rounded-md bg-background pr-3">
                  <Input
                    id="newUsername"
                    placeholder="Ingrese nombre de usuario"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={isLoading}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <User className="text-gray-400" size={18} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Contraseña</Label>
                <div className="flex items-center border rounded-md bg-background pr-3">
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Ingrese contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Key className="text-gray-400" size={18} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="flex items-center border rounded-md bg-background pr-3">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Key className="text-gray-400" size={18} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                className="bg-dhl-red hover:bg-dhl-red/90 w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando usuario...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="flex items-center border rounded-md bg-background pr-3">
                  <Input
                    id="username"
                    placeholder="Ingrese su usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <User className="text-gray-400" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="flex items-center border rounded-md bg-background pr-3">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Key className="text-gray-400" size={18} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Ingrese "zaladmin2025" como contraseña para crear usuarios nuevos.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                className="bg-dhl-red hover:bg-dhl-red/90 w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Login;
