import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Button } from "./button";

test("renders a button with its label", async () => {
  const screen = await render(<Button>Book now</Button>);
  await expect.element(screen.getByRole("button", { name: "Book now" })).toBeVisible();
});
