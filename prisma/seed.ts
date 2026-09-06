import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient, PreferredLanguage } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';

const adapter = new PrismaMariaDb({
    host: process.env.MYSQL_HOST ?? 'mysql',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

const s3Bucket = process.env.S3_BUCKET ?? 'road-book-local';

const s3 = new S3Client({
    region: process.env.S3_REGION ?? 'eu-central-1',

    ...(process.env.S3_ENDPOINT
        ? { endpoint: process.env.S3_ENDPOINT }
        : {}),

    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',

    ...(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
        ? {
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY,
            },
        }
        : {}),
});

const seedAssetsPath = join(
    process.cwd(),
    'prisma',
    'seed-assets',
);

async function uploadSeedImage(
    filePath: string,
    objectKey: string,
): Promise<string> {
    const body = await readFile(filePath);

    await s3.send(
        new PutObjectCommand({
            Bucket: s3Bucket,
            Key: objectKey,
            Body: body,
            ContentType: 'image/jpeg',
        }),
    );

    return objectKey;
}

async function main(): Promise<void> {
    if (
        process.env.NODE_ENV === 'production' &&
        process.env.ALLOW_PRODUCTION_SEED !== 'true'
    ) {
        throw new Error(
            'Production seed is disabled. Set ALLOW_PRODUCTION_SEED=true explicitly.',
        );
    }

    console.log('🌱 Starting database seed...');

    const seedPassword = process.env.SEED_USER_PASSWORD;

    if (!seedPassword) {
        throw new Error('SEED_USER_PASSWORD is not set');
    }

    const passwordHash = await bcrypt.hash(seedPassword, 10);

    console.log('🧹 Cleaning database...')

    await prisma.favorite.deleteMany();
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.routeTag.deleteMany();
    await prisma.routePhoto.deleteMany();
    await prisma.routeStop.deleteMany();
    await prisma.route.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    console.log('👤 Creating users...');

    const timofey = await prisma.user.create({
        data: {
            name: 'Timofey',
            email: 'timofey@roadbook.dev',
            passwordHash,
            bio: 'Road trip enthusiast. I like discovering new cities and scenic routes.',
            preferredLanguage: PreferredLanguage.en,
        },
    });

    const anna = await prisma.user.create({
        data: {
            name: 'Anna',
            email: 'anna@roadbook.dev',
            passwordHash,
            bio: 'Weekend traveler who loves cities, lakes and cozy road trips.',
            preferredLanguage: PreferredLanguage.en,
        },
    });

    const michael = await prisma.user.create({
        data: {
            name: 'Michael',
            email: 'michael@roadbook.dev',
            passwordHash,
            bio: 'Mountains, nature and long drives are my favorite way to travel.',
            preferredLanguage: PreferredLanguage.en,
        },
    });

    console.log('🖼️ Uploading user avatars...');

    const timofeyAvatarKey = await uploadSeedImage(
        join(seedAssetsPath, 'avatars', 'timofey.jpg'),
        'avatars/seed/timofey.jpg',
    );

    const annaAvatarKey = await uploadSeedImage(
        join(seedAssetsPath, 'avatars', 'anna.jpg'),
        'avatars/seed/anna.jpg',
    );

    const michaelAvatarKey = await uploadSeedImage(
        join(seedAssetsPath, 'avatars', 'michael.jpg'),
        'avatars/seed/michael.jpg',
    );

    await prisma.user.update({
        where: { id: timofey.id },
        data: {
            avatarObjectKey: timofeyAvatarKey,
        },
    });

    await prisma.user.update({
        where: { id: anna.id },
        data: {
            avatarObjectKey: annaAvatarKey,
        },
    });

    await prisma.user.update({
        where: { id: michael.id },
        data: {
            avatarObjectKey: michaelAvatarKey,
        },
    });

    console.log('🏷️ Creating tags...');

    await prisma.tag.createMany({
        data: [
            { name: 'Germany', slug: 'germany' },
            { name: 'Weekend', slug: 'weekend' },
            { name: 'Nature', slug: 'nature' },
            { name: 'City', slug: 'city' },
            { name: 'Mountains', slug: 'mountains' },
            { name: 'Sea', slug: 'sea' },
            { name: 'Family', slug: 'family' },
            { name: 'Road Trip', slug: 'road-trip' },
        ],
    });

    const tags = await prisma.tag.findMany();

    const tagBySlug = Object.fromEntries(
        tags.map((tag) => [tag.slug, tag]),
    );

    console.log('🛣️ Creating routes...');

    const wuppertalBonn = await prisma.route.create({
        data: {
            userId: timofey.id,
            title: 'Wuppertal to Bonn via Cologne',
            slug: 'wuppertal-to-bonn-via-cologne',
            description:
                'A relaxed weekend trip through three cities in North Rhine-Westphalia.',
            stops: {
                create: [
                    {
                        name: 'Wuppertal',
                        address: 'Wuppertal, Germany',
                        cityName: 'Wuppertal',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 51.2562,
                        longitude: 7.1508,
                        position: 1,
                        description: 'Starting point of the trip.',
                    },
                    {
                        name: 'Cologne',
                        address: 'Köln, Germany',
                        cityName: 'Köln',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 50.9375,
                        longitude: 6.9603,
                        position: 2,
                        description: 'Stop near Cologne Cathedral and the Rhine.',
                    },
                    {
                        name: 'Bonn',
                        address: 'Bonn, Germany',
                        cityName: 'Bonn',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 50.7374,
                        longitude: 7.0982,
                        position: 3,
                        description: 'Final stop in Bonn.',
                    },
                ],
            },
            routeTags: {
                create: [
                    { tagId: tagBySlug['germany'].id },
                    { tagId: tagBySlug['weekend'].id },
                    { tagId: tagBySlug['city'].id },
                ],
            },
        },
    });

    const bavaria = await prisma.route.create({
        data: {
            userId: michael.id,
            title: 'Bavarian Alps Road Trip',
            slug: 'bavarian-alps-road-trip',
            description:
                'A scenic route from Munich to Neuschwanstein Castle and the Alps.',
            stops: {
                create: [
                    {
                        name: 'Munich',
                        address: 'München, Germany',
                        cityName: 'München',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 48.1351,
                        longitude: 11.5820,
                        position: 1,
                    },
                    {
                        name: 'Neuschwanstein Castle',
                        address: 'Neuschwansteinstraße 20, Schwangau, Germany',
                        cityName: 'Schwangau',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 47.5576,
                        longitude: 10.7498,
                        position: 2,
                        description: 'Visit the famous Neuschwanstein Castle.',
                    },
                    {
                        name: 'Garmisch-Partenkirchen',
                        address: 'Garmisch-Partenkirchen, Germany',
                        cityName: 'Garmisch-Partenkirchen',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 47.4917,
                        longitude: 11.0955,
                        position: 3,
                    },
                ],
            },
            routeTags: {
                create: [
                    { tagId: tagBySlug['germany'].id },
                    { tagId: tagBySlug['mountains'].id },
                    { tagId: tagBySlug['nature'].id },
                    { tagId: tagBySlug['road-trip'].id },
                ],
            },
        },
    });

    const balticSea = await prisma.route.create({
        data: {
            userId: anna.id,
            title: 'Hamburg to the Baltic Sea',
            slug: 'hamburg-to-the-baltic-sea',
            description:
                'A northern Germany weekend route with historic Lübeck and the Baltic coast.',
            stops: {
                create: [
                    {
                        name: 'Hamburg',
                        address: 'Hamburg, Germany',
                        cityName: 'Hamburg',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 53.5511,
                        longitude: 9.9937,
                        position: 1,
                    },
                    {
                        name: 'Lübeck',
                        address: 'Lübeck, Germany',
                        cityName: 'Lübeck',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 53.8655,
                        longitude: 10.6866,
                        position: 2,
                    },
                    {
                        name: 'Timmendorfer Strand',
                        address: 'Timmendorfer Strand, Germany',
                        cityName: 'Timmendorfer Strand',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 53.9953,
                        longitude: 10.7767,
                        position: 3,
                    },
                ],
            },
            routeTags: {
                create: [
                    { tagId: tagBySlug['germany'].id },
                    { tagId: tagBySlug['weekend'].id },
                    { tagId: tagBySlug['sea'].id },
                ],
            },
        },
    });

    const berlinSpreewald = await prisma.route.create({
        data: {
            userId: timofey.id,
            title: 'Berlin, Potsdam and Spreewald',
            slug: 'berlin-potsdam-spreewald',
            description:
                'A combination of city sightseeing and nature around Berlin.',
            stops: {
                create: [
                    {
                        name: 'Berlin',
                        address: 'Berlin, Germany',
                        cityName: 'Berlin',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 52.5200,
                        longitude: 13.4050,
                        position: 1,
                    },
                    {
                        name: 'Potsdam',
                        address: 'Potsdam, Germany',
                        cityName: 'Potsdam',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 52.3906,
                        longitude: 13.0645,
                        position: 2,
                    },
                    {
                        name: 'Lübbenau',
                        address: 'Lübbenau, Germany',
                        cityName: 'Lübbenau',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 51.8680,
                        longitude: 13.9670,
                        position: 3,
                    },
                ],
            },
            routeTags: {
                create: [
                    { tagId: tagBySlug['germany'].id },
                    { tagId: tagBySlug['city'].id },
                    { tagId: tagBySlug['nature'].id },
                    { tagId: tagBySlug['family'].id },
                ],
            },
        },
    });

    const southwest = await prisma.route.create({
        data: {
            userId: anna.id,
            title: 'Heidelberg and Baden-Baden',
            slug: 'heidelberg-and-baden-baden',
            description:
                'A relaxed trip through beautiful towns in southwest Germany.',
            stops: {
                create: [
                    {
                        name: 'Frankfurt am Main',
                        address: 'Frankfurt am Main, Germany',
                        cityName: 'Frankfurt am Main',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 50.1109,
                        longitude: 8.6821,
                        position: 1,
                    },
                    {
                        name: 'Heidelberg',
                        address: 'Heidelberg, Germany',
                        cityName: 'Heidelberg',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 49.3988,
                        longitude: 8.6724,
                        position: 2,
                    },
                    {
                        name: 'Baden-Baden',
                        address: 'Baden-Baden, Germany',
                        cityName: 'Baden-Baden',
                        countryName: 'Germany',
                        countryCode: 'DE',
                        latitude: 48.7606,
                        longitude: 8.2398,
                        position: 3,
                    },
                ],
            },
            routeTags: {
                create: [
                    { tagId: tagBySlug['germany'].id },
                    { tagId: tagBySlug['weekend'].id },
                    { tagId: tagBySlug['city'].id },
                    { tagId: tagBySlug['road-trip'].id },
                ],
            },
        },
    });

    console.log('🌄 Uploading route covers...');

    const wuppertalBonnCoverKey = await uploadSeedImage(
        join(seedAssetsPath, 'routes', 'wuppertal-bonn.jpg'),
        'routes/seed/wuppertal-bonn.jpg',
    );

    const bavariaCoverKey = await uploadSeedImage(
        join(seedAssetsPath, 'routes', 'bavarian-alps.jpg'),
        'routes/seed/bavarian-alps.jpg',
    );

    const balticSeaCoverKey = await uploadSeedImage(
        join(seedAssetsPath, 'routes', 'baltic-sea.jpg'),
        'routes/seed/baltic-sea.jpg',
    );

    const berlinSpreewaldCoverKey = await uploadSeedImage(
        join(seedAssetsPath, 'routes', 'berlin-spreewald.jpg'),
        'routes/seed/berlin-spreewald.jpg',
    );

    const southwestCoverKey = await uploadSeedImage(
        join(seedAssetsPath, 'routes', 'heidelberg-baden-baden.jpg'),
        'routes/seed/heidelberg-baden-baden.jpg',
    );

    await Promise.all([
        prisma.route.update({
            where: { id: wuppertalBonn.id },
            data: { coverObjectKey: wuppertalBonnCoverKey },
        }),

        prisma.route.update({
            where: { id: bavaria.id },
            data: { coverObjectKey: bavariaCoverKey },
        }),

        prisma.route.update({
            where: { id: balticSea.id },
            data: { coverObjectKey: balticSeaCoverKey },
        }),

        prisma.route.update({
            where: { id: berlinSpreewald.id },
            data: { coverObjectKey: berlinSpreewaldCoverKey },
        }),

        prisma.route.update({
            where: { id: southwest.id },
            data: { coverObjectKey: southwestCoverKey },
        }),
    ]);

    console.log('💬 Creating comments...');

    await prisma.comment.createMany({
        data: [
            {
                routeId: wuppertalBonn.id,
                userId: anna.id,
                body: 'Great route for a weekend trip!',
            },
            {
                routeId: wuppertalBonn.id,
                userId: michael.id,
                body: 'Cologne and Bonn are a great combination.',
            },
            {
                routeId: bavaria.id,
                userId: anna.id,
                body: 'The mountain views must be amazing.',
            },
            {
                routeId: bavaria.id,
                userId: timofey.id,
                body: 'I definitely want to try this route.',
            },
            {
                routeId: balticSea.id,
                userId: timofey.id,
                body: 'Perfect idea for summer.',
            },
            {
                routeId: berlinSpreewald.id,
                userId: anna.id,
                body: 'Spreewald is a great choice for a family trip.',
            },
            {
                routeId: southwest.id,
                userId: michael.id,
                body: 'Heidelberg is one of my favorite cities in Germany.',
            },
        ],
    });

    console.log('❤️ Creating likes...');

    await prisma.like.createMany({
        data: [
            {
                userId: anna.id,
                routeId: wuppertalBonn.id,
            },
            {
                userId: michael.id,
                routeId: wuppertalBonn.id,
            },
            {
                userId: timofey.id,
                routeId: bavaria.id,
            },
            {
                userId: anna.id,
                routeId: bavaria.id,
            },
            {
                userId: timofey.id,
                routeId: balticSea.id,
            },
            {
                userId: michael.id,
                routeId: balticSea.id,
            },
            {
                userId: anna.id,
                routeId: berlinSpreewald.id,
            },
            {
                userId: michael.id,
                routeId: southwest.id,
            },
        ],
    });

    console.log('⭐ Creating favorites...');

    await prisma.favorite.createMany({
        data: [
            {
                userId: anna.id,
                routeId: wuppertalBonn.id,
            },
            {
                userId: michael.id,
                routeId: wuppertalBonn.id,
            },
            {
                userId: timofey.id,
                routeId: bavaria.id,
            },
            {
                userId: timofey.id,
                routeId: balticSea.id,
            },
            {
                userId: anna.id,
                routeId: berlinSpreewald.id,
            },
        ],
    });

    console.log('');
    console.log('✅ Database seed completed successfully');
    console.log('');
    console.log('Demo users:');
    console.log('  timofey@roadbook.dev');
    console.log('  anna@roadbook.dev');
    console.log('  michael@roadbook.dev');
    console.log('');
    console.log('Password: SEED_USER_PASSWORD from .env');
}

main()
    .catch((error) => {
        console.error('❌ Seed failed');
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });