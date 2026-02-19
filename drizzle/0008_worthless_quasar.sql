CREATE TABLE `agency_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(128) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agency_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `agency_settings_settingKey_unique` UNIQUE(`settingKey`)
);
