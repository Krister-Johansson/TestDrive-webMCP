import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SlotCalendarView } from "./slot-calendar-view";

const days = [
  { date: "2026-10-01", total: 10, available: 10 },
  { date: "2026-10-02", total: 10, available: 0 },
  { date: "2026-10-05", total: 10, available: 3 },
];

test("enables days with free slots, strikes full days, disables the rest, and reports a pick", async () => {
  const onSelectDay = vi.fn();
  const screen = await render(<SlotCalendarView days={days} selected="2026-10-01" onSelectDay={onSelectDay} />);
  const grid = screen.getByRole("grid");
  await expect.element(grid).toBeVisible();
  await expect.element(grid.getByRole("button", { name: "Thursday, October 1, 2026, selected" })).toBeVisible();
  await expect.element(grid.getByRole("button", { name: "Friday, October 2, 2026, fully booked" })).toBeDisabled();
  await expect.element(grid.getByRole("button", { name: "Saturday, October 3, 2026" })).toBeDisabled();
  await grid.getByRole("button", { name: "Monday, October 5, 2026" }).click();
  expect(onSelectDay).toHaveBeenCalledWith("2026-10-05");
});

test("day buttons carry the visible day number in their names", async () => {
  // WCAG 2.5.3: "October 1st" does not contain the visible "1" as a word, "October 1" does.
  const screen = await render(<SlotCalendarView days={days} selected="2026-10-01" onSelectDay={() => {}} />);
  const buttons = screen.getByRole("grid").getByRole("button").elements();
  expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    const visible = button.textContent?.trim() ?? "";
    expect(button.getAttribute("aria-label")).toMatch(new RegExp(`\\b${visible}\\b`));
  }
});
