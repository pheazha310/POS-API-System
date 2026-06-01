import db from "../../../config/database";
import { IUser, IUserPayload } from "../models/auth.model";

class AuthRepository {
  async findByEmail(email: string): Promise<(IUser & { id: number }) | null> {
    const [rows]: any = await db.query(
      "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL",
      [email]
    );
    return rows[0] ?? null;
  }

  async findUserById(id: number): Promise<IUserPayload | null> {
    const [rows]: any = await db.query(
      `SELECT id, name, email, role
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] ?? null;
  }

  async createUser(user: IUser): Promise<number> {
    const [result]: any = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [user.name, user.email, user.password, user.role]
    );
    return result.insertId;
  }
}

export default new AuthRepository();