CREATE TABLE `private_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`pair` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_private_messages_pair_time` ON `private_messages` (`pair`,`created`);--> statement-breakpoint
CREATE INDEX `idx_private_messages_sender_time` ON `private_messages` (`sender`,`created`);--> statement-breakpoint
CREATE TABLE `social_blocks` (
	`pair` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`target` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_social_blocks_actor` ON `social_blocks` (`actor`);--> statement-breakpoint
CREATE TABLE `street_presence` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`level` integer NOT NULL,
	`look` text NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`updated` integer NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_street_presence_online` ON `street_presence` (`active`,`updated`);