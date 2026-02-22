CREATE TABLE `abTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`topic` text NOT NULL,
	`customPrompt` text,
	`enableWebResearch` int NOT NULL DEFAULT 0,
	`shouldGenerateImage` int NOT NULL DEFAULT 0,
	`modelA` varchar(100) NOT NULL,
	`contentA` text,
	`titleA` text,
	`imageUrlA` text,
	`wordCountA` int DEFAULT 0,
	`generationTimeMsA` int DEFAULT 0,
	`inputTokensA` int DEFAULT 0,
	`outputTokensA` int DEFAULT 0,
	`modelB` varchar(100) NOT NULL,
	`contentB` text,
	`titleB` text,
	`imageUrlB` text,
	`wordCountB` int DEFAULT 0,
	`generationTimeMsB` int DEFAULT 0,
	`inputTokensB` int DEFAULT 0,
	`outputTokensB` int DEFAULT 0,
	`winner` enum('A','B','none') DEFAULT 'none',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `abTests` ADD CONSTRAINT `abTests_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `abTests` ADD CONSTRAINT `abTests_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;