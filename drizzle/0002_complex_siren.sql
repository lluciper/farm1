CREATE TABLE `card_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`mutation` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `room_members` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_room_members_code` ON `room_members` (`code`);