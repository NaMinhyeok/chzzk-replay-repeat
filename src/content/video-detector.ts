/**
 * 치지직 페이지에서 비디오 요소를 감지하는 모듈
 */

export class VideoDetector {
  private observer: MutationObserver | null = null;
  private onVideoFound: (video: HTMLVideoElement) => void;

  constructor(onVideoFound: (video: HTMLVideoElement) => void) {
    this.onVideoFound = onVideoFound;
  }

  /**
   * 비디오 감지 시작
   */
  start(): void {
    // 이미 존재하는 비디오 요소 확인
    this.checkExistingVideo();

    // MutationObserver로 동적으로 추가되는 비디오 감지
    this.observer = new MutationObserver(() => {
      this.checkExistingVideo();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 비디오 감지 중지
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * 현재 페이지에서 비디오 요소 찾기
   */
  private checkExistingVideo(): void {
    const video = document.querySelector('video');
    if (video) {
      this.onVideoFound(video);
      // 비디오를 찾았으면 옵저버 중지
      this.stop();
    }
  }
}
