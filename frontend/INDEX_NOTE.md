# Frontend index.html

File `index.html` lengkap (UI Login + Chat) berukuran ~26KB dan sudah ada di:

1. Zip yang sudah didownload: `disapp-frontend.zip` → extract → `index.html`
2. Atau copy dari folder lokal `disapp-frontend/index.html`

Setelah clone repo:

```bash
# Extract zip frontend ke folder frontend/
unzip disapp-frontend.zip -d /tmp/fe
cp /tmp/fe/disapp-frontend/index.html frontend/
cp /tmp/fe/disapp-frontend/js/app.js frontend/js/  # sudah ada di repo
```

Atau download langsung dari artifact project.

Kemudian:
```bash
cd frontend
python3 -m http.server 8080
```
