
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUploader from '@/components/FileUploader';
import OrderSummary from '@/components/OrderSummary';
import ProcessedFilesList from '@/components/ProcessedFilesList';
import NotificationsMenu from '@/components/NotificationsMenu';
import { OrderData } from '@/types';
import { getNotifications } from '@/lib/notifications';

const Index = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [processedData, setProcessedData] = useState<{
    days: string[];
    orders: OrderData[];
    fileName: string;
  } | null>(null);

  // Set the document title
  useEffect(() => {
    document.title = 'Pedidos Duplicados - ZAL Seco';
  }, []);

  const handleFileProcessed = (data: {
    days: string[];
    orders: OrderData[];
    fileName: string;
  }) => {
    setProcessedData(data);
    setActiveTab('process');
  };

  const handleSaved = () => {
    setProcessedData(null);
    setActiveTab('saved');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      {/* Header */}
      <header className="bg-dhl-yellow py-6 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-dhl-red">Pedidos Duplicados - ZAL Seco</h1>
            <NotificationsMenu />
          </div>
          <p className="text-dhl-darkgray mt-2">Procesador de Pedidos Excel a PDF</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger 
              value="upload" 
              className="data-[state=active]:bg-dhl-yellow data-[state=active]:text-dhl-red"
            >
              Subir Archivo
            </TabsTrigger>
            <TabsTrigger 
              value="process" 
              disabled={!processedData}
              className="data-[state=active]:bg-dhl-yellow data-[state=active]:text-dhl-red"
            >
              Procesar Pedidos
            </TabsTrigger>
            <TabsTrigger 
              value="saved"
              className="data-[state=active]:bg-dhl-yellow data-[state=active]:text-dhl-red"
            >
              Archivos Guardados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="max-w-3xl mx-auto">
              <FileUploader onFileProcessed={handleFileProcessed} />
            </div>
          </TabsContent>

          <TabsContent value="process" className="space-y-4">
            {processedData && (
              <OrderSummary
                fileName={processedData.fileName}
                days={processedData.days}
                orders={processedData.orders}
                onSaved={handleSaved}
              />
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <ProcessedFilesList />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-dhl-darkgray text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Desarrollado en DHL Carrefour - ZAL Seco
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
