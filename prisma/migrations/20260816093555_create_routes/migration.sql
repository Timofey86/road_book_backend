-- CreateTable
CREATE TABLE `routes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `description` TEXT NULL,
    `cover_object_key` VARCHAR(500) NULL,
    `total_distance_meters` INTEGER NULL,
    `total_duration_seconds` INTEGER NULL,
    `route_geometry` JSON NULL,
    `route_built_at` DATETIME(3) NULL,
    `is_route_actual` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `routes_user_id_idx`(`user_id`),
    INDEX `routes_created_at_idx`(`created_at`),
    INDEX `routes_distance_idx`(`total_distance_meters`),
    INDEX `routes_user_created_at_idx`(`user_id`, `created_at`),
    UNIQUE INDEX `routes_user_slug_unique`(`user_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `routes` ADD CONSTRAINT `routes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
