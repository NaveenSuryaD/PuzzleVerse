export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan';
export type Tube = Color[];

export interface ColorSortState {
  tubes: Tube[];
}
