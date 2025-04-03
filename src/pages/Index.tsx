
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUploader from '@/components/FileUploader';
import OrderSummary from '@/components/OrderSummary';
import ProcessedFilesList from '@/components/ProcessedFilesList';
import { OrderData } from '@/types';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [processedData, setProcessedData] = useState<{
    days: string[];
    orders: OrderData[];
    fileName: string;
  } | null>(null);

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
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-dhl-red">Express Excel Ship</h1>
            <p className="text-dhl-darkgray mt-2">Excel to PDF Order Processor</p>
          </div>
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
              Upload File
            </TabsTrigger>
            <TabsTrigger 
              value="process" 
              disabled={!processedData}
              className="data-[state=active]:bg-dhl-yellow data-[state=active]:text-dhl-red"
            >
              Process Orders
            </TabsTrigger>
            <TabsTrigger 
              value="saved"
              className="data-[state=active]:bg-dhl-yellow data-[state=active]:text-dhl-red"
            >
              Saved Files
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
            &copy; {new Date().getFullYear()} Express Excel Ship | DHL-Inspired Design
          </p>
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
};

export default Index;
