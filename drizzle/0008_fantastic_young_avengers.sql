CREATE TABLE `street_gestures` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`target` text,
	`kind` text NOT NULL,
	`state` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `street_gestures_created` ON `street_gestures` (`created`);--> statement-breakpoint
CREATE INDEX `street_gestures_actor` ON `street_gestures` (`actor`,`created`);--> statement-breakpoint
ALTER TABLE `street_presence` ADD `joined` integer DEFAULT 0 NOT NULL;