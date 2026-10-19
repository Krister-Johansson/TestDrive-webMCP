import { beforeEach, describe, expect, it } from "vitest";
import { clearActivity, finishCall, getActivity, startCall, summarizeArgs } from "./activity-store";

beforeEach(() => {
  clearActivity();
});

describe("agent activity store", () => {
  it("records a call as running and then done with the first line of the result", () => {
    const id = startCall("find_cars", { powertrain: "electric" });
    expect(getActivity()[0]).toMatchObject({ id, tool: "find_cars", status: "running", args: "powertrain: electric" });

    finishCall(id, { ok: true, text: "3 cars:\n- id a: ...\n- id b: ..." });
    expect(getActivity()[0]).toMatchObject({ status: "done", summary: "3 cars:" });
  });

  it("marks failures as errors", () => {
    const id = startCall("select_slot", { slotId: "nope" });
    finishCall(id, { ok: false, text: "No slot with id nope." });
    expect(getActivity()[0]).toMatchObject({ status: "error", summary: "No slot with id nope." });
  });

  it("keeps the newest calls first and drops the oldest past the limit", () => {
    for (let i = 0; i < 10; i++) startCall(`tool_${i}`, {});
    const tools = getActivity().map((entry) => entry.tool);
    expect(tools).toHaveLength(6);
    expect(tools[0]).toBe("tool_9");
    expect(tools.at(-1)).toBe("tool_4");
  });

  it("summarizes arguments as short key and value pairs", () => {
    expect(summarizeArgs({})).toBe("");
    expect(summarizeArgs({ car: "Norra Vik", towHitch: true, skip: undefined })).toBe("car: Norra Vik, towHitch: true");
    expect(summarizeArgs({ features: ["heated seats", "panoramic roof"] })).toBe("features: heated seats, panoramic roof");
    expect(summarizeArgs({ note: "x".repeat(200) }).length).toBeLessThanOrEqual(80);
  });
});
