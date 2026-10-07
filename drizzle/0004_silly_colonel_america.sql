CREATE TABLE `friendships` (
	`pair` text PRIMARY KEY NOT NULL,
	`low` text NOT NULL,
	`high` text NOT NULL,
	`requested_by` text NOT NULL,
	`status` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_friendships_low` ON `friendships` (`low`);--> statement-breakpoint
CREATE INDEX `idx_friendships_high` ON `friendships` (`high`);--> statement-breakpoint
CREATE TABLE `party_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`party` text NOT NULL,
	`guest` text NOT NULL,
	`created` integer NOT NULL
);
