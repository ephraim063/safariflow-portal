export const MOCK_QUOTES = [
  {
    id: 'Q-2024-001',
    client_name: 'James & Sarah Okafor',
    client_email: 'james.okafor@email.com',
    client_phone: '+27 82 555 0101',
    destination: 'Bali, Indonesia',
    travel_dates: '15 Mar - 25 Mar 2025',
    num_travelers: 2,
    total_amount: 87500,
    status: 'Sent',
    date_created: '2024-01-15',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Return Flights JNB → DPS', details: 'Economy, Singapore Airlines', unit_price: 15500, quantity: 2 },
      { description: 'The Mulia Resort - 10 Nights', details: 'Deluxe Ocean View Suite', unit_price: 42000, quantity: 1 },
      { description: 'Airport Transfers', details: 'Private return', unit_price: 2200, quantity: 1 },
      { description: 'Bali Discovery Tour', details: 'Full day guided', unit_price: 3500, quantity: 2 },
    ]
  },
  {
    id: 'Q-2024-002',
    client_name: 'Priya Naidoo',
    client_email: 'priya.naidoo@email.com',
    client_phone: '+27 71 555 0202',
    destination: 'Santorini, Greece',
    travel_dates: '01 Jun - 10 Jun 2025',
    num_travelers: 2,
    total_amount: 124000,
    status: 'Accepted',
    date_created: '2024-01-12',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Return Flights JNB → ATH', details: 'Business class, Emirates', unit_price: 28000, quantity: 2 },
      { description: 'Canaves Oia Suites - 9 Nights', details: 'Cave suite, breakfast included', unit_price: 58000, quantity: 1 },
      { description: 'Island Tours Package', details: 'Volcano, wine tasting, sunset cruise', unit_price: 10000, quantity: 1 },
    ]
  },
  {
    id: 'Q-2024-003',
    client_name: 'Michael van der Berg',
    client_email: 'mvdberg@email.com',
    client_phone: '+27 83 555 0303',
    destination: 'Dubai, UAE',
    travel_dates: '20 Feb - 27 Feb 2025',
    num_travelers: 4,
    total_amount: 156000,
    status: 'Draft',
    date_created: '2024-01-18',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Return Flights JNB → DXB', details: 'Economy, Emirates', unit_price: 12000, quantity: 4 },
      { description: 'Atlantis The Palm - 7 Nights', details: 'Superior Room, breakfast', unit_price: 55000, quantity: 1 },
      { description: 'Desert Safari', details: 'Evening with dinner', unit_price: 4500, quantity: 4 },
      { description: 'City Tour', details: 'Full day with guide', unit_price: 3500, quantity: 4 },
    ]
  },
  {
    id: 'Q-2024-004',
    client_name: 'Amara & Kwame Mensah',
    client_email: 'amara.mensah@email.com',
    client_phone: '+27 79 555 0404',
    destination: 'Maldives',
    travel_dates: '14 Apr - 21 Apr 2025',
    num_travelers: 2,
    total_amount: 198000,
    status: 'Sent',
    date_created: '2024-01-20',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Return Flights JNB → MLE', details: 'Business class, Qatar Airways', unit_price: 35000, quantity: 2 },
      { description: 'Soneva Fushi - 7 Nights', details: 'Water Villa with Pool', unit_price: 98000, quantity: 1 },
      { description: 'Seaplane Transfer', details: 'Return to resort', unit_price: 15000, quantity: 1 },
    ]
  },
  {
    id: 'Q-2024-005',
    client_name: 'Lisa Botha',
    client_email: 'lisa.botha@email.com',
    client_phone: '+27 84 555 0505',
    destination: 'Paris, France',
    travel_dates: '10 May - 18 May 2025',
    num_travelers: 1,
    total_amount: 65000,
    status: 'Draft',
    date_created: '2024-01-22',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Return Flights JNB → CDG', details: 'Economy, Air France', unit_price: 18000, quantity: 1 },
      { description: 'Hotel Le Marais - 8 Nights', details: 'Superior room, breakfast', unit_price: 38000, quantity: 1 },
      { description: 'Paris City Tour', details: 'Eiffel, Louvre, Versailles', unit_price: 9000, quantity: 1 },
    ]
  },
]

export const MOCK_CLIENTS = [
  { id: 'C-001', name: 'James & Sarah Okafor', email: 'james.okafor@email.com', phone: '+27 82 555 0101', quotes: 3, bookings: 2, value: 245000, added: '2023-11-01' },
  { id: 'C-002', name: 'Priya Naidoo', email: 'priya.naidoo@email.com', phone: '+27 71 555 0202', quotes: 2, bookings: 2, value: 198000, added: '2023-10-15' },
  { id: 'C-003', name: 'Michael van der Berg', email: 'mvdberg@email.com', phone: '+27 83 555 0303', quotes: 1, bookings: 0, value: 156000, added: '2024-01-18' },
  { id: 'C-004', name: 'Amara & Kwame Mensah', email: 'amara.mensah@email.com', phone: '+27 79 555 0404', quotes: 4, bookings: 3, value: 542000, added: '2023-09-20' },
  { id: 'C-005', name: 'Lisa Botha', email: 'lisa.botha@email.com', phone: '+27 84 555 0505', quotes: 1, bookings: 0, value: 65000, added: '2024-01-22' },
]

export const MONTHLY_DATA = [
  { month: 'Aug', quotes: 18, revenue: 890000 },
  { month: 'Sep', quotes: 24, revenue: 1240000 },
  { month: 'Oct', quotes: 21, revenue: 1050000 },
  { month: 'Nov', quotes: 32, revenue: 1680000 },
  { month: 'Dec', quotes: 28, revenue: 1420000 },
  { month: 'Jan', quotes: 35, revenue: 1890000 },
]
