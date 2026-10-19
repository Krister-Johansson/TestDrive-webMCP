"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Accessibility, PointerSensor } from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import {
  columnGroupingFeature,
  columnOrderingFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createExpandedRowModel,
  createGroupedRowModel,
  rowExpandingFeature,
  tableFeatures,
  useTable,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type ExpandedState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronRight, Columns3, EllipsisVertical, Rows3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Car } from "@/db/schema";
import { ENUM_LABELS } from "@/lib/car-enums";
import { CAR_GROUP_KEYS, groupQuery, nextSortQuery, type CarGroupKey, type CarSort, type CarSortKey } from "@/lib/car-sort";
import {
  COLUMN_MAX_WIDTH,
  COLUMN_MIN_WIDTH,
  DEFAULT_TABLE_LAYOUT,
  moveColumn,
  placeColumn,
  serializeTableLayout,
  TABLE_LAYOUT_COOKIE,
  type TableLayout,
} from "@/lib/car-table-layout";
import { carName } from "@/lib/format";
import { withQuery } from "@/lib/search-params";
import { cn } from "@/lib/utils";

const RESIZE_STEP = 16;

/**
 * Pointer only: a column drags from anywhere in its header, including the sort link (a click
 * without movement still sorts), but not from the menu button or the resize handle.
 * Keyboard users move columns from the column menu instead.
 */
const SENSORS = [
  PointerSensor.configure({
    preventActivation: (event) => event.target instanceof Element && Boolean(event.target.closest('button, [role="separator"]')),
  }),
];

/**
 * Without the Accessibility plugin: it would turn each header cell into a focusable "draggable"
 * button and hide the columnheader role. The column menu is the accessible way to move columns.
 */
type Plugins = Extract<NonNullable<ComponentProps<typeof DragDropProvider>["plugins"]>, unknown[]>;
const PLUGINS = (defaults: Plugins) =>
  defaults.filter((plugin) => plugin !== Accessibility && !("plugin" in plugin && plugin.plugin === Accessibility));

const features = tableFeatures({
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  columnSizingFeature,
  columnResizingFeature,
  columnOrderingFeature,
  columnVisibilityFeature,
});

const helper = createColumnHelper<typeof features, Car>();

/**
 * Accessors return what the table shows, so grouping labels match the cells. Cells are drawn by `CarCell`.
 * Default widths leave room for the label next to the sort icon and the column menu (about 82 px of chrome).
 */
const columns = helper.columns([
  helper.accessor((car) => car.brand, { id: "brand", header: "Brand", size: 128 }),
  helper.accessor((car) => carName(car), { id: "car", header: "Car", size: 240, enableHiding: false, enableGrouping: false }),
  helper.accessor((car) => car.year, { id: "year", header: "Year", size: 120 }),
  helper.accessor((car) => ENUM_LABELS.bodyType[car.bodyType], { id: "body", header: "Body", size: 128 }),
  helper.accessor((car) => ENUM_LABELS.powertrain[car.powertrain], { id: "powertrain", header: "Powertrain", size: 160 }),
  helper.accessor((car) => ENUM_LABELS.transmission[car.transmission], { id: "gearbox", header: "Gearbox", size: 144 }),
  helper.accessor((car) => car.drivetrain.toUpperCase(), { id: "drive", header: "Drive", size: 120 }),
  helper.accessor((car) => car.seats, { id: "seats", header: "Seats", size: 128 }),
  helper.accessor((car) => (car.towHitch ? "Yes" : "No"), { id: "towHitch", header: "Tow hitch", size: 152 }),
  helper.accessor((car) => car.color, { id: "color", header: "Color", size: 128 }),
  helper.display({ id: "actions", header: "Book", size: 88, enableHiding: false, enableResizing: false, enableGrouping: false }),
]);

const LABELS: Record<string, string> = Object.fromEntries(columns.map((column) => [column.id, String(column.header)]));

function visibilityFrom(hidden: string[]): ColumnVisibilityState {
  return Object.fromEntries(hidden.map((id) => [id, false]));
}

