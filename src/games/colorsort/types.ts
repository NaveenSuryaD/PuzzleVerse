export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
export type Tube = Color[];

export interface ColorSortState {
  tubes: Tube[];
}
