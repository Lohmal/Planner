import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { User, Group, Task, GroupMember } from "@/types";
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

  // Check if members_can_create_tasks column exists in groups table and add it if it doesn't
  const groupsTableInfo = await db.all("PRAGMA table_info(groups)");
  const hasTaskPermission = groupsTableInfo.some(
    (column: { name: string }) => column.name === "members_can_create_tasks"
  );

  if (!hasTaskPermission) {
    // Add members_can_create_tasks column to groups table
    await db.exec(`
      ALTER TABLE groups ADD COLUMN members_can_create_tasks INTEGER DEFAULT 0
    `);
    console.log("Added members_can_create_tasks column to groups table");
  }

  // Bildirimler tablosu
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'task_assigned', 'task_due_soon', 'group_invitation', etc.
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_id INTEGER, -- task_id, group_id, etc. depending on the type
      is_read INTEGER DEFAULT 0, -- 0: not read, 1: read
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Grup davetleri tablosı
  await db.exec(`
    CREATE TABLE IF NOT EXISTS group_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      invited_by INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(group_id, user_id)
    )
  `);

  // Task comments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS task_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

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

  // Check if members_can_create_tasks column exists in groups table and add it if it doesn't
  const groupsTableInfo = await db.all("PRAGMA table_info(groups)");
  const hasTaskPermission = groupsTableInfo.some(
    (column: { name: string }) => column.name === "members_can_create_tasks"
  );

  if (!hasTaskPermission) {
    // Add members_can_create_tasks column to groups table
    await db.exec(`
      ALTER TABLE groups ADD COLUMN members_can_create_tasks INTEGER DEFAULT 0
    `);
    console.log("Added members_can_create_tasks column to groups table");
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
  members_can_create_tasks?: boolean;
}): Promise<Group | null> {
  const db = await getDB();

  try {
    // Start a transaction to ensure atomicity
    await db.exec("BEGIN TRANSACTION");

    const result = await db.run(
      "INSERT INTO groups (name, description, creator_id, members_can_create_tasks) VALUES (?, ?, ?, ?)",
      [
        group.name,
        group.description || null,
        group.creator_id,
        group.members_can_create_tasks ? 1 : 0, // Convert boolean to 0/1 for SQLite
      ]
    );

    // Oluşturan kişiyi admin olarak gruba ekleyelim
    if (result.lastID) {
      await db.run("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)", [
        result.lastID,
        group.creator_id,
        "admin",
      ]);
    }

    // Commit the transaction
    await db.exec("COMMIT");

    return getGroupById(result.lastID);
  } catch (error) {
    // Rollback in case of error
    await db.exec("ROLLBACK");
    console.error("Grup oluşturulurken hata:", error);
    return null;
  }
}

export async function updateGroup(
  id: number | string,
  group: { name: string; description?: string; members_can_create_tasks?: boolean }
): Promise<Group | null> {
  const db = await getDB();

  await db.run(
    "UPDATE groups SET name = ?, description = ?, members_can_create_tasks = ? WHERE id = ?",
    [
      group.name,
      group.description || null,
      group.members_can_create_tasks !== undefined ? (group.members_can_create_tasks ? 1 : 0) : null,
      id,
    ]
  );

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

  try {
    const result = await db.run(
      `
      INSERT INTO subgroups (name, description, group_id, creator_id)
      VALUES (?, ?, ?, ?)
      `,
      [subgroup.name, subgroup.description || null, subgroup.group_id, subgroup.creator_id]
    );

    if (result.lastID) {
      return getSubgroupById(result.lastID);
    }
    return null;
  } catch (error) {
    console.error("Alt grup oluşturulurken hata:", error);
    return null;
  }
}

export async function updateSubgroup(
  id: number | string,
  subgroup: { name: string; description?: string }
): Promise<any | null> {
  const db = await getDB();

  try {
    await db.run(
      `
      UPDATE subgroups SET name = ?, description = ?
      WHERE id = ?
    `,
      [subgroup.name, subgroup.description || null, id]
    );

    return getSubgroupById(id);
  } catch (error) {
    console.error("Alt grup güncellenirken hata:", error);
    return null;
  }
}

