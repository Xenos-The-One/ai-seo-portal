ALTER TABLE `clients` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `clients` ADD `monthlyBudget` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `clients` ADD `budgetAlertThreshold` int DEFAULT 80;--> statement-breakpoint
ALTER TABLE `content` ADD `wordCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `content` ADD `wasApproved` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `content` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `content` ADD `generationTimeMs` int DEFAULT 0 NOT NULL;