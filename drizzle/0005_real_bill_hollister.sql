CREATE TABLE `contentQualityScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentId` int NOT NULL,
	`overallScore` int NOT NULL DEFAULT 0,
	`readabilityScore` int NOT NULL DEFAULT 0,
	`seoScore` int NOT NULL DEFAULT 0,
	`toneScore` int NOT NULL DEFAULT 0,
	`engagementScore` int NOT NULL DEFAULT 0,
	`readabilityDetails` text,
	`seoDetails` text,
	`toneDetails` text,
	`engagementDetails` text,
	`suggestions` text,
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentQualityScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contentQualityScores` ADD CONSTRAINT `contentQualityScores_contentId_content_id_fk` FOREIGN KEY (`contentId`) REFERENCES `content`(`id`) ON DELETE cascade ON UPDATE no action;