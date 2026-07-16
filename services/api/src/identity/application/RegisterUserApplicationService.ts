import type { TransactionManager } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { PasswordHasher } from "../domain/PasswordHasher.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import type { UserRepository } from "../domain/UserRepository.js";
import type { User } from "../domain/models.js";

export interface RegisterUserInput {
  email: string;
  displayName: string;
  /** Optional in 4.1 — password flows are frozen for later, but supported if given. */
  password?: string;
}

/**
 * Aggregate — User onboarding (identity only, no JWT).
 * New users receive the `buyer` role. Being a seller is granted later via SellerProfile.
 */
export class RegisterUserApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly users: UserRepository,
    private readonly roles: RoleAssignmentRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<RepositoryResult<User>> {
    if (!input.password) throw new Error("password_required");
    const passwordHash = await this.hasher.hash(input.password);
    return this.tx.runInTransaction(async (txCtx) => {
      const existing = await this.users.findByEmail(txCtx, input.email);
      if (existing) throw new Error("email_taken");
      const result = await this.users.upsert(txCtx, {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      });
      await this.roles.assign(txCtx, result.entity.id, "buyer");
      return result;
    });
  }
}
