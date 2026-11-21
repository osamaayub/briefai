ALTER TABLE `briefs` ADD `request_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `briefs_user_request_idx` ON `briefs` (`user_id`,`request_id`);