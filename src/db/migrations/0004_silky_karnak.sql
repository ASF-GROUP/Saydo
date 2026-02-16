PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_task_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`priority` integer,
	`tags` text,
	`project_id` text,
	`recurrence` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_task_templates`("id", "name", "title", "description", "priority", "tags", "project_id", "recurrence", "sort_order", "created_at", "updated_at") SELECT "id", "name", "title", "description", "priority", "tags", "project_id", "recurrence", "sort_order", "created_at", "updated_at" FROM `task_templates`;--> statement-breakpoint
DROP TABLE `task_templates`;--> statement-breakpoint
ALTER TABLE `__new_task_templates` RENAME TO `task_templates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `tasks` ADD `remind_at` text;