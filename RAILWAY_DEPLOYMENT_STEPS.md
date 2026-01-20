# Deploying AdobeWork to Railway

Your project is a **Monorepo** containing two separate applications:
1. **Frontend**: `adobework` (Next.js)
2. **Backend**: `adobework-backend` (Python FastAPI)

Railway tries to build the "Root" directory by default, which is empty of build scripts, causing the error `Script start.sh not found`.

**You must deploy two separate services and point them to their specific folders.**

---

## 🚀 1. Deploying the Backend (Python)

1.  **Create New Service**:
    - Go to your Railway Dashboard.
    - Click **"New Project"** -> **"Deploy from GitHub repo"**.
    - Select your repository (`adobework`).

2.  **CONFIGURATION (Critical Step)**:
    - Once the project is created, click on the service card.
    - Go to **Settings** tab.
    - Scroll down to **Root Directory**.
    - Enter: `adobework-backend`
    - Click **Save** (This will trigger a re-deploy).

3.  **Environment Variables**:
    - Go to **Variables** tab.
    - Add the following:
      ```env
      PORT=8000
      DEBUG=false
      CORS_ORIGINS=["https://your-frontend-domain.vercel.app","http://localhost:3000"]
      ALLOW_ORIGINS=["*"]
      # Add any other variables from your .env file
      ```

4.  **Get URL**:
    - Go to **Settings** -> **Networking**.
    - Click **Generate Domain**.
    - Copy this URL (e.g., `https://adobework-backend-production.up.railway.app`).

---

## 🎨 2. Deploying the Frontend (Next.js)

*Note: For Next.js, Vercel is recommended, but Railway works too.*

1.  **Create New Service** (in the same project or new one):
    - Click **+ New** -> **GitHub Repo**.
    - Select the same repository (`adobework`).

2.  **CONFIGURATION**:
    - Click on the new service card.
    - Go to **Settings**.
    - Set **Root Directory** to: `adobework`
    - Click **Save**.

3.  **Environment Variables**:
    - Go to **Variables**.
    - Add:
      ```env
      PYTHON_BACKEND_URL=https://your-backend-url-from-step-1.up.railway.app
      ```

4.  **Build Settings** (Usually auto-detected, but just in case):
    - Build Command: `npm run build`
    - Start Command: `npm start`

---

## ✅ Checklist for Success
- [ ] Backend "Root Directory" is set to `adobework-backend`
- [ ] Frontend "Root Directory" is set to `adobework`
- [ ] Backend has a Public Domain generated
- [ ] Frontend has `PYTHON_BACKEND_URL` pointing to Backend's Public Domain
