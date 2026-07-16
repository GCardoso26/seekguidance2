import type { TransactionManager } from "../../platform/transaction/types.js";
import type { PasswordHasher } from "../domain/PasswordHasher.js";
import type { RoleAssignmentRepository } from "../domain/RoleAssignmentRepository.js";
import type { SellerProfileRepository } from "../domain/SellerProfileRepository.js";
import type { UserRepository } from "../domain/UserRepository.js";
import { AssignRoleApplicationService } from "./AssignRoleApplicationService.js";
import { AuthorizationService } from "./AuthorizationService.js";
import { CreateSellerProfileApplicationService } from "./CreateSellerProfileApplicationService.js";
import { RegisterUserApplicationService } from "./RegisterUserApplicationService.js";

/** Composition root — wires Identity Application Services over any adapters. */
export function createIdentityApplicationServices(deps: {
  tx: TransactionManager;
  users: UserRepository;
  profiles: SellerProfileRepository;
  roles: RoleAssignmentRepository;
  hasher: PasswordHasher;
}) {
  return {
    registerUser: new RegisterUserApplicationService(deps.tx, deps.users, deps.roles, deps.hasher),
    assignRole: new AssignRoleApplicationService(deps.tx, deps.roles),
    createSellerProfile: new CreateSellerProfileApplicationService(
      deps.tx,
      deps.profiles,
      deps.roles,
    ),
    authorization: new AuthorizationService(deps.tx, deps.roles),
  };
}
