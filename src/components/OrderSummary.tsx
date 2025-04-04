
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, Save, FileText, Calendar } from 'lucide-react';
import { OrderData } from '@/types';
import { generatePDF } from '@/lib/pdfGenerator';
import { saveProcessedFile } from '@/lib/storage';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderSummaryProps {
  fileName: string;
  days: string[];
  orders: OrderData[];
  onSaved: () => void;
}

const OrderSummary = ({ fileName, days, orders, onSaved }: OrderSummaryProps) => {
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<string | undefined>(undefined);
  const [uploadDate, setUploadDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [uploadedBy, setUploadedBy] = useState<string>('');
  const { toast } = useToast();

  // Filter orders based on selected day
  const filteredOrders = selectedDay 
    ? orders.filter(order => order.day === selectedDay)
    : orders;

  const handleGeneratePDF = (type: 'all' | 'day' | 'single') => {
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

    const processedFile = {
      id: Date.now().toString(),
      fileName,
      uploadDate,
      uploadedBy: uploadedBy || 'Desconocido',
      orders,
      days
    };

    try {
      const { pdf, pageCount } = generatePDF(processedFile, day, orderId);
      
      const orderCount = type === 'all' 
        ? orders.length 
        : type === 'day' 
          ? filteredOrders.length 
          : 1;
      
      // Open PDF in a new tab
      pdf.output('dataurlnewwindow');
      
      toast({
        title: "PDF Generado Exitosamente",
        description: `PDF generado con ${orderCount} pedidos en ${pageCount} páginas.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: "Hubo un error al crear el PDF. Por favor intente de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!uploadDate) {
      toast({
        title: "Fecha requerida",
        description: "Por favor ingrese una fecha antes de guardar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const processedFile = {
        id: Date.now().toString(),
        fileName,
        uploadDate,
        uploadedBy: uploadedBy || 'Desconocido',
        orders,
        days
      };

      await saveProcessedFile(processedFile);
      
      toast({
        title: "Guardado exitosamente",
        description: `Archivo guardado con ${orders.length} pedidos.`,
        variant: "default"
      });
      
      onSaved();
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Error al guardar archivo",
        description: "Hubo un error al guardar el archivo. Por favor intente de nuevo.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="border-b bg-gradient-to-r from-dhl-yellow to-dhl-red">
        <CardTitle className="text-white text-center">
          Resumen de Pedidos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uploadDate" className="flex items-center gap-2">
                <Calendar size={16} /> Fecha de Procesamiento
              </Label>
              <Input
                id="uploadDate"
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="border-dhl-gray focus:border-dhl-yellow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploadedBy" className="flex items-center gap-2">
                <FileText size={16} /> Subido Por
              </Label>
              <Input
                id="uploadedBy"
                placeholder="Ingrese su nombre"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                className="border-dhl-gray focus:border-dhl-yellow"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <div>
                <h3 className="font-bold text-dhl-darkgray">Resumen del Archivo</h3>
                <p className="text-sm text-gray-500">
                  Nombre del archivo: {fileName}
                </p>
                <p className="text-sm text-gray-500">
                  Encontrados {orders.length} pedidos en {days.length} días
                </p>
              </div>
              <Button variant="outline" onClick={handleSave} className="border-dhl-yellow hover:bg-dhl-yellow hover:text-white">
                <Save size={16} className="mr-2" /> Guardar en Base de Datos
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="all">Todos los Pedidos</TabsTrigger>
              <TabsTrigger value="byDay">Por Día</TabsTrigger>
              <TabsTrigger value="single">Pedido Individual</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-sm text-center text-gray-500 mb-4">
                  Generar un PDF con todos los {orders.length} pedidos
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
                    <Select onValueChange={setSelectedDay} value={selectedDay || ""}>
                      <SelectTrigger id="daySelect" className="border-dhl-gray focus:border-dhl-yellow">
                        <SelectValue placeholder="Seleccione un día" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {days.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDay && (
                    <div className="text-sm text-gray-600">
                      Encontrados {filteredOrders.length} pedidos para {selectedDay}
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
                    <Select onValueChange={setSelectedOrder} value={selectedOrder || ""}>
                      <SelectTrigger id="orderSelect" className="border-dhl-gray focus:border-dhl-yellow">
                        <SelectValue placeholder="Seleccione un pedido" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {orders.map((order) => (
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
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
