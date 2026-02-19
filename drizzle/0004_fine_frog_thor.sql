CREATE TABLE `contentAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`engagementRate` int NOT NULL DEFAULT 0,
	`avgTimeOnPage` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text NOT NULL,
	`status` enum('pending','resolved') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentRepurposed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`format` enum('social-snippet','email-summary','short-form','infographic-script','video-script') NOT NULL,
	`content` text NOT NULL,
	`platform` varchar(100),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentRepurposed_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentRevisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500),
	`content` text,
	`changeDescription` text,
	`revisionNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentRevisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contentAnalytics` ADD CONSTRAINT `contentAnalytics_contentId_content_id_fk` FOREIGN KEY (`contentId`) REFERENCES `content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentComments` ADD CONSTRAINT `contentComments_contentId_content_id_fk` FOREIGN KEY (`contentId`) REFERENCES `content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentComments` ADD CONSTRAINT `contentComments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentRepurposed` ADD CONSTRAINT `contentRepurposed_contentId_content_id_fk` FOREIGN KEY (`contentId`) REFERENCES `content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentRepurposed` ADD CONSTRAINT `contentRepurposed_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentRevisions` ADD CONSTRAINT `contentRevisions_contentId_content_id_fk` FOREIGN KEY (`contentId`) REFERENCES `content`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentRevisions` ADD CONSTRAINT `contentRevisions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;