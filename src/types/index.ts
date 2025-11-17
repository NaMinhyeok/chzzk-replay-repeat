export interface LoopRange {
  start: number; // 시작 시간 (초)
  end: number;   // 끝 시간 (초)
}

export interface LoopState {
  enabled: boolean;
  range: LoopRange | null;
}
