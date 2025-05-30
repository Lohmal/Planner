import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Kisi, User, Group, Task, GroupMember } from "@/types";
import bcrypt from "bcryptjs";

// Veritabanı bağlantısı için tek bir örnek (singleton) oluşturalım
let db: any = null;

export async function getDB() {
  if (db) {
    return db;
  }

  // Veritabanı bağlantısını açalım
  db = await open({
    filename: "./data.sqlite",
    driver: sqlite3.Database,
  });

  // Tablolar oluşturalım (eğer yoksa)

  // Kullanıcılar tablosu
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      profile_picture TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Gruplar tablosu
  await db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      creator_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Grup üyeleri tablosu
  await db.exec(`
    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(group_id, user_id)
    )
  `);

  // Görevler (tasks) tablosu
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
      priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
      due_date TEXT,
      group_id INTEGER NOT NULL,
      assigned_to INTEGER,
      created_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Eski kisiler tablosu da kalsın (uyumluluk için)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS kisiler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad TEXT NOT NULL,
      soyad TEXT NOT NULL,
      email TEXT UNIQUE,
      telefon TEXT,
      adres TEXT,
      notlar TEXT,
      olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

// Veritabanını başlatma fonksiyonu
export async function initDB() {
  const db = await getDB();

  // Demo kullanıcı oluşturalım (eğer yoksa)
  const userCount = await db.get("SELECT COUNT(*) as count FROM users");

  if (userCount.count === 0) {
    // Demo admin kullanıcısı oluştur
    const hashedPassword = await bcrypt.hash("password", 10);
    await db.run("INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)", [
      "admin",
      "admin@example.com",
      hashedPassword,
      "Admin User",
    ]);

    // Birkaç test kullanıcısı daha ekleyelim
    const testUser1 = await bcrypt.hash("test123", 10);
    const testUser2 = await bcrypt.hash("test123", 10);

    await db.run("INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)", [
      "ahmet",
      "ahmet@example.com",
      testUser1,
      "Ahmet Yılmaz",
    ]);

    await db.run("INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)", [
      "ayse",
      "ayse@example.com",
      testUser2,
      "Ayşe Kaya",
    ]);

    // Demo gruplar oluşturalım
    const admin = await db.get("SELECT id FROM users WHERE username = ?", ["admin"]);

    await db.run("INSERT INTO groups (name, description, creator_id) VALUES (?, ?, ?)", [
      "Yazılım Ekibi",
      "Web ve mobil uygulama geliştirme ekibi",
      admin.id,
    ]);

    await db.run("INSERT INTO groups (name, description, creator_id) VALUES (?, ?, ?)", [
      "Mekanik Ekibi",
      "Mekanik tasarım ve üretim ekibi",
      admin.id,
    ]);

    await db.run("INSERT INTO groups (name, description, creator_id) VALUES (?, ?, ?)", [
      "Elektrik Ekibi",
      "Elektrik ve elektronik sistemler ekibi",
      admin.id,
    ]);

    // Grup üyelikleri ekleyelim
    const yazilimGrubu = await db.get("SELECT id FROM groups WHERE name = ?", ["Yazılım Ekibi"]);
    const mekanikGrubu = await db.get("SELECT id FROM groups WHERE name = ?", ["Mekanik Ekibi"]);
    const elektrikGrubu = await db.get("SELECT id FROM groups WHERE name = ?", ["Elektrik Ekibi"]);

    const ahmet = await db.get("SELECT id FROM users WHERE username = ?", ["ahmet"]);
    const ayse = await db.get("SELECT id FROM users WHERE username = ?", ["ayse"]);

    // Admin tüm gruplara admin olarak ekleyelim
    await db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)", [
      yazilimGrubu.id,
      admin.id,
      "admin",
    ]);

    await db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)", [
      mekanikGrubu.id,
      admin.id,
      "admin",
    ]);

    await db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)", [
      elektrikGrubu.id,
      admin.id,
      "admin",
    ]);

    // Diğer kullanıcılar bazı gruplara üye olsun
    await db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)", [
      yazilimGrubu.id,
      ahmet.id,
      "member",
    ]);

    await db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)", [
      elektrikGrubu.id,
      ahmet.id,
      "member",
    ]);

    await db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)", [
      mekanikGrubu.id,
      ayse.id,
      "member",
    ]);

    // Demo görevler ekleyelim
    await db.run(
      "INSERT INTO tasks (title, description, status, priority, due_date, group_id, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "Frontend geliştirme",
        "React ile kullanıcı arayüzü geliştirme",
        "in_progress",
        "high",
        "2023-12-31",
        yazilimGrubu.id,
        ahmet.id,
        admin.id,
      ]
    );

    await db.run(
      "INSERT INTO tasks (title, description, status, priority, due_date, group_id, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "Devre tasarımı",
        "Güç kaynağı devre tasarımı",
        "pending",
        "medium",
        "2023-12-25",
        elektrikGrubu.id,
        ahmet.id,
        admin.id,
      ]
    );

    await db.run(
      "INSERT INTO tasks (title, description, status, priority, due_date, group_id, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "Parça tedariki",
        "Mekanik parçaların tedarik edilmesi",
        "pending",
        "high",
        "2023-12-20",
        mekanikGrubu.id,
        ayse.id,
        admin.id,
      ]
    );
  }

  // Eski örnek verileri de ekleyelim
  const kisiCount = await db.get("SELECT COUNT(*) as count FROM kisiler");

  if (kisiCount.count === 0) {
    await db.exec(`
      INSERT INTO kisiler (ad, soyad, email, telefon, adres, notlar) VALUES
      ('Ahmet', 'Yılmaz', 'ahmet@example.com', '555-123-4567', 'İstanbul, Türkiye', 'Örnek not 1'),
      ('Ayşe', 'Kaya', 'ayse@example.com', '555-234-5678', 'Ankara, Türkiye', 'Örnek not 2'),
      ('Mehmet', 'Demir', 'mehmet@example.com', '555-345-6789', 'İzmir, Türkiye', 'Örnek not 3')
    `);
  }

  return db;
}

