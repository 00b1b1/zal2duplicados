
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';
import { parseExcelFile } from '@/lib/excelParser';
import { useToast } from '@/components/ui/use-toast';

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
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx, .xls)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await parseExcelFile(file);
      
      if (result.orders.length === 0) {
        toast({
          title: "No orders found",
          description: "The Excel file doesn't contain any valid orders data.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      onFileProcessed(result);
      
      toast({
        title: "File processed successfully",
        description: `Found ${result.orders.length} orders across ${result.days.length} days.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: "There was an error processing the Excel file. Please check the format and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
          Upload Excel File
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
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
            accept=".xlsx,.xls"
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
                {isLoading ? "Processing file..." : "Drag and drop your Excel file here"}
              </p>
              <p className="text-xs text-gray-500">
                or click to browse files
              </p>
            </div>
            <div className="pt-4">
              <Button 
                variant="outline" 
                disabled={isLoading}
                className="border-dhl-yellow text-dhl-darkgray hover:text-dhl-red hover:border-dhl-red"
              >
                Select File
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploader;
