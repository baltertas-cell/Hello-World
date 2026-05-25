import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { getListRecordsQueryKey } from "@workspace/api-client-react";

export function ExcelImport() {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/records/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Помилка при імпорті");
      }

      const result = await response.json();
      
      toast({
        title: "Імпорт завершено",
        description: `Додано: ${result.imported}. Пропущено: ${result.skipped}. Помилок: ${result.errors}.`,
      });

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Invalidate list cache
      queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Помилка імпорту",
        description: err.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button 
        variant="outline" 
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Імпорт Excel
      </Button>
    </div>
  );
}