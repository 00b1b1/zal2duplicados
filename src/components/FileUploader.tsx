
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';
import { parseExcelFile } from '@/lib/excelParser';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface FileUploaderProps {
  onFileProcessed: (data: {
    days: string[];
    orders: any[];
    fileName: string;
  }) => void;
}

const FileUploader = ({ onFileProcessed }: FileUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const { toast } = useToast();

  const processFile = async (file: File) => {
    if (!file) return;

    // Check if file is an Excel file
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Por favor suba un archivo Excel (.xlsx, .xls, .xlsm)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setProgress(10);
    setProcessingStatus('Iniciando procesamiento del archivo');

    // Simulate progress updates
    const progressUpdater = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressUpdater);
          return 90;
        }
        const increment = Math.floor(Math.random() * 10) + 5;
        const status = getStatusMessage(prev);
        if (status !== processingStatus) {
          setProcessingStatus(status);
        }
        return Math.min(prev + increment, 90);
      });
    }, 800);

    try {
      setProcessingStatus('Leyendo archivo Excel');
      const result = await parseExcelFile(file);
      
      if (result.orders.length === 0) {
        toast({
          title: "No se encontraron pedidos",
          description: "El archivo Excel no contiene datos de pedidos válidos.",
          variant: "destructive"
        });
        setIsLoading(false);
        clearInterval(progressUpdater);
        setProgress(0);
        setProcessingStatus('');
        return;
      }
      
      setProcessingStatus('Procesamiento completado');
      setProgress(100);
      onFileProcessed(result);
      
      toast({
        title: "Archivo procesado con éxito",
        description: `Se encontraron ${result.orders.length} pedidos en ${result.days.length} días.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      toast({
        title: "Error al procesar archivo",
        description: "Hubo un error al procesar el archivo Excel. Por favor verifique el formato e intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressUpdater);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        setProcessingStatus('');
      }, 1000);
    }
  };

  const getStatusMessage = (progress: number): string => {
    if (progress < 20) return 'Leyendo archivo Excel';
    if (progress < 40) return 'Identificando hojas y días';
    if (progress < 60) return 'Procesando pedidos';
    if (progress < 80) return 'Extrayendo información de proveedores';
    return 'Finalizando procesamiento';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto shadow-md">
      <CardHeader className="bg-dhl-yellow pb-6">
        <CardTitle className="text-center text-dhl-red flex items-center justify-center gap-2">
          <UploadCloud size={24} />
          Subir Archivo Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="text-center text-sm font-medium mb-2">
              {processingStatus}
            </div>
            <Progress value={progress} className="h-2 bg-gray-200" />
            <div className="text-xs text-center text-gray-500">
              {progress === 100 ? 'Completado' : `${progress}% completado`}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Por favor espere mientras procesamos su archivo...
            </p>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center ${
              dragActive ? 'border-dhl-yellow bg-yellow-50' : 'border-gray-300'
            } transition-all duration-200 ease-in-out cursor-pointer`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.xlsm"
              onChange={handleChange}
              disabled={isLoading}
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <UploadCloud 
                size={48} 
                className={`${dragActive ? 'text-dhl-yellow' : 'text-gray-400'} animate-pulse`} 
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Arrastre y suelte su archivo Excel aquí
                </p>
                <p className="text-xs text-gray-500">
                  o haga clic para buscar archivos
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  disabled={isLoading}
                  className="border-dhl-yellow text-dhl-darkgray hover:text-dhl-red hover:border-dhl-red"
                >
                  Seleccionar Archivo
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 text-xs text-gray-500">
          <p>Formatos soportados: Excel (.xlsx, .xls, .xlsm con macros)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploader;
