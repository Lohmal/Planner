/**
 * Kişi modeli (eski)
 */
export type Kisi = {
  id?: number;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  adres?: string;
  notlar?: string;
  olusturma_tarihi?: string;
};

/**
 * Kullanıcı modeli
 */
export type User = {
  id: number;
  username: string;
  email: string;
  password?: string; // API yanıtlarında bu alan olmamalı
  full_name?: string;
  profile_picture?: string;
  created_at?: string;
};

/**
 * Grup modeli
 */
export type Group = {
  id: number;
  name: string;
  description?: string;
  creator_id: number;
  created_at?: string;
  // İlişkisel veri
  creator?: User;
  member_count?: number;
};

/**
 * Grup üyesi modeli
 */
export type GroupMember = {
  id: number;
  group_id: number;
  user_id: number;
  role: string; // "admin" | "member"
  joined_at?: string;
  // İlişkisel veri
  username?: string;
  email?: string;
  full_name?: string;
};

/**
 * Görev modeli
 */
export type Task = {
  id: number;
  title: string;
  description?: string;
  status: string; // "pending" | "in_progress" | "completed"
  priority: string; // "low" | "medium" | "high"
  due_date?: string;
  group_id: number;
  assigned_to?: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  // İlişkisel veri
  group_name?: string;
  assigned_username?: string;
  assigned_full_name?: string;
  creator_username?: string;
  creator_full_name?: string;
};

/**
 * API yanıt modeli
 */
export type ApiResponse<T> = {
  data?: T | null;
  success: boolean;
  message?: string;
};