function clampWidth(width: number) {
  return Math.min(COLUMN_MAX_WIDTH, Math.max(COLUMN_MIN_WIDTH, width));
}

export function CarTable({
  cars,
  query = "",
  sort = null,
  currentQuery = "",
  group = null,
  layout = DEFAULT_TABLE_LAYOUT,
}: {
  cars: Car[];
  query?: string;
  sort?: CarSort | null;
  /** The browse page's query string, so sort and group links keep the active filters. */
  currentQuery?: string;
  group?: CarGroupKey | null;
  /** Column order, widths, and hidden columns from the layout cookie. */
  layout?: TableLayout;
}) {
  const [columnOrder, setColumnOrder] = useState<string[]>(layout.order);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(layout.sizing);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(() => visibilityFrom(layout.hidden));
  const [expanded, setExpanded] = useState<ExpandedState>(true);

  const table = useTable({
    features,
    columns,
    data: cars,
    getRowId: (car) => car.id,
    state: { columnOrder, columnSizing, columnVisibility, expanded, grouping: group ? [group] : [] },
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    columnResizeMode: "onChange",
    groupedColumnMode: false,
    autoResetExpanded: false,
  });

  // The layout is a per-viewer preference; the server reads the cookie so the first paint matches.
  useEffect(() => {
    const hidden = Object.keys(columnVisibility).filter((id) => columnVisibility[id] === false);
    const value = serializeTableLayout({ order: columnOrder, sizing: columnSizing, hidden });
    document.cookie = `${TABLE_LAYOUT_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  }, [columnOrder, columnSizing, columnVisibility]);

  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const movable = headers.filter((header) => header.column.id !== "actions").map((header) => header.column.id);
  const rows = table.getRowModel().rows;
  const params = new URLSearchParams(currentQuery);

  function move(id: string, delta: -1 | 1) {
    const hidden = Object.keys(columnVisibility).filter((key) => columnVisibility[key] === false);
    setColumnOrder((order) => moveColumn(order, id, delta, hidden));
  }

  function resize(id: string, width: number) {
    setColumnSizing((sizing) => ({ ...sizing, [id]: clampWidth(width) }));
  }

  function resetLayout() {
    setColumnOrder(DEFAULT_TABLE_LAYOUT.order);
    setColumnSizing(DEFAULT_TABLE_LAYOUT.sizing);
    setColumnVisibility(visibilityFrom(DEFAULT_TABLE_LAYOUT.hidden));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <GroupByMenu params={params} group={group} />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Columns3 aria-hidden="true" />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-44">
            {table.getAllLeafColumns()
              .filter((column) => column.id !== "actions")
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={columnVisibility[column.id] !== false}
                  disabled={!column.getCanHide()}
                  onCheckedChange={(checked) => setColumnVisibility((visibility) => ({ ...visibility, [column.id]: checked }))}
                >
                  {LABELS[column.id]}
                </DropdownMenuCheckboxItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetLayout}>Reset columns</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <DragDropProvider
          sensors={SENSORS}
          plugins={PLUGINS}
          onDragEnd={(event) => {
            const { source } = event.operation;
            if (event.canceled || !isSortable(source) || source.initialIndex === source.index) return;
            const target = movable[source.index];
            const side = source.index > source.initialIndex ? "after" : "before";
            if (target) setColumnOrder((order) => placeColumn(order, String(source.id), target, side));
          }}
        >
          <Table className="table-fixed" style={{ width: table.getTotalSize() }}>
            <TableHeader>
              <TableRow>
                {headers.map((header) => {
                  const id = header.column.id;
                  if (id === "actions") {
                    return (
                      <TableHead key={id} scope="col" data-column-id={id} style={{ width: header.getSize() }}>
                        <span className="sr-only">Book</span>
                      </TableHead>
                    );
                  }
                  const index = movable.indexOf(id);
                  return (
                    <HeaderCell
                      key={id}
                      id={id}
                      index={index}
                      label={LABELS[id]}
                      width={header.getSize()}
                      resizing={header.column.getIsResizing()}
                      onResizeStart={header.getResizeHandler()}
                      sort={sort}
                      params={params}
                      grouped={group === id}
                      canHide={header.column.getCanHide()}
                      canMoveLeft={index > 0}
                      canMoveRight={index < movable.length - 1}
                      onMove={(delta) => move(id, delta)}
                      onResize={(width) => resize(id, width)}
                      onResetSize={() => header.column.resetSize()}
                      onHide={() => setColumnVisibility((visibility) => ({ ...visibility, [id]: false }))}
                    />
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                if (row.getIsGrouped()) {
                  const open = row.getIsExpanded();
                  const count = row.subRows.length;
                  return (
                    <TableRow key={row.id} className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={headers.length} className="py-1.5">
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={row.getToggleExpandedHandler()}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
                        >
                          <ChevronRight aria-hidden="true" className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-90")} />
                          <span className="font-medium">
                            {LABELS[row.groupingColumnId ?? ""]}: {String(row.groupingValue)}
                          </span>
                          <span className="text-muted-foreground">
                            {count} {count === 1 ? "car" : "cars"}
                          </span>
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn("overflow-hidden", cell.column.id === "actions" && "text-right")}
                        style={{ width: cell.column.getSize() }}
                      >
                        <CarCell car={row.original} columnId={cell.column.id} query={query} />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DragDropProvider>
      </div>
    </div>
  );
}

function GroupByMenu({ params, group }: { params: URLSearchParams; group: CarGroupKey | null }) {
  const options: (CarGroupKey | null)[] = [null, ...CAR_GROUP_KEYS];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Rows3 aria-hidden="true" />
        Group by: {group ? LABELS[group] : "None"}
        <ChevronDown aria-hidden="true" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-40">
        {options.map((key) => (
          <DropdownMenuLinkItem
            key={key ?? "none"}
            render={<Link href={withQuery("/", groupQuery(params, key))} scroll={false} replace />}
            closeOnClick
          >
            <Check aria-hidden="true" className={group === key ? undefined : "invisible"} />
            {key ? LABELS[key] : "None"}
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderCell({
  id,
  index,
  label,
  width,
  resizing,
  onResizeStart,
  sort,
  params,
  grouped,
  canHide,
  canMoveLeft,
  canMoveRight,
  onMove,
  onResize,
  onResetSize,
  onHide,
}: {
  id: string;
  index: number;
  label: string;
  width: number;
  resizing: boolean;
  onResizeStart: (event: unknown) => void;
  sort: CarSort | null;
  params: URLSearchParams;
  grouped: boolean;
  canHide: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMove: (delta: -1 | 1) => void;
  onResize: (width: number) => void;
  onResetSize: () => void;
  onHide: () => void;
}) {
  const cellRef = useRef<HTMLTableCellElement>(null);
  // The whole header cell drags with a pointer. Keyboard and single-pointer users move columns from the menu.
  const { isDragging } = useSortable({ id, index, element: cellRef });
  const key = id as CarSortKey;
  const active = sort?.key === key ? sort.order : null;
  const Icon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ArrowUpDown;
  const groupable = (CAR_GROUP_KEYS as readonly string[]).includes(id);
  const sortHref = (order: "asc" | "desc") => {
    const next = new URLSearchParams(params);
    next.set("sort", key);
    next.set("order", order);
    return withQuery("/", next.toString());
  };

  return (
    <TableHead
      ref={cellRef}
      scope="col"
      data-column-id={id}
      aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : undefined}
      style={{ width }}
      className={cn("relative cursor-grab pr-4 pl-3 active:cursor-grabbing", isDragging && "opacity-60")}
    >
      <div className="flex min-w-0 items-center gap-0.5">
        <Link
          href={withQuery("/", nextSortQuery(params, sort, key))}
          scroll={false}
          replace
          draggable={false}
          className="-ml-1 inline-flex h-8 min-w-0 items-center gap-1 rounded-md px-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
        >
          <span className="truncate">{label}</span>
          <Icon aria-hidden="true" className={active ? "size-3.5 shrink-0" : "size-3.5 shrink-0 text-muted-foreground opacity-60"} />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" className="ml-auto size-6 shrink-0" aria-label={`${label} column options`} />}
          >
            <EllipsisVertical aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-44">
            <DropdownMenuLinkItem render={<Link href={sortHref("asc")} scroll={false} replace />} closeOnClick>
              <ArrowUp aria-hidden="true" />
              Sort ascending
            </DropdownMenuLinkItem>
            <DropdownMenuLinkItem render={<Link href={sortHref("desc")} scroll={false} replace />} closeOnClick>
              <ArrowDown aria-hidden="true" />
              Sort descending
            </DropdownMenuLinkItem>
            {groupable ? (
              <DropdownMenuLinkItem
                render={<Link href={withQuery("/", groupQuery(params, grouped ? null : (id as CarGroupKey)))} scroll={false} replace />}
                closeOnClick
              >
                <Rows3 aria-hidden="true" />
                {grouped ? "Stop grouping" : `Group by ${label.toLowerCase()}`}
              </DropdownMenuLinkItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!canMoveLeft} onClick={() => onMove(-1)}>
              Move left
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveRight} onClick={() => onMove(1)}>
              Move right
            </DropdownMenuItem>
            <DropdownMenuItem closeOnClick={false} disabled={width >= COLUMN_MAX_WIDTH} onClick={() => onResize(width + 2 * RESIZE_STEP)}>
              Wider
            </DropdownMenuItem>
            <DropdownMenuItem closeOnClick={false} disabled={width <= COLUMN_MIN_WIDTH} onClick={() => onResize(width - 2 * RESIZE_STEP)}>
              Narrower
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onResetSize}>Reset width</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!canHide} onClick={onHide}>
              Hide column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* 24 px wide and centred on the column edge; the cell padding keeps it clear of the buttons. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${label} column`}
        aria-valuenow={width}
        aria-valuemin={COLUMN_MIN_WIDTH}
        aria-valuemax={COLUMN_MAX_WIDTH}
        tabIndex={0}
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        onDoubleClick={onResetSize}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            onResize(width + (event.key === "ArrowRight" ? RESIZE_STEP : -RESIZE_STEP));
          }
        }}
        className="group/resize absolute top-0 -right-3 z-10 flex h-full w-6 cursor-col-resize touch-none justify-center outline-none select-none"
      >
        <span
          className={cn(
            "h-full w-0.5 bg-transparent transition-colors group-hover/resize:bg-border group-focus-visible/resize:bg-ring motion-reduce:transition-none",
            resizing && "bg-ring",
          )}
        />
      </div>
    </TableHead>
  );
}

