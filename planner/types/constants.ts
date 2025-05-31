/**
 * API Endpoint sabitleri
 */
export const API_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  CURRENT_USER: "/api/auth/me",
  LOGOUT: "/api/auth/logout",

  USERS: "/api/users",
  USER_DETAIL: (id: string | number) => `/api/users/${id}`,

  GROUPS: "/api/groups",
  GROUP_DETAIL: (id: string | number) => `/api/groups/${id}`,
  GROUP_MEMBERS: (id: string | number) => `/api/groups/${id}/members`,
  GROUP_TASKS: (id: string | number) => `/api/groups/${id}/tasks`,
  GROUP_SUBGROUPS: (id: string | number) => `/api/groups/${id}/subgroups`,
  SUBGROUP_DETAIL: (groupId: string | number, subgroupId: string | number) =>
    `/api/groups/${groupId}/subgroups/${subgroupId}`,

  TASKS: "/api/tasks",
  TASK_DETAIL: (id: string | number) => `/api/tasks/${id}`,
  USER_TASKS: (id: string | number) => `/api/users/${id}/tasks`,
  TASK_COMMENTS: (taskId: string | number) => `/api/tasks/${taskId}/comments`,

  // Eski API'ler
  KISILER: "/api/kisiler",
  KISI_DETAY: (id: string | number) => `/api/kisiler/${id}`,
};

/**
 * Sayfa yol sabitleri
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/signup",
  DASHBOARD: "/dashboard",

  GROUPS: "/groups",
  GROUP_CREATE: "/groups/create",
  GROUP_DETAIL: (id: string | number) => `/groups/${id}`,
  GROUP_EDIT: (id: string | number) => `/groups/${id}/edit`,
  GROUP_MEMBERS: (id: string | number) => `/groups/${id}/members`,
  GROUP_TASKS: (id: string | number) => `/groups/${id}/tasks`,

  // Adding subgroup routes - fixing duplicates
  GROUP_SUBGROUPS_LIST: (id: string | number) => `/groups/${id}/subgroups`,
  GROUP_SUBGROUP_CREATE: (id: string | number) => `/groups/${id}/subgroups/create`,
  GROUP_SUBGROUP_DETAIL: (groupId: string | number, subgroupId: string | number) =>
    `/groups/${groupId}/subgroups/${subgroupId}`,

  TASKS: "/tasks",
  TASK_CREATE: "/tasks/create",
  TASK_DETAIL: (id: string | number) => `/tasks/${id}`,
  TASK_EDIT: (id: string | number) => `/tasks/${id}/edit`,

  // Eski rotalar
  KISI_EKLE: "/kisi/ekle",
  KISI_DETAY: (id: string | number) => `/kisi/${id}`,
  KISI_DUZENLE: (id: string | number) => `/kisi/${id}/duzenle`,
  GROUP_SUBGROUPS: (id: string | number) => `/groups/${id}/subgroups`,
  SUBGROUP_DETAIL: (groupId: string | number, subgroupId: string | number) =>
    `/groups/${groupId}/subgroups/${subgroupId}`,
};

/**
 * Form doğrulama mesajları
 */
export const VALIDATION_MESSAGES = {
  // Genel
  REQUIRED_FIELD: "Bu alan zorunludur",

  // Kullanıcı
  USERNAME_MIN: "Kullanıcı adı en az 3 karakter olmalıdır",
  PASSWORD_MIN: "Şifre en az 6 karakter olmalıdır",
  EMAIL_INVALID: "Geçerli bir e-posta adresi giriniz",
  PASSWORDS_DONT_MATCH: "Şifreler eşleşmiyor",

  // Grup
  GROUP_NAME_MIN: "Grup adı en az 3 karakter olmalıdır",

  // Görev
  TASK_TITLE_MIN: "Görev başlığı en az 3 karakter olmalıdır",

  // Eski
  AD_REQUIRED: "Ad en az 2 karakter olmalıdır",
  SOYAD_REQUIRED: "Soyad en az 2 karakter olmalıdır",
};

/**
 * Durum ve öncelik seçenekleri
 */
export const TASK_STATUS_OPTIONS = [
  { value: "pending", label: "Bekliyor" },
  { value: "in_progress", label: "Devam Ediyor" },
  { value: "completed", label: "Tamamlandı" },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
];

/**
 * Uygulama genel sabitleri
 */
export const APP_CONSTANTS = {
  TITLE: "Planlayıcı Uygulaması",
  FOOTER_TEXT: "Tüm hakları saklıdır",
  DEMO_EMAIL: "admin@example.com",
  DEMO_PASSWORD: "password",
};
