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

  // Alt gruplar tablosu
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subgroups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      group_id INTEGER NOT NULL,
      creator_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
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

  // Görev-Kullanıcı ilişki tablosu (çoklu atama için)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS task_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(task_id, user_id)
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

  // Check if subgroup_id column exists in tasks table and add it if it doesn't
  const tableInfo = await db.all("PRAGMA table_info(tasks)");
  const hasSubgroupId = tableInfo.some((column: { name: string }) => column.name === "subgroup_id");

  if (!hasSubgroupId) {
    // Add subgroup_id column to tasks table
    await db.exec(`
      ALTER TABLE tasks ADD COLUMN subgroup_id INTEGER DEFAULT NULL REFERENCES subgroups(id) ON DELETE SET NULL
    `);
    console.log("Added subgroup_id column to tasks table");
  }

  return db;
}

// Veritabanını başlatma fonksiyonu
export async function initDB() {
  const db = await getDB();

  // Check if subgroup_id column exists in tasks table and add it if it doesn't
  const tableInfo = await db.all("PRAGMA table_info(tasks)");
  const hasSubgroupId = tableInfo.some((column: { name: string }) => column.name === "subgroup_id");

  if (!hasSubgroupId) {
    // Add subgroup_id column to tasks table
    await db.exec(`
      ALTER TABLE tasks ADD COLUMN subgroup_id INTEGER DEFAULT NULL REFERENCES subgroups(id) ON DELETE SET NULL
    `);
    console.log("Added subgroup_id column to tasks table");
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

// Alt grup işlemleri
export async function getSubgroups(groupId: number | string): Promise<any[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT s.*, u.username as creator_username, u.full_name as creator_full_name
    FROM subgroups s
    JOIN users u ON s.creator_id = u.id
    WHERE s.group_id = ?
    ORDER BY s.created_at DESC
  `,
    [groupId]
  );
}

export async function getSubgroupById(id: number | string): Promise<any | null> {
  const db = await getDB();
  return db.get(
    `
    SELECT s.*, u.username as creator_username, u.full_name as creator_full_name, g.name as group_name
    FROM subgroups s
    JOIN users u ON s.creator_id = u.id
    JOIN groups g ON s.group_id = g.id
    WHERE s.id = ?
  `,
    [id]
  );
}

export async function createSubgroup(subgroup: {
  name: string;
  description?: string;
  group_id: number;
  creator_id: number;
}): Promise<any | null> {
  const db = await getDB();

  const result = await db.run(
    `
    INSERT INTO subgroups (name, description, group_id, creator_id)
    VALUES (?, ?, ?, ?)
  `,
    [subgroup.name, subgroup.description || null, subgroup.group_id, subgroup.creator_id]
  );

  return getSubgroupById(result.lastID);
}

export async function updateSubgroup(
  id: number | string,
  subgroup: { name: string; description?: string }
): Promise<any | null> {
  const db = await getDB();

  await db.run(
    `
    UPDATE subgroups SET name = ?, description = ?
    WHERE id = ?
  `,
    [subgroup.name, subgroup.description || null, id]
  );

  return getSubgroupById(id);
}

export async function deleteSubgroup(id: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run("DELETE FROM subgroups WHERE id = ?", [id]);
  return result.changes > 0;
}

// Çoklu görev atama işlemleri
export async function assignTaskToUsers(
  taskId: number | string,
  userIds: (number | string)[],
  assignedBy: number | string
): Promise<number> {
  const db = await getDB();
  let successCount = 0;

  for (const userId of userIds) {
    try {
      await db.run(
        `
        INSERT INTO task_assignments (task_id, user_id, assigned_by)
        VALUES (?, ?, ?)
      `,
        [taskId, userId, assignedBy]
      );
      successCount++;
    } catch (error) {
      console.error(`Error assigning task ${taskId} to user ${userId}:`, error);
    }
  }

  return successCount;
}

export async function removeTaskAssignment(taskId: number | string, userId: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run(
    `
    DELETE FROM task_assignments 
    WHERE task_id = ? AND user_id = ?
  `,
    [taskId, userId]
  );
  return result.changes > 0;
}

export async function getTaskAssignees(taskId: number | string): Promise<any[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT ta.*, u.username, u.email, u.full_name,
           a.username as assigner_username, a.full_name as assigner_full_name
    FROM task_assignments ta
    JOIN users u ON ta.user_id = u.id
    JOIN users a ON ta.assigned_by = a.id
    WHERE ta.task_id = ?
    ORDER BY ta.assigned_at DESC
  `,
    [taskId]
  );
}

export async function getTasksByGroupId(groupId: number | string): Promise<Task[]> {
  const db = await getDB();

  // Get all tasks for this group
  const tasks = await db.all(
    `
    SELECT t.*, g.name as group_name
    FROM tasks t
    JOIN groups g ON t.group_id = g.id
    WHERE t.group_id = ?
    ORDER BY t.due_date ASC, t.priority DESC
  `,
    [groupId]
  );

  // For each task, get the assignees
  for (const task of tasks) {
    task.assignees = await getTaskAssignees(task.id);
  }

  return tasks;
}

// Görev (task) işlemleri
export async function getTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.all(`
    SELECT t.*, g.name as group_name
    FROM tasks t
    JOIN groups g ON t.group_id = g.id
    ORDER BY t.due_date ASC, t.priority DESC
  `);
}

