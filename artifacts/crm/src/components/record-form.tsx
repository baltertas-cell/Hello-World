import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const recordSchema = z.object({
  date: z.string().optional().nullable(),
  networkOrg: z.string().optional().nullable(),
  byFact: z.string().optional().nullable(),
  basis: z.string().optional().nullable(),
  fraudSigns: z.string().optional().nullable(),
  internalFraud: z.string().optional().nullable(),
  violationsFound: z.string().optional().nullable(),
  damagesCaused: z.string().optional().nullable(),
  measuresТaken: z.string().optional().nullable(),
  transferredToPolice: z.string().optional().nullable(),
  policeResult: z.string().optional().nullable(),
  applicantVictim: z.string().optional().nullable(),
  investigationStatus: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

interface RecordFormProps {
  initialValues?: Partial<RecordFormValues>;
  onSubmit: (data: RecordFormValues) => void;
  isSubmitting?: boolean;
}

export function RecordForm({ initialValues, onSubmit, isSubmitting }: RecordFormProps) {
  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      date: initialValues?.date || "",
      networkOrg: initialValues?.networkOrg || "",
      byFact: initialValues?.byFact || "",
      basis: initialValues?.basis || "",
      fraudSigns: initialValues?.fraudSigns || "",
      internalFraud: initialValues?.internalFraud || "",
      violationsFound: initialValues?.violationsFound || "",
      damagesCaused: initialValues?.damagesCaused || "",
      measuresТaken: initialValues?.measuresТaken || "",
      transferredToPolice: initialValues?.transferredToPolice || "",
      policeResult: initialValues?.policeResult || "",
      applicantVictim: initialValues?.applicantVictim || "",
      investigationStatus: initialValues?.investigationStatus || "",
      notes: initialValues?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="networkOrg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Відносно мережі/ГО</FormLabel>
                <FormControl>
                  <Input placeholder="Введіть назву..." {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="byFact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>по Факту</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="basis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Підстава</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fraudSigns"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ознаки шахрайства</FormLabel>
                <FormControl>
                  <Input placeholder="Так / Ні / Опис..." {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="internalFraud"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Внутрішнє шахрайство</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="violationsFound"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Виявлено порушень</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[80px]" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="damagesCaused"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Завдано збитків</FormLabel>
                <FormControl>
                  <Input placeholder="Сума..." {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="measuresТaken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Притягнуто до відповідальності/прийняті заходи</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transferredToPolice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Передано в ОВС</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="policeResult"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Результат ОВС</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="applicantVictim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Заявник / Потерпілий</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="investigationStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Стан контролю досудового розслідування</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Додаткові нотатки</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[100px]" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isSubmitting ? "Збереження..." : "Зберегти запис"}
          </Button>
        </div>
      </form>
    </Form>
  );
}