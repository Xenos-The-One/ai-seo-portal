CREATE TABLE `wordpressConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`siteName` varchar(255) NOT NULL,
	`siteUrl` varchar(500) NOT NULL,
	`username` varchar(255) NOT NULL,
	`applicationPassword` text NOT NULL,
	`defaultStatus` enum('draft','publish','pending') NOT NULL DEFAULT 'draft',
	`defaultAuthorId` int,
	`defaultCategoryId` int,
	`isActive` int NOT NULL DEFAULT 1,
	`lastPublishedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wordpressConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wordpressPublishHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`connectionId` int NOT NULL,
	`wordpressPostId` int NOT NULL,
	`wordpressPostUrl` text,
	`publishStatus` enum('draft','publish','pending') NOT NULL,
	`success` int NOT NULL DEFAULT 1,
	`errorMessage` text,
	`publishedBy` int NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wordpressPublishHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `wordpressConnections` ADD CONSTRAINT `wordpressConnections_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wordpressConnections` ADD CONSTRAINT `wordpressConnections_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wordpressPublishHistory` ADD CONSTRAINT `wordpressPublishHistory_contentId_content_id_fk` FOREIGN KEY (`contentId`) REFERENCES `content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wordpressPublishHistory` ADD CONSTRAINT `wordpressPublishHistory_connectionId_wordpressConnections_id_fk` FOREIGN KEY (`connectionId`) REFERENCES `wordpressConnections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wordpressPublishHistory` ADD CONSTRAINT `wordpressPublishHistory_publishedBy_users_id_fk` FOREIGN KEY (`publishedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;