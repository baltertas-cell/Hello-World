import { Router, type IRouter } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { eq, ilike, or, and, gte, lte, sql } from "drizzle-orm";
import { db, recordsTable } from "@workspace/db";
import {
  ListRecordsQueryParams,
  CreateRecordBody,
  GetRecordParams,
  UpdateRecordParams,
  UpdateRecordBody,
  DeleteRecordParams,
} from "@workspace/api-zod";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// GET /records/stats — must be before /records/:id
router.get("/records/stats", async (req, res): Promise<void> => {
  const [totalRow] = await db.select({ count: sql<number>`count(*)::int` }).from(recordsTable);
  const [fraudRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recordsTable)
    .where(sql`${recordsTable.fraudSigns} IS NOT NULL AND ${recordsTable.fraudSigns} != ''`);
  const [internalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recordsTable)
    .where(sql`${recordsTable.internalFraud} IS NOT NULL AND ${recordsTable.internalFraud} != ''`);
  const [policeRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recordsTable)
    .where(sql`${recordsTable.transferredToPolice} IS NOT NULL AND ${recordsTable.transferredToPolice} != ''`);

  res.json({
    total: totalRow?.count ?? 0,
    withFraudSigns: fraudRow?.count ?? 0,
    internalFraud: internalRow?.count ?? 0,
    transferredToPolice: policeRow?.count ?? 0,
    totalDamages: "—",
  });
});

// GET /records
router.get("/records", async (req, res): Promise<void> => {
  const parsed = ListRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, fraudOnly, internalFraud, dateFrom, dateTo } = parsed.data;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(recordsTable.date, `%${search}%`),
        ilike(recordsTable.networkOrg, `%${search}%`),
        ilike(recordsTable.byFact, `%${search}%`),
        ilike(recordsTable.basis, `%${search}%`),
        ilike(recordsTable.fraudSigns, `%${search}%`),
        ilike(recordsTable.applicantVictim, `%${search}%`),
        ilike(recordsTable.investigationStatus, `%${search}%`),
      ),
    );
  }

  if (fraudOnly === "true") {
    conditions.push(sql`${recordsTable.fraudSigns} IS NOT NULL AND ${recordsTable.fraudSigns} != ''`);
  }

  if (internalFraud === "true") {
    conditions.push(sql`${recordsTable.internalFraud} IS NOT NULL AND ${recordsTable.internalFraud} != ''`);
  }

  if (dateFrom) {
    conditions.push(gte(recordsTable.date, dateFrom));
  }

  if (dateTo) {
    conditions.push(lte(recordsTable.date, dateTo));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const records = await db
    .select()
    .from(recordsTable)
    .where(where)
    .orderBy(sql`${recordsTable.date} DESC NULLS LAST, ${recordsTable.createdAt} DESC`);

  res.json(records.map(toApiRecord));
});

// POST /records
router.post("/records", async (req, res): Promise<void> => {
  const parsed = CreateRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db
    .insert(recordsTable)
    .values(fromApiInput(parsed.data))
    .returning();

  res.status(201).json(toApiRecord(record));
});

