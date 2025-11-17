/**
 * 비디오 위에 표시되는 구간 반복 UI 오버레이
 */

import type { LoopController } from '../loop-controller';

export class LoopOverlay {
  private controller: LoopController;
  private container: HTMLDivElement | null = null;
  private panel: HTMLDivElement | null = null;
  private minimizedButton: HTMLButtonElement | null = null;
  private startInput: HTMLInputElement | null = null;
  private endInput: HTMLInputElement | null = null;
  private toggleButton: HTMLButtonElement | null = null;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private isMinimized = false;

  constructor(controller: LoopController) {
    this.controller = controller;
  }

  /**
   * 오버레이 생성 및 표시
   */
  show(videoElement: HTMLVideoElement): void {
    if (this.container) {
      return; // 이미 표시됨
    }

    this.container = this.createOverlay();

    // 비디오 요소의 부모에 오버레이 추가
    const videoParent = videoElement.parentElement;
    if (videoParent) {
      videoParent.style.position = 'relative';
      videoParent.appendChild(this.container);
    } else {
      document.body.appendChild(this.container);
    }
  }

  /**
   * 오버레이 제거
   */
  hide(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  /**
   * 오버레이 DOM 생성
   */
  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'chzzk-loop-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;

    // 패널 생성
    this.panel = this.createPanel();
    overlay.appendChild(this.panel);

    // 최소화 버튼 생성
    this.minimizedButton = this.createMinimizedButton();
    this.minimizedButton.style.display = 'none';
    overlay.appendChild(this.minimizedButton);

    return overlay;
  }

  /**
   * 컨트롤 패널 생성
   */
  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'chzzk-loop-panel bg-black/80 rounded-xl shadow-2xl p-5 min-w-[320px] border border-gray-700';
    panel.style.cursor = 'move';

    // 드래그 기능
    this.setupDragging(panel);

    // 제목
    const title = document.createElement('div');
    title.className = 'text-white font-bold text-base mb-4 flex items-center justify-between pb-3 border-b border-gray-700';
    title.innerHTML = `
      <span class="flex items-center gap-2">🔁 구간 반복</span>
      <div class="flex gap-2">
        <button class="minimize-btn text-gray-400 hover:text-white transition-colors text-lg">−</button>
        <button class="close-btn text-gray-400 hover:text-white transition-colors">✕</button>
      </div>
    `;
    title.querySelector('.minimize-btn')?.addEventListener('click', () => this.toggleMinimize());
    title.querySelector('.close-btn')?.addEventListener('click', () => this.hide());
    panel.appendChild(title);

    // 버튼 컨테이너
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'grid grid-cols-2 gap-2 mb-4';

    const setStartBtn = this.createButton('시작 지점 설정', () => {
      const time = this.controller.setStartPoint();
      this.updateTimeInput(this.startInput!, time);
    });

    const setEndBtn = this.createButton('끝 지점 설정', () => {
      const time = this.controller.setEndPoint();
      this.updateTimeInput(this.endInput!, time);
    });

    buttonContainer.appendChild(setStartBtn);
    buttonContainer.appendChild(setEndBtn);
    panel.appendChild(buttonContainer);

    // 시간 입력 필드
    const timeInputsContainer = document.createElement('div');
    timeInputsContainer.className = 'space-y-2.5 mb-4';

    this.startInput = this.createTimeInput('시작', '00:00:00');
    this.endInput = this.createTimeInput('끝', '00:00:00');

    timeInputsContainer.appendChild(this.createInputRow('시작', this.startInput));
    timeInputsContainer.appendChild(this.createInputRow('끝', this.endInput));
    panel.appendChild(timeInputsContainer);

    // 토글 버튼
    this.toggleButton = this.createToggleButton();
    panel.appendChild(this.toggleButton);

    return panel;
  }

  /**
   * 버튼 생성
   */
  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * 시간 입력 필드 생성
   */
  private createTimeInput(placeholder: string, value: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = value;
    input.className = 'chzzk-time-input bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

    input.addEventListener('change', () => {
      const time = this.parseTime(input.value);
      if (time !== null) {
        const state = this.controller.getState();
        const range = state.range || { start: 0, end: 0 };

        if (input === this.startInput) {
          this.controller.setRange({ ...range, start: time });
        } else if (input === this.endInput) {
          this.controller.setRange({ ...range, end: time });
        }
      }
    });

    return input;
  }

  /**
   * 입력 행 생성
   */
  private createInputRow(label: string, input: HTMLInputElement): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3';

    const labelEl = document.createElement('label');
    labelEl.className = 'text-white text-sm font-medium w-12 flex-shrink-0';
    labelEl.textContent = label;

    row.appendChild(labelEl);
    row.appendChild(input);

    return row;
  }

  /**
   * 토글 버튼 생성
   */
  private createToggleButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md';
    button.textContent = '반복 시작';

    button.addEventListener('click', () => {
      const enabled = this.controller.toggle();
      button.textContent = enabled ? '⏸ 반복 중지' : '▶ 반복 시작';
      button.className = enabled
        ? 'w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md'
        : 'w-full bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md';
    });

    return button;
  }

  /**
   * 드래그 기능 설정
   */
  private setupDragging(element: HTMLElement): void {
    element.addEventListener('mousedown', (e) => {
      // 버튼이면 항상 드래그 허용, 패널이면 버튼/입력 외부만 드래그 허용
      const target = e.target as HTMLElement;
      const isButton = element instanceof HTMLButtonElement;
      const shouldDrag = isButton || (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT');

      if (shouldDrag) {
        this.isDragging = true;
        const rect = this.container?.getBoundingClientRect();
        if (rect) {
          this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };
        }
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.container) {
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;
        this.container.style.right = 'auto';
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  /**
   * 시간 형식 파싱 (HH:MM:SS -> 초)
   */
  private parseTime(timeStr: string): number | null {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3 && parts.every(n => !isNaN(n))) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
  }

  /**
   * 시간 형식 변환 (초 -> HH:MM:SS)
   */
  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /**
   * 시간 입력 필드 업데이트
   */
  private updateTimeInput(input: HTMLInputElement, time: number): void {
    input.value = this.formatTime(time);
  }

  /**
   * 최소화 버튼 생성
   */
  private createMinimizedButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'bg-black/80 hover:bg-black/90 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-2xl border border-gray-700 transition-all hover:scale-110';
    button.style.cursor = 'move';
    button.innerHTML = '🔁';
    button.title = '구간 반복 패널 열기';

    // 클릭 vs 드래그 구분
    let clickStartTime = 0;
    button.addEventListener('mousedown', () => {
      clickStartTime = Date.now();
    });

    button.addEventListener('click', (e) => {
      const clickDuration = Date.now() - clickStartTime;
      // 짧은 클릭만 토글 (드래그가 아닌 경우)
      if (clickDuration < 200) {
        this.toggleMinimize();
      }
    });

    // 드래그 기능 추가
    this.setupDragging(button);

    return button;
  }

  /**
   * 최소화/펼치기 토글
   */
  private toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;

    if (this.panel && this.minimizedButton) {
      if (this.isMinimized) {
        this.panel.style.display = 'none';
        this.minimizedButton.style.display = 'flex';
      } else {
        this.panel.style.display = 'block';
        this.minimizedButton.style.display = 'none';
      }
    }
  }
}
