
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Key, UserPlus, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { user, login, isLoading, error, createUser, logout, isRegistrationEnabled } = useAuth();
  const { toast } = useToast();
  
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
        
        // Clear form and switch to login tab on success
        setNewUsername('');
        setNewPassword('');
        setConfirmPassword('');
        setRole('user');
        setActiveTab('login');
        
        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado exitosamente. Puede iniciar sesión ahora.",
        });
      }
    } catch (error) {
      console.error('Create user error:', error);
    }
  };

  // Admin mode handler for superuser
  const handleAdminMode = async () => {
    try {
      if (createUser) {
        // Switch to registration tab
        setActiveTab('register');
        
        toast({
          title: "Modo administrador",
          description: "Ahora puede crear nuevos usuarios",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Admin mode error:', error);
    }
  };

  // Redirect if user is already logged in
  if (user) {
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
            Acceso al sistema de gestión de pedidos
          </CardDescription>
        </CardHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'login' | 'register')}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register" disabled={!isRegistrationEnabled && !user}>
              Registrarse
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
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
                </div>
                
                {!isRegistrationEnabled && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded flex items-center gap-2">
                    <AlertTriangle size={16} />
                    El registro de usuarios está desactivado. Contacte al administrador.
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
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
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Iniciar sesión
                    </>
                  )}
                </Button>
                {isRegistrationEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab('register')}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrarse
                  </Button>
                )}
                {/* Super admin button with specific action */}
                <div className="w-full mt-2 text-center">
                  <button
                    type="button"
                    onClick={handleAdminMode}
                    className="text-xs text-gray-500 hover:text-dhl-red transition-colors"
                  >
                    Acceso para Administrador
                  </button>
                </div>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
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
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-3">
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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab('login')}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Volver al inicio de sesión
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;
