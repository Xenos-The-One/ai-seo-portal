ALTER TABLE `content` ADD `scheduledPublishDate` timestamp;--> statement-breakpoint
ALTER TABLE `content` ADD `isScheduled` int DEFAULT 0 NOT NULL;