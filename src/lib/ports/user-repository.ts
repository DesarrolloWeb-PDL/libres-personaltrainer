/**
 * User Repository Port — Hexagonal Architecture
 *
 * This port defines the contract for user data access.
 * Infrastructure adapters implement this interface; domain logic depends only on it.
 */

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRepository {
  /** Find a user by ID */
  findById(id: string): Promise<UserRecord | null>;

  /** Find a user by email */
  findByEmail(email: string): Promise<UserRecord | null>;

  /** Create a new user */
  create(data: { email: string; name?: string }): Promise<UserRecord>;
}
