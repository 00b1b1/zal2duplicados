
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { parseExcelFile } from '@/lib/excelParser';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  // Clear processing steps when not loading
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setProcessingSteps([]);
      }, 2000);
    }
  }, [isLoading]);

  const addProcessingStep = (step: string) => {
    setProcessingSteps(prev => [...prev, step]);
    setProcessingStatus(step);
  };

  const processFile = async (file: File) => {
    if (!file) return;

    // Reset states
    setProcessingSteps([]);
    setProgress(0);
    
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

    setFileName(file.name);
    setIsLoading(true);
    setProgress(5);
    addProcessingStep('Iniciando procesamiento del archivo');

    // Create a more interactive progress simulation
    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      if (currentProgress >= 95) {
        clearInterval(progressInterval);
        return;
      }
      
      // More realistic progress increments
      const increment = Math.random() * 3 + 1;
      currentProgress = Math.min(currentProgress + increment, 95);
      setProgress(currentProgress);
      
      // Add steps at certain progress points
      if (currentProgress > 15 && !processingSteps.includes('Leyendo estructura del archivo')) {
        addProcessingStep('Leyendo estructura del archivo');
      } else if (currentProgress > 30 && !processingSteps.includes('Identificando hojas de trabajo')) {
        addProcessingStep('Identificando hojas de trabajo');
      } else if (currentProgress > 45 && !processingSteps.includes('Localizando datos de pedidos')) {
        addProcessingStep('Localizando datos de pedidos');
      } else if (currentProgress > 65 && !processingSteps.includes('Procesando información de proveedores')) {
        addProcessingStep('Procesando información de proveedores');
      } else if (currentProgress > 80 && !processingSteps.includes('Compilando datos para visualización')) {
        addProcessingStep('Compilando datos para visualización');
      }
    }, 250);

    try {
      addProcessingStep('Procesando archivo Excel');
      const result = await parseExcelFile(file);
      
      clearInterval(progressInterval);
      
      if (result.orders.length === 0) {
        addProcessingStep('No se encontraron pedidos en el archivo');
        toast({
          title: "No se encontraron pedidos",
          description: "El archivo Excel no contiene datos de pedidos válidos.",
          variant: "destructive"
        });
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 1500);
        return;
      }
      
      addProcessingStep('¡Procesamiento completado con éxito!');
      setProgress(100);
      
      // Small delay before completing to show 100% progress
      setTimeout(() => {
        onFileProcessed(result);
        
        toast({
          title: "Archivo procesado con éxito",
          description: `Se encontraron ${result.orders.length} pedidos en ${result.days.length} días.`,
          variant: "default"
        });
      }, 800);
      
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      clearInterval(progressInterval);
      addProcessingStep('¡Error! No se pudo procesar el archivo');
      
      toast({
        title: "Error al procesar archivo",
        description: "Hubo un error al procesar el archivo Excel. Por favor verifique el formato e intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 1500);
    }
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
            <div className="flex items-center justify-center mb-2">
              {fileName && (
                <Badge variant="outline" className="px-3 py-1 flex items-center gap-2 bg-gray-50">
                  <FileSpreadsheet size={16} className="text-dhl-red" />
                  {fileName}
                </Badge>
              )}
            </div>
            
            <div className="text-center text-sm font-medium mb-2 flex items-center justify-center gap-2">
              {progress < 100 ? (
                <span className="animate-pulse">
                  {processingStatus}
                </span>
              ) : (
                <span className="text-green-600 font-bold">
                  {processingStatus}
                </span>
              )}
            </div>
            
            <Progress 
              value={progress} 
              className="h-2 bg-gray-200" 
              style={{ 
                transition: "all 0.4s ease" 
              }} 
            />
            
            <div className="text-xs text-center text-gray-500">
              {progress === 100 ? (
                <span className="text-green-600 font-semibold">Completado</span>
              ) : (
                `${Math.round(progress)}% completado`
              )}
            </div>
            
            <div className="mt-6 space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-md p-3 bg-gray-50">
              {processingSteps.map((step, index) => (
                <div 
                  key={index} 
                  className={`text-xs flex items-center gap-2 ${
                    index === processingSteps.length - 1 ? 'text-dhl-red font-semibold' : 'text-gray-500'
                  } ${
                    step.includes('Error') ? 'text-red-500' : ''
                  }`}
                >
                  {step.includes('Error') ? (
                    <AlertTriangle size={12} className="text-red-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-dhl-yellow" />
                  )}
                  {step}
                </div>
              ))}
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
          <p className="mt-1">Arrastra o haz clic en el área para comenzar</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploader;
