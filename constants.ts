
// European roulette wheel layout
export const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export const NUMBER_TO_INDEX_MAP: Map<number, number> = new Map(ROULETTE_NUMBERS.map((num, i) => [num, i]));

export const NUMBER_COLORS: { [key: number]: 'green' | 'red' | 'black' } = {
    0: 'green', 1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red',
    10: 'black', 11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red',
    19: 'red', 20: 'black', 21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red',
    28: 'black', 29: 'black', 30: 'red', 31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};

export const MODEL_NAMES = {
    AVG_DIST: 'Average Distance',
    MARKOV: 'Markov Chain',
    HOT_ZONE: 'Hot Zone',
    MOMENTUM: 'Momentum Weight',
};
