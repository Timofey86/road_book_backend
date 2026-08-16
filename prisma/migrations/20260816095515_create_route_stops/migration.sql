-- CreateTable
CREATE TABLE `route_stops` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `route_id` BIGINT NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `address` VARCHAR(500) NULL,
    `city_name` VARCHAR(150) NULL,
    `country_name` VARCHAR(100) NULL,
    `country_code` CHAR(2) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `position` SMALLINT NOT NULL,
    `description` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `route_stops_route_id_idx`(`route_id`),
    INDEX `route_stops_country_code_idx`(`country_code`),
    INDEX `route_stops_city_name_idx`(`city_name`),
    UNIQUE INDEX `route_stops_route_position_unique`(`route_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `route_stops` ADD CONSTRAINT `route_stops_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
