export const BODY_TYPES = ["suv", "sedan", "wagon", "hatchback", "coupe"] as const;
export const POWERTRAINS = ["electric", "plug-in-hybrid", "hybrid", "petrol", "diesel"] as const;
export const TRANSMISSIONS = ["manual", "automatic"] as const;
export const DRIVETRAINS = ["fwd", "rwd", "awd"] as const;
export const BOOKING_STATUSES = ["confirmed", "cancelled"] as const;

export type BodyType = (typeof BODY_TYPES)[number];
export type Powertrain = (typeof POWERTRAINS)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type Drivetrain = (typeof DRIVETRAINS)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ENUM_LABELS = {
  bodyType: { suv: "SUV", sedan: "Sedan", wagon: "Wagon", hatchback: "Hatchback", coupe: "Coupe" },
  powertrain: {
    electric: "Electric",
    "plug-in-hybrid": "Plug-in hybrid",
    hybrid: "Hybrid",
    petrol: "Petrol",
    diesel: "Diesel",
  },
  transmission: { manual: "Manual", automatic: "Automatic" },
  drivetrain: { fwd: "Front-wheel drive", rwd: "Rear-wheel drive", awd: "All-wheel drive" },
} as const;

export const SLOT_DURATION_MINUTES = 45;

/** The fixed exterior color list. Cars store the name; the hex drives the swatch. */
export const CAR_COLORS = [
  { name: "White", hex: "#e6ebef" },
  { name: "Silver", hex: "#c0c5cc" },
  { name: "Grey", hex: "#5b6670" },
  { name: "Black", hex: "#15181c" },
  { name: "Blue", hex: "#1f2a44" },
  { name: "Red", hex: "#b3261e" },
  { name: "Green", hex: "#2f4f3a" },
  { name: "Yellow", hex: "#e8b923" },
  { name: "Orange", hex: "#b87333" },
  { name: "Beige", hex: "#d9c8a9" },
] as const;

export const COLOR_NAMES = CAR_COLORS.map((color) => color.name) as unknown as readonly [
  (typeof CAR_COLORS)[number]["name"],
  ...(typeof CAR_COLORS)[number]["name"][],
];
export type CarColor = (typeof CAR_COLORS)[number]["name"];

export function colorHex(name: CarColor): string {
  return (CAR_COLORS.find((color) => color.name === name) ?? CAR_COLORS[2]).hex;
}
