CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`browser` text NOT NULL,
	`started` integer NOT NULL,
	`day` text NOT NULL,
	`played` integer DEFAULT 0 NOT NULL,
	`last_active` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_visits_day` ON `visits` (`day`);--> statement-breakpoint
CREATE INDEX `idx_visits_browser` ON `visits` (`browser`);--> statement-breakpoint
CREATE INDEX `idx_visits_active` ON `visits` (`played`,`last_active`);