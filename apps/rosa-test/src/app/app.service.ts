import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';
import { Appointment } from './interfaces/appointment.interface';
import { TimeSlot } from './interfaces/timeSlot.interface';

dayjs.extend(utc);
dayjs.extend(isBetween);

@Injectable()
export class AppService {
    private existingAppointments: Appointment[] = [];

    /**
     * For the sake of simplicity, we will set a unique daily availability
     * The start and end properties are specified in minutes from midnight.
     * So, start: 570 means the professional starts working at 570 minutes past midnight, which is 9:30 AM (since 570min = 9hours30min).
     * Similarly, end: 1200 means the professional finishes working at 1200 minutes past midnight, which is 6:00 PM (since 1200min = 20hours).
     */
    private dailyAvailability = { start: 570, end: 1200 }; // 9:30 to 20:00

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

            this.existingAppointments.push({
                date: dayjs(date, 'yyyy-MM-dd').toISOString(),
                appointments: appointments,
            });
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
        const availabilities: TimeSlot[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let day = new Date(start); day.getTime() <= end.getTime(); day.setDate(day.getDate() + 1)) {
            const appointments =
                this.existingAppointments.find((appointment) => appointment.date === day.toISOString().split('T')[0])
                    ?.appointments || [];

            let currentTime = this.dailyAvailability.start;

            while (currentTime < this.dailyAvailability.end) {
                const currentSlot: TimeSlot = {
                    startAt: new Date(day.getTime() + currentTime * 60000),
                    endAt: new Date(day.getTime() + (currentTime + this.slotDuration) * 60000),
                };

                const overlappingAppointments = appointments.filter(
                    (appointment) => appointment.startAt < currentSlot.endAt && currentSlot.startAt < appointment.endAt
                );

                if (overlappingAppointments.length === 0) {
                    if (
                        availabilities.length > 0 &&
                        availabilities[availabilities.length - 1].endAt.getTime() === currentSlot.startAt.getTime()
                    ) {
                        // Extend the end time of the last available slot
                        availabilities[availabilities.length - 1].endAt = currentSlot.endAt;
                    } else {
                        // Add a new available slot
                        availabilities.push(currentSlot);
                    }
                }

                currentTime += this.slotDuration;
            }
        }

        return availabilities;
    }

    /**
     * Returns the next available time slot after the given date.
     * @param date The date after which to search for the next available time slot.
     * @returns The next available time slot.
     */
    getNextAvailability(date: Date): TimeSlot | null {
        // Binary search to find the index of the first appointment on or after the given date
        let start = 0;
        let end = this.existingAppointments.length - 1;
        let baseDate = dayjs.utc(date);

        while (start <= end) {
            const mid = Math.floor((start + end) / 2);

            /**
             * If the date of the appointment at the middle index is before the given date,
             * search in the next half of the array.
             */
            if (dayjs.utc(this.existingAppointments[mid].date).isBefore(dayjs.utc(date), 'day')) {
                start = mid + 1;
            } else if (
                /**
                 * If the date of the appointment at the middle index is the same as the given date
                 * but the time is after the daily availability end, search in the next half of the array.
                 */
                dayjs.utc(this.existingAppointments[mid].date).isSame(dayjs.utc(date), 'day') &&
                dayjs.utc(date).isAfter(dayjs.utc(date).startOf('day').add(this.dailyAvailability.end, 'minutes'))
            ) {
                start = mid + 1;

                // Set the base date to the next day to search the correct date in the next iteration.
                baseDate = baseDate.add(1, 'day');
            } else {
                /**
                 * If the date of the appointment at the middle index is the same as the given date
                 * and the time is before the daily availability end or the date is after the given date,
                 * search in the previous half of the array
                 */
                end = mid - 1;
            }
        }

        // Iterate over the appointments starting from the found index
        for (let i = start; i < this.existingAppointments.length; i++) {
            const appointments = this.existingAppointments[i].appointments;

            let currentTime = this.dailyAvailability.start;

            const startOfDay = baseDate.startOf('day');
            const dailyStart = startOfDay.add(this.dailyAvailability.start, 'minutes').toDate();
            const dailyEnd = startOfDay.add(this.dailyAvailability.end, 'minutes').toDate();

            while (currentTime < this.dailyAvailability.end) {
                const currentSlot: TimeSlot = {
                    startAt: startOfDay.add(currentTime, 'minutes').toDate(),
                    endAt: startOfDay.add(currentTime + this.slotDuration, 'minutes').toDate(),
                };

                if (
                    !appointments.some(
                        (appointment) =>
                            dayjs
                                .utc(currentSlot.startAt)
                                .isBetween(dayjs.utc(appointment.startAt), dayjs.utc(appointment.endAt)) ||
                            dayjs
                                .utc(currentSlot.endAt)
                                .isBetween(dayjs.utc(appointment.startAt), dayjs.utc(appointment.endAt))
                    ) &&
                    currentSlot.startAt >= dailyStart &&
                    currentSlot.endAt <= dailyEnd
                ) {
                    return currentSlot;
                }

                currentTime += this.slotDuration;
            }
        }

        return null;
    }
}
