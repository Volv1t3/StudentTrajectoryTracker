export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface AvailabilitySlot {
  id: number;
  collaborator_id: number;
  day_of_week: DayOfWeek;
  time_from: string;
  time_to: string;
  notes: string | null;
}

export interface ProjectMeetingDay {
  id: number;
  project_id: number;
  day_of_week: DayOfWeek;
  notes: string | null;
}
