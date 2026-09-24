import type { NewCar } from "@/lib/booking-service";

type Spec = Pick<NewCar, "model" | "year" | "bodyType" | "powertrain" | "transmission" | "drivetrain" | "color" | "seats" | "towHitch" | "features" | "tagline">;

const brand = (name: string, specs: Spec[]): NewCar[] => specs.map((spec) => ({ brand: name, ...spec }));

/**
 * The demo fleet: five brands, five current models each. Body type, powertrain, gearbox,
 * driven wheels, and seat count follow the real cars (where a model is sold in several
 * versions, one common version is listed). Year, color, features, tow hitch, and taglines
 * are demo choices. Cars ship without photos and show the generated placeholder.
 */
export const DEMO_CARS: NewCar[] = [
  ...brand("Volvo", [
    { model: "EX30", year: 2026, bodyType: "suv", powertrain: "electric", transmission: "automatic", drivetrain: "rwd", color: "Yellow", seats: 5, towHitch: false, features: ["Google built-in", "Pilot Assist", "Harman Kardon soundbar"], tagline: "The small electric SUV, single motor, rear-wheel drive." },
    { model: "EX90", year: 2026, bodyType: "suv", powertrain: "electric", transmission: "automatic", drivetrain: "awd", color: "Silver", seats: 7, towHitch: true, features: ["seven seats", "lidar", "Bowers & Wilkins audio", "air suspension"], tagline: "Seven seats, twin motor, fully electric." },
    { model: "XC60", year: 2026, bodyType: "suv", powertrain: "plug-in-hybrid", transmission: "automatic", drivetrain: "awd", color: "Grey", seats: 5, towHitch: true, features: ["Pilot Assist", "panoramic roof", "heated seats"], tagline: "The mid-size SUV as a T8 plug-in hybrid." },
    { model: "XC90", year: 2025, bodyType: "suv", powertrain: "plug-in-hybrid", transmission: "automatic", drivetrain: "awd", color: "Blue", seats: 7, towHitch: true, features: ["seven seats", "air suspension", "Bowers & Wilkins audio", "360 camera"], tagline: "The large SUV with three rows and a plug." },
    { model: "V60", year: 2025, bodyType: "wagon", powertrain: "plug-in-hybrid", transmission: "automatic", drivetrain: "awd", color: "Red", seats: 5, towHitch: true, features: ["Pilot Assist", "roof rails", "heated seats"], tagline: "The estate as a T6 plug-in hybrid with all-wheel drive." },
  ]),
  ...brand("Polestar", [
    { model: "2", year: 2025, bodyType: "sedan", powertrain: "electric", transmission: "automatic", drivetrain: "rwd", color: "White", seats: 5, towHitch: true, features: ["Google built-in", "Pilot Assist", "Harman Kardon audio"], tagline: "The fastback, single motor, rear-wheel drive since the 2024 update." },
    { model: "3", year: 2025, bodyType: "suv", powertrain: "electric", transmission: "automatic", drivetrain: "awd", color: "Black", seats: 5, towHitch: true, features: ["dual motor", "air suspension", "Bowers & Wilkins audio"], tagline: "The electric performance SUV." },
    { model: "4", year: 2025, bodyType: "suv", powertrain: "electric", transmission: "automatic", drivetrain: "awd", color: "Grey", seats: 5, towHitch: true, features: ["no rear window", "digital rear-view mirror", "panoramic roof"], tagline: "The SUV coupe that replaced the rear window with a camera." },
    { model: "5", year: 2026, bodyType: "sedan", powertrain: "electric", transmission: "automatic", drivetrain: "awd", color: "Blue", seats: 4, towHitch: false, features: ["dual motor", "800-volt charging", "bonded aluminium body"], tagline: "The four-seat electric grand tourer." },
    { model: "1", year: 2021, bodyType: "coupe", powertrain: "plug-in-hybrid", transmission: "automatic", drivetrain: "awd", color: "Beige", seats: 4, towHitch: false, features: ["carbon fibre body", "limited production", "Öhlins dampers"], tagline: "The limited-run plug-in hybrid coupe, built 2019 to 2021." },
  ]),
  ...brand("BMW", [
    { model: "i4", year: 2025, bodyType: "sedan", powertrain: "electric", transmission: "automatic", drivetrain: "rwd", color: "Blue", seats: 5, towHitch: true, features: ["curved display", "Harman Kardon audio", "adaptive cruise"], tagline: "The electric Gran Coupé as the eDrive40, rear-wheel drive." },
    { model: "iX", year: 2025, bodyType: "suv", powertrain: "electric", transmission: "automatic", drivetrain: "awd", color: "Grey", seats: 5, towHitch: true, features: ["dual motor", "air suspension", "panoramic roof"], tagline: "The electric SUV with xDrive on every version." },
    { model: "X5", year: 2025, bodyType: "suv", powertrain: "plug-in-hybrid", transmission: "automatic", drivetrain: "awd", color: "Black", seats: 5, towHitch: true, features: ["xDrive", "air suspension", "heated seats"], tagline: "The X5 as the xDrive50e plug-in hybrid." },
    { model: "330e Touring", year: 2025, bodyType: "wagon", powertrain: "plug-in-hybrid", transmission: "automatic", drivetrain: "rwd", color: "White", seats: 5, towHitch: true, features: ["roof rails", "adaptive cruise", "heated seats"], tagline: "The 3 Series estate with a plug, rear-wheel drive." },
    { model: "M2", year: 2025, bodyType: "coupe", powertrain: "petrol", transmission: "manual", drivetrain: "rwd", color: "Red", seats: 4, towHitch: false, features: ["six-speed manual", "straight-six turbo", "sport seats"], tagline: "The compact M coupe, still available with a manual gearbox." },
  ]),
  ...brand("Audi", [
    { model: "Q4 e-tron", year: 2025, bodyType: "suv", powertrain: "electric", transmission: "automatic", drivetrain: "rwd", color: "Silver", seats: 5, towHitch: true, features: ["virtual cockpit", "heated seats", "adaptive cruise"], tagline: "The compact electric SUV, rear-wheel drive on the base versions." },
    { model: "Q5 TFSI e", year: 2026, bodyType: "suv", powertrain: "plug-in-hybrid", transmission: "automatic", drivetrain: "awd", color: "Green", seats: 5, towHitch: true, features: ["quattro", "virtual cockpit", "panoramic roof"], tagline: "The mid-size SUV as a quattro plug-in hybrid." },
    { model: "A6 Avant", year: 2025, bodyType: "wagon", powertrain: "diesel", transmission: "automatic", drivetrain: "fwd", color: "Black", seats: 5, towHitch: true, features: ["roof rails", "virtual cockpit", "adaptive cruise"], tagline: "The estate as the 40 TDI, front-wheel drive." },
    { model: "e-tron GT", year: 2025, bodyType: "sedan", powertrain: "electric", transmission: "automatic", drivetrain: "awd", color: "Grey", seats: 4, towHitch: false, features: ["dual motor", "800-volt charging", "air suspension"], tagline: "The four-seat electric grand tourer, quattro on every version." },
    { model: "A3 Sportback", year: 2025, bodyType: "hatchback", powertrain: "petrol", transmission: "manual", drivetrain: "fwd", color: "Blue", seats: 5, towHitch: false, features: ["six-speed manual", "virtual cockpit", "heated seats"], tagline: "The five-door hatchback as the 35 TFSI with a manual gearbox." },
  ]),
  ...brand("Toyota", [
    { model: "Corolla Touring Sports", year: 2025, bodyType: "wagon", powertrain: "hybrid", transmission: "automatic", drivetrain: "fwd", color: "White", seats: 5, towHitch: true, features: ["Toyota Safety Sense", "roof rails", "heated seats"], tagline: "The estate as a self-charging hybrid." },
    { model: "RAV4", year: 2025, bodyType: "suv", powertrain: "plug-in-hybrid", transmission: "automatic", drivetrain: "awd", color: "Red", seats: 5, towHitch: true, features: ["Toyota Safety Sense", "AWD-i", "panoramic roof"], tagline: "The SUV as the plug-in hybrid with electric all-wheel drive." },
    { model: "bZ4X", year: 2025, bodyType: "suv", powertrain: "electric", transmission: "automatic", drivetrain: "fwd", color: "Grey", seats: 5, towHitch: true, features: ["Toyota Safety Sense", "panoramic roof", "heated seats"], tagline: "The electric SUV, front-wheel drive on the single-motor version." },
    { model: "GR86", year: 2025, bodyType: "coupe", powertrain: "petrol", transmission: "manual", drivetrain: "rwd", color: "Yellow", seats: 4, towHitch: false, features: ["six-speed manual", "flat-four engine", "sport seats"], tagline: "The rear-wheel-drive sports coupe with a manual gearbox." },
    { model: "Yaris", year: 2025, bodyType: "hatchback", powertrain: "hybrid", transmission: "automatic", drivetrain: "fwd", color: "Beige", seats: 5, towHitch: false, features: ["Toyota Safety Sense", "wireless charging", "heated seats"], tagline: "The small hatchback as a self-charging hybrid." },
  ]),
];
