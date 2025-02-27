import {
  integer,
  timestamp,
  pgTable,
  text,
  boolean,
  uuid,
  varchar,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 50 }).unique().notNull(),
  password: varchar("password", { length: 256 }).notNull(),
  iv: varchar("iv", { length: 32 }).notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  verifyCode: varchar("verify_code", { length: 6 }).notNull(),
  verifyCodeExpires: timestamp("verify_code_expires").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
});

export const passwords = pgTable("passwords", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  accountName: varchar("account_name", { length: 50 }).notNull(),
  username: varchar("username", { length: 50 }).notNull(),
  encrypted_password: varchar("encrypted_password").notNull(),
  iv: varchar("iv").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  passwords: many(passwords),
}));

export const passwordRelations = relations(passwords, ({ one }) => ({
  user: one(users, {
    fields: [passwords.userId],
    references: [users.id],
  }),
}));
