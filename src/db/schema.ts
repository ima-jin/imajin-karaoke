import { pgTable, uuid, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const participants = pgTable('participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  imajinEventId: varchar('imajin_event_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  participantDid: varchar('participant_did', { length: 255 }),
  position: integer('position').notNull(),
  status: varchar('status', { length: 20 }).default('waiting').notNull(), // waiting | active | complete | skipped
  phone: varchar('phone', { length: 20 }),
  turnStart: timestamp('turn_start', { withTimezone: true }),
  turnEnd: timestamp('turn_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const karaokeConfig = pgTable('karaoke_config', {
  imajinEventId: varchar('imajin_event_id', { length: 255 }).primaryKey(),
  signupMode: varchar('signup_mode', { length: 20 }).default('anyone').notNull(), // 'anyone' | 'attendees_only'
  discoverable: boolean('discoverable').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Types for use in app
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type KaraokeConfig = typeof karaokeConfig.$inferSelect;
export type NewKaraokeConfig = typeof karaokeConfig.$inferInsert;
