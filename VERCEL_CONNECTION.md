# Connecting Vercel Frontend to Railway Backend

Since your Backend is running on Railway, you need to tell your **Vercel Frontend** where to find it.

## 1. Copy Backend URL
1.  Go to **Railway Dashboard**.
2.  Click on the **Backend Service** (`adobework-backend` / `courageous-trust`).
3.  Go to **Settings** -> **Networking**.
4.  Copy the **Public Domain** (e.g., `https://adobework-backend-production.up.railway.app`).

## 2. Deploy to Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Select your GitHub Repository (`adobework`).
4.  **Important:** Configure **Environment Variables** before deploying:

    | Name | Value |
    | :--- | :--- |
    | `PYTHON_BACKEND_URL` | Paste your Railway URL here |

5.  Click **Deploy**.

## 3. Verification
- Once Vercel finishes, open your new website.
- Upload a file (e.g., PDF to Word).
- If it works, the connection is successful!

> **Note:** Your Backend code already allows connections from `*.vercel.app`, so no extra CORS configuration is needed.
