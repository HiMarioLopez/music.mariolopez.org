import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach } from "bun:test";

GlobalRegistrator.register();

afterEach(async () => {
  const { cleanup } = await import("@testing-library/react");
  cleanup();
});
