import { pgTable, uuid, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const participants = pgTable('participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  imajinEventId: varchar('imajin_event_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  position: integer('position').notNull(),
  status: varchar('status', { length: 20 }).default('waiting').notNull(), // waiting | active | complete | skipped
  phone: varchar('phone', { length: 20 }),
  turnStart: timestamp('turn_start', { withTimezone: true }),
  turnEnd: timestamp('turn_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Types for use in app
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
