# Panduan Deployment Lengkap (Production Ready)

Panduan ini mencakup langkah-langkah deployment untuk:
1.  **Database**: Neon (PostgreSQL)
2.  **Backend**: Render (NestJS)
3.  **Frontend**: Vercel (React/Vite)

---

## 1. Setup Database (Neon)

1.  Login ke [Neon](https://neon.tech/).
2.  Buat **New Project** dan pilih region terdekat.
3.  Buka **Connection Details** lalu pilih branch, database, dan role yang ingin digunakan.
4.  Salin connection string Postgres.
    *   Format: `postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require`
    *   Untuk traffic serverless atau koneksi yang sering dibuka, gunakan pooled URL dari Neon jika tersedia.
    *   Simpan URL ini sebagai `DATABASE_URL`.

---

## 2. Setup Backend (Render)

1.  Login ke [Render](https://render.com/).
2.  Klik **New +** > **Web Service**.
3.  Hubungkan repository GitHub/GitLab Anda.
4.  Pilih folder `backend` sebagai **Root Directory**.
5.  Konfigurasi:
    *   **Runtime**: Node
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm run db:deploy`
        *   *Catatan: Migration berjalan sebelum server menerima traffic. Seed data opsional dan tidak menggantikan migration.*
6.  Scroll ke bawah ke bagian **Environment Variables**. Tambahkan variabel berikut:
    *   `NODE_ENV`: `production`
    *   `PORT`: `10000`
    *   `DATABASE_URL`: (Tempel URL Neon dari Langkah 1)
    *   `DB_SYNCHRONIZE`: `false` (Production wajib memakai migration, bukan sinkronisasi otomatis)
    *   `DB_SSL`: `true` (Wajib: untuk koneksi aman ke Neon)
    *   `RUN_SEED_ON_BOOT`: `false`
    *   `JWT_SECRET`: (Isi dengan string acak yang panjang dan aman, misal hasil dari `openssl rand -hex 32`)
    *   `FRONTEND_URL`: (Kosongkan dulu, atau isi sementara dengan `http://localhost:5173`. Nanti kita update setelah Frontend di-deploy di Vercel).
7.  Klik **Create Web Service**.
8.  Tunggu hingga deployment sukses. Salin URL backend Anda (misal: `https://backend-task.onrender.com`).

---

## 3. Setup Frontend (Vercel)

1.  Login ke [Vercel](https://vercel.com/).
2.  Klik **Add New...** > **Project**.
3.  Import repository yang sama.
4.  Konfigurasi Project:
    *   **Framework Preset**: Vite
    *   **Root Directory**: Klik **Edit** dan pilih folder `frontend`.
5.  Buka bagian **Environment Variables**. Tambahkan:
    *   `VITE_API_URL`: (Tempel URL Backend dari Render, misal: `https://backend-task.onrender.com`)
6.  Klik **Deploy**.
7.  Setelah sukses, Anda akan mendapatkan domain (misal: `https://task-frontend.vercel.app`).

---

## 4. Langkah Terakhir (Integrasi Final)

Agar Backend aman (CORS) dan hanya menerima request dari Frontend Vercel Anda:

1.  Kembali ke Dashboard **Render** > Pilih Web Service Backend Anda.
2.  Masuk ke menu **Environment**.
3.  Edit variabel `FRONTEND_URL`.
4.  Isi dengan URL Frontend dari Vercel (misal: `https://task-frontend.vercel.app`).
    *   *Penting: Jangan gunakan tanda miring (slash) di akhir URL.*
5.  Simpan perubahan. Render akan otomatis me-restart backend Anda.

---

## 5. Migration dan Seed Neon dari VS Code

Jalankan dari terminal VS Code jika ingin menyiapkan database Neon secara manual:

```powershell
cd D:\PROJECT\Hosting\Management-Task\backend
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
$env:DB_SSL="true"
$env:DB_SYNCHRONIZE="false"
npm run build
npm run migration:run
npm run seed:prod
```

`seed:prod` sudah menjalankan migration terlebih dahulu, sehingga aman jika Render dashboard masih memakai command lama `npm run seed:prod && npm run start:prod`.

---

## Checklist Verifikasi Production

- [ ] **Database**: Tabel `users`, `projects`, `workspaces`, `tasks`, `daily_reports`, `webhooks`, dan tabel pendukung sudah terbuat di Neon melalui migration.
- [ ] **Seed Data**: User admin demo (`admin@example.com`) sudah bisa login.
- [ ] **Security**: Backend menggunakan `https` dan CORS memblokir origin asing.
- [ ] **Frontend**: Tidak ada error dari bundle aplikasi, bisa register/login, workspace tampil, reports analytics tidak 404, dan data tersimpan.
