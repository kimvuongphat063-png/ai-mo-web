import "server-only";
import { hash, verify, type Algorithm, type Options } from "@node-rs/argon2";

/** Argon2id — the algorithm discriminant in the ambient `Algorithm` enum. */
const ARGON2ID = 2 as Algorithm;

const ARGON2_OPTIONS: Options = {
  algorithm: ARGON2ID,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash_: string, password: string): Promise<boolean> {
  return verify(hash_, password);
}
