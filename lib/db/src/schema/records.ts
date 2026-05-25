import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recordsTable = pgTable("records", {
  id: serial("id").primaryKey(),
  date: text("date"),
  networkOrg: text("network_org"),
  byFact: text("by_fact"),
  basis: text("basis"),
  fraudSigns: text("fraud_signs"),
  internalFraud: text("internal_fraud"),
  violationsFound: text("violations_found"),
  damagesCaused: text("damages_caused"),
  measuresTaken: text("measures_taken"),
  transferredToPolice: text("transferred_to_police"),
  policeResult: text("police_result"),
  applicantVictim: text("applicant_victim"),
  investigationStatus: text("investigation_status"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRecordSchema = createInsertSchema(recordsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRecord = z.infer<typeof insertRecordSchema>;
export type Record = typeof recordsTable.$inferSelect;
