-- Healthcare Application Database Schema
-- Designed for Supabase (PostgreSQL)
-- Includes: Users, Patients, Doctors, Appointments, Prescriptions, Reminders, and Feedback

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CORE TABLES
-- ==========================================

-- USERS (Profiles)
-- Links to Supabase Auth.users
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')) DEFAULT 'patient',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    terms_accepted BOOLEAN DEFAULT FALSE,
    profile_data JSONB DEFAULT '{}',
    health_data JSONB DEFAULT '{}',
    pregnancy_data JSONB DEFAULT '{}',
    history_data JSONB DEFAULT '{}',
    emergency_data JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PATIENTS
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age >= 0),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    medical_history JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCTORS
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    specialization TEXT NOT NULL,
    experience INTEGER CHECK (experience >= 0),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPOINTMENTS
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRESCRIPTIONS
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    medicines JSONB NOT NULL DEFAULT '[]', -- Array of objects: {name, dosage, frequency}
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REMINDERS (Medication tracking)
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    time TEXT NOT NULL,
    taken BOOLEAN DEFAULT FALSE,
    last_taken_date TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEEDBACK
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    recipient TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. PERFORMANCE & CONSTRAINTS
-- ==========================================

-- Indexes for common queries
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Automatic profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, display_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email), 
    NEW.email, 
    'patient'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 3. SECURITY (RLS & POLICIES)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICY (Helper)
-- Check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS POLICIES
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id AND is_deleted = FALSE OR is_admin());
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id AND is_deleted = FALSE OR is_admin());

-- PATIENTS POLICIES
CREATE POLICY "Patients view own data" ON public.patients FOR SELECT USING (auth.uid() = user_id AND is_deleted = FALSE OR is_admin());
CREATE POLICY "Doctors view assigned patients" ON public.patients FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.appointments a 
    JOIN public.doctors d ON a.doctor_id = d.id 
    WHERE a.patient_id = patients.id AND d.user_id = auth.uid()
));

-- DOCTORS POLICIES
CREATE POLICY "Doctors view own data" ON public.doctors FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Public can view doctors" ON public.doctors FOR SELECT USING (true);

-- APPOINTMENTS POLICIES
CREATE POLICY "Patients view own appointments" ON public.appointments FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.patients WHERE id = appointments.patient_id AND user_id = auth.uid()) OR is_admin());

CREATE POLICY "Doctors view own appointments" ON public.appointments FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.doctors WHERE id = appointments.doctor_id AND user_id = auth.uid()) OR is_admin());

-- PRESCRIPTIONS POLICIES
CREATE POLICY "Patients view own prescriptions" ON public.prescriptions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.patients WHERE id = prescriptions.patient_id AND user_id = auth.uid()) OR is_admin());

CREATE POLICY "Doctors view own prescriptions" ON public.prescriptions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.doctors WHERE id = prescriptions.doctor_id AND user_id = auth.uid()) OR is_admin());

-- REMINDERS POLICIES
CREATE POLICY "Users manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id AND is_deleted = FALSE OR is_admin());

-- FEEDBACK POLICIES
CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own feedback" ON public.feedback FOR SELECT USING (auth.uid() = uid OR is_admin());

-- ==========================================
-- 4. ENABLE REALTIME
-- ==========================================
-- This allows your app to listen for live changes
ALTER publication supabase_realtime ADD TABLE public.reminders;
ALTER publication supabase_realtime ADD TABLE public.appointments;
ALTER publication supabase_realtime ADD TABLE public.users;

-- ==========================================
-- 5. SAMPLE QUERIES
-- ==========================================

/*
-- SAMPLE INSERTS (Run after creating users in Auth)
-- 1. Create a patient profile
INSERT INTO public.patients (user_id, age, gender, medical_history)
VALUES ('USER_UUID_HERE', 28, 'female', '{"conditions": ["Asthma"], "allergies": ["Peanuts"]}');

-- 2. Create a doctor profile
INSERT INTO public.doctors (user_id, specialization, experience)
VALUES ('DOCTOR_UUID_HERE', 'Cardiology', 12);

-- 3. Schedule an appointment
INSERT INTO public.appointments (patient_id, doctor_id, appointment_date)
VALUES ('PATIENT_UUID_HERE', 'DOCTOR_UUID_HERE', '2024-06-15 10:30:00+00');

-- EXAMPLE SELECTS
-- Get all upcoming appointments for a doctor with patient names
SELECT a.*, u.name as patient_name
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN public.users u ON p.user_id = u.id
WHERE a.doctor_id = 'DOCTOR_UUID_HERE' AND a.appointment_date > NOW();

-- Get medication reminders for today
SELECT * FROM public.reminders 
WHERE user_id = 'USER_UUID_HERE' AND is_deleted = FALSE;
*/