// Kullanıcı işlemleri
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDB();
  return db.get("SELECT * FROM users WHERE email = ?", [email]);
}

export async function getUserById(id: number | string): Promise<User | null> {
  const db = await getDB();
  return db.get("SELECT * FROM users WHERE id = ?", [id]);
}

export async function createUser(user: {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}): Promise<User | null> {
  const db = await getDB();

  // Şifreyi hashleme
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const result = await db.run("INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)", [
    user.username,
    user.email,
    hashedPassword,
    user.full_name || null,
  ]);

  return getUserById(result.lastID);
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);

  if (!user || !user.password) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return null;
  }

  // Şifre alanını çıkararak kullanıcı bilgilerini döndür
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

// Grup işlemleri
export async function getGroups(): Promise<Group[]> {
  const db = await getDB();
  return db.all("SELECT * FROM groups ORDER BY created_at DESC");
}

export async function getGroupById(id: number | string): Promise<Group | null> {
  const db = await getDB();
  return db.get("SELECT * FROM groups WHERE id = ?", [id]);
}

export async function getGroupsByUserId(userId: number | string): Promise<Group[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT g.* 
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
    ORDER BY g.created_at DESC
  `,
    [userId]
  );
}

export async function createGroup(group: {
  name: string;
  description?: string;
  creator_id: number;
}): Promise<Group | null> {
  const db = await getDB();

  const result = await db.run("INSERT INTO groups (name, description, creator_id) VALUES (?, ?, ?)", [
    group.name,
    group.description || null,
    group.creator_id,
  ]);

  // Oluşturan kişiyi admin olarak gruba ekleyelim
  if (result.lastID) {
    await db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)", [
      result.lastID,
      group.creator_id,
      "admin",
    ]);
  }

  return getGroupById(result.lastID);
}

export async function updateGroup(
  id: number | string,
  group: { name: string; description?: string }
): Promise<Group | null> {
  const db = await getDB();

  await db.run("UPDATE groups SET name = ?, description = ? WHERE id = ?", [group.name, group.description || null, id]);

  return getGroupById(id);
}

export async function deleteGroup(id: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run("DELETE FROM groups WHERE id = ?", [id]);
  return result.changes > 0;
}

// Grup üyeliği işlemleri
export async function getGroupMembers(groupId: number | string): Promise<GroupMember[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT gm.*, u.username, u.email, u.full_name
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ?
    ORDER BY gm.role DESC, u.username ASC
  `,
    [groupId]
  );
}

export async function addGroupMember(
  groupId: number | string,
  userId: number | string,
  role: string = "member"
): Promise<boolean> {
  const db = await getDB();
  try {
    const result = await db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)", [
      groupId,
      userId,
      role,
    ]);
    return result.changes > 0;
  } catch (error) {
    console.error("Grup üyesi eklenirken hata:", error);
    return false;
  }
}

export async function removeGroupMember(groupId: number | string, userId: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, userId]);
  return result.changes > 0;
}

export async function isGroupMember(groupId: number | string, userId: number | string): Promise<boolean> {
  const db = await getDB();
  const member = await db.get("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, userId]);
  return !!member;
}

export async function isGroupAdmin(groupId: number | string, userId: number | string): Promise<boolean> {
  const db = await getDB();
  const member = await db.get("SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND role = 'admin'", [
    groupId,
    userId,
  ]);
  return !!member;
}

// Görev (task) işlemleri
export async function getTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.all(`
    SELECT t.*, u.username as assigned_username, u.full_name as assigned_full_name,
           c.username as creator_username, c.full_name as creator_full_name,
           g.name as group_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    JOIN users c ON t.created_by = c.id
    JOIN groups g ON t.group_id = g.id
    ORDER BY t.due_date ASC, t.priority DESC
  `);
}

