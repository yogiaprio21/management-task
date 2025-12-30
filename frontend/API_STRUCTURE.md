# Dokumentasi Struktur API

Dokumentasi ini menjelaskan struktur API yang digunakan dalam frontend Management Task.

## Base URL
Semua request API diarahkan ke `http://localhost:3000`.

## Headers
- **Content-Type**: `application/json`
- **Authorization**: `Bearer <token>` (Otomatis ditambahkan jika user sudah login)

## Endpoint & Fungsi

### 1. Autentikasi (`api/auth.ts`)
- `POST /auth/login`: Login user.
- `POST /auth/register`: Registrasi user baru.

### 2. Users (`api/users.ts`)
- `GET /users`: Mengambil daftar semua user (Admin only).
- `GET /users/profile`: Mengambil profil user yang sedang login.
- `PATCH /users/:id`: Mengupdate data user (misal: role).
- `DELETE /users/:id`: Menghapus user.

### 3. Projects (`api/projects.ts`)
- `GET /projects`: Mengambil semua project.
- `GET /projects/:id`: Mengambil detail project.
- `POST /projects`: Membuat project baru.

### 4. Tasks (`api/tasks.ts`)
- `GET /tasks?sprintId=:id`: Mengambil task berdasarkan sprint.
- `POST /tasks`: Membuat task baru.
- `PATCH /tasks/:id`: Mengupdate task (status, title, dll).
- `DELETE /tasks/:id`: Menghapus task.

### 5. Backlog (`api/backlog.ts`)
- `GET /backlog/project/:projectId`: Mengambil item backlog.
- `POST /backlog`: Membuat item backlog.
- `PATCH /backlog/:id`: Mengupdate item backlog.
- `DELETE /backlog/:id`: Menghapus item backlog.

### 6. Sprints (`api/sprints.ts`)
- `GET /sprints/project/:projectId`: Mengambil sprint dalam project.
- `POST /sprints`: Membuat sprint baru.

## Error Handling
Frontend menggunakan `axios` interceptor di `src/api/client.ts` untuk menangani error secara global:
- **401 Unauthorized**: Redirect ke halaman login.
- **403 Forbidden**: Menampilkan pesan "You do not have permission".
- **Lainnya**: Menampilkan pesan error dari server atau pesan default.

## Tipe Data
Definisi tipe data lengkap dapat ditemukan di `src/types/index.ts`.
