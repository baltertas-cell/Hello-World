tsximport React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";
import { getListRecordsQueryKey } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function ExcelImport() {
  const [isUploading, setIsUploading] = React.useState(false);
  const [result, setResult] = React.useState<{
    imported: number;
    skipped: number;
    errors: number;
    messages: string[];
  } | null>(null);
  const [showResult, setShowResult] = React.useState(false);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Помилка при імпорті");
      }

      setResult(data);
      setShowResult(true);

      if (fileInputRef.current) fileInputRef.current.value = "";
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
    <>
      <input
        type="file"
        accept=".xlsx,.xls"
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
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Завантаження...
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-4 w-4" />
            Імпорт Excel
          </>
        )}
      </Button>

      {/* Діалог з результатом */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Результат імпорту</DialogTitle>
          </DialogHeader>

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-green-50 p-3 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{result.imported}</div>
                  <div className="text-xs text-green-600 mt-1">Додано</div>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">{result.skipped}</div>
                  <div className="text-xs text-yellow-600 mt-1">Пропущено</div>
                </div>
                <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                  <div className="text-2xl font-bold text-red-700">{result.errors}</div>
                  <div className="text-xs text-red-600 mt-1">Помилок</div>
                </div>
              </div>

              {result.messages.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Деталі:</p>
                  <ul className="space-y-1">
                    {result.messages.map((msg, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                        {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.imported > 0 && result.errors === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Імпорт завершено успішно
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResult(false)}>Закрити</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
