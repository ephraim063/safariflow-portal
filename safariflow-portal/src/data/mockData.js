export const CURRENCY = { code: 'USD', symbol: '$' }

export const MOCK_QUOTES = [
  {
    id: 'Q-2024-001',
    client_name: 'James & Sarah Okafor',
    client_email: 'james.okafor@email.com',
    client_phone: '+254 722 555 101',
    destination: 'Masai Mara, Kenya',
    travel_dates: '15 Jul - 22 Jul 2025',
    num_travelers: 2,
    total_amount: 8400,
    status: 'Sent',
    date_created: '2024-01-15',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Masai Mara Safari - 7 Nights', details: 'Governors Camp, full board', unit_price: 5600, quantity: 1 },
      { description: 'Game Drives', details: 'Twice daily in 4x4 landcruiser', unit_price: 800, quantity: 2 },
      { description: 'Nairobi Airport Transfers', details: 'Private return', unit_price: 400, quantity: 1 },
      { description: 'Park Fees', details: 'Masai Mara conservancy fee', unit_price: 400, quantity: 2 },
    ]
  },
  {
    id: 'Q-2024-002',
    client_name: 'Priya & Raj Naidoo',
    client_email: 'priya.naidoo@email.com',
    client_phone: '+254 733 555 202',
    destination: 'Serengeti, Tanzania',
    travel_dates: '01 Aug - 10 Aug 2025',
    num_travelers: 2,
    total_amount: 12800,
    status: 'Accepted',
    date_created: '2024-01-12',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Serengeti Migration Safari - 9 Nights', details: 'Four Seasons Serengeti, full board', unit_price: 9800, quantity: 1 },
      { description: 'Hot Air Balloon Safari', details: 'Sunrise balloon with champagne breakfast', unit_price: 650, quantity: 2 },
      { description: 'Kilimanjaro Airport Transfers', details: 'Private return', unit_price: 350, quantity: 1 },
    ]
  },
  {
    id: 'Q-2024-003',
    client_name: 'Michael & Family Chen',
    client_email: 'mchen@email.com',
    client_phone: '+256 772 555 303',
    destination: 'Bwindi, Uganda',
    travel_dates: '20 Sep - 27 Sep 2025',
    num_travelers: 4,
    total_amount: 18600,
    status: 'Draft',
    date_created: '2024-01-18',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Gorilla Trekking Permits', details: 'Bwindi Impenetrable Forest', unit_price: 700, quantity: 4 },
      { description: 'Bwindi Lodge - 7 Nights', details: 'Luxury forest lodge, full board', unit_price: 1200, quantity: 4 },
      { description: 'Chimpanzee Trekking', details: 'Kibale Forest guided trek', unit_price: 250, quantity: 4 },
      { description: 'Kampala Transfers', details: 'Private 4x4 return', unit_price: 600, quantity: 1 },
    ]
  },
  {
    id: 'Q-2024-004',
    client_name: 'Amara & Kwame Mensah',
    client_email: 'amara.mensah@email.com',
    client_phone: '+255 754 555 404',
    destination: 'Zanzibar, Tanzania',
    travel_dates: '14 Jun - 21 Jun 2025',
    num_travelers: 2,
    total_amount: 4800,
    status: 'Sent',
    date_created: '2024-01-20',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Zanzibar Beach Resort - 7 Nights', details: 'Zuri Zanzibar, breakfast included', unit_price: 3200, quantity: 1 },
      { description: 'Spice Island Tour', details: 'Full day guided spice tour', unit_price: 120, quantity: 2 },
      { description: 'Dhow Sunset Cruise', details: 'Traditional dhow with dinner', unit_price: 180, quantity: 2 },
      { description: 'Stone Town Half Day Tour', details: 'UNESCO heritage walking tour', unit_price: 80, quantity: 2 },
    ]
  },
  {
    id: 'Q-2024-005',
    client_name: 'Lisa & Tom Anderson',
    client_email: 'lisa.anderson@email.com',
    client_phone: '+250 788 555 505',
    destination: 'Volcanoes NP, Rwanda',
    travel_dates: '10 Oct - 18 Oct 2025',
    num_travelers: 2,
    total_amount: 9600,
    status: 'Draft',
    date_created: '2024-01-22',
    agent_name: 'Ibrahim',
    items: [
      { description: 'Gorilla Trekking Permits', details: 'Volcanoes National Park', unit_price: 1500, quantity: 2 },
      { description: 'Bisate Lodge - 8 Nights', details: 'Eco-luxury lodge, full board', unit_price: 2800, quantity: 1 },
      { description: 'Golden Monkey Trekking', details: 'Guided half day trek', unit_price: 100, quantity: 2 },
      { description: 'Kigali City Tour', details: 'Genocide Memorial + cultural sites', unit_price: 150, quantity: 2 },
    ]
  },
]

export const MOCK_CLIENTS = [
  { id: 'C-001', name: 'James & Sarah Okafor', email: 'james.okafor@email.com', phone: '+254 722 555 101', quotes: 3, bookings: 2, value: 18400, added: '2023-11-01' },
  { id: 'C-002', name: 'Priya & Raj Naidoo', email: 'priya.naidoo@email.com', phone: '+254 733 555 202', quotes: 2, bookings: 2, value: 22600, added: '2023-10-15' },
  { id: 'C-003', name: 'Michael & Family Chen', email: 'mchen@email.com', phone: '+256 772 555 303', quotes: 1, bookings: 0, value: 18600, added: '2024-01-18' },
  { id: 'C-004', name: 'Amara & Kwame Mensah', email: 'amara.mensah@email.com', phone: '+255 754 555 404', quotes: 4, bookings: 3, value: 38200, added: '2023-09-20' },
  { id: 'C-005', name: 'Lisa & Tom Anderson', email: 'lisa.anderson@email.com', phone: '+250 788 555 505', quotes: 1, bookings: 0, value: 9600, added: '2024-01-22' },
]

export const MONTHLY_DATA = [
  { month: 'Aug', quotes: 18, revenue: 142000 },
  { month: 'Sep', quotes: 24, revenue: 198000 },
  { month: 'Oct', quotes: 21, revenue: 168000 },
  { month: 'Nov', quotes: 32, revenue: 245000 },
  { month: 'Dec', quotes: 28, revenue: 224000 },
  { month: 'Jan', quotes: 35, revenue: 312000 },
]
