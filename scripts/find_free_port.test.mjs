import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import { findFreePort } from "./find_free_port.mjs";

test("findFreePort skips ports already in use and returns the next free port", async () => {
  let attempts = 0;

  const port = await findFreePort({
    startPort: 5177,
    createServer: () => {
      attempts += 1;
      const server = new EventEmitter();
      let boundPort = null;

      server.unref = () => {};
      server.address = () => (boundPort === null ? null : { port: boundPort });
      server.close = (callback) => {
        callback?.();
      };
      server.listen = ({ port: candidatePort }, callback) => {
        if (attempts === 1) {
          queueMicrotask(() => {
            const error = new Error("address in use");
            error.code = "EADDRINUSE";
            server.emit("error", error);
          });
          return;
        }

        boundPort = candidatePort;
        queueMicrotask(callback);
      };

      return server;
    },
  });

  assert.equal(port, 5178);
  assert.equal(attempts, 2);
});

test("findFreePort fails fast on non-recoverable probe errors", async () => {
  await assert.rejects(
    () =>
      findFreePort({
        startPort: 5177,
        createServer: () => {
          const server = new EventEmitter();
          server.unref = () => {};
          server.address = () => null;
          server.close = () => {};
          server.listen = () => {
            queueMicrotask(() => {
              const error = new Error("operation not permitted");
              error.code = "EPERM";
              server.emit("error", error);
            });
          };
          return server;
        },
      }),
    /Unable to probe port 5177 on 127\.0\.0\.1: EPERM/,
  );
});
