# Dokumentasi Sistem Project Management

## 1. Struktur Permission (RBAC)

Sistem ini menerapkan Role-Based Access Control (RBAC) yang ketat untuk memastikan keamanan data antar project.

### Level Akses Project
- **Owner (Pembuat Project)**: Memiliki akses penuh (Full Access) ke project, termasuk menambah/menghapus member, membuat sprint, backlog, dan mengelola seluruh task.
- **Member (Undangan)**: Dapat melihat seluruh data project (Sprint, Backlog, Task) dan membuat task baru. Namun, hanya dapat mengedit task yang dibuatnya sendiri atau yang di-assign kepadanya.
- **Admin (System Wide)**: Memiliki akses penuh ke seluruh project dalam sistem.

### Kontrol Kanban (Drag-and-Drop)
Fitur drag-and-drop pada Kanban board di bagian *Active Sprint* kini memiliki validasi permission:
- **Project Owner**: Dapat memindahkan semua task.
- **Assignee**: Hanya dapat memindahkan task yang ditugaskan kepadanya.
- **Admin**: Dapat memindahkan semua task.
- **Member Lain**: Tidak diperbolehkan memindahkan task yang bukan miliknya.

---

## 2. Fitur Baru: Task Detail Modal

Setiap item pada **Backlog**, **Kanban Card**, dan **Task List** kini dapat diklik untuk menampilkan modal detail yang komprehensif.

### Tab Detail
- Menampilkan informasi utama: Judul, Deskripsi, Status, Prioritas, Assignee, dan Deadline.
- Field yang dapat diedit disesuaikan dengan level permission user.

### Tab Comments
- User dapat menambahkan komentar pada setiap task.
- Komentar akan menampilkan nama pengirim dan waktu pengiriman.

### Tab Files (Attachments)
- Mendukung pengelolaan lampiran dokumen untuk setiap task.
- User dapat melihat daftar file dan mendownloadnya.

### Tab History (Activity Log)
- Menampilkan riwayat aktivitas pada task tersebut (Siapa yang melakukan perubahan, kapan, dan apa yang diubah).
- Mengambil data dari Audit Log sistem secara real-time.

---

## 3. Panduan Pengguna

### Mengelola Project
1. Masuk ke **Dashboard** untuk melihat ringkasan project Anda.
2. Klik **New Project** untuk membuat workspace baru.
3. Di dalam project, gunakan tab **Members** untuk mengundang tim melalui email.

### Bekerja dengan Kanban
1. Pastikan ada sprint yang aktif di tab **Active Sprint**.
2. Klik kartu task untuk melihat atau mengedit detail.
3. Gunakan fitur drag-and-drop untuk memperbarui status task (hanya jika Anda adalah owner atau assignee).

### Membuat Laporan
1. Gunakan tab **Reports** untuk membuat laporan harian atau mingguan.
2. Laporan akan tersimpan dan dapat dilihat oleh seluruh member project untuk transparansi tim.
