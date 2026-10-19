import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { CopyButton } from "./copy-button";

test("its name matches the visible label and a status region announces the copy", async () => {
  vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  const screen = await render(<CopyButton text="claude mcp add" />);
  const button = screen.getByRole("button", { name: "Copy" });
  await expect.element(screen.getByRole("status")).toHaveTextContent("");
  await button.click();
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith("claude mcp add");
  await expect.element(screen.getByRole("status")).toHaveTextContent("Copied to clipboard");
  await expect.element(screen.getByRole("button", { name: "Copied" })).toBeVisible();
});
