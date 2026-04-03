function img(name) {
  return `${import.meta.env.BASE_URL}properties/${name}`
}

/**
 * Six rental units — Casablanca area. Map coordinates are approximate.
 */
export const PROPERTY_LISTINGS = [
  {
    id: 'unit-maarif-boho',
    shortName: 'Maarif — Boho 2BR',
    title: '2-bedroom apartment — Maarif',
    description:
      'Open-plan living and dining with warm finishes, woven wall accents, and plenty of daylight. Third floor, quiet building. Syndic charges about 450 MAD/month (cold water and common areas).',
    imageUrl: img('prop-1.png'),
    monthlyPrice: 7200,
    locationLabel: 'Rue Jean Jaurès, Maarif, Casablanca',
    lat: 33.5726,
    lng: -7.6328,
    taken: true,
  },
  {
    id: 'unit-ain-sebaa-designer',
    shortName: 'Ain Sebaa — Designer 2BR',
    title: '2-bedroom apartment — Ain Sebaa',
    description:
      'Fully furnished with velvet seating, marble coffee table, and a separate dining zone. Large windows with blinds. Suitable for professionals; parking may be available separately.',
    imageUrl: img('prop-2.png'),
    monthlyPrice: 6800,
    locationLabel: 'Boulevard Al Qods, Ain Sebaa, Casablanca',
    lat: 33.6091,
    lng: -7.5208,
    taken: false,
  },
  {
    id: 'unit-hay-riad-townhouse',
    shortName: 'Hay Riad — Townhouse',
    title: 'Modern townhouse — Hay Riad',
    description:
      'Corner unit with private garage, pedestrian entrance, glass balcony, and split AC. Contemporary façade in a gated community. Ideal for a small family.',
    imageUrl: img('prop-3.png'),
    monthlyPrice: 19500,
    locationLabel: 'Hay Riad, Casablanca',
    lat: 33.5412,
    lng: -7.6489,
    taken: true,
  },
  {
    id: 'unit-anfa-mediterranean',
    shortName: 'Anfa — Mediterranean',
    title: 'Mediterranean-style home — Anfa',
    description:
      'White stucco façade, arched entry with tile detail, secure gate, and mature trees on the street. Quiet residential street near amenities.',
    imageUrl: img('prop-4.png'),
    monthlyPrice: 11200,
    locationLabel: 'Quartier des Hôpitaux, Anfa, Casablanca',
    lat: 33.598,
    lng: -7.655,
    taken: false,
  },
  {
    id: 'unit-dar-bouazza-villa',
    shortName: 'Dar Bouazza — Pool villa',
    title: 'Villa with pool — Dar Bouazza',
    description:
      'Private pool, red-tile patio with outdoor dining, lounge seating, and landscaped garden. Bright white exterior with large glass doors. Long-term lease preferred.',
    imageUrl: img('prop-5.png'),
    monthlyPrice: 23500,
    locationLabel: 'Dar Bouazza, Casablanca',
    lat: 33.5142,
    lng: -7.8241,
    taken: true,
  },
  {
    id: 'unit-hay-hassani-bliving',
    shortName: 'Hay Hassani — B Living',
    title: 'Apartment — B Living (Shoreline 10)',
    description:
      'New-build with floor-to-ceiling glazing, recessed balconies, and black metal railings. Ground-floor lobby access. Coastal-style urban block.',
    imageUrl: img('prop-6.png'),
    monthlyPrice: 9200,
    locationLabel: 'Hay Hassani, near Shoreline access, Casablanca',
    lat: 33.5568,
    lng: -7.5689,
    taken: false,
  },
]
