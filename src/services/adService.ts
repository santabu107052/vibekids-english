import { Capacitor } from '@capacitor/core';
import { 
  AdMob, 
  BannerAdOptions, 
  BannerAdSize, 
  BannerAdPosition, 
  AdOptions,
  RewardAdOptions,
  RewardAdPluginEvents
} from '@capacitor-community/admob';

/**
 * GOOGLE ADMOB OFFICIAL TEST AD UNIT IDS
 */
export const ADMOB_TEST_IDS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
};

class AdService {
  private isInitialized = false;
  private isBannerShowing = false;

  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public async initialize(): Promise<void> {
    if (!this.isNative()) return;
    if (this.isInitialized) return;

    try {
      await AdMob.initialize({
        testingDevices: ['EMULATOR'],
      });
      // Độc lập gọi request tracking nếu cần
      try { await AdMob.requestTrackingAuthorization(); } catch {}
      
      this.isInitialized = true;
    } catch (e) {
      console.warn('[AdMob] Lỗi khởi tạo:', e);
    }
  }

  public async showBanner(customAdId?: string): Promise<void> {
    if (!this.isNative() || this.isBannerShowing) return;

    try {
      await this.initialize();
      const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
      const adId = customAdId || ADMOB_TEST_IDS[platform].banner;

      const options: BannerAdOptions = {
        adId,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: true,
      };

      await AdMob.showBanner(options);
      this.isBannerShowing = true;
    } catch (e) {
      console.warn('[AdMob] Lỗi hiển thị Banner:', e);
    }
  }

  public async hideBanner(): Promise<void> {
    if (!this.isNative() || !this.isBannerShowing) return;
    try {
      await AdMob.hideBanner();
      this.isBannerShowing = false;
    } catch (e) {
      console.warn('[AdMob] Lỗi ẩn Banner:', e);
    }
  }

  public async showInterstitial(customAdId?: string): Promise<boolean> {
    if (!this.isNative()) return false;

    try {
      await this.initialize();
      const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
      const adId = customAdId || ADMOB_TEST_IDS[platform].interstitial;

      await AdMob.prepareInterstitial({ adId, isTesting: true });
      await AdMob.showInterstitial();
      return true;
    } catch (e) {
      console.warn('[AdMob] Lỗi hiển thị Interstitial:', e);
      return false;
    }
  }

  public async showRewardVideo(
    onRewarded: (amount: number, type: string) => void,
    customAdId?: string
  ): Promise<boolean> {
    if (!this.isNative()) {
      onRewarded(50, 'Stars');
      return true;
    }

    try {
      await this.initialize();
      const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
      const adId = customAdId || ADMOB_TEST_IDS[platform].rewarded;

      await AdMob.prepareRewardVideoAd({ adId, isTesting: true });

      const listener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (reward) => {
          onRewarded(reward.amount || 50, reward.type || 'Stars');
          listener.remove();
        }
      );

      await AdMob.showRewardVideoAd();
      return true;
    } catch (e) {
      console.warn('[AdMob] Lỗi hiển thị Reward Ad:', e);
      return false;
    }
  }
}

export const adService = new AdService();
