import { TimeSlot } from './timeSlot.interface';

export interface Appointment {
    date: string;
    appointments: TimeSlot[];
}
