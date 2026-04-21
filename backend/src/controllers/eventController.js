const { validationResult } = require('express-validator');
const SchoolEvent = require('../models/SchoolEvent');

// @desc    Get events
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res) => {
  try {
    const { month, year, type } = req.query;
    const query = {
      schoolId: req.user.schoolId,
      isActive: true,
    };

    if (type) query.type = type;
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      query.eventDate = { $gte: start, $lte: end };
    }

    const events = await SchoolEvent.find(query).sort({ eventDate: 1 }).lean();
    res.status(200).json({
      success: true,
      data: { events },
    });
  } catch (error) {
    console.error('Get Events Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
    });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private (admin)
exports.createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const event = await SchoolEvent.create({
      ...req.body,
      schoolId: req.user.schoolId,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event },
    });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (admin)
exports.updateEvent = async (req, res) => {
  try {
    const event = await SchoolEvent.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event },
    });
  } catch (error) {
    console.error('Update Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating event',
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (admin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await SchoolEvent.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
    });
  }
};
