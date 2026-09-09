import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {PrismaClient, PreferredLanguage, Prisma, type Route} from '../src/generated/prisma/client';
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

type SeedStop = {
    name: string;
    address: string;
    cityName: string;
    countryName: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    position: number;
    description?: string;
};

type OrsRouteResponse = {
    features: Array<{
        properties: {
            summary: {
                distance: number;
                duration: number;
            };
        };
        geometry: {
            type: 'LineString';
            coordinates: number[][];
        };
    }>;
};

type SeedRoute = {
    userId: number;
    title: string;
    slug: string;
    description: string;
    coverObjectKey: string;
    tags: string[];
    stops: SeedStop[];
};


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


async function buildSeedRoute(stops: SeedStop[]) {
    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey) {
        throw new Error('ORS_API_KEY is not set');
    }

    const coordinates = stops
        .sort((a, b) => a.position - b.position)
        .map((stop) => [
            stop.longitude,
            stop.latitude,
        ]);

    const response = await fetch(
        'https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson',
        {
            method: 'POST',
            headers: {
                Authorization: apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                coordinates,
            }),
        },
    );

    if (!response.ok) {
        throw new Error(
            `ORS request failed: ${response.status} ${response.statusText}`,
        );
    }

    const data = await response.json() as OrsRouteResponse;

    const feature = data.features[0];

    if (!feature) {
        throw new Error('ORS returned no route');
    }

    return {
        totalDistanceMeters: Math.round(
            feature.properties.summary.distance,
        ),
        totalDurationSeconds: Math.round(
            feature.properties.summary.duration,
        ),
        routeGeometry: feature.geometry as Prisma.InputJsonValue,
    };
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

    // -------------------------------------------------------------------------
    // USERS
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // AVATARS
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // TAGS
    // -------------------------------------------------------------------------

    console.log('🏷️ Creating tags...');

    await prisma.tag.createMany({
        data: [
            // Countries
            { name: 'Germany', slug: 'germany' },
            { name: 'France', slug: 'france' },
            { name: 'Netherlands', slug: 'netherlands' },
            { name: 'Luxembourg', slug: 'luxembourg' },

            // Trip type
            { name: 'Weekend', slug: 'weekend' },
            { name: 'Road Trip', slug: 'road-trip' },
            { name: 'Family', slug: 'family' },
            { name: 'Cross Border', slug: 'cross-border' },

            // Landscape / destination type
            { name: 'Nature', slug: 'nature' },
            { name: 'City', slug: 'city' },
            { name: 'Mountains', slug: 'mountains' },
            { name: 'Sea', slug: 'sea' },
            { name: 'Lake', slug: 'lake' },
            { name: 'River', slug: 'river' },
            { name: 'Forest', slug: 'forest' },
            { name: 'Historic', slug: 'historic' },
        ],
    });

    const tags = await prisma.tag.findMany();

    const tagBySlug = Object.fromEntries(
        tags.map((tag) => [tag.slug, tag]),
    );

    // -------------------------------------------------------------------------
    // ROUTE COVERS
    // -------------------------------------------------------------------------

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

    const duesseldorfMaastrichtAachenCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '01-duesseldorf-maastricht-aachen.png',
        ),
        'routes/seed/01-duesseldorf-maastricht-aachen.png',
    );

    const moselleValleyCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '02-moselle-valley-koblenz-cochem-trier.png',
        ),
        'routes/seed/02-moselle-valley-koblenz-cochem-trier.png',
    );

    const blackForestCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '03-black-forest-baden-baden-triberg-freiburg.png',
        ),
        'routes/seed/03-black-forest-baden-baden-triberg-freiburg.png',
    );

    const lakeConstanceCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '04-lake-constance-konstanz-friedrichshafen-lindau.png',
        ),
        'routes/seed/04-lake-constance-konstanz-friedrichshafen-lindau.png',
    );

    const saxonSwitzerlandCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '05-dresden-bastei-saxon-switzerland.png',
        ),
        'routes/seed/05-dresden-bastei-saxon-switzerland.png',
    );

    const harzCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '06-harz-goslar-wernigerode-quedlinburg.png',
        ),
        'routes/seed/06-harz-goslar-wernigerode-quedlinburg.png',
    );

    const nurembergRothenburgWuerzburgCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '07-nuremberg-rothenburg-wuerzburg.png',
        ),
        'routes/seed/07-nuremberg-rothenburg-wuerzburg.png',
    );

    const northSeaCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '08-bremen-bremerhaven-cuxhaven.png',
        ),
        'routes/seed/08-bremen-bremerhaven-cuxhaven.png',
    );

    const luxembourgMoselleCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '09-luxembourg-trier-bernkastel-kues.png',
        ),
        'routes/seed/09-luxembourg-trier-bernkastel-kues.png',
    );

    const alsaceCoverKey = await uploadSeedImage(
        join(
            seedAssetsPath,
            'routes',
            '10-alsace-strasbourg-colmar-mulhouse.png',
        ),
        'routes/seed/10-alsace-strasbourg-colmar-mulhouse.png',
    );

    // -------------------------------------------------------------------------
    // ROUTES DATA
    // -------------------------------------------------------------------------

    const seedRoutes: SeedRoute[] = [
        {
            userId: timofey.id,
            title: 'Wuppertal to Bonn via Cologne',
            slug: 'wuppertal-to-bonn-via-cologne',
            description:
                'A relaxed weekend trip through three cities in North Rhine-Westphalia.',
            coverObjectKey: wuppertalBonnCoverKey,
            tags: [
                'germany',
                'weekend',
                'city',
            ],
            stops: [
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
                    description:
                        'Stop near Cologne Cathedral and the Rhine.',
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

        {
            userId: michael.id,
            title: 'Bavarian Alps Road Trip',
            slug: 'bavarian-alps-road-trip',
            description:
                'A scenic route from Munich to Neuschwanstein Castle and the Alps.',
            coverObjectKey: bavariaCoverKey,
            tags: [
                'germany',
                'mountains',
                'nature',
                'road-trip',
            ],
            stops: [
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
                    address:
                        'Neuschwansteinstraße 20, Schwangau, Germany',
                    cityName: 'Schwangau',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 47.5576,
                    longitude: 10.7498,
                    position: 2,
                    description:
                        'Visit the famous Neuschwanstein Castle.',
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

        {
            userId: anna.id,
            title: 'Hamburg to the Baltic Sea',
            slug: 'hamburg-to-the-baltic-sea',
            description:
                'A northern Germany weekend route with historic Lübeck and the Baltic coast.',
            coverObjectKey: balticSeaCoverKey,
            tags: [
                'germany',
                'weekend',
                'sea',
            ],
            stops: [
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

        {
            userId: timofey.id,
            title: 'Berlin, Potsdam and Spreewald',
            slug: 'berlin-potsdam-spreewald',
            description:
                'A combination of city sightseeing and nature around Berlin.',
            coverObjectKey: berlinSpreewaldCoverKey,
            tags: [
                'germany',
                'city',
                'nature',
                'family',
            ],
            stops: [
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

        {
            userId: anna.id,
            title: 'Heidelberg and Baden-Baden',
            slug: 'heidelberg-and-baden-baden',
            description:
                'A relaxed trip through beautiful towns in southwest Germany.',
            coverObjectKey: southwestCoverKey,
            tags: [
                'germany',
                'weekend',
                'city',
                'road-trip',
            ],
            stops: [
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
        {
            userId: timofey.id,
            title: 'Düsseldorf, Maastricht and Aachen',
            slug: 'dusseldorf-maastricht-aachen',
            description:
                'A cross-border road trip from Düsseldorf to Maastricht and historic Aachen.',
            coverObjectKey: duesseldorfMaastrichtAachenCoverKey,
            tags: [
                'germany',
                'netherlands',
                'city',
                'weekend',
                'cross-border',
                'road-trip',
            ],
            stops: [
                {
                    name: 'Düsseldorf',
                    address: 'Düsseldorf, Germany',
                    cityName: 'Düsseldorf',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 51.2277,
                    longitude: 6.7735,
                    position: 1,
                },
                {
                    name: 'Maastricht',
                    address: 'Maastricht, Netherlands',
                    cityName: 'Maastricht',
                    countryName: 'Netherlands',
                    countryCode: 'NL',
                    latitude: 50.8514,
                    longitude: 5.6910,
                    position: 2,
                },
                {
                    name: 'Aachen',
                    address: 'Aachen, Germany',
                    cityName: 'Aachen',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 50.7753,
                    longitude: 6.0839,
                    position: 3,
                },
            ],
        },

        {
            userId: anna.id,
            title: 'Moselle Valley: Koblenz to Trier',
            slug: 'moselle-valley-koblenz-cochem-trier',
            description:
                'A scenic drive along the Moselle through vineyards, castles and historic riverside towns.',
            coverObjectKey: moselleValleyCoverKey,
            tags: [
                'germany',
                'nature',
                'river',
                'historic',
                'road-trip',
            ],
            stops: [
                {
                    name: 'Koblenz',
                    address: 'Koblenz, Germany',
                    cityName: 'Koblenz',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 50.3569,
                    longitude: 7.5889,
                    position: 1,
                },
                {
                    name: 'Cochem',
                    address: 'Cochem, Germany',
                    cityName: 'Cochem',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 50.1469,
                    longitude: 7.1667,
                    position: 2,
                },
                {
                    name: 'Trier',
                    address: 'Trier, Germany',
                    cityName: 'Trier',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 49.7499,
                    longitude: 6.6371,
                    position: 3,
                },
            ],
        },

        {
            userId: michael.id,
            title: 'Black Forest: Baden-Baden to Freiburg',
            slug: 'black-forest-baden-baden-triberg-freiburg',
            description:
                'A winding drive through forests, waterfalls and mountain towns in the Black Forest.',
            coverObjectKey: blackForestCoverKey,
            tags: [
                'germany',
                'nature',
                'forest',
                'mountains',
                'road-trip',
            ],
            stops: [
                {
                    name: 'Baden-Baden',
                    address: 'Baden-Baden, Germany',
                    cityName: 'Baden-Baden',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 48.7606,
                    longitude: 8.2398,
                    position: 1,
                },
                {
                    name: 'Triberg',
                    address: 'Triberg im Schwarzwald, Germany',
                    cityName: 'Triberg',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 48.1315,
                    longitude: 8.2325,
                    position: 2,
                },
                {
                    name: 'Freiburg',
                    address: 'Freiburg im Breisgau, Germany',
                    cityName: 'Freiburg',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 47.9990,
                    longitude: 7.8421,
                    position: 3,
                },
            ],
        },

        {
            userId: anna.id,
            title: 'Lake Constance: Konstanz to Lindau',
            slug: 'lake-constance-konstanz-friedrichshafen-lindau',
            description:
                'A relaxed lakeside route with Alpine views and beautiful towns along Lake Constance.',
            coverObjectKey: lakeConstanceCoverKey,
            tags: [
                'germany',
                'nature',
                'lake',
                'family',
                'weekend',
            ],
            stops: [
                {
                    name: 'Konstanz',
                    address: 'Konstanz, Germany',
                    cityName: 'Konstanz',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 47.6779,
                    longitude: 9.1732,
                    position: 1,
                },
                {
                    name: 'Friedrichshafen',
                    address: 'Friedrichshafen, Germany',
                    cityName: 'Friedrichshafen',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 47.6519,
                    longitude: 9.4785,
                    position: 2,
                },
                {
                    name: 'Lindau',
                    address: 'Lindau, Germany',
                    cityName: 'Lindau',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 47.5460,
                    longitude: 9.6845,
                    position: 3,
                },
            ],
        },

        {
            userId: michael.id,
            title: 'Dresden, Bastei and Saxon Switzerland',
            slug: 'dresden-bastei-saxon-switzerland',
            description:
                'A dramatic road trip from historic Dresden into the sandstone landscapes of Saxon Switzerland.',
            coverObjectKey: saxonSwitzerlandCoverKey,
            tags: [
                'germany',
                'nature',
                'mountains',
                'historic',
                'road-trip',
            ],
            stops: [
                {
                    name: 'Dresden',
                    address: 'Dresden, Germany',
                    cityName: 'Dresden',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 51.0504,
                    longitude: 13.7373,
                    position: 1,
                },
                {
                    name: 'Bastei',
                    address: 'Bastei, Lohmen, Germany',
                    cityName: 'Lohmen',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 50.9619,
                    longitude: 14.0727,
                    position: 2,
                },
                {
                    name: 'Bad Schandau',
                    address: 'Bad Schandau, Germany',
                    cityName: 'Bad Schandau',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 50.9177,
                    longitude: 14.1547,
                    position: 3,
                },
            ],
        },

        {
            userId: timofey.id,
            title: 'Harz Mountains: Goslar to Quedlinburg',
            slug: 'harz-goslar-wernigerode-quedlinburg',
            description:
                'A road trip through medieval towns and mountain scenery in the Harz region.',
            coverObjectKey: harzCoverKey,
            tags: [
                'germany',
                'mountains',
                'nature',
                'historic',
                'road-trip',
            ],
            stops: [
                {
                    name: 'Goslar',
                    address: 'Goslar, Germany',
                    cityName: 'Goslar',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 51.9059,
                    longitude: 10.4289,
                    position: 1,
                },
                {
                    name: 'Wernigerode',
                    address: 'Wernigerode, Germany',
                    cityName: 'Wernigerode',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 51.8354,
                    longitude: 10.7844,
                    position: 2,
                },
                {
                    name: 'Quedlinburg',
                    address: 'Quedlinburg, Germany',
                    cityName: 'Quedlinburg',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 51.7904,
                    longitude: 11.1500,
                    position: 3,
                },
            ],
        },

        {
            userId: michael.id,
            title: 'Nuremberg, Rothenburg and Würzburg',
            slug: 'nuremberg-rothenburg-wuerzburg',
            description:
                'A classic Franconian road trip through three of Germany’s most charming historic cities.',
            coverObjectKey: nurembergRothenburgWuerzburgCoverKey,
            tags: [
                'germany',
                'city',
                'historic',
                'weekend',
                'road-trip',
            ],
            stops: [
                {
                    name: 'Nuremberg',
                    address: 'Nürnberg, Germany',
                    cityName: 'Nürnberg',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 49.4521,
                    longitude: 11.0767,
                    position: 1,
                },
                {
                    name: 'Rothenburg ob der Tauber',
                    address: 'Rothenburg ob der Tauber, Germany',
                    cityName: 'Rothenburg ob der Tauber',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 49.3780,
                    longitude: 10.1788,
                    position: 2,
                },
                {
                    name: 'Würzburg',
                    address: 'Würzburg, Germany',
                    cityName: 'Würzburg',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 49.7913,
                    longitude: 9.9534,
                    position: 3,
                },
            ],
        },

        {
            userId: anna.id,
            title: 'Bremen, Bremerhaven and Cuxhaven',
            slug: 'bremen-bremerhaven-cuxhaven',
            description:
                'A northern road trip from historic Bremen to the North Sea coast.',
            coverObjectKey: northSeaCoverKey,
            tags: [
                'germany',
                'sea',
                'city',
                'road-trip',
            ],
            stops: [
                {
                    name: 'Bremen',
                    address: 'Bremen, Germany',
                    cityName: 'Bremen',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 53.0793,
                    longitude: 8.8017,
                    position: 1,
                },
                {
                    name: 'Bremerhaven',
                    address: 'Bremerhaven, Germany',
                    cityName: 'Bremerhaven',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 53.5396,
                    longitude: 8.5809,
                    position: 2,
                },
                {
                    name: 'Cuxhaven',
                    address: 'Cuxhaven, Germany',
                    cityName: 'Cuxhaven',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 53.8593,
                    longitude: 8.6879,
                    position: 3,
                },
            ],
        },

        {
            userId: timofey.id,
            title: 'Luxembourg, Trier and Bernkastel-Kues',
            slug: 'luxembourg-trier-bernkastel-kues',
            description:
                'A cross-border route from Luxembourg through historic Trier into the Moselle wine region.',
            coverObjectKey: luxembourgMoselleCoverKey,
            tags: [
                'luxembourg',
                'germany',
                'city',
                'river',
                'cross-border',
                'road-trip',
            ],
            stops: [
                {
                    name: 'Luxembourg',
                    address: 'Luxembourg City, Luxembourg',
                    cityName: 'Luxembourg',
                    countryName: 'Luxembourg',
                    countryCode: 'LU',
                    latitude: 49.6116,
                    longitude: 6.1319,
                    position: 1,
                },
                {
                    name: 'Trier',
                    address: 'Trier, Germany',
                    cityName: 'Trier',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 49.7499,
                    longitude: 6.6371,
                    position: 2,
                },
                {
                    name: 'Bernkastel-Kues',
                    address: 'Bernkastel-Kues, Germany',
                    cityName: 'Bernkastel-Kues',
                    countryName: 'Germany',
                    countryCode: 'DE',
                    latitude: 49.9169,
                    longitude: 7.0766,
                    position: 3,
                },
            ],
        },

        {
            userId: anna.id,
            title: 'Alsace: Strasbourg, Colmar and Mulhouse',
            slug: 'alsace-strasbourg-colmar-mulhouse',
            description:
                'A colorful road trip through historic towns, canals and vineyards in Alsace.',
            coverObjectKey: alsaceCoverKey,
            tags: [
                'france',
                'city',
                'historic',
                'cross-border',
                'road-trip',
            ],
            stops: [
                {
                    name: 'Strasbourg',
                    address: 'Strasbourg, France',
                    cityName: 'Strasbourg',
                    countryName: 'France',
                    countryCode: 'FR',
                    latitude: 48.5734,
                    longitude: 7.7521,
                    position: 1,
                },
                {
                    name: 'Colmar',
                    address: 'Colmar, France',
                    cityName: 'Colmar',
                    countryName: 'France',
                    countryCode: 'FR',
                    latitude: 48.0794,
                    longitude: 7.3585,
                    position: 2,
                },
                {
                    name: 'Mulhouse',
                    address: 'Mulhouse, France',
                    cityName: 'Mulhouse',
                    countryName: 'France',
                    countryCode: 'FR',
                    latitude: 47.7508,
                    longitude: 7.3359,
                    position: 3,
                },
            ],
        },
    ];

    // -------------------------------------------------------------------------
    // CREATE ROUTES + BUILD THEM THROUGH ORS
    // -------------------------------------------------------------------------

    console.log('🛣️ Creating and building routes...');

    const createdRoutes: Route[] = [];

    for (const seedRoute of seedRoutes) {
        console.log(`   🚗 ${seedRoute.title}`);
        const routing = await buildSeedRoute(seedRoute.stops);
        console.log(`${(routing.totalDistanceMeters / 1000).toFixed(1)} km`);
        const route = await prisma.route.create({
            data: {
                userId: seedRoute.userId,
                title: seedRoute.title,
                slug: seedRoute.slug,
                description: seedRoute.description,
                coverObjectKey: seedRoute.coverObjectKey,

                totalDistanceMeters: routing.totalDistanceMeters,
                totalDurationSeconds: routing.totalDurationSeconds,
                routeGeometry: routing.routeGeometry,
                routeBuiltAt: new Date(),
                isRouteActual: true,

                stops: {
                    create: seedRoute.stops,
                },

                routeTags: {
                    create: seedRoute.tags.map((slug) => {
                        const tag = tagBySlug[slug];

                        if (!tag) {
                            throw new Error(
                                `Unknown seed tag: ${slug}`,
                            );
                        }

                        return {
                            tagId: tag.id,
                        };
                    }),
                },
            },
        });

        createdRoutes.push(route);
    }

    const [
        wuppertalBonn,
        bavaria,
        balticSea,
        berlinSpreewald,
        southwest,
    ] = createdRoutes;

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
            {
                routeId: createdRoutes[5].id,
                userId: anna.id,
                body: 'Xanten sounds like a great weekend destination.',
            },
            {
                routeId: createdRoutes[6].id,
                userId: timofey.id,
                body: 'The Moselle Valley is perfect for a road trip.',
            },
            {
                routeId: createdRoutes[7].id,
                userId: anna.id,
                body: 'I would love to drive through the Black Forest.',
            },
            {
                routeId: createdRoutes[10].id,
                userId: timofey.id,
                body: 'Saxon Switzerland looks amazing.',
            },
            {
                routeId: createdRoutes[11].id,
                userId: michael.id,
                body: 'This looks like a great family route.',
            },
        ],
    });

    // -------------------------------------------------------------------------
    // LIKES
    // -------------------------------------------------------------------------

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

            {
                userId: anna.id,
                routeId: createdRoutes[5].id,
            },
            {
                userId: michael.id,
                routeId: createdRoutes[5].id,
            },
            {
                userId: timofey.id,
                routeId: createdRoutes[6].id,
            },
            {
                userId: michael.id,
                routeId: createdRoutes[7].id,
            },
            {
                userId: timofey.id,
                routeId: createdRoutes[8].id,
            },
            {
                userId: anna.id,
                routeId: createdRoutes[9].id,
            },
            {
                userId: timofey.id,
                routeId: createdRoutes[10].id,
            },
            {
                userId: michael.id,
                routeId: createdRoutes[11].id,
            },
            {
                userId: anna.id,
                routeId: createdRoutes[12].id,
            },
            {
                userId: timofey.id,
                routeId: createdRoutes[13].id,
            },
            {
                userId: michael.id,
                routeId: createdRoutes[14].id,
            },
        ],
    });

    // -------------------------------------------------------------------------
    // FAVORITES
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // DONE
    // -------------------------------------------------------------------------

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