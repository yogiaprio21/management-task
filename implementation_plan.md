# Analisis: Toast Notifications & Dashboard Pending Tasks Fix

## Ringkasan Masalah

Dua masalah yang perlu diselesaikan:
1. **Toast notifications** — sebagian halaman sudah ada, sebagian belum
2. **Dashboard "Pending Tasks"** — menampilkan *semua* task dari semua tim, bukan milik user yang login

---

## 1. Status Toast Notification Per Halaman

### ✅ Sudah Ada Toast

| Halaman / Fitur | Aksi | Status |
|---|---|---|
| `Dashboard.tsx` | Create Project | ✅ `toast.success/error` |
| `ProjectDetail.tsx` | Create Backlog Item | ✅ `toast.success/error` |
| `ProjectDetail.tsx` | Create Sprint | ✅ `toast.success/error` |
| `ProjectDetail.tsx` | Create Report | ✅ `toast.success/error` |
| `ProjectDetail.tsx` | Update Task (drag & drop) | ✅ `toast.success/error` |
| `ProjectDetail.tsx` | Delete Task | ✅ `toast.success/error` |
| `ProjectDetail.tsx` | Add/Remove Member | ✅ `toast.success/error` |
| `ProductBacklog.tsx` | Create Backlog Item | ✅ `toast.success` |
| `ProductBacklog.tsx` | Update Backlog Item | ✅ `toast.success` |
| `ProductBacklog.tsx` | Delete Backlog Item | ✅ `toast.success` |
| `ProductBacklog.tsx` | Move to Sprint | ✅ `toast.success/error` |
| `TaskList.tsx` | Create Task | ✅ `toast.success/error` |
| `TaskList.tsx` | Update Task | ✅ `toast.success/error` |
| `TaskList.tsx` | Delete Task | ✅ `toast.success/error` |
| `SprintBoard.tsx` | Update Task (drag & drop) | ✅ `toast.success/error` |
| `UserList.tsx` | Update User Role | ✅ `toast.success/error` |
| `UserList.tsx` | Delete User | ✅ `toast.success/error` |
| `ProjectList.tsx` | Create Project | ✅ `toast.success/error` |
| `ProjectList.tsx` | Delete Project | ✅ `toast.success/error` |

### ❌ Belum Ada Toast / Perlu Ditambah

| Halaman / Fitur | Aksi | Masalah |
|---|---|---|
| `ProductBacklog.tsx` | Create Backlog Item | ❌ Tidak ada `onError` handler — jika gagal, user tidak tahu |
| `ProductBacklog.tsx` | Update Backlog Item | ❌ Tidak ada `onError` handler |
| `ProductBacklog.tsx` | Delete Backlog Item | ❌ Tidak ada `onError` handler |
| `ProjectDetail.tsx` | Klik "Start Sprint" | ⚠️ Hanya `toast('... coming soon!')` — fitur belum diimplementasi |
| `AuditLogs.tsx` | Load error | ❌ Tidak ada error state / toast jika gagal load |
| `SprintBoard.tsx` | Update Task Modal submit | ⚠️ Toast sudah ada untuk drag-drop, tapi modal submit juga trigger mutation yang sama — OK |
| `Integrations.tsx` | Semua aksi | ❌ Perlu dicek (belum dilihat) |
| `Login.tsx` / `Register.tsx` | Error login/register | ❌ Perlu dicek apakah ada toast |

---

## 2. Bug: Dashboard "Pending Tasks" Menampilkan Semua Task

### Root Cause

**`Dashboard.tsx` line 25–30:**
```tsx
const { data: tasks } = useQuery({
  queryKey: ['tasks'],
  queryFn: () => getTasks(''),  // ← sprintId kosong = ambil SEMUA task
});

const pendingTasks = tasks?.filter(t => t.status !== 'done').length || 0;
```

`getTasks('')` → backend menerima `sprintId = ''` (empty string) → kondisi `if (sprintId)` pada backend **false** → mengembalikan **semua task** yang ada di semua project yang diikuti user (sudah ada filter by membership di backend, jadi bukan bug keamanan, tapi secara UX tetap misleading karena menghitung total dari semua project).

### Fix yang Diperlukan

Pending Tasks di dashboard seharusnya menampilkan **task yang di-assign ke user yang sedang login** dan belum selesai — bukan total dari semua project.

**Backend sudah mendukung filter by assignee**, kita perlu menambahkan parameter `assigneeId` di query, atau cukup filter di frontend dari data yang sudah ada menggunakan `user.id`.

---

## Proposed Changes

### Fix 1: Dashboard Pending Tasks — Filter by Current User

#### [MODIFY] [Dashboard.tsx](file:///d:/PROJECT/Hosting/Management-Task/frontend/src/pages/Dashboard.tsx)

Ubah logika `pendingTasks` agar hanya menghitung task yang di-assign ke user yang sedang login:

```tsx
// Sebelum:
const pendingTasks = tasks?.filter(t => t.status !== 'done').length || 0;

// Sesudah:
const pendingTasks = tasks?.filter(t => t.status !== 'done' && t.assigneeId === user?.id).length || 0;
```

Tambahkan `useAuth()` hook dan import user.

### Fix 2: Tambah `onError` Toast di ProductBacklog

#### [MODIFY] [ProductBacklog.tsx](file:///d:/PROJECT/Hosting/Management-Task/frontend/src/pages/ProductBacklog.tsx)

Tambahkan `onError` handler di 3 mutation:
- `createBacklogMutation`
- `updateBacklogMutation`  
- `deleteBacklogMutation`

### Fix 3: Cek dan tambah toast di Login/Register/Integrations

#### [MODIFY] [Login.tsx](file:///d:/PROJECT/Hosting/Management-Task/frontend/src/pages/Login.tsx)
#### [MODIFY] [Integrations.tsx](file:///d:/PROJECT/Hosting/Management-Task/frontend/src/pages/Integrations.tsx)

---

## Verification Plan

- Jalankan dev server dan test setiap halaman
- Pastikan Pending Tasks di dashboard hanya hitungan task yang di-assign ke user login
- Pastikan error toast muncul ketika aksi gagal (bisa simulasi dengan mematikan backend)