export async function deleteSubgroup(id: number | string): Promise<boolean> {
  const db = await getDB();

  try {
    // Start a transaction
    await db.exec("BEGIN TRANSACTION");

    // Update tasks to remove subgroup_id reference
    await db.run(
      `
      UPDATE tasks SET subgroup_id = NULL
      WHERE subgroup_id = ?
    `,
      [id]
    );

    // Delete the subgroup
    const result = await db.run(
      `
      DELETE FROM subgroups
      WHERE id = ?
    `,
      [id]
    );

    // Commit the transaction
    await db.exec("COMMIT");

    return result.changes > 0;
  } catch (error) {
    // Rollback in case of error
    await db.exec("ROLLBACK");
    console.error("Alt grup silinirken hata:", error);
    return false;
  }
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

// Add function to get tasks by subgroup ID
export async function getTasksBySubgroupId(subgroupId: number | string): Promise<Task[]> {
  const db = await getDB();

  // Get all tasks for this subgroup
  const tasks = await db.all(
    `
    SELECT t.*, g.name as group_name, sg.name as subgroup_name
    FROM tasks t
    JOIN groups g ON t.group_id = g.id
    JOIN subgroups sg ON t.subgroup_id = sg.id
    WHERE t.subgroup_id = ?
    ORDER BY t.due_date ASC, t.priority DESC
  `,
    [subgroupId]
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

  try {
    // Log the task ID being requested
    console.log("Fetching task with ID:", id);

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

    if (!task) {
      console.log("No task found with ID:", id);
      return null;
    }

    // Görevin atandığı kullanıcıları al
    const assignees = await getTaskAssignees(id);
    task.assignees = assignees;

    return task;
  } catch (error) {
    console.error(`Error fetching task with ID ${id}:`, error);
    return null;
  }
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
    subgroup_id?: number | null;
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
    subgroup_id: task.subgroup_id !== undefined ? task.subgroup_id : currentTask.subgroup_id,
  };

  // Log the update operation
  console.log(`Updating task ${id} with:`, updatedTask);

  await db.run(
    `
    UPDATE tasks SET
      title = ?, description = ?, status = ?, priority = ?,
      due_date = ?, subgroup_id = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      updatedTask.title,
      updatedTask.description,
      updatedTask.status,
      updatedTask.priority,
      updatedTask.due_date,
      updatedTask.subgroup_id,
      id,
    ]
  );

  // Note: We're handling task assignments separately in the API route
  // to ensure better control over the process

  return getTaskById(id);
}

export async function deleteTask(id: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run("DELETE FROM tasks WHERE id = ?", [id]);
  return result.changes > 0;
}

// Bildirim işlemleri
export async function getNotifications(userId: number | string): Promise<any[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
    `,
    [userId]
  );
}

export async function getUnreadNotificationsCount(userId: number | string): Promise<number> {
  const db = await getDB();
  const result = await db.get(
    `
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
    `,
    [userId]
  );
  return result.count || 0;
}

export async function markNotificationAsRead(notificationId: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE id = ?
    `,
    [notificationId]
  );
  return result.changes > 0;
}

export async function markAllNotificationsAsRead(userId: number | string): Promise<boolean> {
  const db = await getDB();
  const result = await db.run(
    `
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
    `,
    [userId]
  );
  return result.changes > 0;
}

export async function createNotification(notification: {
  user_id: number | string;
  type: string;
  title: string;
  message: string;
  related_id?: number;
}): Promise<any> {
  const db = await getDB();
  const result = await db.run(
    `
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (?, ?, ?, ?, ?)
    `,
    [notification.user_id, notification.type, notification.title, notification.message, notification.related_id || null]
  );
  return result.lastID;
}

export async function deleteNotification(notificationId: number | string, userId: number | string): Promise<boolean> {
  const db = await getDB();

  try {
    // Only allow users to delete their own notifications
    const result = await db.run("DELETE FROM notifications WHERE id = ? AND user_id = ?", [notificationId, userId]);

    return result.changes > 0;
  } catch (error) {
    console.error("Bildirim silinirken hata (DB):", error);
    return false;
  }
}

// Grup davetleri işlemleri
export async function createGroupInvitation(invitation: {
  group_id: number | string;
  user_id: number | string;
  invited_by: number | string;
}): Promise<any> {
  const db = await getDB();

  try {
    // Önce davet oluştur
    const result = await db.run(
      `
      INSERT INTO group_invitations (group_id, user_id, invited_by)
      VALUES (?, ?, ?)
      `,
      [invitation.group_id, invitation.user_id, invitation.invited_by]
    );

    // Davet bildirimi oluştur
    const group = await getGroupById(invitation.group_id);
    const inviter = await getUserById(invitation.invited_by);

    if (group && inviter) {
      await createNotification({
        user_id: invitation.user_id,
        type: "group_invitation",
        title: "Grup Daveti",
        message: `${inviter.full_name || inviter.username} sizi "${group.name}" grubuna davet etti.`,
        related_id: result.lastID,
      });
    }

    return result.lastID;
  } catch (error) {
    console.error("Group invitation error:", error);
    return null;
  }
}

export async function getGroupInvitations(userId: number | string): Promise<any[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT gi.*, g.name as group_name, u.username as inviter_username, u.full_name as inviter_full_name
    FROM group_invitations gi
    JOIN groups g ON gi.group_id = g.id
    JOIN users u ON gi.invited_by = u.id
    WHERE gi.user_id = ? AND gi.status = 'pending'
    ORDER BY gi.created_at DESC
    `,
    [userId]
  );
}

