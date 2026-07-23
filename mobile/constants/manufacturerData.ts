export type JobPeek = {
  id: string;
  category: string;
  product: string;
  quantity: string;
  budget: string;
  location: string;
  image?: string;
};

export type Job = JobPeek & {
  sme: string;
  description: string;
  deadline: string;
  requirements: string[];
  postedAt: string;
};

export type TimelineStage = {
  stage: string;
  date: string;
  completed: boolean;
};

export type Message = {
  from: string;
  message: string;
  timestamp: string;
};

export type Order = {
  id: string;
  job: string;
  sme: string;
  smeLogo: null | string;
  amount: string;
  milestone: number;
  milestoneLabel: string;
  dueIn: string;
  progress: number;
  urgent: boolean;
  description: string;
  specifications: string;
  quantity: string;
  deliveryAddress: string;
  timeline: TimelineStage[];
  messages: Message[];
};

// Jobs
export const JOBS: Job[] = [
  {
    id: "j1",
    category: "Packaging",
    product: "Aluminium Beverage Cans",
    quantity: "10,000 units",
    budget: "GH₵ 52,000",
    location: "Spintex Road, Accra",
    sme: "AfroDrinks Ltd",
    description:
      "We need a reliable manufacturer to produce 10,000 aluminium beverage cans with custom printed branding. Cans must meet food-grade standards and be ready for filling at our Spintex facility.",
    deadline: "2025-05-10",
    requirements: [
      "ISO 9001 certified production",
      "Custom artwork printing capability",
      "Experience with 3004 aluminium alloy",
      "Minimum 5,000-unit capacity per run",
    ],
    postedAt: "2025-04-28",
    image:
      "https://5.imimg.com/data5/SELLER/Default/2025/10/549803421/JE/WZ/UK/136717440/500ml-aluminium-beverage-can-1000x1000.png",
  },
  {
    id: "j2",
    category: "Hardware",
    product: "M10 Steel Bolts",
    quantity: "50,000 units",
    budget: "GH₵ 18,500",
    location: "Tema Industrial Area",
    sme: "BuildRight Co.",
    description:
      "Bulk order of M10 x 50mm zinc-plated steel bolts for construction projects across the Greater Accra region. Consistent quality and on-time delivery are critical.",
    deadline: "2025-05-20",
    requirements: [
      "Grade 8.8 steel compliance",
      "Zinc-plating with 12µm minimum coating",
      "Batch testing certificates required",
      "Delivery to Tema warehouse",
    ],
    postedAt: "2025-04-27",
    image: "https://www.jetwash.ie/site/wp-content/uploads/2024/07/bolt.png",
  },
  {
    id: "j3",
    category: "Plastics",
    product: "500ml PET Bottles",
    quantity: "20,000 units",
    budget: "GH₵ 31,000",
    location: "Achimota, Accra",
    sme: "PureWater Ghana",
    description:
      "Food-grade 500ml PET bottles for our bottled water line. Must be clear, BPA-free, and compatible with our automated filling line.",
    deadline: "2025-05-15",
    requirements: [
      "Food-grade PET resin only",
      "BPA-free certification",
      "28mm neck standard for capping machine",
      "Palletised delivery",
    ],
    postedAt: "2025-04-26",
    image: "https://cpimg.tistatic.com/6219622/b/1/500-ml-pet-bottle.jpg",
  },
  {
    id: "j4",
    category: "Textiles",
    product: "Branded Staff Uniforms",
    quantity: "500 sets",
    budget: "GH₵ 22,000",
    location: "Osu, Accra",
    sme: "QuickServe Hotels",
    description:
      "Production of 500 sets of branded staff uniforms for a mid-scale hotel chain. Includes shirts, trousers, and aprons. Must be durable, comfortable, and match brand colour specifications.",
    deadline: "2025-06-01",
    requirements: [
      "65% polyester / 35% cotton blend",
      "Colour-fast dye process",
      "Embroidery capability for logo placement",
      "Sizes range from XS to 3XL",
    ],
    postedAt: "2025-04-25",
  },
  {
    id: "j5",
    category: "Electronics",
    product: "Solar Lantern Assembly",
    quantity: "2,000 units",
    budget: "GH₵ 68,000",
    location: "Kumasi, Ashanti",
    sme: "BrightHome Energy",
    description:
      "Assembly of 2,000 solar-powered LED lanterns for rural electrification distribution. Components are supplied; manufacturer handles PCB assembly, housing, and QC testing.",
    deadline: "2025-05-28",
    requirements: [
      "SMT PCB assembly experience",
      "IP44 weatherproofing minimum",
      "100% unit-level QC testing",
      "Packaging with instruction leaflet",
    ],
    postedAt: "2025-04-24",
  },
  {
    id: "j6",
    category: "Food Processing",
    product: "Shea Butter Sachets",
    quantity: "30,000 sachets",
    budget: "GH₵ 14,500",
    location: "Tamale, Northern Region",
    sme: "NaturaCare Ghana",
    description:
      "Filling and sealing of 30,000 x 15g shea butter sachets for cosmetic retail. Raw shea butter is supplied by the client; manufacturer handles filling, sealing, and labelling.",
    deadline: "2025-05-18",
    requirements: [
      "HACCP-compliant facility",
      "Heat-seal sachet capability (15g)",
      "Custom label application",
      "Batch traceability records",
    ],
    postedAt: "2025-04-23",
  },
  {
    id: "j7",
    category: "Furniture",
    product: "Office Chairs",
    quantity: "200 units",
    budget: "GH₵ 40,000",
    location: "East Legon, Accra",
    sme: "Apex Workspaces Ltd",
    description:
      "Manufacturing of 200 ergonomic office chairs with adjustable height, lumbar support, and armrests. Must pass a 120kg load test and come with a 12-month warranty.",
    deadline: "2025-06-10",
    requirements: [
      "BIFMA load test compliance (120kg)",
      "Breathable mesh backrest",
      "5-star nylon base with castor wheels",
      "12-month manufacturer warranty",
    ],
    postedAt: "2025-04-22",
  },
  {
    id: "j8",
    category: "Agro-processing",
    product: "Dried Mango Slices",
    quantity: "5,000 kg",
    budget: "GH₵ 37,500",
    location: "Techiman, Bono East",
    sme: "TropiFresh Exports",
    description:
      "Processing and drying of 5,000kg of mango slices for export to EU markets. Must meet EU food safety standards with no added sugar or preservatives.",
    deadline: "2025-05-25",
    requirements: [
      "EU food safety certification",
      "No added sugar or sulphites",
      "Moisture content ≤ 14%",
      "Vacuum-sealed export packaging",
    ],
    postedAt: "2025-04-21",
  },
];

