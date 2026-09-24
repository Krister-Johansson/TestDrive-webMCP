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
  await expect.element(grid.getByRole("button", { name: /October 1st, 2026, selected/ })).toBeVisible();
  await expect.element(grid.getByRole("button", { name: /October 2nd, 2026/ })).toBeDisabled();
  await expect.element(grid.getByRole("button", { name: /October 3rd, 2026/ })).toBeDisabled();
  await grid.getByRole("button", { name: /October 5th, 2026/ }).click();
  expect(onSelectDay).toHaveBeenCalledWith("2026-10-05");
});
