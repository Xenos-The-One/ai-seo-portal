ALTER TABLE `contentComments` ADD `isResolved` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `contentRevisions` ADD `requestedBy` int;--> statement-breakpoint
ALTER TABLE `contentRevisions` ADD `reason` text;--> statement-breakpoint
ALTER TABLE `contentRevisions` ADD `status` enum('pending','in_progress','completed','rejected');--> statement-breakpoint
ALTER TABLE `contentRevisions` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contentRevisions` ADD CONSTRAINT `contentRevisions_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contentComments` DROP COLUMN `status`;