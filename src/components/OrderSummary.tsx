
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
        title: "Selection needed",
        description: "Please select a day first.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'single' && !selectedOrder) {
      toast({
        title: "Selection needed",
        description: "Please select an order first.",
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
      uploadedBy: uploadedBy || 'Unknown',
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
        title: "PDF Generated Successfully",
        description: `Generated PDF with ${orderCount} orders on ${pageCount} pages.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error generating PDF",
        description: "There was an error creating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!uploadDate) {
      toast({
        title: "Date required",
        description: "Please enter a date before saving.",
        variant: "destructive"
      });
      return;
    }

    try {
      const processedFile = {
        id: Date.now().toString(),
        fileName,
        uploadDate,
        uploadedBy: uploadedBy || 'Unknown',
        orders,
        days
      };

      await saveProcessedFile(processedFile);
      
      toast({
        title: "Saved successfully",
        description: `File saved with ${orders.length} orders.`,
        variant: "default"
      });
      
      onSaved();
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Error saving file",
        description: "There was an error saving the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="border-b bg-gradient-to-r from-dhl-yellow to-dhl-red">
        <CardTitle className="text-white text-center">
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uploadDate" className="flex items-center gap-2">
                <Calendar size={16} /> Processing Date
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
                <FileText size={16} /> Uploaded By
              </Label>
              <Input
                id="uploadedBy"
                placeholder="Enter your name"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                className="border-dhl-gray focus:border-dhl-yellow"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <div>
                <h3 className="font-bold text-dhl-darkgray">File Summary</h3>
                <p className="text-sm text-gray-500">
                  Filename: {fileName}
                </p>
                <p className="text-sm text-gray-500">
                  Found {orders.length} orders across {days.length} days
                </p>
              </div>
              <Button variant="outline" onClick={handleSave} className="border-dhl-yellow hover:bg-dhl-yellow hover:text-white">
                <Save size={16} className="mr-2" /> Save to Database
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="byDay">By Day</TabsTrigger>
              <TabsTrigger value="single">Single Order</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-sm text-center text-gray-500 mb-4">
                  Generate a PDF with all {orders.length} orders
                </p>
                <div className="flex justify-center">
                  <Button onClick={() => handleGeneratePDF('all')} className="bg-dhl-red hover:bg-dhl-red/90 text-white">
                    <Printer size={16} className="mr-2" /> Print All Orders
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="byDay" className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="daySelect">Select Day</Label>
                    <Select onValueChange={setSelectedDay} value={selectedDay}>
                      <SelectTrigger id="daySelect" className="border-dhl-gray focus:border-dhl-yellow">
                        <SelectValue placeholder="Select a day" />
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
                      Found {filteredOrders.length} orders for {selectedDay}
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button 
                      onClick={() => handleGeneratePDF('day')} 
                      disabled={!selectedDay}
                      className="bg-dhl-red hover:bg-dhl-red/90 text-white"
                    >
                      <Printer size={16} className="mr-2" /> Print Selected Day
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="single" className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderSelect">Select Order</Label>
                    <Select onValueChange={setSelectedOrder} value={selectedOrder}>
                      <SelectTrigger id="orderSelect" className="border-dhl-gray focus:border-dhl-yellow">
                        <SelectValue placeholder="Select an order" />
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
                      <Printer size={16} className="mr-2" /> Print Single Order
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
