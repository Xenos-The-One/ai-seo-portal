CREATE TABLE `clientPortalUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` text NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('client_admin','client_viewer') NOT NULL DEFAULT 'client_viewer',
	`isActive` int NOT NULL DEFAULT 1,
	`invitationToken` varchar(255),
	`invitationExpiry` timestamp,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientPortalUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientPortalUsers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `portalBranding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(7) DEFAULT '#3b82f6',
	`secondaryColor` varchar(7) DEFAULT '#1e40af',
	`customDomain` varchar(255),
	`portalName` varchar(255),
	`welcomeMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portalBranding_id` PRIMARY KEY(`id`),
	CONSTRAINT `portalBranding_clientId_unique` UNIQUE(`clientId`)
);
--> statement-breakpoint
ALTER TABLE `clientPortalUsers` ADD CONSTRAINT `clientPortalUsers_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portalBranding` ADD CONSTRAINT `portalBranding_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;