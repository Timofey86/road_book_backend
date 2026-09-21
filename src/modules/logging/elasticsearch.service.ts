import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService {
    private readonly client: Client;
    private readonly indexName: string;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.client = new Client({
            node: this.configService.getOrThrow<string>(
                'ELASTICSEARCH_NODE',
            ),
            auth: {
                apiKey: this.configService.getOrThrow<string>(
                    'ELASTICSEARCH_API_KEY',
                ),
            },
        });

        this.indexName = this.configService.getOrThrow<string>(
            'ELASTICSEARCH_INDEX',
        );
    }

    async index(document: Record<string, unknown>): Promise<void> {
        await this.client.index({
            index: this.indexName,
            document,
        });
    }
}