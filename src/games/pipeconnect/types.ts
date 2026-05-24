// Pipe connections: N, E, S, W
export type Dir = 'N' | 'E' | 'S' | 'W';
export interface PipeCell {
  connections: Dir[]; // which sides this pipe connects to
  rotation: number;   // 0,1,2,3 (x90 degrees)
}
export type PipeGrid = PipeCell[][];
