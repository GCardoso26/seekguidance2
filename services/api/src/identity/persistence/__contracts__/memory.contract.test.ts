import { describe } from "vitest";
import { getIdGenerator } from "../../../shared/ids/IdGenerator.js";
import { InMemoryTransactionManager } from "../../../platform/transaction/InMemoryTransactionManager.js";
import { InMemoryRoleAssignmentRepository } from "../InMemoryRoleAssignmentRepository.js";
import { InMemorySellerProfileRepository } from "../InMemorySellerProfileRepository.js";
import { InMemorySessionRepository } from "../InMemorySessionRepository.js";
import { InMemoryUserRepository } from "../InMemoryUserRepository.js";
import { registerRoleAssignmentRepositoryContract } from "./roleAssignment.contract.js";
import { registerSellerProfileRepositoryContract } from "./sellerProfile.contract.js";
import { registerSessionRepositoryContract } from "./session.contract.js";
import { registerUserRepositoryContract } from "./user.contract.js";
import type { IdentityContractFactory } from "./types.js";

const memoryFactory: IdentityContractFactory = async () => {
  const users = new InMemoryUserRepository();
  const profiles = new InMemorySellerProfileRepository();
  const sessions = new InMemorySessionRepository();
  const roles = new InMemoryRoleAssignmentRepository();
  const tx = new InMemoryTransactionManager([users, profiles, sessions, roles]);
  return {
    label: "InMemory",
    ns: `mem-${getIdGenerator().generate().slice(0, 8)}`,
    tx,
    users,
    profiles,
    sessions,
    roles,
  };
};

describe("Identity persistence contracts [InMemory]", () => {
  registerUserRepositoryContract(memoryFactory);
  registerSellerProfileRepositoryContract(memoryFactory);
  registerSessionRepositoryContract(memoryFactory);
  registerRoleAssignmentRepositoryContract(memoryFactory);
});
