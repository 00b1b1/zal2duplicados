
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Download, 
  Trash2, 
  Calendar, 
  User, 
  FileText,
  ArrowUpDown 
} from 'lucide-react';
import { ProcessedFile } from '@/types';
import { getProcessedFiles, deleteProcessedFile } from '@/lib/storage';
import { generatePDF } from '@/lib/pdfGenerator';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

const ProcessedFilesList = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterDate, setFilterDate] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const loadedFiles = await getProcessedFiles();
      setFiles(loadedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error al cargar archivos",
        description: "No se pudieron cargar los archivos guardados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProcessedFile(id);
      setFiles(files.filter(file => file.id !== id));
      toast({
        title: "Archivo eliminado",
        description: "El archivo ha sido eliminado correctamente.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error al eliminar archivo",
        description: "Hubo un error al eliminar el archivo.",
        variant: "destructive"
      });
    }
  };

  const handleGeneratePDF = (file: ProcessedFile) => {
    try {
      const { pdf } = generatePDF(file);
      pdf.output('dataurlnewwindow');
      
      toast({
        title: "PDF Generado",
        description: `PDF generado con ${file.orders.length} pedidos.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: "Hubo un error al crear el PDF.",
        variant: "destructive"
      });
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Format date with error handling
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PP', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  const filteredFiles = files
    .filter(file => !filterDate || file.uploadDate.includes(filterDate))
    .sort((a, b) => {
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="bg-dhl-yellow">
          <CardTitle className="text-dhl-red">Archivos Guardados</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p>Cargando archivos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-dhl-yellow">
        <CardTitle className="text-dhl-red">Archivos Guardados</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span className="text-sm font-semibold">Filtrar por fecha:</span>
          </div>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="mt-1 border-dhl-gray focus:border-dhl-yellow"
          />
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {files.length === 0 ? (
              <p>No hay archivos guardados aún. Procesa un archivo Excel para guardarlo.</p>
            ) : (
              <p>No hay archivos que coincidan con el filtro seleccionado.</p>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de archivo</TableHead>
                  <TableHead>
                    <button 
                      className="flex items-center gap-1 hover:text-dhl-red"
                      onClick={toggleSortDirection}
                    >
                      Fecha <ArrowUpDown size={14} />
                    </button>
                  </TableHead>
                  <TableHead>Subido por</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText size={16} className="text-dhl-red" />
                      {file.fileName}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Calendar size={16} className="text-dhl-yellow" />
                      {formatDate(file.uploadDate)}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <User size={16} className="text-dhl-darkgray" />
                      {file.uploadedBy}
                    </TableCell>
                    <TableCell>
                      {file.orders.length} pedidos
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleGeneratePDF(file)}
                          className="border-dhl-yellow text-dhl-darkgray hover:bg-dhl-yellow hover:text-white"
                        >
                          <Download size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(file.id)}
                          className="border-red-200 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessedFilesList;
