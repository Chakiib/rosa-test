import { Test } from '@nestjs/testing';

import { AppService } from './app.service';

describe('AppService', () => {
    let service: AppService;

    beforeAll(async () => {
        const app = await Test.createTestingModule({
            providers: [AppService],
        }).compile();

        service = app.get<AppService>(AppService);
    });

    describe('getAvailabilities', () => {
        it('should return the correct availabilities for Monday and Tuesday', () => {
            // Mock the existingAppointments array
            const existingAppointmentsMock = [
                {
                    date: '2023-07-10', // Monday
                    appointments: [
                        {
                            startAt: new Date('2023-07-10T12:00:00Z'),
                            endAt: new Date('2023-07-10T16:00:00Z'),
                        },
                    ],
                },
                {
                    date: '2023-07-11', // Tuesday
                    appointments: [
                        {
                            startAt: new Date('2023-07-11T09:00:00Z'),
                            endAt: new Date('2023-07-11T11:00:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-11T18:00:00Z'),
                            endAt: new Date('2023-07-11T20:00:00Z'),
                        },
                    ],
                },
            ];

            service = new AppService();

            // Replace the existingAppointments property with the mock
            service['existingAppointments'] = existingAppointmentsMock;

            const startDate = new Date('2023-07-10T00:00:00Z'); // Monday
            const endDate = new Date('2023-07-11T23:59:59Z'); // Tuesday

            const expectedAvailabilities = [
                {
                    startAt: new Date('2023-07-10T09:30:00Z'), // Monday
                    endAt: new Date('2023-07-10T12:00:00Z'),
                },
                {
                    startAt: new Date('2023-07-10T16:00:00Z'), // Monday
                    endAt: new Date('2023-07-10T20:00:00Z'),
                },
                {
                    startAt: new Date('2023-07-11T11:00:00Z'), // Tuesday
                    endAt: new Date('2023-07-11T18:00:00Z'),
                },
            ];

            const availabilities = service.getAvailabilities(startDate, endDate);

            expect(availabilities).toEqual(expectedAvailabilities);
        });

        it('should return the correct availabilities for Monday, Tuesday, Wednesday, Thursday and Friday', () => {
            // Mock the existingAppointments array
            const existingAppointmentsMock = [
                {
                    date: '2023-07-10', // Monday
                    appointments: [
                        {
                            startAt: new Date('2023-07-10T12:00:00Z'),
                            endAt: new Date('2023-07-10T16:00:00Z'),
                        },
                    ],
                },
                {
                    date: '2023-07-11', // Tuesday
                    appointments: [
                        {
                            startAt: new Date('2023-07-11T09:00:00Z'),
                            endAt: new Date('2023-07-11T11:00:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-11T18:00:00Z'),
                            endAt: new Date('2023-07-11T20:00:00Z'),
                        },
                    ],
                },
                {
                    date: '2023-07-12', // Wednesday
                    appointments: [
                        {
                            startAt: new Date('2023-07-12T09:00:00Z'),
                            endAt: new Date('2023-07-12T11:00:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-12T18:00:00Z'),
                            endAt: new Date('2023-07-12T20:00:00Z'),
                        },
                    ],
                },
                {
                    date: '2023-07-13', // Thursday
                    appointments: [
                        {
                            startAt: new Date('2023-07-13T09:00:00Z'),
                            endAt: new Date('2023-07-13T11:00:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-13T18:00:00Z'),
                            endAt: new Date('2023-07-13T20:00:00Z'),
                        },
                    ],
                },
                {
                    date: '2023-07-14', // Friday
                    appointments: [
                        {
                            startAt: new Date('2023-07-14T09:00:00Z'),
                            endAt: new Date('2023-07-14T11:00:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-14T14:30:00Z'),
                            endAt: new Date('2023-07-14T16:30:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-14T18:00:00Z'),
                            endAt: new Date('2023-07-14T20:00:00Z'),
                        },
                    ],
                },
            ];

            service = new AppService();

            // Replace the existingAppointments property with the mock
            service['existingAppointments'] = existingAppointmentsMock;

            const startDate = new Date('2023-07-10T00:00:00Z'); // Monday
            const endDate = new Date('2023-07-14T23:59:59Z'); // Friday

            const expectedAvailabilities = [
                {
                    startAt: new Date('2023-07-10T09:30:00Z'), // Monday
                    endAt: new Date('2023-07-10T12:00:00Z'),
                },
                {
                    startAt: new Date('2023-07-10T16:00:00Z'), // Monday
                    endAt: new Date('2023-07-10T20:00:00Z'),
                },
                {
                    startAt: new Date('2023-07-11T11:00:00Z'), // Tuesday
                    endAt: new Date('2023-07-11T18:00:00Z'),
                },
                {
                    startAt: new Date('2023-07-12T11:00:00Z'), // Wednesday
                    endAt: new Date('2023-07-12T18:00:00Z'),
                },
                {
                    startAt: new Date('2023-07-13T11:00:00Z'), // Thursday
                    endAt: new Date('2023-07-13T18:00:00Z'),
                },
                {
                    startAt: new Date('2023-07-14T11:00:00Z'), // Friday
                    endAt: new Date('2023-07-14T14:30:00Z'),
                },
                {
                    startAt: new Date('2023-07-14T16:30:00Z'), // Friday
                    endAt: new Date('2023-07-14T18:00:00Z'),
                },
            ];

            const availabilities = service.getAvailabilities(startDate, endDate);

            expect(availabilities).toEqual(expectedAvailabilities);
        });
    });

    describe('getNextAvailability', () => {
        it('should return the next available time slot for Monday', () => {
            // Mock the existingAppointments array
            const existingAppointmentsMock = [
                {
                    date: '2023-07-10', // Monday
                    appointments: [
                        {
                            startAt: new Date('2023-07-10T09:00:00Z'),
                            endAt: new Date('2023-07-10T10:30:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-10T12:00:00Z'),
                            endAt: new Date('2023-07-10T16:00:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-10T17:00:00Z'),
                            endAt: new Date('2023-07-10T19:00:00Z'),
                        },
                    ],
                },
                {
                    date: '2023-07-11', // Tuesday
                    appointments: [
                        {
                            startAt: new Date('2023-07-11T09:00:00Z'),
                            endAt: new Date('2023-07-11T11:00:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-11T18:00:00Z'),
                            endAt: new Date('2023-07-11T20:00:00Z'),
                        },
                    ],
                },
            ];

            service = new AppService();

            // Replace the existingAppointments property with the mock
            service['existingAppointments'] = existingAppointmentsMock;

            const date = new Date('2023-07-10T10:00:00Z'); // Monday

            const expectedNextAvailability = {
                startAt: new Date('2023-07-10T10:30:00Z'), // Monday
                endAt: new Date('2023-07-10T11:00:00Z'),
            };

            const nextAvailability = service.getNextAvailability(date);

            expect(nextAvailability).toEqual(expectedNextAvailability);
        });
    });

    describe('getNextAvailability', () => {
        it('should return the next available time slot for Tuesday', () => {
            // Mock the existingAppointments array
            const existingAppointmentsMock = [
                {
                    date: '2023-07-10', // Monday
                    appointments: [
                        {
                            startAt: new Date('2023-07-10T12:00:00Z'),
                            endAt: new Date('2023-07-10T16:00:00Z'),
                        },
                    ],
                },
                {
                    date: '2023-07-11', // Tuesday
                    appointments: [
                        {
                            startAt: new Date('2023-07-11T09:00:00Z'),
                            endAt: new Date('2023-07-11T11:00:00Z'),
                        },
                        {
                            startAt: new Date('2023-07-11T18:00:00Z'),
                            endAt: new Date('2023-07-11T20:00:00Z'),
                        },
                    ],
                },
            ];

            service = new AppService();

            // Replace the existingAppointments property with the mock
            service['existingAppointments'] = existingAppointmentsMock;

            const date = new Date('2023-07-11T07:00:00Z'); // Tuesday

            const expectedNextAvailability = {
                startAt: new Date('2023-07-11T11:00:00Z'), // Tuesday
                endAt: new Date('2023-07-11T11:30:00Z'),
            };

            const nextAvailability = service.getNextAvailability(date);

            expect(nextAvailability).toEqual(expectedNextAvailability);
        });
    });
});
