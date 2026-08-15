import { Medicine, Hospital, Donor, Reminder, Appointment, Activity, HealthTip, Insurance, Recipe, HealthyLiving, VitalsData, PermissionStatus } from "./types";

export const MOCK_MEDICINES: Medicine[] = [
  {
    id: "1",
    name: "Paracetamol",
    genericName: "Acetaminophen",
    form: "Tablet",
    pack: "10s",
    price: 45,
    substitutes: ["Crocin", "Dolo 650"],
    pharmacy: "CityCare Pharmacy",
    verified: true,
    timestamp: "2h ago",
    trend: "stable",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop",
    dosage: "500mg",
    restrictions: ["Avoid alcohol", "Do not exceed 4g/day"],
    cheapestInIndia: "Generic stores (Jan Aushadhi)"
  },
  {
    id: "2",
    name: "Amoxicillin",
    genericName: "Amoxicillin Trihydrate",
    form: "Capsule",
    pack: "15s",
    price: 120,
    substitutes: ["Mox", "Novamox"],
    pharmacy: "Wellness Meds",
    verified: true,
    timestamp: "1h ago",
    trend: "down",
    imageUrl: "https://images.unsplash.com/photo-1576071804486-b8bc22106dbf?q=80&w=400&auto=format&fit=crop",
    dosage: "250mg / 5ml",
    restrictions: ["Complete full course", "May cause diarrhea"],
    cheapestInIndia: "Local pharmacies with discount cards"
  },
  {
    id: "3",
    name: "Metformin",
    genericName: "Metformin Hydrochloride",
    form: "Tablet",
    pack: "30s",
    price: 85,
    substitutes: ["Glycomet", "Glyciphage"],
    pharmacy: "Metro Health",
    verified: false,
    timestamp: "5h ago",
    trend: "up",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-ad5fe9afef72?q=80&w=400&auto=format&fit=crop",
    dosage: "500mg / 1000mg",
    restrictions: ["Take with meals", "Monitor kidney function"],
    cheapestInIndia: "Online pharmacies (1mg, Pharmeasy) or Jan Aushadhi"
  }
];

export const MOCK_VITALS: VitalsData = {
  heartRate: 72,
  steps: 8432,
  calories: 450,
  sleepHours: 7.5,
  spO2: 98,
  elevation: 12,
  timestamp: "Just now"
};

export const MOCK_PERMISSIONS: PermissionStatus[] = [
  { 
    id: "activity", 
    name: "Physical Activity", 
    description: "Access accelerometer & gyroscope for step counting", 
    status: 'granted',
    icon: "Activity"
  },
  { 
    id: "location", 
    name: "Location Services", 
    description: "GPS for tracking outdoor routes and speed", 
    status: 'prompt',
    icon: "MapPin"
  },
  { 
    id: "body", 
    name: "Body Sensors", 
    description: "Access heart rate and SpO2 sensors", 
    status: 'denied',
    icon: "Heart"
  },
  { 
    id: "bluetooth", 
    name: "Nearby Devices", 
    description: "Sync with smartwatches and wearables", 
    status: 'prompt',
    icon: "Bluetooth"
  },
  { 
    id: "health", 
    name: "Health Connect", 
    description: "Sync data with Android Health / Apple HealthKit", 
    status: 'granted',
    icon: "ShieldCheck"
  }
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: "1",
    title: "Zen Green Smoothie",
    description: "A refreshing blend of spinach, green apple, and ginger for a morning detox.",
    benefits: ["Detoxification", "Energy Boost", "Rich in Vitamin C"],
    imageUrl: "https://picsum.photos/seed/smoothie/400/300"
  },
  {
    id: "2",
    title: "Miso Tofu Bowl",
    description: "Probiotic-rich miso with steamed tofu and seasonal Asian greens.",
    benefits: ["Gut Health", "High Protein", "Low Calorie"],
    imageUrl: "https://picsum.photos/seed/miso/400/300"
  }
];

export const MOCK_HEALTHY_LIVING: HealthyLiving[] = [
  {
    id: "1",
    title: "Mindful Walking",
    content: "Practice 15 minutes of mindful walking daily to reduce stress and improve circulation.",
    icon: "Footprints"
  },
  {
    id: "2",
    title: "Forest Bathing",
    content: "Spend time in nature to lower cortisol levels and boost your immune system.",
    icon: "Trees"
  }
];

