import * as opentelemetry from "@opentelemetry/api"

import { Client } from "./api/client.gen.ts"
import { ConnectOpts } from "./connectOpts.ts"
import { Context, defaultContext } from "./context/context.ts"
import * as telemetry from "./telemetry/telemetry.ts"

export type CallbackFct = (client: Client) => Promise<void>

/**
 * connection executes the given function using the default global Dagger client.
 *
 * @example
 * ```ts
 * await connection(
 *   async () => {
 *     await dag
 *       .container()
 *       .from("alpine")
 *       .withExec(["apk", "add", "curl"])
 *       .withExec(["curl", "https://dagger.io/"])
 *       .sync()
 *   }, { LogOutput: process.stderr }
 * )
 * ```
 */
export async function connection(
  fct: () => Promise<void>,
  cfg: ConnectOpts = {},
) {
  try {
    telemetry.initialize()

    // Wrap connection into the opentelemetry context for propagation
    await opentelemetry.context.with(telemetry.getContext(), async () => {
      try {
        await defaultContext.connection(cfg)
        await fct()
      } finally {
        close()
      }
    })
  } finally {
    await telemetry.close()
  }
}

/**
 * Close global client connection
 */
export function close() {
  defaultContext.close()
}

/**
 * connect runs GraphQL server and initializes a
 * GraphQL client to execute query on it through its callback.
 * This implementation is based on the existing Go SDK.
 */
export async function connect(
  cb: CallbackFct,
  config: ConnectOpts = {},
): Promise<void> {
  const ctx = new Context()
  const client = new Client({ ctx: ctx })

  // Initialize connection
  await ctx.connection(config)

  // Warning shall be throw if versions are not compatible
  try {
    await client.version()
  } catch (e) {
    console.error("failed to check version compatibility:", e)
  }

  await cb(client).finally(() => {
    ctx.close()
  })
}