function CarCell({ car, columnId, query }: { car: Car; columnId: string; query: string }) {
  switch (columnId) {
    case "brand":
      return car.brand;
    case "car":
      return (
        <>
          <Link href={withQuery(`/book/${car.id}`, query)} scroll={false} className="block truncate font-medium hover:underline">
            {carName(car)}
          </Link>
          <div className="line-clamp-1 text-xs text-muted-foreground">{car.tagline}</div>
        </>
      );
    case "year":
      return car.year;
    case "body":
      return ENUM_LABELS.bodyType[car.bodyType];
    case "powertrain":
      return ENUM_LABELS.powertrain[car.powertrain];
    case "gearbox":
      return ENUM_LABELS.transmission[car.transmission];
    case "drive":
      return car.drivetrain.toUpperCase();
    case "seats":
      return car.seats;
    case "towHitch":
      return car.towHitch ? <Badge variant="outline">Yes</Badge> : <span className="text-muted-foreground">No</span>;
    case "color":
      return (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 shrink-0 rounded-full ring-1 ring-foreground/20" style={{ background: car.colorHex }} />
          {car.color}
        </span>
      );
    case "actions":
      return (
        <Link href={withQuery(`/book/${car.id}`, query)} scroll={false} className={buttonVariants({ size: "sm", variant: "outline" })}>
          Book
        </Link>
      );
    default:
      return null;
  }
}
