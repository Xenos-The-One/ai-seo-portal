CREATE TABLE `contentBriefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`title` varchar(500),
	`targetKeywords` text,
	`targetAudience` text,
	`tonePreference` enum('professional','casual','technical','friendly','authoritative','conversational') DEFAULT 'professional',
	`contentType` enum('blog-post','how-to','listicle','case-study','guide','news') DEFAULT 'blog-post',
	`additionalNotes` text,
	`wordCountTarget` int DEFAULT 1500,
	`briefStatus` enum('submitted','in_review','accepted','rejected') NOT NULL DEFAULT 'submitted',
	`submittedBy` varchar(255),
	`submittedEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentBriefs_id` PRIMARY KEY(`id`),
	CONSTRAINT `contentBriefs_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `publishLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`webhookId` int NOT NULL,
	`status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
	`responseCode` int,
	`responseBody` text,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publishLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhookConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`platform` enum('wordpress','ghost','webflow','custom') NOT NULL,
	`endpointUrl` text NOT NULL,
	`apiKey` text,
	`authHeader` text,
	`isActive` int NOT NULL DEFAULT 1,
	`lastPublishedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhookConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contentBriefs` ADD CONSTRAINT `contentBriefs_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publishLogs` ADD CONSTRAINT `publishLogs_contentId_content_id_fk` FOREIGN KEY (`contentId`) REFERENCES `content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publishLogs` ADD CONSTRAINT `publishLogs_webhookId_webhookConfigs_id_fk` FOREIGN KEY (`webhookId`) REFERENCES `webhookConfigs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhookConfigs` ADD CONSTRAINT `webhookConfigs_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhookConfigs` ADD CONSTRAINT `webhookConfigs_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;