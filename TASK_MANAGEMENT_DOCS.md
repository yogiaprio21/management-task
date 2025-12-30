# Dokumentasi Sistem Manajemen Task

## 1. Pendahuluan
Sistem Manajemen Task ini memungkinkan pengguna untuk membuat, membaca, memperbarui, dan menghapus (CRUD) task berdasarkan role yang mereka miliki (Admin, Manager, Staff).

## 2. API Endpoints

Base URL: `/tasks`
Semua endpoint memerlukan autentikasi Bearer Token.

### 2.1. Create Task
- **Endpoint**: `POST /tasks`
- **Role**: Admin, Manager
- **Body**:
  ```json
  {
    "title": "Judul Task",
    "description": "Deskripsi Task",
    "priority": "medium", // low, medium, high
    "status": "todo", // todo, in_progress, review, done
    "deadline": "2023-12-31T23:59:59Z",
    "assigneeId": "uuid-user-staff"
  }
  ```
- **Response**: Object Task yang baru dibuat.

### 2.2. Get All Tasks
- **Endpoint**: `GET /tasks`
- **Query Params**: `sprintId` (optional)
- **Role**: Semua Role
- **Response**: Array of Tasks.

### 2.3. Get Task by ID
- **Endpoint**: `GET /tasks/:id`
- **Role**: Semua Role
- **Response**: Object Task detail.

### 2.4. Update Task
- **Endpoint**: `PATCH /tasks/:id`
- **Role**:
  - **Admin**: Semua field.
  - **Manager**: Semua field (hanya jika task dibuat oleh Manager tersebut).
  - **Staff**: Hanya field `status` (jika task ditugaskan ke Staff tersebut).
- **Body**: Partial object dari Task.
- **Response**: Object Task yang diperbarui.

### 2.5. Delete Task
- **Endpoint**: `DELETE /tasks/:id`
- **Role**: Admin
- **Response**: 200 OK.

## 3. Petunjuk Penggunaan Frontend

### 3.1. Navigasi
1. Login ke aplikasi.
2. Klik menu **"My Tasks"** di sidebar.

### 3.2. Fitur Utama
- **Melihat Daftar Task**: Tabel menampilkan semua task dengan kolom Judul, Status, Prioritas, Assignee, dan Deadline.
- **Pencarian**: Gunakan kolom search di kiri atas tabel untuk mencari berdasarkan judul task.
- **Filter**:
  - **Status**: Filter berdasarkan status (To Do, In Progress, Review, Done).
  - **Priority**: Filter berdasarkan prioritas (Low, Medium, High).
- **Membuat Task Baru**:
  - Klik tombol **"New Task"** (Hanya muncul untuk Admin dan Manager).
  - Isi form modal dan klik "Create Task".
- **Mengedit Task**:
  - Klik baris task pada tabel.
  - Jika Anda memiliki akses, field akan bisa diedit.
  - **Staff** hanya bisa mengubah status task yang ditugaskan padanya.
- **Menghapus Task**:
  - Klik tombol tong sampah (Hanya Admin).

## 4. Laporan Testing

### 4.1. Unit Testing
Kami telah melakukan unit testing pada `TasksService` untuk memverifikasi logika Role-Based Access Control (RBAC).

**Hasil Testing:**
- **Create Task**:
  - [x] Berhasil membuat task dan mencatat `creatorId`.
  - [x] Mengirim notifikasi ke assignee jika ada.
- **Update Task**:
  - [x] **Admin**: Dapat mengupdate semua task.
  - [x] **Manager**: Dapat mengupdate task buatannya sendiri.
  - [x] **Manager**: GAGAL mengupdate task orang lain (Expected: Forbidden).
  - [x] **Staff**: Dapat mengupdate STATUS task yang ditugaskan padanya.
  - [x] **Staff**: GAGAL mengupdate JUDUL/DESKRIPSI task (Expected: Forbidden).
  - [x] **Random User**: GAGAL mengupdate task (Expected: Forbidden).
- **Delete Task**:
  - [x] **Admin**: Dapat menghapus task.
  - [x] **Non-Admin**: GAGAL menghapus task (Expected: Forbidden).

**Status Testing**: ✅ PASSED (Semua skenario validasi role berhasil diverifikasi).
