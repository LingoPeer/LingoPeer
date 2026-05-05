export const unitTestsByUnitId = {
    2: [
        {
            id: 'u2q1',
            section: 'Unit 2 • Travel & Culture',
            prompt: 'Choose the correct option.',
            sentence: 'I ____ to Paris twice.',
            options: ['have been', 'am', 'was', 'go'],
            correctIndex: 0,
        },
        {
            id: 'u2q2',
            section: 'Unit 2 • Travel & Culture',
            prompt: 'Choose the best option.',
            sentence: 'When I arrived at the airport, my flight ____.',
            options: ['already left', 'had already left', 'has already left', 'leaves'],
            correctIndex: 1,
        },
        {
            id: 'u2q3',
            section: 'Unit 2 • Travel & Culture',
            prompt: 'Pick the best word.',
            sentence: 'The hotel was ____; I could see the ocean from my room.',
            options: ['noisy', 'modern', 'careless', 'tiny'],
            correctIndex: 1,
        },
        {
            id: 'u2q4',
            section: 'Unit 2 • Travel & Culture',
            prompt: 'Choose the correct sentence.',
            sentence: '',
            options: [
                'She has visit London last year.',
                'She visited London last year.',
                'She has visited London last year.',
                'She visiting London last year.',
            ],
            correctIndex: 1,
        },
        {
            id: 'u2q5',
            section: 'Unit 2 • Travel & Culture',
            prompt: 'Choose the best option.',
            sentence: 'If I ____ known about the festival, I would have gone.',
            options: ['have', 'had', 'would', 'am'],
            correctIndex: 1,
        },
    ],
};

export function getUnitTestQuestions(unitId) {
    return unitTestsByUnitId[unitId] ?? [];
}

