/**
 * API Endpoint sabitleri
 */
export const API_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  CURRENT_USER: "/api/auth/me",
  LOGOUT: "/api/auth/logout",

  USERS: "/api/users",
  USER_PROFILE: "/api/users/profile",
  USER_STATS: "/api/users/stats",
  USER_DETAIL: (id: string | number) => `/api/users/${id}`,

  GROUPS: "/api/groups",
  GROUP_DETAIL: (id: string | number) => `/api/groups/${id}`,
  GROUP_MEMBERS: (id: string | number) => `/api/groups/${id}/members`,
  GROUP_SUBGROUPS: (id: string | number) => `/api/groups/${id}/subgroups`,
  SUBGROUP_DETAIL: (id: string | number) => `/api/subgroups/${id}`,
  GROUP_INVITATIONS: "/api/group-invitations",
  GROUP_INVITATION_RESPOND: (id: string | number) => `/api/group-invitations/${id}/respond`,

  TASKS: "/api/tasks",
  TASK_DETAIL: (id: string | number) => `/api/tasks/${id}`,
  TASK_COMMENTS: (id: string | number) => `/api/tasks/${id}/comments`,
  GROUP_TASKS: (id: string | number) => `/api/tasks?groupId=${id}`,

  // Eski API'ler
  KISILER: "/api/kisiler",
  KISI_DETAY: (id: string | number) => `/api/kisiler/${id}`,

  // Yeni alt grup API'leri
  SUBGROUP_API_DETAIL: (id: string | number) => `/api/subgroups/${id}`,
  SUBGROUP_API_TASKS: (id: string | number) => `/api/subgroups/${id}/tasks`,
  SEARCH_USERS: "/api/users/search",
};

/**
 * Sayfa yol sabitleri
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  GROUPS: "/groups",
  FORGOT_PASSWORD: "/forgotpassword",
  GROUP_CREATE: "/groups/create",
  GROUP_DETAIL: (id: string | number) => `/groups/${id}`,
  GROUP_EDIT: (id: string | number) => `/groups/${id}/edit`,
  GROUP_MEMBERS: (id: string | number) => `/groups/${id}/members`,
  GROUP_INVITE: (id: string | number) => `/groups/${id}/invite`,
  TASKS: "/tasks",
  TASK_DETAIL: (id: string | number) => `/tasks/${id}`,
  TASK_EDIT: (id: string | number) => `/tasks/${id}/edit`,
  KISILER: "/kisiler",
  KISI_EKLE: "/kisiler/ekle",
  KISI_DETAY: (id: string | number) => `/kisiler/${id}`,
  // Update to use consistent parameter naming
  SUBGROUP_DETAIL: (groupId: string | number, subgroupId: string | number) =>
    `/groups/${groupId}/subgroups/${subgroupId}`,
  // Make sure we have this route for creating tasks within a group
  GROUP_TASKS_CREATE: (id: string | number) => `/groups/${id}/tasks/create`,
  // Add a route for creating tasks within a subgroup context
  SUBGROUP_TASKS_CREATE: (groupId: string | number, subgroupId: string | number) =>
    `/groups/${groupId}/tasks/create?subgroupId=${subgroupId}`,
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
