CREATE TABLE `designStandards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`designPrompt` text NOT NULL,
	`referenceUrl` text,
	`colorScheme` varchar(100),
	`designStyle` varchar(100),
	`isDefault` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designStandards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `designStandards` ADD CONSTRAINT `designStandards_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;