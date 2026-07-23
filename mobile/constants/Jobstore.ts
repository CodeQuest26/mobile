// ─── Types ──────────────────────────────────────────────────────────────────────

export type JobStatus = "active" | "completed" | "draft";
export type BidStatus = "pending" | "accepted" | "rejected";

export interface SMEJob {
  id: string;
  category: string;
  product: string;
  quantity: string;
  budget: string;
  location: string;
  description: string;
  deadline: string;
  postedAt: string;
  status: JobStatus;
  bidsCount: number;
  image?: string;
}

export interface Bid {
  id: string;
  jobId: string;
  manufacturerId: string;
  amount: string;
  deliveryDays: number;
  notes: string;
  submittedAt: string;
  status: BidStatus;
}

export interface Manufacturer {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  capacity: string;
  specialties: string[];
  completedJobs: number;
  responseTime: string;
  verified: boolean;
  logo?: string;
  description: string;
}

/** Hydrated bid — includes full manufacturer object */
export interface BidWithManufacturer extends Bid {
  manufacturer: Manufacturer;
}

/** Hydrated job — includes all bids with manufacturer details */
export interface JobWithBids extends SMEJob {
  bids: BidWithManufacturer[];
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const SME_JOBS: SMEJob[] = [
  {
    id: "j1",
    category: "Packaging",
    product: "Aluminium Beverage Cans",
    quantity: "10,000 units",
    budget: "GH₵ 52,000",
    location: "Spintex Road, Accra",
    description:
      "Custom printed aluminium beverage cans for our new energy drink line. Must support offset print up to 6 colours with food-grade inner lining.",
    deadline: "2025-05-15",
    postedAt: "2025-04-28",
    status: "active",
    bidsCount: 3,
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
    description:
      "Bulk order of zinc-plated M10 grade-8 steel bolts for construction projects. Delivery to Tema port warehouse.",
    deadline: "2025-05-20",
    postedAt: "2025-04-27",
    status: "active",
    bidsCount: 2,
    image: "https://www.jetwash.ie/site/wp-content/uploads/2024/07/bolt.png",
  },
  {
    id: "j3",
    category: "Electronics",
    product: "Custom Circuit Boards",
    quantity: "5,000 units",
    budget: "GH₵ 75,000",
    location: "East Legon, Accra",
    description:
      "PCB assembly for IoT devices. 4-layer board, SMD components, IPC Class 2 workmanship standard.",
    deadline: "2025-06-01",
    postedAt: "2025-04-25",
    status: "completed",
    bidsCount: 2,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
  },
  {
    id: "j4",
    category: "Textiles",
    product: "Corporate Uniforms",
    quantity: "2,000 sets",
    budget: "GH₵ 45,000",
    location: "Cantonments, Accra",
    description:
      "Custom branded uniforms for retail staff. Polo shirt + trousers per set, embroidered logo.",
    deadline: "2025-07-15",
    postedAt: "2025-04-20",
    status: "draft",
    bidsCount: 0,
  },
  {
    id: "j5",
    category: "Food Processing",
    product: "Stainless Steel Tanks",
    quantity: "50 units",
    budget: "GH₵ 120,000",
    location: "Takoradi",
    description:
      "Large capacity 2,000-litre 316L stainless steel fermentation tanks for brewery expansion.",
    deadline: "2025-08-30",
    postedAt: "2025-04-15",
    status: "active",
    bidsCount: 1,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400",
  },
];

// ─── Manufacturers ────────────────────────────────────────────────────────────

export const MANUFACTURERS: Manufacturer[] = [
  {
    id: "m1",
    name: "Accra Metal Works",
    rating: 4.8,
    reviewCount: 127,
    location: "Accra Industrial Area",
    capacity: "50,000 units / month",
    specialties: ["Packaging", "Metal Fabrication", "Custom Printing"],
    completedJobs: 89,
    responseTime: "< 2 hrs",
    verified: true,
    logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100",
    description:
      "Leading manufacturer of metal packaging solutions with over 15 years of experience in the beverage industry. ISO 9001:2015 certified.",
  },
  {
    id: "m2",
    name: "Ghana Industrial Ltd",
    rating: 4.6,
    reviewCount: 95,
    location: "Tema Free Zone",
    capacity: "100,000 units / month",
    specialties: ["Packaging", "Plastics", "Electronics"],
    completedJobs: 156,
    responseTime: "< 4 hrs",
    verified: true,
    logo: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=100",
    description:
      "Full-service manufacturing company specialising in custom packaging and electronic components for West African markets.",
  },
  {
    id: "m3",
    name: "Tema Fasteners Co.",
    rating: 4.5,
    reviewCount: 63,
    location: "Tema Industrial Area",
    capacity: "200,000 units / month",
    specialties: ["Hardware", "Fasteners", "Bulk Manufacturing"],
    completedJobs: 44,
    responseTime: "< 6 hrs",
    verified: true,
    logo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100",
    description:
      "Specialist bulk fastener manufacturer supplying construction and engineering firms across Ghana and the ECOWAS region.",
  },
  {
    id: "m4",
    name: "TechBoard Ghana",
    rating: 4.9,
    reviewCount: 38,
    location: "Cantonments, Accra",
    capacity: "10,000 units / month",
    specialties: ["Electronics", "PCB Assembly", "IoT"],
    completedJobs: 27,
    responseTime: "< 3 hrs",
    verified: true,
    logo: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100",
    description:
      "Precision PCB assembly house focused on IoT and embedded systems. IPC-certified technicians with AOI and X-ray inspection in-house.",
  },
  {
    id: "m5",
    name: "SteelCraft Takoradi",
    rating: 4.7,
    reviewCount: 51,
    location: "Takoradi Industrial Hub",
    capacity: "500 units / month",
    specialties: ["Food Processing", "Stainless Fabrication", "Tanks"],
    completedJobs: 33,
    responseTime: "< 8 hrs",
    verified: false,
    description:
      "Specialist stainless steel fabricator serving the food and beverage sector. ASME pressure-vessel fabrication experience.",
  },
];

// ─── Bids ─────────────────────────────────────────────────────────────────────

export const BIDS: Bid[] = [
  // j1 – Aluminium Beverage Cans
  {
    id: "b1",
    jobId: "j1",
    manufacturerId: "m1",
    amount: "GH₵ 48,500",
    deliveryDays: 21,
    notes:
      "ISO 9001 certified with 10+ yrs in beverage packaging. Price includes tooling and one free colour proof.",
    submittedAt: "2025-04-29",
    status: "pending",
  },
  {
    id: "b2",
    jobId: "j1",
    manufacturerId: "m2",
    amount: "GH₵ 51,200",
    deliveryDays: 18,
    notes:
      "State-of-the-art rotary printing line. Fastest turnaround in Accra — includes 500 bonus units.",
    submittedAt: "2025-04-30",
    status: "pending",
  },
  {
    id: "b3",
    jobId: "j1",
    manufacturerId: "m3",
    amount: "GH₵ 46,000",
    deliveryDays: 28,
    notes:
      "Most competitive rate. Can scale to 15,000 units at the same unit price if needed.",
    submittedAt: "2025-05-01",
    status: "pending",
  },
  // j2 – Steel Bolts
  {
    id: "b4",
    jobId: "j2",
    manufacturerId: "m3",
    amount: "GH₵ 16,800",
    deliveryDays: 14,
    notes:
      "DIN 933 spec, zinc-plated. Certificate of conformity and batch test report included.",
    submittedAt: "2025-04-28",
    status: "pending",
  },
  {
    id: "b5",
    jobId: "j2",
    manufacturerId: "m1",
    amount: "GH₵ 17,500",
    deliveryDays: 10,
    notes:
      "Faster 10-day delivery. Grade-8 guaranteed with full batch test report.",
    submittedAt: "2025-04-29",
    status: "pending",
  },
  // j3 – Circuit Boards (completed)
  {
    id: "b6",
    jobId: "j3",
    manufacturerId: "m4",
    amount: "GH₵ 72,000",
    deliveryDays: 30,
    notes:
      "IPC Class 2 workmanship. AOI and ICT included. Accepted and successfully delivered.",
    submittedAt: "2025-04-26",
    status: "accepted",
  },
  {
    id: "b7",
    jobId: "j3",
    manufacturerId: "m2",
    amount: "GH₵ 74,500",
    deliveryDays: 25,
    notes:
      "Full SMD line available. Slightly higher price for a faster lead time.",
    submittedAt: "2025-04-27",
    status: "rejected",
  },
  // j5 – Stainless Steel Tanks
  {
    id: "b8",
    jobId: "j5",
    manufacturerId: "m5",
    amount: "GH₵ 115,000",
    deliveryDays: 60,
    notes:
      "ASME-experienced team. Pressure testing, certs, and optional on-site installation available.",
    submittedAt: "2025-04-18",
    status: "pending",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getManufacturerById = (id: string): Manufacturer | undefined =>
  MANUFACTURERS.find((m) => m.id === id);

export const getJobById = (id: string): SMEJob | undefined =>
  SME_JOBS.find((j) => j.id === id);

export const getBidsForJob = (jobId: string): BidWithManufacturer[] =>
  BIDS.filter((b) => b.jobId === jobId).map((bid) => ({
    ...bid,
    manufacturer: getManufacturerById(bid.manufacturerId)!,
  }));

export const getJobWithBids = (jobId: string): JobWithBids | undefined => {
  const job = getJobById(jobId);
  if (!job) return undefined;
  return { ...job, bids: getBidsForJob(jobId) };
};

export const getDaysUntilDeadline = (deadline: string): number => {
  const today = new Date();
  return Math.ceil(
    (new Date(deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};