export async function respondToGroupInvitation(
  invitationId: number | string,
  response: "accepted" | "rejected"
): Promise<boolean> {
  const db = await getDB();

  try {
    // Get invitation details first
    const invitation = await db.get(
      `
      SELECT * FROM group_invitations
      WHERE id = ? AND status = 'pending'
      `,
      [invitationId]
    );

    if (!invitation) return false;

    // Update invitation status
    await db.run(
      `
      UPDATE group_invitations
      SET status = ?
      WHERE id = ?
      `,
      [response, invitationId]
    );

    // If accepted, add user to group
    if (response === "accepted") {
      await addGroupMember(invitation.group_id, invitation.user_id);

      // Notify group creator
      const group = await getGroupById(invitation.group_id);
      const user = await getUserById(invitation.user_id);

      if (group && user) {
        await createNotification({
          user_id: group.creator_id,
          type: "group_member_joined",
          title: "Yeni Grup Üyesi",
          message: `${user.full_name || user.username} "${group.name}" grubuna katıldı.`,
          related_id: group.id,
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Respond to invitation error:", error);
    return false;
  }
}

// Kullanıcı arama fonksiyonu
export async function searchUsers(query: string, excludeUserIds: (number | string)[] = []): Promise<User[]> {
  const db = await getDB();

  const excludePlaceholders = excludeUserIds.map(() => "?").join(",");
  const params = [`%${query}%`, `%${query}%`, `%${query}%`];

  let sql = `
    SELECT id, username, email, full_name
    FROM users
    WHERE (username LIKE ? OR email LIKE ? OR full_name LIKE ?)
  `;

  if (excludeUserIds.length > 0) {
    sql += ` AND id NOT IN (${excludePlaceholders})`;
    params.push(...excludeUserIds.map((id) => id.toString()));
  }

  sql += " LIMIT 10";

  return db.all(sql, params);
}

// Add interface for TaskAssignee
interface TaskAssignee {
  id: number;
  task_id: number;
  user_id: number;
  assigned_by: number;
  assigned_at: string;
  username?: string;
  email?: string;
  full_name?: string | null;
  assigner_username?: string;
  assigner_full_name?: string | null;
}

// Task görevi ataması için bildirim oluşturma
export async function notifyTaskAssignment(
  taskId: number | string,
  userId: number | string,
  assignedBy: number | string
): Promise<void> {
  const task = await getTaskById(taskId);
  const assigner = await getUserById(assignedBy);

  if (task && assigner) {
    await createNotification({
      user_id: userId,
      type: "task_assigned",
      title: "Yeni Görev Atandı",
      message: `${assigner.full_name || assigner.username} size "${task.title}" görevini atadı.`,
      related_id: Number(task.id),
    });
  }
}

// Task yorumları işlemleri
export async function getTaskComments(taskId: number | string): Promise<any[]> {
  const db = await getDB();
  return db.all(
    `
    SELECT tc.*, u.username, u.email, u.full_name
    FROM task_comments tc
    JOIN users u ON tc.user_id = u.id
    WHERE tc.task_id = ?
    ORDER BY tc.created_at DESC
    `,
    [taskId]
  );
}

export async function addTaskComment(comment: {
  task_id: number | string;
  user_id: number | string;
  comment: string;
}): Promise<any> {
  const db = await getDB();
  const result = await db.run(
    `
    INSERT INTO task_comments (task_id, user_id, comment)
    VALUES (?, ?, ?)
    `,
    [comment.task_id, comment.user_id, comment.comment]
  );

  // Create a notification for each assignee of the task
  const task = await getTaskById(comment.task_id);
  const commenter = await getUserById(comment.user_id);

  if (task && task.assignees && commenter) {
    // Exclude the commenter from notifications
    const assigneesToNotify = task.assignees
      .filter((assignee: TaskAssignee) => assignee.user_id != comment.user_id)
      .map((assignee: TaskAssignee) => assignee.user_id);

    // Create a notification for each assignee
    for (const assigneeId of assigneesToNotify) {
      await createNotification({
        user_id: assigneeId,
        type: "task_comment",
        title: "Görev Yorumu",
        message: `${commenter.full_name || commenter.username} "${task.title}" görevine yorum ekledi.`,
        related_id: task.id,
      });
    }

    // Also notify the task creator if they're not the commenter
    if (task.created_by != comment.user_id) {
      await createNotification({
        user_id: task.created_by,
        type: "task_comment",
        title: "Görev Yorumu",
        message: `${commenter.full_name || commenter.username} "${task.title}" görevine yorum ekledi.`,
        related_id: task.id,
      });
    }
  }

  return result.lastID;
}

export async function deleteTaskComment(commentId: number | string, userId: number | string): Promise<boolean> {
  const db = await getDB();

  // Check if the user is the author of the comment
  const comment = await db.get(`SELECT * FROM task_comments WHERE id = ? AND user_id = ?`, [commentId, userId]);

  if (!comment) {
    return false;
  }

  const result = await db.run(`DELETE FROM task_comments WHERE id = ?`, [commentId]);

  return result.changes > 0;
}

// Add type for the groupTasks result
interface GroupTask {
  id: number;
}

// Enhanced group member removal with task assignment cleanup
export async function removeGroupMemberAndCleanup(
  groupId: number | string,
  userId: number | string,
  removedBy?: number | string
): Promise<boolean> {
  const db = await getDB();

  try {
    // Start a transaction to ensure all operations are atomic
    await db.exec("BEGIN TRANSACTION");

    // Remove the user from the group
    const result = await db.run("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, userId]);

    // Remove user from all task assignments in this group
    await db.run(
      `
      DELETE FROM task_assignments 
      WHERE task_id IN (SELECT id FROM tasks WHERE group_id = ?) 
      AND user_id = ?
    `,
      [groupId, userId]
    );

    // Optionally create a notification about the removal if removedBy is provided
    if (removedBy) {
      await db.run(
        `
        INSERT INTO notifications (
          user_id, type, title, message, related_id, is_read
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          userId,
          "group_removal",
          "Gruptan Çıkarıldınız",
          `Bir grup yöneticisi tarafından gruptan çıkarıldınız.`,
          groupId,
          0,
        ]
      );
    }

    // Commit the transaction
    await db.exec("COMMIT");

    return result.changes > 0;
  } catch (error) {
    // If there's an error, roll back the transaction
    await db.exec("ROLLBACK");
    console.error("Error removing group member:", error);
    return false;
  }
}

// Add a new function to update member role
export async function updateGroupMemberRole(
  groupId: number | string,
  userId: number | string,
  role: string
): Promise<boolean> {
  const db = await getDB();
  try {
    const result = await db.run(
      "UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?",
      [role, groupId, userId]
    );
    return result.changes > 0;
  } catch (error) {
    console.error("Grup üyesi rolü güncellenirken hata:", error);
    return false;
  }
}

// Add a function to check if a user can create tasks in a group
export async function canCreateTasksInGroup(groupId: number | string, userId: number | string): Promise<boolean> {
  const db = await getDB();
  
  // First check if user is an admin
  const isAdmin = await isGroupAdmin(groupId, userId);
  if (isAdmin) return true;
  
  // If not admin, check if the group allows members to create tasks
  const group = await db.get(
    "SELECT members_can_create_tasks FROM groups WHERE id = ?",
    [groupId]
  );
  
  return group && group.members_can_create_tasks === 1;
}
