import dotenv from "dotenv";
import path from "node:path";
import { app } from "electron";

// Em dev: .env na raiz do projeto (process.cwd())
// Em produção: .env ao lado do .exe (extraFiles copia lá)
const envPath = app.isPackaged
  ? path.join(path.dirname(app.getPath("exe")), ".env")
  : path.resolve(process.cwd(), ".env");

dotenv.config({ path: envPath });
