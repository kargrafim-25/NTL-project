import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionTier: varchar("subscription_tier").default("free").notNull(), // free, starter, pro
  dailyCredits: integer("daily_credits").default(0).notNull(),
  monthlyCredits: integer("monthly_credits").default(0).notNull(),
  maxDailyCredits: integer("max_daily_credits").default(2).notNull(),
  maxMonthlyCredits: integer("max_monthly_credits").default(10).notNull(),
  lastCreditReset: timestamp("last_credit_reset").defaultNow(),
  monthlyCompletionStreak: integer("monthly_completion_streak").default(0).notNull(),
  lastNotificationDate: timestamp("last_notification_date"),
  pendingDiscountCode: varchar("pending_discount_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const signalDirectionEnum = pgEnum('signal_direction', ['BUY', 'SELL']);
export const signalStatusEnum = pgEnum('signal_status', ['fresh', 'active', 'closed', 'stopped']);
export const userActionEnum = pgEnum('user_action', ['pending', 'successful', 'unsuccessful', 'didnt_take']);
export const timeframeEnum = pgEnum('timeframe', ['5M', '15M', '30M', '1H', '4H', '1D', '1W']);
export const newsImpactEnum = pgEnum('news_impact', ['low', 'medium', 'high']);
export const newsCurrencyEnum = pgEnum('news_currency', ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']);

export const tradingSignals = pgTable("trading_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  pair: varchar("pair").default("XAUUSD").notNull(),
  direction: signalDirectionEnum("direction").notNull(),
  timeframe: timeframeEnum("timeframe").notNull(),
  entryPrice: decimal("entry_price", { precision: 10, scale: 2 }).notNull(),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 2 }).notNull(),
  takeProfit: decimal("take_profit", { precision: 10, scale: 2 }).notNull(),
  confidence: integer("confidence").notNull(), // 1-100
  analysis: text("analysis"),
  status: signalStatusEnum("status").default("fresh").notNull(),
  userAction: userActionEnum("user_action").default("pending").notNull(),
  pips: decimal("pips", { precision: 10, scale: 2 }),
  lastNotified: timestamp("last_notified"),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const economicNews = pgTable("economic_news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  currency: newsCurrencyEnum("currency").notNull(),
  impact: newsImpactEnum("impact").notNull(),
  eventTime: timestamp("event_time").notNull(),
  actualValue: varchar("actual_value"),
  forecastValue: varchar("forecast_value"),
  previousValue: varchar("previous_value"),
  source: varchar("source").default("manual").notNull(),
  sourceUrl: varchar("source_url"),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  signals: many(tradingSignals),
}));

export const signalsRelations = relations(tradingSignals, ({ one }) => ({
  user: one(users, {
    fields: [tradingSignals.userId],
    references: [users.id],
  }),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type TradingSignal = typeof tradingSignals.$inferSelect;
export type InsertTradingSignal = typeof tradingSignals.$inferInsert;
export type EconomicNews = typeof economicNews.$inferSelect;
export type InsertEconomicNews = typeof economicNews.$inferInsert;

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertSignalSchema = createInsertSchema(tradingSignals).omit({
  id: true,
  createdAt: true,
  closedAt: true,
});

export const insertNewsSchema = createInsertSchema(economicNews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;
