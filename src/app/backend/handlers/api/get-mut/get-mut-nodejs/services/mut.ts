import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { logger } from './powertools';

interface MUTConfig {
    parameterName: string;
}

const ssmClient = new SSMClient({});

export const getMUT = async (config: MUTConfig): Promise<string> => {
    const response = await ssmClient.send(new GetParameterCommand({
        Name: config.parameterName,
        WithDecryption: true,
    }));

    if (!response.Parameter?.Value) {
        throw new Error('MUT not found');
    }

    logger.info('Successfully retrieved MUT');
    return response.Parameter.Value;
}; 