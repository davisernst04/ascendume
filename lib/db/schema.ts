import { pgTable, serial, text, timestamp, varchar, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Better Auth Users Table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role").default("user"),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
}));

// Better Auth Sessions Table
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
}, (table) => ({
  userIdIdx: index("session_user_id_idx").on(table.userId),
  tokenIdx: index("session_token_idx").on(table.token),
}));

// Better Auth Accounts Table (for OAuth providers)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
}, (table) => ({
  userIdIdx: index("account_user_id_idx").on(table.userId),
  accountIdIdx: index("account_account_id_idx").on(table.accountId),
  providerIdIdx: index("account_provider_id_idx").on(table.providerId),
}));

// Better Auth Verifications Table (for email verification, password reset, etc.)
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
}, (table) => ({
  identifierIdx: index("verification_identifier_idx").on(table.identifier),
}));

// Resumes Table
export const resumes = pgTable("resumes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull().default("My Resume"),
  originalFileUrl: text("original_file_url"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("resumes_user_id_idx").on(table.userId),
}));

// Personal Info Table
export const personalInfo = pgTable("personal_info", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  resumeId: text("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  location: varchar("location", { length: 255 }),
  summary: text("summary"),
  website: varchar("website", { length: 500 }),
  linkedin: varchar("linkedin", { length: 500 }),
  github: varchar("github", { length: 500 }),
}, (table) => ({
  resumeIdIdx: index("personal_info_resume_id_idx").on(table.resumeId),
}));

// Work Experience Table
export const workExperience = pgTable("work_experience", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  resumeId: text("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  location: varchar("location", { length: 255 }),
  startDate: varchar("start_date", { length: 50 }),
  endDate: varchar("end_date", { length: 50 }),
  current: boolean("current").notNull().default(false),
  bullets: text("bullets"),
  order: serial("order"),
}, (table) => ({
  resumeIdIdx: index("work_experience_resume_id_idx").on(table.resumeId),
}));

// Education Table
export const education = pgTable("education", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  resumeId: text("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  institution: varchar("institution", { length: 255 }),
  degree: varchar("degree", { length: 255 }),
  field: varchar("field", { length: 255 }),
  gpa: varchar("gpa", { length: 20 }),
  graduationDate: varchar("graduation_date", { length: 50 }),
  order: serial("order"),
}, (table) => ({
  resumeIdIdx: index("education_resume_id_idx").on(table.resumeId),
}));

// Skills Table
export const skills = pgTable("skills", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  resumeId: text("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }).unique(),
  technical: text("technical"),
  frameworks: text("frameworks"),
  tools: text("tools"),
}, (table) => ({
  resumeIdIdx: index("skills_resume_id_idx").on(table.resumeId),
}));

// Projects Table
export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  resumeId: text("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  url: varchar("url", { length: 500 }),
  technologies: text("technologies"),
  description: text("description"),
  order: serial("order"),
}, (table) => ({
  resumeIdIdx: index("projects_resume_id_idx").on(table.resumeId),
}));

// Certifications Table
export const certifications = pgTable("certifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  resumeId: text("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }),
  issuer: varchar("issuer", { length: 255 }),
  date: varchar("date", { length: 50 }),
  credentialUrl: varchar("credential_url", { length: 500 }),
  order: serial("order"),
}, (table) => ({
  resumeIdIdx: index("certifications_resume_id_idx").on(table.resumeId),
}));

// Relations
export const resumesRelations = relations(resumes, ({ one, many }) => ({
  personalInfo: one(personalInfo, {
    fields: [resumes.id],
    references: [personalInfo.resumeId],
  }),
  workExperience: many(workExperience),
  education: many(education),
  skills: one(skills, {
    fields: [resumes.id],
    references: [skills.resumeId],
  }),
  projects: many(projects),
  certifications: many(certifications),
}));

export const personalInfoRelations = relations(personalInfo, ({ one }) => ({
  resume: one(resumes, {
    fields: [personalInfo.resumeId],
    references: [resumes.id],
  }),
}));

export const workExperienceRelations = relations(workExperience, ({ one }) => ({
  resume: one(resumes, {
    fields: [workExperience.resumeId],
    references: [resumes.id],
  }),
}));

export const educationRelations = relations(education, ({ one }) => ({
  resume: one(resumes, {
    fields: [education.resumeId],
    references: [resumes.id],
  }),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  resume: one(resumes, {
    fields: [skills.resumeId],
    references: [resumes.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  resume: one(resumes, {
    fields: [projects.resumeId],
    references: [resumes.id],
  }),
}));

export const certificationsRelations = relations(certifications, ({ one }) => ({
  resume: one(resumes, {
    fields: [certifications.resumeId],
    references: [resumes.id],
  }),
}));
