CREATE TABLE `game_saves` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`mutation` text NOT NULL,
	`updated` integer NOT NULL
);