export const MOCK_REMINDERS: Reminder[] = [
  { id: "1", medicineName: "Paracetamol", time: "08:00 AM", taken: true },
  { id: "2", medicineName: "Metformin", time: "01:00 PM", taken: false },
  { id: "3", medicineName: "Amoxicillin", time: "09:00 PM", taken: false },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { 
    id: "1", 
    doctorName: "Dr. Sarah Chen", 
    hospitalName: "Apollo Speciality", 
    date: "Oct 24, 2024", 
    time: "10:30 AM", 
    type: "Cardiology Follow-up" 
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: "1", type: "scan", description: "Scanned prescription for Paracetamol", timestamp: "2h ago" },
  { id: "2", type: "search", description: "Searched for 'Best Neurologist'", timestamp: "Yesterday" },
];

export const MOCK_TIPS: HealthTip[] = [
  {
    id: "1",
    title: "Hydration in Tropical Climates",
    content: "Staying hydrated is crucial in Asia's humid weather. Aim for 3L of water daily.",
    category: "Wellness",
    imageUrl: "https://picsum.photos/seed/water/400/200"
  },
  {
    id: "2",
    title: "Benefits of Green Tea",
    content: "Rich in antioxidants, green tea helps boost metabolism and focus.",
    category: "Nutrition",
    imageUrl: "https://picsum.photos/seed/tea/400/200"
  }
];

export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: "1",
    name: "Apollo Speciality Hospital",
    location: "Chennai, India",
    capabilityScore: 95,
    costRange: "$$$",
    bedAvailability: 12,
    distance: "2.5 km",
    bestFit: true,
    badges: ["Cardiology", "Emergency"],
    reviewSummary: "Excellent cardiac care, highly rated for emergency response."
  },
  {
    id: "2",
    name: "Fortis Memorial",
    location: "Gurugram, India",
    capabilityScore: 88,
    costRange: "$$",
    bedAvailability: 5,
    distance: "4.1 km",
    bestFit: false,
    badges: ["Neurology", "Orthopedics"],
    reviewSummary: "Good facilities, but wait times can be long."
  },
  {
    id: "3",
    name: "Max Healthcare",
    location: "New Delhi, India",
    capabilityScore: 92,
    costRange: "$$$",
    bedAvailability: 8,
    distance: "3.8 km",
    bestFit: true,
    badges: ["Oncology", "Pediatrics"],
    reviewSummary: "State of the art oncology department."
  }
];

export const MOCK_DONORS: Donor[] = [
  {
    id: "1",
    type: "O+ Blood",
    distance: "1.2 km",
    availability: "Immediate",
    verified: true,
    eta: "15 mins",
    maskedContact: "+91 ******7890",
    role: 'donor'
  },
  {
    id: "2",
    type: "B- Blood",
    distance: "5.4 km",
    availability: "Within 2h",
    verified: true,
    eta: "45 mins",
    maskedContact: "+91 ******4321",
    role: 'donor'
  },
  {
    id: "3",
    type: "AB+ Blood Needed",
    distance: "3.2 km",
    availability: "Urgent",
    verified: true,
    eta: "N/A",
    maskedContact: "+91 ******9988",
    role: 'needer'
  },
  {
    id: "4",
    type: "Kidney (Registered)",
    distance: "12 km",
    availability: "On Request",
    verified: true,
    eta: "N/A",
    maskedContact: "+91 ******1122",
    role: 'donor'
  }
];

