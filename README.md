# 🤖 BotTeleGoogleSheet

Integrasi sederhana antara **Telegram Bot** dan **Google Sheets** menggunakan Google Apps Script. Proyek ini memungkinkan Anda untuk menghubungkan bot Telegram dengan spreadsheet Google untuk menerima dan menyimpan data secara otomatis.

---

## 📂 Struktur Proyek

- `code.gs` - Script utama (Google Apps Script) yang menangani logika penerimaan data dari Telegram dan menuliskannya ke Google Sheet.
- `DATA GUDANG.xlsx` - Contoh file Excel yang merepresentasikan struktur data yang digunakan.

---

## 🚀 Fitur

- Terima pesan dari bot Telegram dan simpan ke Google Sheet.
- Otomatisasi pencatatan dan panjualan data gudang .
- Mudah dikonfigurasi dan di-deploy menggunakan Google Apps Script Editor.

---

## 🛠️ Persiapan & Instalasi

### 1. Buat Bot Telegram
- Buka Telegram dan cari `@BotFather`
- Buat bot baru dan simpan token API-nya

### 2. Siapkan Google Sheets & Apps Script
- Buka [Google Drive](https://drive.google.com/)
- Buat file **Google Sheets** baru untuk menyimpan data
- Catat **Spreadsheet ID** dari URL (misalnya, dari: `https://docs.google.com/spreadsheets/d/IDGoogleSheet/edit`)
- Klik menu **Extensions > Apps Script**
- Hapus semua isi script default, lalu **tempel isi dari file `code.gs`**

Selanjutnya, ganti nilai variabel berikut pada bagian atas script:

```javascript
spreadsheetId = 'IDGoogleSheet';    // Ganti dengan ID Google Sheet Anda
botHandle     = '@UsernameBot';     // Ganti dengan username bot Telegram Anda (tanpa spasi)
botToken      = 'BotToken';         // Ganti dengan token bot dari BotFather
appsScriptUrl = 'WebAppUrl';        // Ganti dengan URL Web App setelah proses deploy
```

