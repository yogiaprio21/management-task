# Panduan Deployment Lengkap (Production Ready)

Panduan ini mencakup langkah-langkah deployment untuk:
1.  **Database**: Supabase (PostgreSQL)
2.  **Backend**: Render (NestJS)
3.  **Frontend**: Vercel (React/Vite)

---

## 1. Setup Database (Supabase)

1.  Login ke [Supabase](https://supabase.com/).
2.  Buat **New Project**.
3.  Isi nama project dan password database (SIMPAN PASSWORD INI).
4.  Pilih region terdekat (misal: Singapore).
5.  Setelah project aktif, masuk ke **Project Settings** > **Database** > **Connection string**.
6.  Pilih tab **URI** dan salin connection string-nya.
    *   Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
    *   Ganti `[PASSWORD]` dengan password yang Anda buat di langkah 3.
    *   **Simpan URL ini untuk langkah selanjutnya.**

---

## 2. Setup Backend (Render)

1.  Login ke [Render](https://render.com/).
2.  Klik **New +** > **Web Service**.
3.  Hubungkan repository GitHub/GitLab Anda.
4.  Pilih folder `backend` sebagai **Root Directory**.
5.  Konfigurasi:
    *   **Runtime**: Node
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm run start:prod`
        *   *Catatan: Seed data akan berjalan otomatis di background setelah server menyala.*
6.  Scroll ke bawah ke bagian **Environment Variables**. Tambahkan variabel berikut:
    *   `NODE_ENV`: `production`
    *   `PORT`: `10000`
    *   `DATABASE_URL`: (Tempel URL Supabase dari Langkah 1)
    *   `DB_SYNCHRONIZE`: `true` (Wajib: untuk membuat tabel otomatis)
    *   `DB_SSL`: `true` (Wajib: untuk koneksi aman ke Supabase)
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

## Checklist Verifikasi Production

- [ ] **Database**: Tabel `user`, `task`, dll sudah terbuat di Supabase (otomatis via TypeORM saat backend start).
- [ ] **Seed Data**: User admin demo (`admin@example.com`) sudah bisa login.
- [ ] **Security**: Backend menggunakan `https` dan CORS memblokir origin asing.
- [ ] **Frontend**: Tidak ada error di console browser, bisa register/login, dan data tersimpan.
