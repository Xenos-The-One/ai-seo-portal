CREATE TABLE `publishingSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`publishToWordPress` int NOT NULL DEFAULT 0,
	`wordpressConnectionIds` text,
	`wordpressStatus` enum('draft','publish','pending') DEFAULT 'draft',
	`publishToManus` int NOT NULL DEFAULT 0,
	`manusWebsiteIds` text,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`executedAt` timestamp,
	`errorMessage` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publishingSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `publishingSchedules` ADD CONSTRAINT `publishingSchedules_contentId_content_id_fk` FOREIGN KEY (`contentId`) REFERENCES `content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publishingSchedules` ADD CONSTRAINT `publishingSchedules_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;