// Helper
export const getJobById = (id: string): Job | null =>
  JOBS.find((j) => j.id === id) ?? null;

//  Orders
export const ORDERS: Order[] = [
  {
    id: "o1",
    job: "Aluminium Cans",
    sme: "AfroDrinks Ltd",
    smeLogo: null,
    amount: "GH₵ 52,000",
    milestone: 2,
    milestoneLabel: "Quality Check",
    dueIn: "3 days",
    progress: 0.65,
    urgent: true,
    description:
      "Production of 10,000 aluminium beverage cans with custom branding.",
    specifications:
      "Material: 3004 aluminium, thickness 0.25mm, diameter 66mm, height 115mm",
    quantity: "10,000 units",
    deliveryAddress: "AfroDrinks Factory, Spintex Road, Accra",
    timeline: [
      { stage: "Order Confirmed", date: "2025-04-01", completed: true },
      { stage: "Raw Materials", date: "2025-04-05", completed: true },
      { stage: "Production", date: "2025-04-10", completed: true },
      { stage: "Quality Check", date: "2025-04-15", completed: false },
      { stage: "Delivery", date: "2025-04-20", completed: false },
    ],
    messages: [
      {
        from: "SME",
        message: "Can we speed up delivery?",
        timestamp: "2025-04-12 10:23",
      },
      {
        from: "Manufacturer",
        message: "We're on track for quality check.",
        timestamp: "2025-04-12 14:15",
      },
    ],
  },
  {
    id: "o2",
    job: "Steel Bolts",
    sme: "BuildRight Co.",
    smeLogo: null,
    amount: "GH₵ 18,500",
    milestone: 1,
    milestoneLabel: "Production",
    dueIn: "7 days",
    progress: 0.4,
    urgent: false,
    description: "Bulk production of M10 steel bolts for construction use.",
    specifications: "Material: Grade 8.8 steel, M10 x 50mm, zinc-plated",
    quantity: "50,000 units",
    deliveryAddress: "BuildRight Warehouse, Tema Industrial Area",
    timeline: [
      { stage: "Order Confirmed", date: "2025-04-03", completed: true },
      { stage: "Raw Materials", date: "2025-04-07", completed: true },
      { stage: "Production", date: "2025-04-14", completed: false },
      { stage: "Quality Check", date: "2025-04-18", completed: false },
      { stage: "Delivery", date: "2025-04-25", completed: false },
    ],
    messages: [
      {
        from: "SME",
        message: "Please confirm material grade.",
        timestamp: "2025-04-08 09:00",
      },
    ],
  },
  {
    id: "o3",
    job: "Branded Staff Uniforms",
    sme: "QuickServe Hotels",
    smeLogo: null,
    amount: "GH₵ 22,000",
    milestone: 1,
    milestoneLabel: "Raw Materials",
    dueIn: "12 days",
    progress: 0.2,
    urgent: false,
    description:
      "500 sets of branded staff uniforms including shirts, trousers, and aprons.",
    specifications:
      "65% polyester / 35% cotton, embroidered logo, sizes XS–3XL",
    quantity: "500 sets",
    deliveryAddress: "QuickServe Head Office, Osu, Accra",
    timeline: [
      { stage: "Order Confirmed", date: "2025-04-20", completed: true },
      { stage: "Raw Materials", date: "2025-04-25", completed: false },
      { stage: "Production", date: "2025-05-05", completed: false },
      { stage: "Quality Check", date: "2025-05-10", completed: false },
      { stage: "Delivery", date: "2025-05-15", completed: false },
    ],
    messages: [
      {
        from: "SME",
        message: "Please confirm fabric colour swatches before cutting.",
        timestamp: "2025-04-21 11:00",
      },
    ],
  },
  {
    id: "c1",
    job: "Plastic Bottles",
    sme: "PureWater Ghana",
    smeLogo: null,
    amount: "GH₵ 31,000",
    milestone: 5,
    milestoneLabel: "Delivered",
    dueIn: "Completed",
    progress: 1.0,
    urgent: false,
    description: "500ml PET plastic bottles for bottled water packaging.",
    specifications: "Material: PET, 500ml capacity, food-grade",
    quantity: "20,000 units",
    deliveryAddress: "PureWater Factory, Achimota, Accra",
    timeline: [
      { stage: "Order Confirmed", date: "2025-03-01", completed: true },
      { stage: "Raw Materials", date: "2025-03-05", completed: true },
      { stage: "Production", date: "2025-03-12", completed: true },
      { stage: "Quality Check", date: "2025-03-18", completed: true },
      { stage: "Delivery", date: "2025-03-25", completed: true },
    ],
    messages: [
      {
        from: "SME",
        message: "Bottles received in good condition!",
        timestamp: "2025-03-25 16:00",
      },
    ],
  },
];

