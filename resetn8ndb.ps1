# -----------------------------
# n8n-node dev reset & start
# Works even if path contains '@'
# -----------------------------

# 1️⃣ Set project root safely
$ProjectRoot = (Resolve-Path .).Path  # resolves full path with correct escaping

# 2️⃣ Delete dev SQLite DB if exists
$DevDB = Join-Path $ProjectRoot ".n8n-dev.sqlite"
if (Test-Path $DevDB) {
    Write-Host "Deleting old dev DB..."
    Remove-Item $DevDB -Force
}

# 3️⃣ Set environment variables for n8n dev
$env:N8N_DB_SQLITE_FILE = $DevDB
$env:N8N_BASIC_AUTH_ACTIVE = "true"
$env:N8N_BASIC_AUTH_USER = "admin"
$env:N8N_BASIC_AUTH_PASSWORD = "devpass123"
$env:NODE_PATH = $ProjectRoot

# 4️⃣ Compile TypeScript nodes
Write-Host "Compiling TypeScript nodes..."
if (Test-Path (Join-Path $ProjectRoot "tsconfig.json")) {
    npx tsc
} else {
    Write-Host "No tsconfig.json found — skipping TypeScript compilation"
}

# 5️⃣ Start n8n-node-dev
Write-Host "Starting n8n-node-dev with hot reload..."
npx n8n-node-dev start --dir "$ProjectRoot"
