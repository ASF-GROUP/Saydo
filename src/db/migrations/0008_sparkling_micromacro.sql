CREATE TABLE `ai_memories` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`category` text DEFAULT 'context' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
