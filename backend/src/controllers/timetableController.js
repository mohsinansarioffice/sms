const { validationResult } = require('express-validator');
const TimeSlot = require('../models/TimeSlot');
const Timetable = require('../models/Timetable');

const DAY_ORDER = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const sortTimetableEntries = (entries = []) =>
  [...entries].sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.dayOfWeek] || 99) - (DAY_ORDER[b.dayOfWeek] || 99);
    if (dayDiff !== 0) return dayDiff;

    const aOrder = a.timeSlotId?.displayOrder ?? 0;
    const bOrder = b.timeSlotId?.displayOrder ?? 0;
    return aOrder - bOrder;
  });

// ============ TIME SLOTS ============

// @desc    Get all time slots
// @route   GET /api/timetable/slots
// @access  Private
exports.getTimeSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.find({
      schoolId: req.user.schoolId,
      isActive: true,
    }).sort({ displayOrder: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: { slots },
    });
  } catch (error) {
    console.error('Get Time Slots Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching time slots',
    });
  }
};

// @desc    Create time slot
// @route   POST /api/timetable/slots
// @access  Private (admin)
exports.createTimeSlot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const slot = await TimeSlot.create({
      ...req.body,
      schoolId: req.user.schoolId,
    });

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: { slot },
    });
  } catch (error) {
    console.error('Create Time Slot Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating time slot',
    });
  }
};

// @desc    Update time slot
// @route   PUT /api/timetable/slots/:id
// @access  Private (admin)
exports.updateTimeSlot = async (req, res) => {
  try {
    const slot = await TimeSlot.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Time slot updated successfully',
      data: { slot },
    });
  } catch (error) {
    console.error('Update Time Slot Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating time slot',
    });
  }
};

// @desc    Delete time slot (soft)
// @route   DELETE /api/timetable/slots/:id
// @access  Private (admin)
exports.deleteTimeSlot = async (req, res) => {
  try {
    const slot = await TimeSlot.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Time slot deleted successfully',
    });
  } catch (error) {
    console.error('Delete Time Slot Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting time slot',
    });
  }
};

// ============ TIMETABLE ============

// @desc    Get timetable for class/section
// @route   GET /api/timetable?classId=xxx&sectionId=xxx&academicYearId=xxx
// @access  Private
exports.getTimetable = async (req, res) => {
  try {
    const { classId, sectionId, academicYearId } = req.query;

    if (!classId || !academicYearId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID and Academic Year ID are required',
      });
    }

    const query = {
      schoolId: req.user.schoolId,
      classId,
      academicYearId,
      isActive: true,
      sectionId: sectionId || null,
    };

    const timetable = await Timetable.find(query)
      .populate('timeSlotId')
      .populate('subjectId', 'name')
      .populate('teacherId', 'personalInfo.firstName personalInfo.lastName')
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .lean();

    res.status(200).json({
      success: true,
      data: { timetable: sortTimetableEntries(timetable) },
    });
  } catch (error) {
    console.error('Get Timetable Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetable',
    });
  }
};

// @desc    Get teacher's timetable
// @route   GET /api/timetable/teacher/:teacherId?academicYearId=xxx
// @access  Private
exports.getTeacherTimetable = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYearId } = req.query;

    if (!academicYearId) {
      return res.status(400).json({
        success: false,
        message: 'Academic Year ID is required',
      });
    }

    const timetable = await Timetable.find({
      schoolId: req.user.schoolId,
      teacherId,
      academicYearId,
      isActive: true,
    })
      .populate('timeSlotId')
      .populate('subjectId', 'name')
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .lean();

    res.status(200).json({
      success: true,
      data: { timetable: sortTimetableEntries(timetable) },
    });
  } catch (error) {
    console.error('Get Teacher Timetable Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher timetable',
    });
  }
};

