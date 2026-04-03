/** Static display data for layout only — no scoring logic.
 * Five photos (candidate-1 … candidate-5.png) are each used for one profile only; others have no photo.
 */
export const MATCHING_SECTIONS = [
  {
    id: 'strong',
    title: 'Strong fit',
    candidates: [
      {
        id: 'c1',
        name: 'Youssef El Amrani',
        photoIndex: 2,
        rows: [
          { label: 'Income', value: '22,000 MAD', status: 'ok' },
          { label: 'Employment', value: 'CDI', status: 'ok' },
          { label: 'Occupants', value: '1', status: 'ok' },
          { label: 'Move-in', value: 'Immediate', status: 'ok' },
          { label: 'Pets / smoking', value: 'None', status: 'ok' },
        ],
      },
      {
        id: 'c2',
        name: 'Nadia Chraibi',
        photoIndex: 1,
        rows: [
          { label: 'Income', value: '25,000 MAD', status: 'ok' },
          { label: 'Employment', value: 'Business owner', status: 'warn' },
          { label: 'Occupants', value: '2', status: 'ok' },
          { label: 'Move-in', value: 'Immediate', status: 'ok' },
        ],
      },
      {
        id: 'c3',
        name: 'Salma Bennani',
        photoIndex: 4,
        rows: [
          { label: 'Income', value: '18,000 MAD', status: 'ok' },
          { label: 'Employment', value: 'CDI', status: 'ok' },
          { label: 'Occupants', value: '2', status: 'ok' },
          { label: 'Move-in', value: 'Within 2 weeks', status: 'warn' },
        ],
      },
      {
        id: 'c4',
        name: 'Rachid Berrada',
        photoIndex: 3,
        rows: [
          { label: 'Income', value: '20,000 MAD', status: 'ok' },
          { label: 'Employment', value: 'Civil service', status: 'ok' },
          { label: 'Occupants', value: '1', status: 'ok' },
          { label: 'Move-in', value: 'Immediate', status: 'ok' },
        ],
      },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    candidates: [
      {
        id: 'c5',
        name: 'Mehdi Alaoui',
        photoIndex: 5,
        rows: [
          { label: 'Income', value: '15,000 MAD', status: 'ok' },
          { label: 'Employment', value: 'Freelancer', status: 'gap' },
          { label: 'Occupants', value: '1', status: 'ok' },
          { label: 'Documentation', value: 'Partial file', status: 'warn' },
        ],
      },
      {
        id: 'c6',
        name: 'Imane Tazi',
        photoIndex: null,
        rows: [
          { label: 'Income', value: '13,000 MAD', status: 'gap' },
          { label: 'Employment', value: 'Civil service', status: 'ok' },
          { label: 'Occupants', value: '3', status: 'gap' },
        ],
      },
      {
        id: 'c7',
        name: 'Othmane Lahlou',
        photoIndex: null,
        rows: [
          { label: 'Income', value: '16,000 MAD', status: 'ok' },
          { label: 'Employment', value: 'CDI', status: 'ok' },
          { label: 'Occupants', value: '2', status: 'ok' },
          { label: 'Smoking', value: 'Yes', status: 'gap' },
        ],
      },
      {
        id: 'c8',
        name: 'Sara El Fassi',
        photoIndex: null,
        rows: [
          { label: 'Income', value: '17,000 MAD', status: 'ok' },
          { label: 'Employment', value: 'CDI', status: 'ok' },
          { label: 'Occupants', value: '1', status: 'ok' },
          { label: 'Pets', value: 'Cat', status: 'gap' },
        ],
      },
    ],
  },
  {
    id: 'risk',
    title: 'Higher risk',
    candidates: [
      {
        id: 'c9',
        name: 'Hamza Idrissi',
        photoIndex: null,
        rows: [
          { label: 'Income', value: '4,000 MAD', status: 'gap' },
          { label: 'Employment', value: 'Student', status: 'gap' },
          { label: 'Guarantor', value: 'None', status: 'gap' },
        ],
      },
      {
        id: 'c10',
        name: 'Karim Ziani',
        photoIndex: null,
        rows: [
          { label: 'Income', value: '12,000 MAD', status: 'gap' },
          { label: 'Employment', value: 'Temporary contract', status: 'gap' },
          { label: 'Occupants', value: '2', status: 'ok' },
        ],
      },
      {
        id: 'c11',
        name: 'Lina Touil',
        photoIndex: null,
        rows: [
          { label: 'Income', value: '14,000 MAD', status: 'gap' },
          { label: 'Employment', value: 'Freelancer', status: 'gap' },
          { label: 'Occupants', value: '1', status: 'ok' },
          { label: 'Move-in', value: 'Late', status: 'gap' },
        ],
      },
    ],
  },
]
