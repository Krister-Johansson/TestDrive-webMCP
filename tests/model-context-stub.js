// A stand-in for Chrome's document.modelContext used by browser tests and Playwright.
// It records registrations, honours abort signals, and can execute a tool by name.
(function installModelContextStub() {
  if (typeof document === "undefined") return;
  const tools = new Map();
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener(new Event("toolchange")));
  const context = {
    __stub: true,
    registerTool(tool, options) {
      tools.set(tool.name, tool);
      notify();
      const signal = options && options.signal;
      if (signal) {
        signal.addEventListener("abort", () => {
          if (tools.get(tool.name) === tool) {
            tools.delete(tool.name);
            notify();
          }
        });
      }
    },
    getTools() {
      return [...tools.values()];
    },
    async executeTool(name, args) {
      const tool = tools.get(name);
      if (!tool) throw new Error(`No tool named ${name}`);
      return tool.execute(args || {}, { signal: new AbortController().signal });
    },
    addEventListener(type, listener) {
      if (type === "toolchange") listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === "toolchange") listeners.delete(listener);
    },
  };
  Object.defineProperty(document, "modelContext", { value: context, configurable: true, writable: true });
  window.__modelContextStub = context;
})();