export const MOCK_INSURANCE: Insurance[] = [
  {
    id: "1",
    provider: "Star Health",
    planName: "Family Health Optima",
    monthlyPremium: 15,
    coverageAmount: "₹25 Lakhs",
    features: ["Cashless at 12,000+ hospitals", "No pre-policy checkup up to 50 years"],
    termsSummary: "Comprehensive family floater plan with restoration benefits.",
    link: "https://www.starhealth.in/"
  },
  {
    id: "2",
    provider: "HDFC ERGO",
    planName: "Optima Restore",
    monthlyPremium: 18,
    coverageAmount: "₹50 Lakhs",
    features: ["Restore benefit", "Stay active discount"],
    termsSummary: "Automatic restoration of sum insured upon exhaustion.",
    link: "https://www.hdfcergo.com/"
  },
  {
    id: "3",
    provider: "Cigna Global",
    planName: "Platinum Plan",
    monthlyPremium: 250,
    coverageAmount: "Unlimited",
    features: ["Worldwide coverage", "24/7 multilingual support"],
    termsSummary: "Premium global health insurance for expatriates.",
    link: "https://www.cignaglobal.com/"
  },
  {
    id: "4",
    provider: "Bupa Global",
    planName: "Elite Health Plan",
    monthlyPremium: 320,
    coverageAmount: "Unlimited",
    features: ["Full cancer cover", "Evacuation & Repatriation"],
    termsSummary: "Top-tier international health coverage with concierge service.",
    link: "https://www.bupaglobal.com/"
  },
  {
    id: "5",
    provider: "ICICI Lombard",
    planName: "Health Shield",
    monthlyPremium: 20,
    coverageAmount: "₹1 Crore",
    features: ["Wellness rewards", "Unlimited reset"],
    termsSummary: "Modern health shield with extensive wellness benefits.",
    link: "https://www.icicilombard.com/"
  }
];

export const SUGGESTED_AI_PROMPTS = [
  {
    title: "Explain a medical term",
    prompt: "Can you explain what 'Hypertension Stage 1' and 'Systolic vs Diastolic' mean in simple terms?",
    category: "Terminology"
  },
  {
    title: "Help me understand my report",
    prompt: "Can you explain what a high blood pressure reading generally means?",
    category: "Lab & Reports"
  },
  {
    title: "What questions should I ask my doctor?",
    prompt: "What are the most important questions I should ask my doctor during an annual cardiology check-up?",
    category: "Preparation"
  },
  {
    title: "Help me understand my symptoms",
    prompt: "I've had mild headaches and eye fatigue after long screen hours. How should I think about these symptoms?",
    category: "Symptom Context"
  },
  {
    title: "Prepare for doctor's appointment",
    prompt: "How can I best prepare my medical history, symptoms list, and medications before seeing a new specialist?",
    category: "Care Navigation"
  }
];

export const MOCK_TIMELINE_EVENTS = [
  {
    id: "tl-1",
    title: "Comprehensive Metabolic Panel (CMP) Completed",
    date: "August 12, 2026",
    time: "09:30 AM",
    type: "report" as const,
    description: "Routine fasting blood tests covering kidney and liver function, glucose, and electrolytes.",
    details: "Glucose fasting: 94 mg/dL (Normal). eGFR: >90 mL/min (Normal). Electrolytes within optimal reference ranges.",
    provider: "Apollo Diagnostics Lab",
    status: "reviewed" as const,
    tags: ["Lab Report", "Routine", "Blood Panel"],
    isDemo: true
  },
  {
    id: "tl-2",
    title: "Cardiology Consultation & ECG Review",
    date: "July 28, 2026",
    time: "11:15 AM",
    type: "appointment" as const,
    description: "In-person assessment with Dr. Sarah Chen to review blood pressure trends and resting heart rhythm.",
    details: "Resting BP observed at 122/80 mmHg. Sinus rhythm confirmed. Recommended continuing daily 30-minute brisk walk and low-sodium hydration routine.",
    provider: "Metro Specialty Clinic",
    status: "completed" as const,
    tags: ["Cardiology", "Consultation", "ECG"],
    isDemo: true
  },
  {
    id: "tl-3",
    title: "Medication Adjustment: Metformin & Vitamin D3",
    date: "June 15, 2026",
    time: "04:00 PM",
    type: "medication" as const,
    description: "Updated daily regimen for metabolic health and seasonal vitamin balance.",
    details: "Metformin 500mg once daily with evening meal. Vitamin D3 2000 IU softgel once daily morning with food.",
    provider: "Wellness Meds Pharmacy",
    status: "completed" as const,
    tags: ["Medication", "Prescription", "Metabolic"],
    isDemo: true
  },
  {
    id: "tl-4",
    title: "AI Health Navigator Analysis: Blood Pressure Guidelines",
    date: "May 20, 2026",
    time: "02:45 PM",
    type: "ai_interaction" as const,
    description: "Reviewed educational guidance on healthy systolic ranges and lifestyle measures for cardiovascular wellness.",
    details: "HealthNav AI provided structured overview of home monitoring techniques, hydration impact, and recommended discussion points for physician review.",
    provider: "HealthNav AI",
    status: "reviewed" as const,
    tags: ["AI Navigator", "Education", "Vitals"],
    isDemo: true
  },
  {
    id: "tl-5",
    title: "Annual Preventive Health Screening",
    date: "March 10, 2026",
    time: "10:00 AM",
    type: "assessment" as const,
    description: "Full health screening including lipid panel, BMI, vision, and pulmonary function check.",
    details: "Total Cholesterol: 185 mg/dL. HDL: 54 mg/dL. LDL: 110 mg/dL. All vital indicators recorded in healthy operational ranges.",
    provider: "City Care Health Center",
    status: "completed" as const,
    tags: ["Preventive", "Annual Check", "Lipid Profile"],
    isDemo: true
  }
];

