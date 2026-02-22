CREATE TABLE `manusPublishHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`websiteId` int NOT NULL,
	`publishedUrl` text,
	`slug` varchar(500),
	`success` int NOT NULL DEFAULT 1,
	`errorMessage` text,
	`publishedBy` int NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `manusPublishHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manusWebsites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`projectId` varchar(255) NOT NULL,
	`versionId` varchar(255),
	`projectName` varchar(255) NOT NULL,
	`projectTitle` varchar(255) NOT NULL,
	`projectDescription` text,
	`previewUrl` text,
	`publishedUrl` text,
	`customDomain` varchar(255),
	`template` varchar(100) DEFAULT 'web-static',
	`features` text,
	`status` enum('creating','active','error','archived') NOT NULL DEFAULT 'creating',
	`lastDeployedAt` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manusWebsites_id` PRIMARY KEY(`id`),
	CONSTRAINT `manusWebsites_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
ALTER TABLE `manusPublishHistory` ADD CONSTRAINT `manusPublishHistory_contentId_content_id_fk` FOREIGN KEY (`contentId`) REFERENCES `content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manusPublishHistory` ADD CONSTRAINT `manusPublishHistory_websiteId_manusWebsites_id_fk` FOREIGN KEY (`websiteId`) REFERENCES `manusWebsites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manusPublishHistory` ADD CONSTRAINT `manusPublishHistory_publishedBy_users_id_fk` FOREIGN KEY (`publishedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manusWebsites` ADD CONSTRAINT `manusWebsites_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manusWebsites` ADD CONSTRAINT `manusWebsites_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;