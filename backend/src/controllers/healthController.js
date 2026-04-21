module.exports = {
  health: (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'school-management-backend',
    });
  },
};