export const MOCK_HEALTH_RECORDS = [
  {
    id: "rec-1",
    title: "Comprehensive Blood Panel & Lipid Profile",
    category: "Lab Reports" as const,
    date: "Aug 12, 2026",
    fileName: "blood_panel_aug2026.pdf",
    fileSize: "1.4 MB",
    status: "Verified" as const,
    provider: "Apollo Diagnostics",
    summary: "Fasting lipid profile, HbA1c (5.4%), renal function tests, and liver enzymes within normal parameters.",
    tags: ["Lipid Profile", "HbA1c", "Routine"],
    notes: "Follow-up recommended in 6 months for routine monitoring.",
    isDemo: true
  },
  {
    id: "rec-2",
    title: "Cardiology Consultation Prescription",
    category: "Prescriptions" as const,
    date: "Jul 28, 2026",
    fileName: "rx_cardiology_chen_jul2026.pdf",
    fileSize: "480 KB",
    status: "Verified" as const,
    provider: "Dr. Sarah Chen, MD",
    summary: "Maintenance regimen prescription including Metformin 500mg and daily multivitamin supplement.",
    tags: ["Prescription", "Cardiology", "Active"],
    notes: "Take with food. Verified by pharmacist.",
    isDemo: true
  },
  {
    id: "rec-3",
    title: "Chest X-Ray Digital Imaging & Radiologist Note",
    category: "Imaging" as const,
    date: "May 04, 2026",
    fileName: "chest_xray_radiology_may2026.pdf",
    fileSize: "4.8 MB",
    status: "Verified" as const,
    provider: "Metro Imaging & Diagnostics",
    summary: "PA view chest radiograph demonstrates clear lung fields, normal cardiothoracic ratio, and no focal consolidation.",
    tags: ["Radiology", "X-Ray", "Lungs"],
    notes: "No acute cardiopulmonary disease detected.",
    isDemo: true
  },
  {
    id: "rec-4",
    title: "Annual Seasonal Influenza Vaccination Record",
    category: "Vaccination" as const,
    date: "Nov 14, 2025",
    fileName: "flu_vaccine_certificate_2025.pdf",
    fileSize: "320 KB",
    status: "Verified" as const,
    provider: "City Public Health Clinic",
    summary: "Quadrivalent inactivated influenza vaccine administered in left deltoid.",
    tags: ["Vaccination", "Immunization", "Influenza"],
    notes: "Next booster due Autumn 2026.",
    isDemo: true
  },
  {
    id: "rec-5",
    title: "Clinical Summary & Discharge Summary Note",
    category: "Medical Reports" as const,
    date: "Jan 18, 2025",
    fileName: "clinical_summary_jan2025.pdf",
    fileSize: "890 KB",
    status: "Processed" as const,
    provider: "Fortis Memorial Hospital",
    summary: "Outpatient orthopedic assessment following mild ankle sprain. Resolved with conservative physiotherapy.",
    tags: ["Outpatient", "Orthopedic", "Summary"],
    notes: "Fully rehabilitated. No ongoing restrictions.",
    isDemo: true
  }
];

