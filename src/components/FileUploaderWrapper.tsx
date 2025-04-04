
import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import { OrderData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Days of the week in Spanish
const DAYS_OF_WEEK = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

interface FileUploaderWrapperProps {
  onFileProcessed: (data: {
    days: string[];
    orders: OrderData[];
    fileName: string;
  }) => void;
}

const FileUploaderWrapper = ({ onFileProcessed }: FileUploaderWrapperProps) => {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileProcessed = async (data: {
    days: string[];
    orders: OrderData[];
    fileName: string;
  }) => {
    // Check if user has upload permissions
    if (!user || user.canUpload === false) {
      toast({
        title: "Permiso denegado",
        description: "No tiene permisos para subir archivos.",
        variant: "destructive",
      });
      return;
    }

    // Validate if a day is selected when there are available days
    if (data.days.length > 0 && (!selectedDay || !dayOfWeek)) {
      toast({
        title: "Selección requerida",
        description: "Por favor seleccione un día a destacar y su día de la semana",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if the selected day is one of the available days in the file
      if (selectedDay && !data.days.includes(selectedDay)) {
        toast({
          title: "Día inválido",
          description: "El día seleccionado no está disponible en el archivo",
          variant: "destructive",
        });
        return;
      }

      // Store the featured day in Supabase if a day is selected
      if (selectedDay && dayOfWeek) {
        // Use a more generic approach to avoid type errors
        await supabase
          .from('featured_days')
          .insert({
            file_id: data.fileName,
            day: selectedDay,
            day_of_week: dayOfWeek
          });
      }

      // Pass the data to the parent component
      onFileProcessed(data);
    } catch (error) {
      console.error('Error storing featured day:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el día destacado",
        variant: "destructive",
      });
    }
  };

  // If user is not logged in or doesn't have upload permissions, show warning
  if (!user) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="bg-dhl-yellow">
          <CardTitle className="text-dhl-red">Subir Archivo Excel</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-md">
            <AlertTriangle size={20} />
            <p>Inicie sesión para subir archivos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user.canUpload === false) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="bg-dhl-yellow">
          <CardTitle className="text-dhl-red">Subir Archivo Excel</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
            <AlertTriangle size={20} />
            <p>No tiene permisos para subir archivos. Contacte al administrador.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-dhl-yellow">
        <CardTitle className="text-dhl-red">Subir Archivo Excel</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} />
              <Label htmlFor="selectedDay" className="text-sm font-semibold">Día a destacar:</Label>
            </div>
            <Input
              id="selectedDay"
              type="text"
              placeholder="Ej: 12/04/2025"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="border-dhl-gray focus:border-dhl-yellow"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingrese el día exactamente como aparece en el archivo Excel (formato DD/MM/YYYY).
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} />
              <Label htmlFor="dayOfWeek" className="text-sm font-semibold">Día de la semana:</Label>
            </div>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger id="dayOfWeek" className="border-dhl-gray focus:border-dhl-yellow">
                <SelectValue placeholder="Seleccione el día de la semana" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <FileUploader onFileProcessed={handleFileProcessed} />
      </CardContent>
    </Card>
  );
};

export default FileUploaderWrapper;
