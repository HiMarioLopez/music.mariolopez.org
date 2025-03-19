import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';
import { logger } from './powertools';

interface MUTConfig {
    parameterName: string;
}

const ssmClient = new SSMClient({});

export const storeMUT = async (musicUserToken: string, config: MUTConfig): Promise<void> => {
    await ssmClient.send(new PutParameterCommand({
        Name: config.parameterName,
        Value: musicUserToken,
        Type: 'SecureString',
        Overwrite: true
    }));

    logger.info('Successfully stored MUT');
}; 