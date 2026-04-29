export const USER = {
  company: "Mensah Fabrications Ltd",
  location: "Tema Industrial Area, Tema",
  initials: "MF",
  verified: true,
};

export const STATS = [
  {
    label: "Active Orders",
    value: "4",
    icon: "cube-outline",
    color: "#6366F1",
  },
  { label: "Open Bids", value: "7", icon: "hammer-outline", color: "#F59E0B" },
  {
    label: "This Month",
    value: "GH₵ 14.2k",
    icon: "trending-up-outline",
    color: "#22C55E",
  },
  {
    label: "Pending Pay",
    value: "GH₵ 52k",
    icon: "time-outline",
    color: "#EF4444",
  },
];

export const ACTIVE_ORDERS = [
  {
    id: "o1",
    job: "Aluminium Cans",
    sme: "AfroDrinks Ltd",
    amount: "GH₵ 52,000",
    milestone: 2,
    milestoneLabel: "Quality Check",
    dueIn: "3 days",
    progress: 0.65,
    urgent: true,
  },
  {
    id: "o2",
    job: "Steel Frames",
    sme: "BuildRight Ghana",
    amount: "GH₵ 28,000",
    milestone: 1,
    milestoneLabel: "In Production",
    dueIn: "12 days",
    progress: 0.35,
    urgent: false,
  },
];

export const NEW_JOBS = [
  {
    id: "j1",
    product: "Plastic Containers",
    quantity: "5,000 units",
    budget: "GH₵ 8k–12k",
    location: "Accra",
    category: "Packaging",
  },
  {
    id: "j2",
    product: "Wooden Pallets",
    quantity: "200 units",
    budget: "GH₵ 3.5k–5k",
    location: "Kumasi",
    category: "Logistics",
  },
  {
    id: "j3",
    product: "Cotton Bags",
    quantity: "1,000 units",
    budget: "GH₵ 2k–3k",
    location: "Takoradi",
    category: "Fashion",
  },
];

export const QUICK_ACTIONS = [
  { label: "Browse Jobs", icon: "search-outline", color: "#6366F1" },
  { label: "My Bids", icon: "hammer-outline", color: "#F59E0B" },
  { label: "Earnings", icon: "wallet-outline", color: "#22C55E" },
  { label: "Messages", icon: "chatbubble-outline", color: "#EC4899" },
];
