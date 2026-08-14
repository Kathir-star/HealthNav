import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Bluetooth, Cpu, Zap, ShieldCheck, Smartphone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface SensorDiagnosisProps {
  onComplete: (detectedSensors: string[]) => void;
}

export const SensorDiagnosis: React.FC<SensorDiagnosisProps> = ({ onComplete }) => {
  const [step, setStep] = React.useState(0);
  const [detectedSensors, setDetectedSensors] = React.useState<string[]>([]);
  const [isDiagnosing, setIsDiagnosing] = React.useState(true);

  const sensorSteps = [
    { id: 'accelerometer', name: 'Accelerometer', icon: Activity, description: 'Detecting motion sensors...' },
    { id: 'gyroscope', name: 'Gyroscope', icon: Zap, description: 'Calibrating orientation sensors...' },
    { id: 'bluetooth', name: 'Bluetooth LE', icon: Bluetooth, description: 'Scanning for nearby wearables...' },
    { id: 'heartrate', name: 'Heart Rate Sensor', icon: ShieldCheck, description: 'Checking PPG sensor availability...' },
  ];

  React.useEffect(() => {
    if (step < sensorSteps.length) {
      const timer = setTimeout(() => {
        // Simulate detection (most devices have accel/gyro, some have BT, few have HR)
        const currentSensor = sensorSteps[step];
        const isDetected = Math.random() > 0.2; // 80% chance for demo purposes
        
        if (isDetected) {
          setDetectedSensors(prev => [...prev, currentSensor.id]);
        }
        
        setStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setIsDiagnosing(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="fixed inset-0 z-[400] bg-emerald-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute inset-0 -z-10 opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2560&auto=format&fit=crop" 
          alt="Medical Tech" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-emerald-950/40" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-2xl"
      >
        <div className="relative inline-block mb-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative z-10">
            <Cpu className="text-white w-10 h-10 animate-pulse" />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl -z-10"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">System Diagnosis</h2>
          <p className="text-emerald-100/60 font-medium">
            {isDiagnosing ? "Optimizing HealthNav for your device hardware..." : "Diagnosis Complete"}
          </p>
        </div>

        <div className="grid gap-3">
          {sensorSteps.map((s, idx) => {
            const isCurrent = idx === step;
            const isDone = idx < step;
            const isFound = detectedSensors.includes(s.id);

            return (
              <div 
                key={s.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex items-center justify-between",
                  isCurrent ? "bg-emerald-500/20 border-emerald-500 shadow-lg" : 
                  isDone ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/5 opacity-40"
                )}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isFound ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"
                  )}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{s.name}</h4>
                    <p className="text-[10px] text-emerald-100/40 font-medium uppercase tracking-wider">
                      {isCurrent ? s.description : isDone ? (isFound ? 'Detected & Optimized' : 'Not Available') : 'Waiting...'}
                    </p>
                  </div>
                </div>
                {isCurrent && <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />}
                {isDone && (
                  isFound ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400/40" />
                )}
              </div>
            );
          })}
        </div>

        {!isDiagnosing && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onComplete(detectedSensors)}
            className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95"
          >
            Enter Dashboard
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};
