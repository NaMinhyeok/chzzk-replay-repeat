/**
 * 비디오 구간 반복 재생을 관리하는 모듈
 */

import type { LoopRange, LoopState } from '../types';

export class LoopController {
  private video: HTMLVideoElement;
  private state: LoopState = {
    enabled: false,
    range: null,
  };

  constructor(video: HTMLVideoElement) {
    this.video = video;
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    this.video.addEventListener('timeupdate', this.handleTimeUpdate);
  }

  /**
   * 재생 시간 업데이트 핸들러
   */
  private handleTimeUpdate = (): void => {
    if (!this.state.enabled || !this.state.range) {
      return;
    }

    const currentTime = this.video.currentTime;
    const { start, end } = this.state.range;

    // 끝 지점을 넘으면 시작 지점으로 이동
    if (currentTime >= end) {
      this.video.currentTime = start;
    }

    // 시작 지점보다 이전이면 시작 지점으로 이동
    if (currentTime < start) {
      this.video.currentTime = start;
    }
  };

  /**
   * 반복 구간 설정
   */
  setRange(range: LoopRange): void {
    // 유효성 검증
    if (range.start < 0 || range.end <= range.start) {
      console.error('Invalid loop range:', range);
      return;
    }

    this.state.range = range;
  }

  /**
   * 시작 지점 설정 (현재 재생 시간)
   */
  setStartPoint(): number {
    const currentTime = this.video.currentTime;

    if (this.state.range) {
      this.state.range.start = currentTime;
    } else {
      this.state.range = {
        start: currentTime,
        end: this.video.duration || currentTime + 10,
      };
    }

    return currentTime;
  }

  /**
   * 끝 지점 설정 (현재 재생 시간)
   */
  setEndPoint(): number {
    const currentTime = this.video.currentTime;

    if (this.state.range) {
      this.state.range.end = currentTime;
    } else {
      this.state.range = {
        start: 0,
        end: currentTime,
      };
    }

    return currentTime;
  }

  /**
   * 반복 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
  }

  /**
   * 반복 토글
   */
  toggle(): boolean {
    this.state.enabled = !this.state.enabled;
    return this.state.enabled;
  }

  /**
   * 현재 상태 가져오기
   */
  getState(): LoopState {
    return { ...this.state };
  }

  /**
   * 정리
   */
  destroy(): void {
    this.video.removeEventListener('timeupdate', this.handleTimeUpdate);
  }
}
