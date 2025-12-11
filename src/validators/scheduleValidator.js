const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const createScheduleSchema = Joi.object({
    employeeId: objectIdSchema.required(),
    date: Joi.date().iso().required(),
    shiftType: Joi.string().valid('day', 'night', 'afternoon', 'flexible').default('day'),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    location: Joi.string().max(100),
    department: Joi.string().max(100),
    notes: Joi.string().max(500),
    isRecurring: Joi.boolean(),
    recurrencePattern: Joi.when('isRecurring', {
        is: true,
        then: Joi.object({
            frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
            endsOn: Joi.date().iso(),
            daysOfWeek: Joi.array().items(
                Joi.string().valid('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
            ),
        }),
    }),
});

const scheduleQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    employeeId: objectIdSchema,
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    shiftType: Joi.string().valid('day', 'night', 'afternoon', 'flexible'),
});

module.exports = {
    createScheduleSchema,
    scheduleQuerySchema,
};
