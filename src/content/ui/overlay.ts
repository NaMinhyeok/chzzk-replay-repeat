
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

  show(videoElement: HTMLVideoElement): void {
    if (this.container) {
      return;
    }

    this.container = this.createOverlay();

    const videoParent = videoElement.parentElement;
    if (videoParent) {
      videoParent.style.position = 'relative';
      videoParent.appendChild(this.container);

      requestAnimationFrame(() => {
        this.panel?.classList.add('animate-panel-enter');
      });
    } else {
      document.body.appendChild(this.container);
    }
  }

  hide(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'chzzk-loop-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;

    overlay.addEventListener('click', (e) => e.stopPropagation());
    overlay.addEventListener('mousedown', (e) => e.stopPropagation());
    overlay.addEventListener('mouseup', (e) => e.stopPropagation());
    overlay.addEventListener('dblclick', (e) => e.stopPropagation());

    this.panel = this.createPanel();
    overlay.appendChild(this.panel);

    this.minimizedButton = this.createMinimizedButton();
    this.minimizedButton.style.display = 'none';
    overlay.appendChild(this.minimizedButton);

    return overlay;
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'chzzk-loop-panel rounded-3xl p-6 w-[360px] border border-white/10 ring-1 ring-white/5 shadow-2xl';
    panel.style.cursor = 'move';

    this.setupDragging(panel);

    const title = document.createElement('div');
    title.className = 'text-white/90 font-bold text-lg mb-6 flex items-center justify-between select-none';
    title.innerHTML = `
      <span class="flex items-center gap-3 drop-shadow-md">
        <span class="text-xl">🔁</span>
        <span style="color: #00ffa3;">구간 반복</span>
      </span>
      <div class="flex gap-2">
        <button class="minimize-btn text-white/40 hover:text-white transition-all duration-300 hover:scale-110 active:scale-90 p-1.5 rounded-lg hover:bg-white/10" aria-label="최소화">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <button class="close-btn text-white/40 hover:text-red-400 transition-all duration-300 hover:scale-110 active:scale-90 p-1.5 rounded-lg hover:bg-white/10" aria-label="닫기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `;
    title.querySelector('.minimize-btn')?.addEventListener('click', () => this.toggleMinimize());
    title.querySelector('.close-btn')?.addEventListener('click', () => this.hide());
    panel.appendChild(title);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'grid grid-cols-2 gap-3 mb-6';

    const setStartBtn = this.createButton('시작 지점', () => {
      const time = this.controller.setStartPoint();
      this.updateTimeInput(this.startInput!, time);
    });

    const setEndBtn = this.createButton('끝 지점', () => {
      const time = this.controller.setEndPoint();
      this.updateTimeInput(this.endInput!, time);
    });

    buttonContainer.appendChild(setStartBtn);
    buttonContainer.appendChild(setEndBtn);
    panel.appendChild(buttonContainer);

    const timeInputsContainer = document.createElement('div');
    timeInputsContainer.className = 'divide-y divide-white/10 mb-6 bg-black/20 rounded-2xl border border-white/5';

    this.startInput = this.createTimeInput('00:00:00', '00:00:00');
    this.endInput = this.createTimeInput('00:00:00', '00:00:00');

    timeInputsContainer.appendChild(this.createInputRow('시작', this.startInput, 'py-4'));
    timeInputsContainer.appendChild(this.createInputRow('끝', this.endInput, 'py-4'));
    panel.appendChild(timeInputsContainer);

    this.toggleButton = this.createToggleButton();
    panel.appendChild(this.toggleButton);

    return panel;
  }

  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'group relative flex items-center justify-center gap-2 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 active:from-white/5 active:to-white/5 text-white/90 text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] border border-white/10 hover:border-white/20 shadow-lg hover:shadow-white/5';
    button.innerHTML = `<span class="opacity-70 group-hover:opacity-100 transition-opacity">📍</span> ${text}`;
    button.addEventListener('click', onClick);
    return button;
  }

  private createTimeInput(placeholder: string, value: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = value;
    input.className = 'chzzk-time-input bg-black/30 border border-white/10 text-white text-center text-base font-bold tracking-widest px-3 py-2.5 rounded-xl w-full focus:outline-none focus:bg-black/50 focus:border-[#00ffa3]/50 focus:shadow-[0_0_15px_-5px_rgba(0,255,163,0.3)] transition-all duration-300 placeholder-white/10 hover:border-white/20';

    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });

    input.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    input.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

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

  private createInputRow(label: string, input: HTMLInputElement, paddingClass: string = ''): HTMLDivElement {
    const row = document.createElement('div');
    row.className = `flex items-center gap-3 group ${paddingClass}`;

    const labelEl = document.createElement('label');
    labelEl.className = 'text-white/60 text-xs font-bold uppercase tracking-wider w-[60px] text-center flex-shrink-0 group-hover:text-[#00ffa3] transition-colors';
    labelEl.textContent = label;

    row.appendChild(labelEl);
    row.appendChild(input);

    return row;
  }

  private createToggleButton(): HTMLButtonElement {
    const button = document.createElement('button');
    const inactiveClass = 'w-full bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 active:from-white/5 active:to-white/5 text-white/90 font-bold py-4 px-4 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg border border-white/10 tracking-wide flex items-center justify-center gap-2 group';
    const activeClass = 'w-full bg-gradient-to-r from-[#00ffa3] to-[#00ffc8] text-black font-extrabold py-4 px-4 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(0,255,163,0.4)] border-none animate-glow-pulse tracking-wide flex items-center justify-center gap-2';

    button.className = inactiveClass;
    button.innerHTML = '<span class="group-hover:translate-x-1 transition-transform">▶</span> 반복 시작';

    button.addEventListener('click', () => {
      const enabled = this.controller.toggle();
      if (enabled) {
        button.innerHTML = '<span>⏸</span> 반복 중지';
        button.className = activeClass;
      } else {
        button.innerHTML = '<span class="group-hover:translate-x-1 transition-transform">▶</span> 반복 시작';
        button.className = inactiveClass;
      }
    });

    return button;
  }

  private setupDragging(element: HTMLElement): void {
    let wasDragging = false;

    element.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      const isButton = element instanceof HTMLButtonElement;
      
      const closestButton = target.closest('button');
      
      const shouldDrag = isButton || (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT' && !closestButton);

      if (shouldDrag && this.container) {
        this.isDragging = true;
        wasDragging = false;

        const rect = this.container.getBoundingClientRect();
        const parent = this.container.offsetParent as HTMLElement;
        const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };

        const currentLeft = rect.left - parentRect.left;
        const currentTop = rect.top - parentRect.top;

        this.container.style.left = `${currentLeft}px`;
        this.container.style.top = `${currentTop}px`;
        this.container.style.right = 'auto';
        this.container.style.bottom = 'auto';

        this.dragOffset = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (this.isDragging && this.container) {
        wasDragging = true;

        const parent = this.container.offsetParent as HTMLElement;
        const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };

        const x = e.clientX - parentRect.left - this.dragOffset.x;
        const y = e.clientY - parentRect.top - this.dragOffset.y;

        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (this.isDragging && wasDragging) {
        e.stopPropagation();
        e.preventDefault();
      }
      this.isDragging = false;
      wasDragging = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp, true);
  }

  private parseTime(timeStr: string): number | null {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3 && parts.every(n => !isNaN(n))) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private updateTimeInput(input: HTMLInputElement, time: number): void {
    input.value = this.formatTime(time);
  }

  private createMinimizedButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'bg-black/80 hover:bg-black text-[#00ffa3] backdrop-blur-xl rounded-full w-14 h-14 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] animate-scale-in z-[9999]';
    button.style.cursor = 'move';
    button.innerHTML = '<span class="text-2xl">🔁</span>';
    button.title = '구간 반복 패널 열기';

    let clickStartTime = 0;
    button.addEventListener('mousedown', () => {
      clickStartTime = Date.now();
    });

    button.addEventListener('click', (e) => {
      const clickDuration = Date.now() - clickStartTime;
      if (clickDuration < 200) {
        this.toggleMinimize();
      }
    });

    this.setupDragging(button);

    return button;
  }

  private toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;

    if (this.panel && this.minimizedButton) {
      if (this.isMinimized) {
        this.panel.classList.remove('animate-panel-enter');
        this.panel.classList.add('animate-panel-exit');

        setTimeout(() => {
          if (this.isMinimized && this.panel && this.minimizedButton) {
            this.panel.style.display = 'none';
            this.minimizedButton.style.display = 'flex';
            this.minimizedButton.classList.remove('animate-scale-in');
            void this.minimizedButton.offsetWidth;
            this.minimizedButton.classList.add('animate-scale-in');
          }
        }, 300);
      } else {
        this.minimizedButton.style.display = 'none';
        this.panel.style.display = 'block';
        this.panel.classList.remove('animate-panel-exit');
        this.panel.classList.add('animate-panel-enter');
      }
    }
  }
}
