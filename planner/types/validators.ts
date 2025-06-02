import { z } from "zod";
import { VALIDATION_MESSAGES } from "./constants";

/**
 * Giriş formu doğrulama şeması
 */
export const loginSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID),
  password: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
});

export type LoginForm = z.infer<typeof loginSchema>;
/**
 * Şifre sıfırlama formu doğrulama şeması
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
});
/**
 * Kayıt formu doğrulama şeması
 */
export const registerSchema = z
  .object({
    username: z.string().min(3, VALIDATION_MESSAGES.USERNAME_MIN),
    email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID),
    password: z.string().min(6, VALIDATION_MESSAGES.PASSWORD_MIN),
    confirmPassword: z.string().min(6, VALIDATION_MESSAGES.PASSWORD_MIN),
    fullName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH,
    path: ["confirmPassword"],
  });

export type RegisterForm = z.infer<typeof registerSchema>;

/**
 * Grup formu doğrulama şeması
 */
export const groupSchema = z.object({
  name: z.string().min(3, VALIDATION_MESSAGES.GROUP_NAME_MIN),
  description: z.string().optional(),
});

export type GroupForm = z.infer<typeof groupSchema>;

/**
 * Görev formu doğrulama şeması
 */
export const taskSchema = z.object({
  title: z.string().min(1, "Görev başlığı zorunludur"),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  due_date: z.string().nullable().optional(),
  subgroup_id: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseInt(val, 10) : val;
    }),
  group_id: z.number().optional(),
});

export type TaskForm = z.infer<typeof taskSchema>;

/**
 * Alt grup formu doğrulama şeması
 */
export const subgroupSchema = z.object({
  name: z.string().min(1, "Alt grup adı zorunludur"),
  description: z.string().optional(),
});

export type SubgroupForm = z.infer<typeof subgroupSchema>;