// POST /records/import — Excel import (multipart, not in codegen)
router.post("/records/import", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "Файл не завантажено" });
    return;
  }

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(req.file.buffer, { type: "buffer" });
  } catch {
    res.status(400).json({ error: "Не вдалося прочитати файл Excel" });
    return;
  }

  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (rows.length < 2) {
    res.json({ imported: 0, skipped: 0, errors: 0, messages: ["Файл порожній або немає даних"] });
    return;
  }

  const COLUMN_MAP: Record<string, keyof typeof fieldMap> = {
    "Дата": "date",
    "Відносно мережі/ГО": "networkOrg",
    "по Факту": "byFact",
    "Підстава": "basis",
    "Ознаки шахрайства": "fraudSigns",
    "Внутрішнє шахрайство": "internalFraud",
    "Виявлено порушень": "violationsFound",
    "Завдано збитків": "damagesCaused",
    "Притягнуто до відповідальності/прийняті заходи": "measuresTaken",
    "Передано в ОВС": "transferredToPolice",
    "Результат ОВС": "policeResult",
    " Заявник / Потерпілий": "applicantVictim",
    "Заявник / Потерпілий": "applicantVictim",
    "Стан контролю досудового розслідування": "investigationStatus",
  };

  const fieldMap = {
    date: recordsTable.date,
    networkOrg: recordsTable.networkOrg,
    byFact: recordsTable.byFact,
    basis: recordsTable.basis,
    fraudSigns: recordsTable.fraudSigns,
    internalFraud: recordsTable.internalFraud,
    violationsFound: recordsTable.violationsFound,
    damagesCaused: recordsTable.damagesCaused,
    measuresTaken: recordsTable.measuresTaken,
    transferredToPolice: recordsTable.transferredToPolice,
    policeResult: recordsTable.policeResult,
    applicantVictim: recordsTable.applicantVictim,
    investigationStatus: recordsTable.investigationStatus,
  };

  const headers = rows[0].map((h) => String(h).trim());
  let imported = 0;
  let errors = 0;
  const messages: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const isEmpty = row.every((cell) => !cell || String(cell).trim() === "");
    if (isEmpty) continue;

    const values: Record<string, string | null> = {};
    headers.forEach((header, idx) => {
      const field = COLUMN_MAP[header];
      if (field) {
        const val = String(row[idx] ?? "").trim();
        values[field] = val || null;
      }
    });

    try {
      await db.insert(recordsTable).values(values);
      imported++;
    } catch (err) {
      errors++;
      messages.push(`Рядок ${i + 1}: помилка збереження`);
    }
  }

  req.log.info({ imported, errors }, "Excel import complete");
  res.json({ imported, skipped: 0, errors, messages });
});

// GET /records/:id
router.get("/records/:id", async (req, res): Promise<void> => {
  const params = GetRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .select()
    .from(recordsTable)
    .where(eq(recordsTable.id, params.data.id));

  if (!record) {
    res.status(404).json({ error: "Запис не знайдено" });
    return;
  }

  res.json(toApiRecord(record));
});

// PATCH /records/:id
router.patch("/records/:id", async (req, res): Promise<void> => {
  const params = UpdateRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db
    .update(recordsTable)
    .set(fromApiInput(parsed.data))
    .where(eq(recordsTable.id, params.data.id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Запис не знайдено" });
    return;
  }

  res.json(toApiRecord(record));
});

// DELETE /records/:id
router.delete("/records/:id", async (req, res): Promise<void> => {
  const params = DeleteRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .delete(recordsTable)
    .where(eq(recordsTable.id, params.data.id))
    .returning();

  if (!record) {
    res.status(404).json({ error: "Запис не знайдено" });
    return;
  }

  res.sendStatus(204);
});

function toApiRecord(r: typeof recordsTable.$inferSelect) {
  return {
    id: r.id,
    date: r.date ?? null,
    networkOrg: r.networkOrg ?? null,
    byFact: r.byFact ?? null,
    basis: r.basis ?? null,
    fraudSigns: r.fraudSigns ?? null,
    internalFraud: r.internalFraud ?? null,
    violationsFound: r.violationsFound ?? null,
    damagesCaused: r.damagesCaused ?? null,
    measuresТaken: r.measuresTaken ?? null,
    transferredToPolice: r.transferredToPolice ?? null,
    policeResult: r.policeResult ?? null,
    applicantVictim: r.applicantVictim ?? null,
    investigationStatus: r.investigationStatus ?? null,
    notes: null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function fromApiInput(data: Record<string, string | null | undefined>) {
  return {
    date: data.date ?? null,
    networkOrg: data.networkOrg ?? null,
    byFact: data.byFact ?? null,
    basis: data.basis ?? null,
    fraudSigns: data.fraudSigns ?? null,
    internalFraud: data.internalFraud ?? null,
    violationsFound: data.violationsFound ?? null,
    damagesCaused: data.damagesCaused ?? null,
    measuresTaken: (data as Record<string, string | null | undefined>)["measuresТaken"] ?? null,
    transferredToPolice: data.transferredToPolice ?? null,
    policeResult: data.policeResult ?? null,
    applicantVictim: data.applicantVictim ?? null,
    investigationStatus: data.investigationStatus ?? null,
  };
}

export default router;
