CREATE TABLE IF NOT EXISTS `app_account_users` (
  `account_uuid` VARCHAR(36) NOT NULL,
  `full_display_name` VARCHAR(255) NOT NULL,
  `account_email` VARCHAR(255) NOT NULL,
  `secure_password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`account_uuid`),
  UNIQUE KEY `uq_app_account_users_email` (`account_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `contact_manager_contacts` (
  `contact_uuid` VARCHAR(36) NOT NULL,
  `account_uuid` VARCHAR(36) NOT NULL,
  `contact_name` VARCHAR(255) NOT NULL,
  `contact_email` VARCHAR(255) NOT NULL DEFAULT '',
  `contact_phone` VARCHAR(50) NOT NULL DEFAULT '',
  `contact_address` VARCHAR(500) NOT NULL DEFAULT '',
  `latitude` DECIMAL(10,7) NOT NULL DEFAULT 0,
  `longitude` DECIMAL(10,7) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP NOT NULL,
  `created_by_name` VARCHAR(255) NOT NULL DEFAULT '',
  `created_by_email` VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`contact_uuid`),
  KEY `ix_contact_account_uuid` (`account_uuid`),
  CONSTRAINT `fk_contact_account` FOREIGN KEY (`account_uuid`)
    REFERENCES `app_account_users` (`account_uuid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
