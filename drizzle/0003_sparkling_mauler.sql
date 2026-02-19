CREATE TABLE `contentTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('how-to','listicle','case-study','guide','news','custom') NOT NULL,
	`prompt` text NOT NULL,
	`structure` text,
	`createdBy` int NOT NULL,
	`isPublic` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contentTemplates` ADD CONSTRAINT `contentTemplates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;