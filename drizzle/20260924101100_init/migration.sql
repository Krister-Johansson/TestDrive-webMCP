CREATE TABLE `bookings` (
	`id` text PRIMARY KEY,
	`slot_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text,
	`note` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_bookings_slot_id_slots_id_fk` FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `cars` (
	`id` text PRIMARY KEY,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`body_type` text NOT NULL,
	`powertrain` text NOT NULL,
	`transmission` text NOT NULL,
	`drivetrain` text NOT NULL,
	`color` text NOT NULL,
	`color_hex` text NOT NULL,
	`seats` integer NOT NULL,
	`tow_hitch` integer DEFAULT false NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`tagline` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` text PRIMARY KEY,
	`car_id` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_slots_car_id_cars_id_fk` FOREIGN KEY (`car_id`) REFERENCES `cars`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_confirmed_slot_unique` ON `bookings` (`slot_id`) WHERE status = 'confirmed';--> statement-breakpoint
CREATE INDEX `bookings_created_at_idx` ON `bookings` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `slots_car_start_unique` ON `slots` (`car_id`,`starts_at`);--> statement-breakpoint
CREATE INDEX `slots_starts_at_idx` ON `slots` (`starts_at`);