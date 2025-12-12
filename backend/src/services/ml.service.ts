
export interface DetectedObject {
    label: string;
    confidence: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export class MlService {
    /**
     * Detect objects in an image (Mock)
     * Requirements: FR-4, FR-20
     */
    async detectObjects(_imagePath: string): Promise<DetectedObject[]> {
        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Return mock data
        return [
            {
                label: 'bed',
                confidence: 0.95,
                boundingBox: { x: 0.1, y: 0.2, width: 0.4, height: 0.3 },
            },
            {
                label: 'chair',
                confidence: 0.88,
                boundingBox: { x: 0.6, y: 0.5, width: 0.2, height: 0.4 },
            },
            {
                label: 'table',
                confidence: 0.75,
                boundingBox: { x: 0.5, y: 0.6, width: 0.3, height: 0.3 },
            },
        ];
    }
}

export const mlService = new MlService();