export const getOrderById = (id: string): Order | null =>
  ORDERS.find((o) => o.id === id) ?? null;

export const ACTIVE_ORDERS = ORDERS.filter((o) => o.progress < 1.0);
export const COMPLETED_ORDERS = ORDERS.filter((o) => o.progress === 1.0);

// New Jobs (subset of JOBS shown on home feed)
export const NEW_JOBS: JobPeek[] = JOBS.slice(0, 5);

// Quick Actions
export type QuickAction = {
  label: string;
  icon: string;
  color: string;
  route?: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "My Orders",
    icon: "receipt-outline",
    color: "#6366F1",
    route: "/(screens)/(manufacturer)/(tabs)/orders",
  },
  {
    label: "Browse Jobs",
    icon: "briefcase-outline",
    color: "#10B981",
    route: "/(screens)/(manufacturer)/(tabs)/bids",
  },
  {
    label: "Payments",
    icon: "wallet-outline",
    color: "#F59E0B",
    // route: "/payments",
  },
  {
    label: "Support",
    icon: "headset-outline",
    color: "#EF4444",
    // route: "/support",
  },
];

// User
export type UserProfile = {
  name: string;
  company: string;
  initials: string;
  location: string;
  verified: boolean;
};

export const USER: UserProfile = {
  name: "Kwame Mensah",
  company: "Mensah Fabrications Ltd",
  initials: "MF",
  location: "Accra, Ghana",
  verified: true,
};
