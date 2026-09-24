CREATE TABLE `car_images` (
	`id` text PRIMARY KEY,
	`car_id` text NOT NULL,
	`url` text NOT NULL,
	`credit` text DEFAULT '' NOT NULL,
	`source_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_car_images_car_id_cars_id_fk` FOREIGN KEY (`car_id`) REFERENCES `cars`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `car_images_car_idx` ON `car_images` (`car_id`,`sort_order`);