export async function getTaskById(id: number | string): Promise<Task | null> {
  const db = await getDB();
  return db.get(
    `
    SELECT t.*, u.username as assigned_username, u.full_name as assigned_full_name,
           c.username as creator_username, c.full_name as creator_full_name,
           g.name as group_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    JOIN users c ON t.created_by = c.id
    JOIN groups g ON t.group_id = g.id
    WHERE t.id = ?
  `,
    [id]
  );
}

export async function getTasksByGroupId(groupId: number | string): Promise<Task[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT t.*, u.username as assigned_username, u.full_name as assigned_full_name,
           c.username as creator_username, c.full_name as creator_full_name,
           g.name as group_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    JOIN users c ON t.created_by = c.id
    JOIN groups g ON t.group_id = g.id
    WHERE t.group_id = ?
    ORDER BY t.due_date ASC, t.priority DESC
  `,
    [groupId]
  );
}

export async function getTasksByUserId(userId: number | string): Promise<Task[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT t.*, u.username as assigned_username, u.full_name as assigned_full_name,
           c.username as creator_username, c.full_name as creator_full_name,
           g.name as group_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    JOIN users c ON t.created_by = c.id
    JOIN groups g ON t.group_id = g.id
    WHERE t.assigned_to = ?
    ORDER BY t.due_date ASC, t.priority DESC
  `,
    [userId]
  );
}

export async function createTask(task: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  group_id: number;
  assigned_to?: number;
  created_by: number;
}): Promise<Task | null> {
  const db = await getDB();

  const result = await db.run(
    `INSERT INTO tasks (
      title, description, status, priority, due_date, 
      group_id, assigned_to, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.title,
      task.description || null,
      task.status || "pending",
      task.priority || "medium",
      task.due_date || null,
      task.group_id,
      task.assigned_to || null,
      task.created_by,
    ]
  );

  return getTaskById(result.lastID);
}

export async function updateTask(
  id: number | string,
  task: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    due_date?: string;
    assigned_to?: number | null;
  }
): Promise<Task | null> {
  const db = await getDB();

  const currentTask = await getTaskById(id);
  if (!currentTask) return null;

  const updatedTask = {
    title: task.title ?? currentTask.title,
    description: task.description ?? currentTask.description,
    status: task.status ?? currentTask.status,
    priority: task.priority ?? currentTask.priority,
    due_date: task.due_date ?? currentTask.due_date,
    assigned_to: task.assigned_to !== undefined ? task.assigned_to : currentTask.assigned_to,
  };

  await db.run(
    `UPDATE tasks SET
      title = ?, description = ?, status = ?, priority = ?,
      due_date = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      updatedTask.title,
      updatedTask.description,
      updatedTask.status,
      updatedTask.priority,
      updatedTask.due_date,
      updatedTask.assigned_to,
      id,
    ]
  );

  return getTaskById(id);
}

export async function deleteTask(id: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run("DELETE FROM tasks WHERE id = ?", [id]);
  return result.changes > 0;
}

// Kişi CRUD işlemleri (eski işlevsellik için saklanmıştır)
export async function getKisiler(): Promise<Kisi[]> {
  const db = await getDB();
  return db.all("SELECT * FROM kisiler ORDER BY olusturma_tarihi DESC");
}

export async function getKisiById(id: number | string): Promise<Kisi | null> {
  const db = await getDB();
  return db.get("SELECT * FROM kisiler WHERE id = ?", [id]);
}

export async function createKisi(kisi: Kisi): Promise<Kisi | null> {
  const db = await getDB();
  const result = await db.run(
    "INSERT INTO kisiler (ad, soyad, email, telefon, adres, notlar) VALUES (?, ?, ?, ?, ?, ?)",
    [kisi.ad, kisi.soyad, kisi.email, kisi.telefon, kisi.adres, kisi.notlar]
  );

  return getKisiById(result.lastID);
}

export async function updateKisi(id: number | string, kisi: Kisi): Promise<Kisi | null> {
  const db = await getDB();
  await db.run("UPDATE kisiler SET ad = ?, soyad = ?, email = ?, telefon = ?, adres = ?, notlar = ? WHERE id = ?", [
    kisi.ad,
    kisi.soyad,
    kisi.email,
    kisi.telefon,
    kisi.adres,
    kisi.notlar,
    id,
  ]);

  return getKisiById(id);
}

export async function deleteKisi(id: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run("DELETE FROM kisiler WHERE id = ?", [id]);
  return result.changes > 0;
}

export async function isEmailUnique(email: string, excludeId?: number | string): Promise<boolean> {
  const db = await getDB();
  let query = "SELECT COUNT(*) as count FROM kisiler WHERE email = ?";
  const params: any[] = [email];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  const result = await db.get(query, params);
  return result.count === 0;
}
