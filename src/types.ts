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
  medicineName?: string;
  medicine_name?: string;
  name?: string;
  time?: string;
  reminder_time?: string;
  dosage?: string;
  sound?: string;
  notes?: string;
  taken: boolean;
};

export type Appointment = {
  id: string;
  doctorName: string;
  hospitalName: string;
  date: string;
  time: string;
  type: string;
  specialty?: string;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
};

export interface VitalsLogEntry {
  id: string;
  metricType: 'heartRate' | 'bloodPressure' | 'spO2' | 'weight' | 'bloodGlucose' | 'temperature' | 'sleep' | 'steps';
  label: string;
  value: string | number;
  unit: string;
  date: string;
  time?: string;
  notes?: string;
  status?: 'Normal' | 'Elevated' | 'Low' | 'Optimal' | 'Attention Needed';
}

export interface MedicationReminder {
  id: string;
  user_id?: string;
  medicine_name: string;
  dosage: string;
  time: string;
  sound?: string;
  taken: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DonorRecord {
  id: string;
  type: string;
  role: 'donor' | 'needer';
  units?: string;
  hospital?: string;
  location?: string;
  distance?: string;
  availability?: string;
  eta?: string;
  contact?: string;
  notes?: string;
  verified?: boolean;
  status?: 'active' | 'fulfilled' | 'cancelled';
  createdAt?: string;
}

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

export type TimelineEventType = 
  | 'report' 
  | 'appointment' 
  | 'medication' 
  | 'assessment' 
  | 'note' 
  | 'ai_interaction';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: TimelineEventType;
  description: string;
  details?: string;
  provider?: string;
  status?: 'completed' | 'scheduled' | 'action_needed' | 'reviewed';
  tags?: string[];
  isDemo?: boolean;
}

export type RecordCategory = 
  | 'Lab Reports' 
  | 'Prescriptions' 
  | 'Medical Reports' 
  | 'Imaging' 
  | 'Vaccination' 
  | 'Other';

export interface HealthRecord {
  id: string;
  title: string;
  category: RecordCategory;
  date: string;
  fileName: string;
  fileSize: string;
  status: 'Verified' | 'Processed' | 'Under Review' | 'Archived';
  provider: string;
  summary: string;
  tags: string[];
  fileUrl?: string;
  notes?: string;
  isDemo?: boolean;
}

export interface AIStructuredResponse {
  summary: string;
  keyTakeaway?: string;
  possibleConsiderations: string[];
  recommendedNextSteps: string[];
  whenToSeekCare: string[];
  warningSigns: string[];
  suggestedFollowUps?: string[];
  disclaimer: string;
  rawText?: string;
}

export interface PrivacyPreferences {
  shareWithAI: boolean;
  storeChatHistoryLocally: boolean;
  anonymousAnalytics: boolean;
  emergencyAlertConsent: boolean;
  retentionDays: number;
}

