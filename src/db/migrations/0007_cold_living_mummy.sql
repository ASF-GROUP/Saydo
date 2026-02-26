CREATE TABLE `task_relations` (
	`task_id` text NOT NULL,
	`related_task_id` text NOT NULL,
	`type` text DEFAULT 'blocks' NOT NULL,
	PRIMARY KEY(`task_id`, `related_task_id`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `actual_minutes` integer;