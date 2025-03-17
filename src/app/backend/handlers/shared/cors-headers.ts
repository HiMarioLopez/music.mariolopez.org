export const getCorsHeaders = (origin: string | undefined, methods: string) => ({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || 'https://admin.music.mariolopez.org',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': `${methods},OPTIONS`,
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
}); 