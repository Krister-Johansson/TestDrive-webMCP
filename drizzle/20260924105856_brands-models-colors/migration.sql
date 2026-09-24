CREATE TABLE `brands` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` text PRIMARY KEY,
	`brand_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_models_brand_id_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_name_unique` ON `brands` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `models_brand_name_unique` ON `models` (`brand_id`,`name`);--> statement-breakpoint
INSERT INTO `brands` (`id`, `name`, `created_at`)
SELECT lower(hex(randomblob(5))), `brand`, CAST(strftime('%s', 'now') AS integer) * 1000
FROM (SELECT DISTINCT `brand` FROM `cars`);--> statement-breakpoint
INSERT INTO `models` (`id`, `brand_id`, `name`, `created_at`)
SELECT lower(hex(randomblob(5))), b.`id`, c.`model`, CAST(strftime('%s', 'now') AS integer) * 1000
FROM (SELECT DISTINCT `brand`, `model` FROM `cars`) c
JOIN `brands` b ON b.`name` = c.`brand`;--> statement-breakpoint
CREATE TABLE `__new_cars` (
	`id` text PRIMARY KEY,
	`model_id` text NOT NULL,
	`year` integer NOT NULL,
	`body_type` text NOT NULL,
	`powertrain` text NOT NULL,
	`transmission` text NOT NULL,
	`drivetrain` text NOT NULL,
	`color` text NOT NULL,
	`seats` integer NOT NULL,
	`tow_hitch` integer DEFAULT false NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`tagline` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_cars_model_id_models_id_fk` FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_cars` (`id`, `model_id`, `year`, `body_type`, `powertrain`, `transmission`, `drivetrain`, `color`, `seats`, `tow_hitch`, `features`, `tagline`, `active`, `created_at`)
SELECT
	c.`id`,
	(SELECT m.`id` FROM `models` m JOIN `brands` b ON b.`id` = m.`brand_id` WHERE b.`name` = c.`brand` AND m.`name` = c.`model`),
	c.`year`, c.`body_type`, c.`powertrain`, c.`transmission`, c.`drivetrain`,
	CASE
		WHEN lower(c.`color`) LIKE '%white%' THEN 'White'
		WHEN lower(c.`color`) LIKE '%silver%' THEN 'Silver'
		WHEN lower(c.`color`) LIKE '%black%' THEN 'Black'
		WHEN lower(c.`color`) LIKE '%blue%' THEN 'Blue'
		WHEN lower(c.`color`) IN ('red', 'rosso') OR lower(c.`color`) LIKE '%red' THEN 'Red'
		WHEN lower(c.`color`) LIKE '%green%' THEN 'Green'
		WHEN lower(c.`color`) IN ('yellow', 'giallo') THEN 'Yellow'
		WHEN lower(c.`color`) IN ('orange', 'copper') THEN 'Orange'
		WHEN lower(c.`color`) IN ('beige', 'sand') THEN 'Beige'
		ELSE 'Grey'
	END,
	c.`seats`, c.`tow_hitch`, c.`features`, c.`tagline`, c.`active`, c.`created_at`
FROM `cars` c;--> statement-breakpoint
DROP TABLE `cars`;--> statement-breakpoint
ALTER TABLE `__new_cars` RENAME TO `cars`;
