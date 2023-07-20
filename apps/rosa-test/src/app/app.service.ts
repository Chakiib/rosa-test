import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';
import { TimeSlot } from './interfaces/timeSlot.interface';

dayjs.extend(utc);
dayjs.extend(isBetween);

@Injectable()
export class AppService {
    private existingAppointments: Map<string, TimeSlot[]> = new Map<string, TimeSlot[]>();

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

            const isoDate = dayjs(date, 'yyyy-MM-dd').toISOString();
            this.existingAppointments.set(isoDate, appointments);
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
            const appointments = this.existingAppointments.get(day.toISOString().split('T')[0]) || [];

            let currentTime = this.dailyAvailability.start;

            while (currentTime < this.dailyAvailability.end) {
                /**
                 * Create a time slot object for the current time.
                 * The startAt and endAt properties are Date objects.
                 * The startAt is the current time and the endAt is the current time plus the slot duration.
                 */
                const currentSlot: TimeSlot = {
                    startAt: new Date(day.getTime() + currentTime * 60000),
                    endAt: new Date(day.getTime() + (currentTime + this.slotDuration) * 60000),
                };

                /**
                 * Check if there are any appointments that overlap with the current time slot.
                 */
                const overlappingAppointments = appointments.filter(
                    (appointment) => appointment.startAt < currentSlot.endAt && currentSlot.startAt < appointment.endAt
                );

                /**
                 * If there are no overlapping appointments, add the current time slot to the availabilities array.
                 */
                if (overlappingAppointments.length === 0) {
                    /**
                     * If the current time slot is adjacent to the last available slot in the availabilities array,
                     * extend the end time of the last available slot instead of adding a new one.
                     */
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

                // Increment the current time by the slot duration
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
        let baseDate = dayjs.utc(date);

        if (dayjs.utc(date).isAfter(dayjs.utc(date).startOf('day').add(this.dailyAvailability.end, 'minutes'))) {
            baseDate = baseDate.add(1, 'day');
        }

        // Iterate over the appointments starting from the given date
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const dateKey = baseDate.format('YYYY-MM-DD');
            const appointments = this.existingAppointments.has(dateKey) ? this.existingAppointments.get(dateKey) : [];

            let currentTime = this.dailyAvailability.start;
            const startOfDay = baseDate.startOf('day');
            const dailyStart = startOfDay.add(this.dailyAvailability.start, 'minutes').toDate();
            const dailyEnd = startOfDay.add(this.dailyAvailability.end, 'minutes').toDate();

            // Iterate over the time slots of the current day until we find an available time slot.
            while (currentTime < this.dailyAvailability.end) {
                const currentSlot: TimeSlot = {
                    startAt: startOfDay.add(currentTime, 'minutes').toDate(),
                    endAt: startOfDay.add(currentTime + this.slotDuration, 'minutes').toDate(),
                };

                // Check if there are any appointments that overlap with the current time slot.
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

            // Move on to the next day
            baseDate = baseDate.add(1, 'day');
        }

        /**
         * Realistically, this point in the code will never be reached as the function will either find an
         * available timeslot and return it or it will run indefinitely.
         * You may want to add a maximum date or maximum number of iterations and return null if those are exceeded.
         */
        return null;
    }
}
