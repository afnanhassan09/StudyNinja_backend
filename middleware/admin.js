const admin = async (req, res, next) => {
  try {
    ``;
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }
    console.log("Admin has been verified");
    next();
  } catch (error) {
    res.status(500).json({
      message: "Error checking admin privileges",
    });
  }
};

module.exports = admin;
