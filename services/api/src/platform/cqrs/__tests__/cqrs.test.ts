import { describe, expect, it } from "vitest";
import { CQRS_PIPELINE, CommandBus, QueryBus } from "../index.js";

describe("CQRS", () => {
  it("documenta pipeline Command→Query", () => {
    expect(CQRS_PIPELINE[0]).toBe("Command");
    expect(CQRS_PIPELINE.at(-1)).toBe("Query");
  });

  it("despacha command e query", async () => {
    const commands = new CommandBus();
    const queries = new QueryBus();
    commands.register({
      commandType: "Ping",
      async handle(cmd) {
        return { pong: true, payload: cmd.payload };
      },
    });
    queries.register({
      queryType: "GetPing",
      async handle() {
        return { ok: true };
      },
    });
    await expect(commands.dispatch({ type: "Ping", payload: { n: 1 } })).resolves.toEqual({
      pong: true,
      payload: { n: 1 },
    });
    await expect(queries.ask({ type: "GetPing", params: {} })).resolves.toEqual({ ok: true });
  });
});