// @desc    Create/Update timetable entry
// @route   POST /api/timetable
// @access  Private (admin)
exports.upsertTimetableEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      academicYearId,
      classId,
      sectionId,
      dayOfWeek,
      timeSlotId,
      subjectId,
      teacherId,
      roomNumber,
      _id,
    } = req.body;

    const selectedSlot = await TimeSlot.findOne({
      _id: timeSlotId,
      schoolId: req.user.schoolId,
      isActive: true,
    }).lean();

    if (!selectedSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found',
      });
    }

    // Teacher conflict: same teacher, same day/time, same academic year
    if (teacherId) {
      const conflict = await Timetable.findOne({
        schoolId: req.user.schoolId,
        academicYearId,
        teacherId,
        dayOfWeek,
        timeSlotId,
        isActive: true,
        ...(_id && { _id: { $ne: _id } }),
      })
        .populate('classId', 'name')
        .populate('sectionId', 'name');

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Teacher is already assigned to ${conflict.classId?.name || 'another class'}${
            conflict.sectionId ? ` ${conflict.sectionId.name}` : ''
          } at this time`,
          conflict: true,
        });
      }
    }

    const normalizedSectionId = sectionId || null;
    const payload = {
      subjectId: selectedSlot.isBreak ? null : subjectId || null,
      teacherId: selectedSlot.isBreak ? null : teacherId || null,
      roomNumber: selectedSlot.isBreak ? '' : roomNumber || '',
      academicYearId,
      isActive: true,
    };

    const existing = await Timetable.findOne({
      schoolId: req.user.schoolId,
      academicYearId,
      classId,
      sectionId: normalizedSectionId,
      dayOfWeek,
      timeSlotId,
    });

    let entry;
    if (existing) {
      Object.assign(existing, payload);
      entry = await existing.save();
    } else {
      entry = await Timetable.create({
        schoolId: req.user.schoolId,
        classId,
        sectionId: normalizedSectionId,
        dayOfWeek,
        timeSlotId,
        ...payload,
      });
    }

    const populatedEntry = await Timetable.findById(entry._id)
      .populate('timeSlotId')
      .populate('subjectId', 'name')
      .populate('teacherId', 'personalInfo.firstName personalInfo.lastName')
      .populate('classId', 'name')
      .populate('sectionId', 'name');

    res.status(200).json({
      success: true,
      message: 'Timetable entry saved successfully',
      data: { entry: populatedEntry },
    });
  } catch (error) {
    console.error('Upsert Timetable Entry Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Timetable entry already exists for this class/section/day/time',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error saving timetable entry',
    });
  }
};

// @desc    Delete timetable entry (soft)
// @route   DELETE /api/timetable/:id
// @access  Private (admin)
exports.deleteTimetableEntry = async (req, res) => {
  try {
    const entry = await Timetable.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user.schoolId },
      { isActive: false },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Timetable entry not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Timetable entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete Timetable Entry Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting timetable entry',
    });
  }
};

// @desc    Bulk copy timetable
// @route   POST /api/timetable/bulk-copy
// @access  Private (admin)
exports.bulkCopyTimetable = async (req, res) => {
  try {
    const { sourceClassId, sourceSectionId, targetClassId, targetSectionId, academicYearId } = req.body;

    if (!sourceClassId || !targetClassId || !academicYearId) {
      return res.status(400).json({
        success: false,
        message: 'Source class, target class, and academic year are required',
      });
    }

    const sourceTimetable = await Timetable.find({
      schoolId: req.user.schoolId,
      classId: sourceClassId,
      sectionId: sourceSectionId || null,
      academicYearId,
      isActive: true,
    }).lean();

    if (!sourceTimetable.length) {
      return res.status(404).json({
        success: false,
        message: 'No timetable found for source class',
      });
    }

    await Timetable.updateMany(
      {
        schoolId: req.user.schoolId,
        classId: targetClassId,
        sectionId: targetSectionId || null,
        academicYearId,
        isActive: true,
      },
      { isActive: false }
    );

    const newEntries = sourceTimetable.map((entry) => ({
      schoolId: req.user.schoolId,
      academicYearId,
      classId: targetClassId,
      sectionId: targetSectionId || null,
      dayOfWeek: entry.dayOfWeek,
      timeSlotId: entry.timeSlotId,
      subjectId: entry.subjectId,
      teacherId: entry.teacherId,
      roomNumber: entry.roomNumber,
      isActive: true,
    }));

    await Timetable.insertMany(newEntries);

    res.status(200).json({
      success: true,
      message: `Copied ${newEntries.length} timetable entries successfully`,
      data: { count: newEntries.length },
    });
  } catch (error) {
    console.error('Bulk Copy Timetable Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error copying timetable',
    });
  }
};