export async function getTasksByUserId(userId: number | string): Promise<Task[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT t.*, g.name as group_name
    FROM tasks t
    JOIN groups g ON t.group_id = g.id
    JOIN task_assignments ta ON t.id = ta.task_id
    WHERE ta.user_id = ?
    ORDER BY t.due_date ASC, t.priority DESC
  `,
    [userId]
  );
}

export async function getTaskById(id: number | string): Promise<any | null> {
  const db = await getDB();
  const task = await db.get(
    `
    SELECT t.*, c.username as creator_username, c.full_name as creator_full_name,
           g.name as group_name, sg.name as subgroup_name
    FROM tasks t
    JOIN users c ON t.created_by = c.id
    JOIN groups g ON t.group_id = g.id
    LEFT JOIN subgroups sg ON t.subgroup_id = sg.id
    WHERE t.id = ?
  `,
    [id]
  );

  if (!task) return null;

  // Görevin atandığı kullanıcıları al
  task.assignees = await getTaskAssignees(id);

  return task;
}

export async function createTask(task: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  group_id: number;
  subgroup_id?: number;
  created_by: number;
  assigned_users?: number[];
}): Promise<Task | null> {
  const db = await getDB();

  const result = await db.run(
    `
    INSERT INTO tasks (
      title, description, status, priority, due_date, 
      group_id, subgroup_id, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      task.title,
      task.description || null,
      task.status || "pending",
      task.priority || "medium",
      task.due_date || null,
      task.group_id,
      task.subgroup_id || null,
      task.created_by,
    ]
  );

  const taskId = result.lastID;

  // Çoklu kullanıcı ataması yap
  if (task.assigned_users && task.assigned_users.length > 0) {
    await assignTaskToUsers(taskId, task.assigned_users, task.created_by);
  }

  return getTaskById(taskId);
}

export async function updateTask(
  id: number | string,
  task: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    due_date?: string;
    assigned_users?: number[];
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
  };

  await db.run(
    `
    UPDATE tasks SET
      title = ?, description = ?, status = ?, priority = ?,
      due_date = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [updatedTask.title, updatedTask.description, updatedTask.status, updatedTask.priority, updatedTask.due_date, id]
  );

  // Update task assignments if provided
  if (task.assigned_users && task.assigned_users.length > 0) {
    // First remove all existing assignments
    await db.run(`DELETE FROM task_assignments WHERE task_id = ?`, [id]);

    // Then add the new assignments
    for (const userId of task.assigned_users) {
      await db.run(
        `
        INSERT INTO task_assignments (task_id, user_id, assigned_by)
        VALUES (?, ?, ?)
      `,
        [id, userId, currentTask.created_by]
      );
    }
  }

  return getTaskById(id);
}

export async function deleteTask(id: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run("DELETE FROM tasks WHERE id = ?", [id]);
  return result.changes > 0;
}

// Eski kisiler ile ilgili işlemler
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
