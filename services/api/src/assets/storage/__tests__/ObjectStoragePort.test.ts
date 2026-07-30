import { describe, expect, it, afterEach } from "vitest";
import {
  getObjectStorage,
  NoopObjectStorage,
  resetObjectStorage,
  setObjectStorage,
  type ObjectStoragePort,
  type PutObjectInput,
} from "../ObjectStoragePort.js";
import { createObjectStorageFromEnv } from "../R2ObjectStorage.js";

describe("ObjectStoragePort", () => {
  afterEach(() => resetObjectStorage());

  it("usa Noop por padrão, sem rede e sem credencial", async () => {
    const port = getObjectStorage();
    expect(port.id).toBe("noop");
    expect(port.enabled).toBe(false);
    await expect(port.put({ key: "k", body: Buffer.from("x"), contentType: "image/webp" })).resolves
      .toBeUndefined();
    await expect(port.exists("k")).resolves.toBe(false);
  });

  it("permite trocar a porta em teste", async () => {
    const puts: PutObjectInput[] = [];
    const fake: ObjectStoragePort = {
      id: "fake",
      enabled: true,
      async put(i) {
        puts.push(i);
      },
      async exists() {
        return false;
      },
    };
    setObjectStorage(fake);
    await getObjectStorage().put({ key: "a/b", body: Buffer.from("x"), contentType: "image/avif" });
    expect(puts).toHaveLength(1);
    expect(puts[0].key).toBe("a/b");
  });
});

describe("createObjectStorageFromEnv", () => {
  it("cai para Noop quando falta qualquer credencial", () => {
    expect(createObjectStorageFromEnv({} as NodeJS.ProcessEnv)).toBeInstanceOf(NoopObjectStorage);
    expect(
      createObjectStorageFromEnv({
        R2_ACCOUNT_ID: "acc",
        R2_ACCESS_KEY_ID: "key",
        R2_BUCKET: "bucket",
      } as NodeJS.ProcessEnv),
    ).toBeInstanceOf(NoopObjectStorage);
  });

  it("cria R2 quando o conjunto completo está presente", () => {
    const port = createObjectStorageFromEnv({
      R2_ACCOUNT_ID: "acc",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_BUCKET: "bucket",
    } as NodeJS.ProcessEnv);
    expect(port.id).toBe("r2");
    expect(port.enabled).toBe(true);
  });
});
