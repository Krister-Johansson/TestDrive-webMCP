/**
 * Shared names, descriptions, and parameter descriptions for every agent tool.
 * Both the WebMCP tools (registered in the browser) and the classic MCP server
 * read from this file so an agent sees the same vocabulary either way.
 */
export const TOOL_LIMITS = {
  name: 30,
  description: 500,
  paramDescription: 150,
  output: 1500,
} as const;

export type ToolAnnotations = {
  readOnlyHint: boolean;
  consequentialHint?: boolean;
  untrustedContentHint?: boolean;
};

export type ToolDef = {
  name: string;
  description: string;
  params: Record<string, string>;
  annotations: ToolAnnotations;
};

const COLOR_LIST = "White, Silver, Grey, Black, Blue, Red, Green, Yellow, Orange, or Beige";

const FILTER_PARAMS = {
  brand: "Brand name, matched case-insensitively as a substring.",
  model: "Model name, matched case-insensitively as a substring. Use with brand.",
  bodyType: "Body type: suv, sedan, wagon, hatchback, or coupe.",
  powertrain: "Powertrain: electric, plug-in-hybrid, hybrid, petrol, or diesel.",
  transmission: "Gearbox: manual or automatic.",
  drivetrain: "Driven wheels: fwd, rwd, or awd.",
  color: `Exterior color, one of ${COLOR_LIST}.`,
  minSeats: "Minimum number of seats, inclusive.",
  towHitch: "true to only show cars with a tow hitch, false for cars without one.",
  yearFrom: "Earliest model year, inclusive.",
  yearTo: "Latest model year, inclusive.",
  feature: "A feature keyword such as 'heated seats' or 'panoramic roof'.",
} as const;

const CAR_PARAMS = {
  brand: "Brand name. Created if it does not exist yet.",
  model: "Model name within the brand. Created if it does not exist yet.",
  year: "Model year, for example 2026.",
  bodyType: "Body type: suv, sedan, wagon, hatchback, or coupe.",
  powertrain: "Powertrain: electric, plug-in-hybrid, hybrid, petrol, or diesel.",
  transmission: "Gearbox: manual or automatic.",
  drivetrain: "Driven wheels: fwd, rwd, or awd.",
  color: `Exterior color, one of ${COLOR_LIST}.`,
  seats: "Number of seats.",
  towHitch: "true if the car has a tow hitch.",
  features: "List of feature names.",
  tagline: "One short sentence shown on the card.",
  imageUrls: "Optional list of photo URLs (https), shown in display order.",
} as const;

export const TOOL_DEFS = {
  find_cars: {
    name: "find_cars",
    description:
      "Find cars available for a test drive. Every filter is optional; combine them to narrow the list. Returns each car's id, brand, model, year, body type, powertrain, transmission, drivetrain, color, seats, tow hitch, and features.",
    params: FILTER_PARAMS,
    annotations: { readOnlyHint: true },
  },
  list_available_slots: {
    name: "list_available_slots",
    description:
      "List free 45 minute test drive slots for one car on one day. Pass the car id or its name, and the date. Returns slot ids with start and end times.",
    params: {
      car: "Car id or car name, for example 'Norra Fjell'.",
      date: "Day to check, formatted YYYY-MM-DD.",
    },
    annotations: { readOnlyHint: true },
  },
  get_booking: {
    name: "get_booking",
    description: "Get one test drive booking by its id, including the car, the time, the customer name, and the status.",
    params: { bookingId: "The booking id returned when the booking was made." },
    annotations: { readOnlyHint: true },
  },
  book_test_drive: {
    name: "book_test_drive",
    description:
      "Book a test drive. Confirms a specific slot for a customer and returns the booking id. Use list_available_slots first to find a free slot id. Fails if the slot was taken in the meantime.",
    params: {
      slotId: "Id of a free slot from list_available_slots.",
      customerName: "Full name of the person taking the test drive.",
      customerEmail: "Email address for the confirmation. Optional.",
      note: "Anything the dealership should know. Optional.",
    },
    annotations: { readOnlyHint: false, consequentialHint: true },
  },
  cancel_booking: {
    name: "cancel_booking",
    description: "Cancel an existing test drive booking by id. The slot becomes available again.",
    params: { bookingId: "Id of the booking to cancel." },
    annotations: { readOnlyHint: false, consequentialHint: true },
  },
  list_bookings: {
    name: "list_bookings",
    description:
      "List test drive bookings, newest first, with the car, time, customer name, and status. Optionally filter by status.",
    params: { status: "confirmed or cancelled. Omit for all bookings." },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
  },
  create_car: {
    name: "create_car",
    description: "Add a new car to the fleet so it can be booked for test drives. Returns the new car id.",
    params: CAR_PARAMS,
    annotations: { readOnlyHint: false, consequentialHint: true },
  },
  generate_slots: {
    name: "generate_slots",
    description:
      "Create 45 minute test drive slots for a car on every day in a date range between two hours. Existing slots are kept. Returns how many slots were added.",
    params: {
      car: "Car id or car name.",
      from: "First day, formatted YYYY-MM-DD.",
      to: "Last day, formatted YYYY-MM-DD.",
      startHour: "First slot starts at this hour, 0 to 23.",
      endHour: "No slot ends after this hour, 1 to 24.",
    },
    annotations: { readOnlyHint: false, consequentialHint: true },
  },
  list_brands: {
    name: "list_brands",
    description:
      "List every brand with its models. Use it to learn the exact brand and model names before filtering or creating cars.",
    params: {},
    annotations: { readOnlyHint: true },
  },
  add_model: {
    name: "add_model",
    description: "Add a model to a brand, creating the brand if it is new. Returns the brand and model ids.",
    params: { brand: "Brand name, for example Volvo.", model: "Model name, for example V70." },
    annotations: { readOnlyHint: false, consequentialHint: true },
  },
  filter_cars: {
    name: "filter_cars",
    description:
      "Filter the car list the user is looking at on this page. Applies the filters in the UI so the user sees the same result. Returns how many cars match. Use find_cars to read details.",
    params: FILTER_PARAMS,
    annotations: { readOnlyHint: false },
  },
  select_car: {
    name: "select_car",
    description: "Open the booking page for one car so the user can see its slots. Pass the car id or name.",
    params: { car: "Car id or car name." },
    annotations: { readOnlyHint: false },
  },
  select_slot: {
    name: "select_slot",
    description:
      "Highlight a slot on the booking page and open the confirmation form for it. Does not book. The user or book_test_drive completes the booking.",
    params: { slotId: "Slot id from list_available_slots." },
    annotations: { readOnlyHint: false },
  },
} as const satisfies Record<string, ToolDef>;

export type ToolName = keyof typeof TOOL_DEFS;
