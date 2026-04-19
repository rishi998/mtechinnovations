# MongoDB Atlas connection: `querySrv ECONNREFUSED`

If you see:

```text
Error: querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net
```

your app is using the **SRV connection string** (`mongodb+srv://...`). The SRV DNS lookup is failing (often due to firewall, corporate network, or DNS blocking).

## Fix: use the standard connection string

1. In **MongoDB Atlas**: go to your cluster → **Connect** → **Connect your application**.
2. Choose **Driver**: Node.js and **Version**: 5.5 or later.
3. Copy the connection string. If it starts with `mongodb+srv://`, switch to the **standard format**:
   - In the same dialog, look for an option like **“I have a connection string but it is in a different format”** or open **“Edit connection string”**.
   - Or go to **Database** → your cluster → **Connect** → **Connect using MongoDB Compass** (or **Drivers**). Sometimes the **Compass** tab shows a host list like `cluster0-shard-00-00.xxxxx.mongodb.net:27017`.
4. Build the **standard** URI (no SRV), for example:

   ```text
   mongodb://USERNAME:PASSWORD@cluster0-shard-00-00.xxxxx.mongodb.net:27017,cluster0-shard-00-01.xxxxx.mongodb.net:27017,cluster0-shard-00-02.xxxxx.mongodb.net:27017/DATABASE?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin
   ```

   Replace:
   - `USERNAME` and `PASSWORD` with your DB user (special characters in password must be [URL-encoded](https://www.w3schools.com/tags/ref_urlencode.asp)).
   - Hostnames and `replicaSet` from the Atlas “Connect” / Compass instructions for your cluster.
   - `DATABASE` with your DB name (e.g. `clientecomm`).

5. Put this string in `.env` as **one line**:

   ```env
   MONGODB_URI=mongodb://USERNAME:PASSWORD@host1:27017,host2:27017,host3:27017/clientecomm?ssl=true&replicaSet=...&authSource=admin
   ```

6. Restart the server (`npm run start:dev`).

## Other checks

- **Network access:** In Atlas → **Network Access** → add your current IP (or `0.0.0.0/0` for testing only).
- **Firewall/VPN:** Try another network or disable VPN to see if SRV starts working; if it does, keep using the standard URI on the restricted network.
- **Password:** If the password has `@`, `#`, `:`, etc., URL-encode them in the URI (e.g. `@` → `%40`).
