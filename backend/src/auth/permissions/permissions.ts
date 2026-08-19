export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",

  // Admin users
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_MANAGE_ROLES: "users.manage_roles",

  DOCUMENTS_READ: "documents.read",
  DOCUMENTS_UPDATE: "documents.update",

  // Roles
  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",

  // Workers
  WORKERS_READ: "workers.read",
  WORKERS_CREATE: "workers.create",
  WORKERS_UPDATE: "workers.update",
  WORKERS_DELETE: "workers.delete",

  // Employers
  EMPLOYERS_READ: "employers.read",
  EMPLOYERS_CREATE: "employers.create",
  EMPLOYERS_UPDATE: "employers.update",
  EMPLOYERS_DELETE: "employers.delete",

  // Jobs
  JOBS_READ: "jobs.read",
  JOBS_CREATE: "jobs.create",
  JOBS_UPDATE: "jobs.update",
  JOBS_DELETE: "jobs.delete",

  // Applications
  APPLICATIONS_READ: "applications.read",
  APPLICATIONS_UPDATE: "applications.update",

  // Verification
  VERIFICATION_READ: "verification.read",
  VERIFICATION_UPDATE: "verification.update",

  // Attendance
  ATTENDANCE_READ: "attendance.read",
  ATTENDANCE_UPDATE: "attendance.update",

  // Payments
  PAYMENTS_READ: "payments.read",
  PAYMENTS_CREATE: "payments.create",
  PAYMENTS_UPDATE: "payments.update",

  // Reports
  REPORTS_READ: "reports.read",

  // Notifications
  NOTIFICATIONS_READ: "notifications.read",
  NOTIFICATIONS_CREATE: "notifications.create",

  // Settings
  SETTINGS_READ: "settings.read",
  SETTINGS_UPDATE: "settings.update",

  // Audit
  AUDIT_LOGS_READ: "audit_logs.read",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];