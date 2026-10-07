CREATE TABLE `street_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_street_messages_time` ON `street_messages` (`created`);--> statement-breakpoint
CREATE INDEX `idx_street_messages_sender_time` ON `street_messages` (`sender`,`created`);