import { Injectable } from '@nestjs/common';
import { Appointment } from './interfaces/appointment.interface';
import { TimeSlot } from './interfaces/timeSlot.interface';
import { addMinutes, isWithinInterval, format } from 'date-fns';

@Injectable()
export class AppService {
    private existingAppointments: Appointment[] = [];

    /**
     * For the sake of simplicity, we will set a unique daily availability
     * The start and end properties are specified in minutes from midnight.
     * So, start: 570 means the professional starts working at 570 minutes past midnight, which is 9:30 AM (since 570min = 9hours30min).
     * Similarly, end: 1080 means the professional finishes working at 1080 minutes past midnight, which is 6:00 PM (since 1080min = 18hours).
     */
    private dailyAvailability = { start: 570, end: 1080 }; // 9:30 to 18:00

    /**
     * Same slot duration for all appointments, in minutes
     */
    private slotDuration = 30;

    /**
     * Generate mock data
     */
    constructor() {
        // Generate 10k lines of mock data
        for (let i = 0; i < 10000; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i); // Add i days to current date

            const appointments = [];
            for (let j = 0; j < Math.random() * 5; j++) {
                // Up to 5 appointments per day
                const start =
                    this.dailyAvailability.start +
                    Math.floor(
                        Math.random() *
                            ((this.dailyAvailability.end - this.dailyAvailability.start) / this.slotDuration)
                    ) *
                        this.slotDuration;

                const end = start + this.slotDuration;
                appointments.push({
                    startAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), start / 60, start % 60),
                    endAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), end / 60, end % 60),
                });
            }

            this.existingAppointments.push({ date: format(date, 'yyyy-MM-dd'), appointments: appointments });
        }
    }

    /**
     * Returns an array of available time slots between the given start and end dates.
     * Each time slot is an object with a startAt and endAt property, both of which are Date objects.
     *
     * @param startDate The start date for the availability search.
     * @param endDate The end date for the availability search.
     * @returns An array of available time slots.
     */
    getAvailabilities(startDate: Date, endDate: Date): TimeSlot[] {
        const availabilities = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let day = start; day.getTime() <= end.getTime(); day.setDate(day.getDate() + 1)) {
            const appointments =
                this.existingAppointments.find((appointment) => appointment.date === format(day, 'yyyy-MM-dd'))
                    ?.appointments || [];

            let currentTime = this.dailyAvailability.start;

            while (currentTime < this.dailyAvailability.end) {
                const currentSlot: TimeSlot = {
                    startAt: addMinutes(new Date(day), currentTime),
                    endAt: addMinutes(new Date(day), currentTime + this.slotDuration),
                };

                if (
                    appointments.some(
                        (appointment) =>
                            isWithinInterval(currentSlot.startAt, {
                                start: appointment.startAt,
                                end: appointment.endAt,
                            }) ||
                            isWithinInterval(currentSlot.endAt, { start: appointment.startAt, end: appointment.endAt })
                    )
                ) {
                    currentTime += this.slotDuration;
                    continue;
                }

                availabilities.push(currentSlot);
                currentTime += this.slotDuration;
            }
        }

        return availabilities;
    }

    getNextAvailability(date: Date): TimeSlot {
        return;
    }
}
