export type Medicine = {
  id: string;
  name: string;
  genericName?: string;
  form: string;
  pack: string;
  price: number;
  substitutes: string[];
  pharmacy: string;
  verified: boolean;
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
  imageUrl?: string;
  dosage?: string;
  restrictions?: string[];
  cheapestInIndia?: string;
};

export type Hospital = {
  id: string;
  name: string;
  location: string;
  distance: string;
  bedAvailability: number | string;
  costRange: string;
  consultationFee?: string;
  capabilityScore: number;
  badges: string[];
  reviewSummary: string;
  bestFit?: boolean;
  appointmentLink?: string;
  availabilityStatus?: 'Available' | 'Busy' | 'Limited';
  nextSlot?: string;
  imageUrl?: string;
};

export type Donor = {
  id: string;
  type: string;
  distance: string;
  availability: string;
  verified: boolean;
  eta: string;
  maskedContact: string;
  role: 'donor' | 'needer';
};

export type Insurance = {
  id: string;
  provider: string;
  planName: string;
  monthlyPremium: number;
  coverageAmount: string;
  features: string[];
  termsSummary: string;
  link: string;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  imageUrl: string;
};

export type HealthyLiving = {
  id: string;
  title: string;
  content: string;
  icon: string;
};

export type VitalsData = {
  heartRate: number;
  steps: number;
  calories: number;
  sleepHours: number;
  spO2: number;
  elevation: number;
  timestamp: string;
};

export type PermissionStatus = {
  id: string;
  name: string;
  description: string;
  status: 'granted' | 'denied' | 'prompt';
  icon: string;
};

export type PregnancyStatus = 'not_pregnant' | 'planning' | 'pregnant' | 'post_pregnancy';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface HealthProfile {
  uid: string;
  email: string;
  displayName?: string;
  onboardingCompleted: boolean;
  termsAccepted: boolean;
  profile: {
    age: number;
    weight: number;
    gender: 'male' | 'female' | 'other';
  };
  health: {
    conditions: string[];
    allergies: string[];
  };
  pregnancy: {
    status: PregnancyStatus;
  };
  history: {
    medicines: string[];
    scans: string[];
  };
  emergency: {
    contacts: EmergencyContact[];
  };
  createdAt?: any;
}

export type FeedbackType = 'bug' | 'data_error' | 'ux_suggestion' | 'safety_report';

export type Feedback = {
  type: FeedbackType;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  anonymous: boolean;
};

export type Reminder = {
  id: string;
  medicineName: string;
  time: string;
  taken: boolean;
};

export type Appointment = {
  id: string;
  doctorName: string;
  hospitalName: string;
  date: string;
  time: string;
  type: string;
};

export type Activity = {
  id: string;
  type: 'scan' | 'search' | 'booking';
  description: string;
  timestamp: string;
};

export type HealthTip = {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl: string;
};

export type Article = {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  imageUrl: string;
  tags: string[];
  category: string;
  publishedDate?: string;
};
