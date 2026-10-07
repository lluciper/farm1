CREATE TABLE `farm_profiles` (
	`code` text PRIMARY KEY NOT NULL,
	`key_hash` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_farm_profiles_key` ON `farm_profiles` (`key_hash`);--> statement-breakpoint
CREATE TABLE `social_ops` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`target` text NOT NULL,
	`nonce` text NOT NULL,
	`day` text NOT NULL,
	`action` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_social_ops_actor_day` ON `social_ops` (`actor`,`day`);