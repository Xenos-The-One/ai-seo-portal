CREATE TABLE `recurringPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`planName` varchar(255) NOT NULL,
	`frequency` enum('daily','weekly','biweekly','monthly') NOT NULL,
	`postsPerCycle` int NOT NULL DEFAULT 1,
	`topicTemplate` text,
	`customPrompt` text,
	`enableWebResearch` int NOT NULL DEFAULT 1,
	`enableImageGeneration` int NOT NULL DEFAULT 1,
	`isActive` int NOT NULL DEFAULT 1,
	`lastRunDate` timestamp,
	`nextRunDate` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurringPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `recurringPlans` ADD CONSTRAINT `recurringPlans_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recurringPlans` ADD CONSTRAINT `recurringPlans_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;