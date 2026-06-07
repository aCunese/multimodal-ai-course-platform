import net from "node:net";
import process from "node:process";
import { pathToFileURL } from "node:url";

export async function findFreePort({
  startPort,
  host = "127.0.0.1",
  maxPort = 65535,
  createServer = () => net.createServer(),
}) {
  if (!Number.isInteger(startPort) || startPort < 0 || startPort > maxPort) {
    throw new RangeError(
      `startPort must be an integer between 0 and ${maxPort}. Received: ${startPort}`,
    );
  }

  for (let port = startPort; port <= maxPort; port += 1) {
    try {
      return await listenOnPort({ port, host, createServer });
    } catch (error) {
      if (error?.code === "EADDRINUSE") {
        continue;
      }

      throw new Error(
        `Unable to probe port ${port} on ${host}: ${error?.code ?? error?.message ?? "unknown error"}`,
      );
    }
  }

  throw new Error(`No free port available between ${startPort} and ${maxPort}.`);
}

function listenOnPort({ port, host, createServer }) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    const cleanup = () => {
      if (typeof server.removeAllListeners === "function") {
        server.removeAllListeners("error");
      }
    };
    const rejectWith = (error) => {
      cleanup();
      try {
        if (typeof server.close === "function") {
          server.close();
        }
      } catch {
        // Best-effort cleanup; preserve the original probing error.
      }
      reject(error);
    };

    if (typeof server.unref === "function") {
      server.unref();
    }

    server.once("error", rejectWith);
    server.listen({ host, port }, () => {
      const address = server.address();
      const resolvedPort =
        typeof address === "object" && address !== null && "port" in address ? address.port : port;

      cleanup();
      server.close(() => resolve(resolvedPort));
    });
  });
}

async function main() {
  const startPort = Number(process.argv[2]);
  const port = await findFreePort({ startPort });
  process.stdout.write(`${port}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
