const Joi = require('joi');
const { objectIdSchema } = require('./commonValidator');

const checkInSchema = Joi.object({
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
    }),
    deviceInfo: Joi.string().max(200),
});

const checkOutSchema = Joi.object({
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
    }),
    deviceInfo: Joi.string().max(200),
});

const attendanceQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    employeeId: objectIdSchema,
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    status: Joi.string().valid('present', 'absent', 'half-day', 'on-leave', 'holiday', 'weekend'),
});

module.exports = {
    checkInSchema,
    checkOutSchema,
    attendanceQuerySchema,
};
