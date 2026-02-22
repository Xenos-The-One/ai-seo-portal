CREATE TABLE `googleAnalyticsConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`propertyId` varchar(255) NOT NULL,
	`viewId` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiry` timestamp,
	`serviceAccountEmail` varchar(320),
	`serviceAccountKey` text,
	`isActive` int NOT NULL DEFAULT 1,
	`lastSyncedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `googleAnalyticsConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `googleAnalyticsConnections` ADD CONSTRAINT `googleAnalyticsConnections_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `googleAnalyticsConnections` ADD CONSTRAINT `googleAnalyticsConnections_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;