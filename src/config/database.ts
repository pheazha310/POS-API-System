import mysql from "mysql2/promise";

import { env } from "./env";

const db = mysql.createPool(env.databaseUrl);

export default db;
