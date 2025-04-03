
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
  ArrowUpDown,
  Printer 
} from 'lucide-react';
import { ProcessedFile } from '@/types';
import { getProcessedFiles, deleteProcessedFile, getProcessedFileById } from '@/lib/storage';
import { generatePDF } from '@/lib/pdfGenerator';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger, 
  SheetFooter 
} from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const ProcessedFilesList = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterDay, setFilterDay] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<string | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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

  const handleGenerateOptions = async (file: ProcessedFile) => {
    try {
      // Fetch the full file data if needed
      const fullFile = await getProcessedFileById(file.id);
      if (fullFile) {
        setSelectedFile(fullFile);
        setSelectedDay(undefined);
        setSelectedOrder(undefined);
        setIsSheetOpen(true);
      } else {
        throw new Error("No se pudo encontrar el archivo");
      }
    } catch (error) {
      console.error('Error loading file details:', error);
      toast({
        title: "Error al cargar detalles",
        description: "No se pudieron cargar los detalles del archivo.",
        variant: "destructive"
      });
    }
  };

  const handleGeneratePDF = (type: 'all' | 'day' | 'single') => {
    if (!selectedFile) return;

    let day = undefined;
    let orderId = undefined;

    if (type === 'day' && !selectedDay) {
      toast({
        title: "Selección requerida",
        description: "Por favor seleccione un día primero.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'single' && !selectedOrder) {
      toast({
        title: "Selección requerida",
        description: "Por favor seleccione un pedido primero.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'day') day = selectedDay;
    if (type === 'single') orderId = selectedOrder;

    try {
      const { pdf, pageCount } = generatePDF(selectedFile, day, orderId);
      
      const orderCount = type === 'all' 
        ? selectedFile.orders.length 
        : type === 'day' 
          ? selectedFile.orders.filter(o => o.day === selectedDay).length 
          : 1;
      
      // Open PDF in a new tab
      pdf.output('dataurlnewwindow');
      
      toast({
        title: "PDF Generado Exitosamente",
        description: `PDF generado con ${orderCount} pedidos en ${pageCount} páginas.`,
        variant: "default"
      });
      
      // Close the sheet
      setIsSheetOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: "Hubo un error al crear el PDF. Por favor intente de nuevo.",
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

  // Get all available days from all files
  const allDays = Array.from(new Set(files.flatMap(file => file.days))).sort();

  const filteredFiles = files
    .filter(file => !filterDate || file.uploadDate.includes(filterDate))
    .filter(file => {
      if (!filterDay) return true;
      return file.days.includes(filterDay);
    })
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
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
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span className="text-sm font-semibold">Filtrar por día:</span>
            </div>
            <Select value={filterDay} onValueChange={setFilterDay}>
              <SelectTrigger className="mt-1 border-dhl-gray focus:border-dhl-yellow">
                <SelectValue placeholder="Seleccionar día" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los días</SelectItem>
                {allDays.map(day => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {files.length === 0 ? (
              <p>No hay archivos guardados aún. Procesa un archivo Excel para guardarlo.</p>
            ) : (
              <p>No hay archivos que coincidan con los filtros seleccionados.</p>
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
                  <TableHead>Días</TableHead>
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
                    <TableCell>
                      {file.days.length} días
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleGenerateOptions(file)}
                          className="border-dhl-yellow text-dhl-darkgray hover:bg-dhl-yellow hover:text-white"
                        >
                          <Printer size={16} />
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

      {/* PDF Generation Options Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Generar PDF</SheetTitle>
            <SheetDescription>
              {selectedFile && `Archivo: ${selectedFile.fileName}`}
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="all">Todos los Pedidos</TabsTrigger>
                <TabsTrigger value="byDay">Por Día</TabsTrigger>
                <TabsTrigger value="single">Pedido Individual</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="text-sm text-center text-gray-500 mb-4">
                    Generar un PDF con todos los pedidos
                  </p>
                  <div className="flex justify-center">
                    <Button onClick={() => handleGeneratePDF('all')} className="bg-dhl-red hover:bg-dhl-red/90 text-white">
                      <Printer size={16} className="mr-2" /> Imprimir Todos los Pedidos
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="byDay" className="space-y-4">
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="daySelect">Seleccionar Día</Label>
                      <Select onValueChange={setSelectedDay} value={selectedDay}>
                        <SelectTrigger id="daySelect" className="border-dhl-gray focus:border-dhl-yellow">
                          <SelectValue placeholder="Seleccione un día" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {selectedFile?.days.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedDay && selectedFile && (
                      <div className="text-sm text-gray-600">
                        Encontrados {selectedFile.orders.filter(o => o.day === selectedDay).length} pedidos para {selectedDay}
                      </div>
                    )}

                    <div className="flex justify-center">
                      <Button 
                        onClick={() => handleGeneratePDF('day')} 
                        disabled={!selectedDay}
                        className="bg-dhl-red hover:bg-dhl-red/90 text-white"
                      >
                        <Printer size={16} className="mr-2" /> Imprimir Día Seleccionado
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="single" className="space-y-4">
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderSelect">Seleccionar Pedido</Label>
                      <Select onValueChange={setSelectedOrder} value={selectedOrder}>
                        <SelectTrigger id="orderSelect" className="border-dhl-gray focus:border-dhl-yellow">
                          <SelectValue placeholder="Seleccione un pedido" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {selectedFile?.orders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.day} - {order.order} - {order.supplier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-center">
                      <Button 
                        onClick={() => handleGeneratePDF('single')} 
                        disabled={!selectedOrder}
                        className="bg-dhl-red hover:bg-dhl-red/90 text-white"
                      >
                        <Printer size={16} className="mr-2" /> Imprimir Pedido Único
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <SheetFooter>
            <Button 
              onClick={() => setIsSheetOpen(false)} 
              variant="outline"
            >
              Cancelar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
};

export default ProcessedFilesList;
