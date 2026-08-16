-- CreateTable
CREATE TABLE `route_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `route_id` INTEGER NOT NULL,
    `object_key` VARCHAR(500) NOT NULL,
    `caption` VARCHAR(500) NULL,
    `position` SMALLINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `route_photos_route_id_idx`(`route_id`),
    UNIQUE INDEX `route_photos_object_key_unique`(`object_key`),
    UNIQUE INDEX `route_photos_route_position_unique`(`route_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `route_photos` ADD CONSTRAINT `route_photos_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
