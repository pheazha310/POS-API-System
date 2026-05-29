import db from "../../../config/database";
import { IUser, IUserPayload } from "../models/auth.model";

class AuthRepository {
  async findByEmail(email: string) {
    const [rows]: any = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    return rows[0];
  }

  async findUserById(id: number): Promise<IUserPayload | null> {
    const [rows]: any = await db.query(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
      `,
      [id]
    );

    return rows[0] ?? null;
  }

  async createUser(user: IUser) {
    const [result]: any = await db.query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
      `,
      [
        user.name,
        user.email,
        user.password,
        user.role,
      ]
    );

    return result;
  }
}

export default new AuthRepository();
