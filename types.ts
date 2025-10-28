
export type SpinDirection = 'CW' | 'CCW';

export interface Spin {
    id: number;
    spinNumber: number;
    number: number;
    direction: SpinDirection;
}

export interface AccuracyData {
    spin: number;
    accuracy: number;
    hits: number;
}
