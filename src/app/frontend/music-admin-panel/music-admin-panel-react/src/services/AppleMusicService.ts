import AuthService from "./AuthService";

class AppleMusicService {
    private static instance: AppleMusicService;
    private musicKit: any;

    public static getInstance(): AppleMusicService {
        if (!AppleMusicService.instance) {
            AppleMusicService.instance = new AppleMusicService();
        }
        return AppleMusicService.instance;
    }

    public getMusicKit(): any {
        return this.musicKit;
    }

    public async initializeMusicKit(appName: string, appBuild: string): Promise<void> {
        if (!this.musicKit) {
            try {
                const developerToken = await AuthService.getInstance().getDeveloperToken();
                await window.MusicKit.configure({
                    developerToken: developerToken,
                    app: {
                        name: appName,
                        build: appBuild,
                    },
                });
                this.musicKit = window.MusicKit.getInstance();
                console.log('[🍎 AppleMusicKit] 🎵✅ MusicKit global instance is now available for use.');
            } catch (err) {
                console.log('[🍎 AppleMusicKit] 🎵❌ Error configuring MusicKit global instance:', err);
            }
        }
    }

    public async login(): Promise<string | null> {
        console.log('[🍎 AppleMusicKit] ⌛ Attempting to log in via OAuth...');
        try {
            const userToken = this.musicKit.authorize();
            console.log('[🍎 AppleMusicKit] ✅ User login successful!');
            return userToken;
        } catch (error) {
            console.log('[🍎 AppleMusicKit] ❌ User login failed:', error);
            return null;
        }
    }
}

export default AppleMusicService;