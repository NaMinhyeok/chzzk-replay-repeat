/**
 * CHZZK Replay Repeat - Content Script 진입점
 * 치지직 다시보기 구간 반복 재생 기능
 */

import './ui/styles.css';
import { VideoDetector } from './video-detector';
import { LoopController } from './loop-controller';
import { LoopOverlay } from './ui/overlay';

console.log('🔁 CHZZK Replay Repeat 확장 프로그램이 로드되었습니다.');

/**
 * 비디오가 발견되었을 때 실행되는 초기화 함수
 */
function initializeLoopFeature(video: HTMLVideoElement): void {
  console.log('✅ 비디오 요소를 찾았습니다:', video);

  // 반복 컨트롤러 생성
  const loopController = new LoopController(video);

  // UI 오버레이 생성 및 표시
  const overlay = new LoopOverlay(loopController);
  overlay.show(video);

  console.log('🎉 구간 반복 기능이 활성화되었습니다!');
}

/**
 * 비디오 감지 시작
 */
const detector = new VideoDetector(initializeLoopFeature);
detector.start();
