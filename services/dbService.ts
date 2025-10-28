
import type { Spin, AccuracyData } from '../types';
import type { FullPredictionState } from './predictionService';

export interface GameState {
    spins: Spin[];
    lastPrediction: number[];
    accuracyHistory: AccuracyData[];
}

export interface SavedState {
    gameState: GameState;
    predictionState: FullPredictionState;
}

const DB_NAME = 'RoulettePredictorDB';
const DB_VERSION = 1;
const STORE_NAME = 'appState';

class DBService {
    private db: IDBDatabase | null = null;

    private async openDB(): Promise<IDBDatabase> {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject("Error opening DB");
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    public async saveState(state: SavedState): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(state, 'mainState');
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error saving state");
        });
    }

    public async loadState(): Promise<SavedState | null> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('mainState');

            request.onsuccess = () => {
                resolve(request.result ? request.result as SavedState : null);
            };
            request.onerror = () => reject("Error loading state");
        });
    }

    public async clearState(): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error clearing state");
        });
    }
}

export const dbService = new DBService();
