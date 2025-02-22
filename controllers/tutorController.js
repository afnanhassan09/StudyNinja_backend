const { uploadFile } = require("../utils/AWS");

const Tutoring = require("../models/tutoringModel");
const Essay = require("../models/essayModel");
const Rating = require("../models/ratingModel");
const User = require("../models/userModel");
const TutoringSession = require("../models/tutoringSessionModel");
const Message = require("../models/messageModel");
const Student = require("../models/studentModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Tutor = require("../models/tutorModel");

class TutorController {
  async requestForTutor(req, res) {
    try {
      const {
        subjects,
        rightToWork,
        eligibility,
        hasDBS,
        NINumber,
        appliedForDBS,
        dbsApplicationDetails,
        university,
        course,
        aLevels,
        aLevelsCompletionDate,
        universityStartDate,
        expectedGraduationDate,
        dateOfBirth,
      } = req.body;
      console.log(dbsApplicationDetails);
      const files = req.files;
      const userId = req.user._id;

      if (
        !subjects ||
        !university ||
        !course ||
        !aLevels ||
        !aLevelsCompletionDate ||
        !universityStartDate ||
        !expectedGraduationDate ||
        !dateOfBirth
      ) {
        return res.status(400).json({
          message:
            "Missing required fields. Please fill in all required information.",
        });
      }

      if (!files.profilePicture) {
        return res.status(400).json({
          message: "Profile picture is required.",
        });
      }

      const user = await User.findOne({ _id: userId });
      let parsedSubjects;
      try {
        parsedSubjects = JSON.parse(subjects);
      } catch (err) {
        return res.status(400).json({
          message: "Invalid subjects format. It must be a valid JSON array.",
        });
      }

      let profilePictureUrl = null;
      const universityDocumentUrls = [];

      // Upload documents for eligibility
      const documentUrls = {
        BritishIrish: {
          passportURL: null,
          NINumber: null,
          UkBornOrAdoptedCertificateURL: null,
        },
        EuEeaSwiss: {
          shareCode: null,
          DOB: null,
          passportURL: null,
        },
        NonEuEea: {
          biometricResidencePermitURL: null,
          validVisaURL: null,
        },
      };

      await Promise.all([
        files.profilePicture
          ? uploadFile(
              files.profilePicture[0].buffer,
              files.profilePicture[0].originalname,
              files.profilePicture[0].mimetype
            ).then((url) => (profilePictureUrl = url))
          : null,
        files.universityDocuments
          ? Promise.all(
              files.universityDocuments.map((doc) =>
                uploadFile(doc.buffer, doc.originalname, doc.mimetype).then(
                  (url) => universityDocumentUrls.push(url)
                )
              )
            )
          : null,
        eligibility === "BritishIrish"
          ? Promise.all([
              files.passportURL
                ? uploadFile(
                    files.passportURL[0].buffer,
                    files.passportURL[0].originalname,
                    files.passportURL[0].mimetype
                  ).then((url) => (documentUrls.BritishIrish.passportURL = url))
                : null,
              files.UkBornOrAdoptedCertificate
                ? uploadFile(
                    files.UkBornOrAdoptedCertificate[0].buffer,
                    files.UkBornOrAdoptedCertificate[0].originalname,
                    files.UkBornOrAdoptedCertificate[0].mimetype
                  ).then(
                    (url) =>
                      (documentUrls.BritishIrish.UkBornOrAdoptedCertificateURL =
                        url)
                  )
                : null,
              (documentUrls.BritishIrish.NINumber = NINumber || null),
            ])
          : null,
        eligibility === "EuEeaSwiss"
          ? Promise.all([
              files.passportURL
                ? uploadFile(
                    files.passportURL[0].buffer,
                    files.passportURL[0].originalname,
                    files.passportURL[0].mimetype
                  ).then((url) => (documentUrls.EuEeaSwiss.passportURL = url))
                : null,
              req.body.shareCode
                ? (documentUrls.EuEeaSwiss.shareCode = req.body.shareCode)
                : null,
              req.body.DOB
                ? (documentUrls.EuEeaSwiss.DOB = req.body.DOB)
                : null,
            ])
          : null,
        eligibility === "NonEuEea"
          ? Promise.all([
              files.biometricResidencePermit
                ? uploadFile(
                    files.biometricResidencePermit[0].buffer,
                    files.biometricResidencePermit[0].originalname,
                    files.biometricResidencePermit[0].mimetype
                  ).then(
                    (url) =>
                      (documentUrls.NonEuEea.biometricResidencePermitURL = url)
                  )
                : null,
              files.validVisa
                ? uploadFile(
                    files.validVisa[0].buffer,
                    files.validVisa[0].originalname,
                    files.validVisa[0].mimetype
                  ).then((url) => (documentUrls.NonEuEea.validVisaURL = url))
                : null,
            ])
          : null,
      ]);

      const dbsDetails = {
        fullName: null,
        certificateNumber: null,
        certificateFileUrl: null,
      };

      const dbsAppDetails = {
        fullName: null,
        phone: null,
        email: null,
      };

      if (hasDBS) {
        dbsDetails.fullName = req.body.fullNameDBS;
        dbsDetails.certificateNumber = req.body.certificateNumber;
        if (files.certificateFile) {
          dbsDetails.certificateFileUrl = await uploadFile(
            files.certificateFile[0].buffer,
            files.certificateFile[0].originalname,
            files.certificateFile[0].mimetype
          );
        }
      } else if (appliedForDBS) {
        if (
          !dbsApplicationDetails ||
          !dbsApplicationDetails.fullName ||
          !dbsApplicationDetails.phone ||
          !dbsApplicationDetails.email
        ) {
          return res.status(400).json({
            message:
              "Full name, phone, and email are required when appliedForDBS is true.",
          });
        }
        dbsAppDetails.fullName = dbsApplicationDetails.fullName;
        dbsAppDetails.phone = dbsApplicationDetails.phone;
        dbsAppDetails.email = dbsApplicationDetails.email;
      }

      let tutor = await Tutor.findOne({ userId });

      if (!eligibility) {
        return res.status(400).json({
          message: "Eligibility is required.",
        });
      }

      // Parse aLevels if it's a string
      let parsedALevels;
      try {
        parsedALevels =
          typeof aLevels === "string" ? JSON.parse(aLevels) : aLevels;

        // Validate aLevels format
        if (
          !Array.isArray(parsedALevels) ||
          !parsedALevels.every(
            (al) => typeof al === "object" && "subject" in al && "grade" in al
          )
        ) {
          return res.status(400).json({
            message:
              "A-Levels must be an array of objects with subject and grade properties",
            example: [
              { subject: "Mathematics", grade: "A*" },
              { subject: "Physics", grade: "A" },
            ],
          });
        }
      } catch (err) {
        return res.status(400).json({
          message:
            "Invalid A-Levels format. Must be a valid JSON array of objects.",
          example: [
            { subject: "Mathematics", grade: "A*" },
            { subject: "Physics", grade: "A" },
          ],
        });
      }

      tutor = await Tutor.create({
        userId,
        subjects: parsedSubjects,
        hasDBS: hasDBS || false,
        dbsDetails: dbsDetails,
        rightToWork: rightToWork || false,
        eligibility: eligibility || null,
        documents: documentUrls,
        appliedForDBS: appliedForDBS,
        dbsApplicationDetails: dbsAppDetails,
        profilePicture: profilePictureUrl,
        university,
        course,
        aLevels: parsedALevels,
        aLevelsCompletionDate,
        universityStartDate,
        expectedGraduationDate,
        dateOfBirth,
      });
      user.onboardingCompleted = true;
      user.save();
      return res.status(201).json({
        message: "Tutor request submitted successfully!",
        tutor,
      });
    } catch (error) {
      console.error("Error submitting tutor request:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getMessagesForTutor(req, res) {
    try {
      const studentId = req.params.studentId;
      const student = await Student.findOne({ _id: studentId });
      const tutor = await Tutor.findOne({ userId: req.user._id });
      console.log("Student Id: " + studentId);
      console.log("Tutor Id: ", tutor._id);
      console.log("User Id: ", req.user._id);
      if (!tutor) {
        return res.status(404).json({ error: "Tutor not found" });
      }

      const messages = await Message.find({
        $or: [
          { sender: req.user._id, recipient: studentId },
          { sender: student.userId, recipient: tutor._id },
        ],
      })
        .populate("sender", "_id")
        .populate("recipient", "_id")
        .sort({ timestamp: 1 })
        .lean();

      if (messages.length === 0) {
        return res.status(200).json({ messages: [] });
      }

      const tutorIdStr = tutor._id.toString();
      const formattedMessages = [];

      for (let msg of messages) {
        formattedMessages.push({
          _id: msg._id,
          sender: msg.senderModel ? msg.senderModel.toLowerCase() : "student",
          content: msg.content,
          timestamp: msg.timestamp,
        });
      }

      return res.status(200).json({ messages: formattedMessages });
    } catch (error) {
      console.error("❌ Error fetching messages for tutor:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getAllContactsForTutor(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });

      if (!tutor) {
        return res.status(404).json({ error: "Tutor not found" });
      }

      const studentIds = await Message.distinct("sender", {
        recipient: tutor._id,
      });

      const additionalStudentIds = await Message.distinct("recipient", {
        sender: tutor._id,
      });

      const uniqueStudentIds = Array.from(
        new Set([...studentIds, ...additionalStudentIds])
      );

      const students = await Student.find({
        _id: { $in: uniqueStudentIds },
      }).populate("userId", "name _id profilePicture"); // Added profilePicture to populated fields

      // Format the response to include name, id, and profile picture
      const formattedStudents = students.map((student) => ({
        _id: student._id,
        name: student.userId?.name || "Unknown",
        userId: student.userId?._id,
        profilePicture: student.profilePicture || null,
      }));

      return res.status(200).json({ students: formattedStudents });
    } catch (error) {
      console.error("Error fetching students for tutor:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateTutorProfile(req, res) {
    try {
      let tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(400).json({
          message: "Tutor profile not found.",
        });
      }

      // Update fields from the request body
      tutor.university = req.body.university || tutor.university;
      tutor.StudyLevel = req.body.StudyLevel || tutor.StudyLevel;
      tutor.yearsOfExperience =
        req.body.yearsOfExperience || tutor.yearsOfExperience;
      tutor.motivation = req.body.motivation || tutor.motivation;

      // Parse subjects if provided as a string
      if (req.body.subjects) {
        try {
          const parsedSubjects =
            typeof req.body.subjects === "string"
              ? JSON.parse(req.body.subjects)
              : req.body.subjects;

          tutor.subjects = Array.isArray(parsedSubjects)
            ? parsedSubjects
            : tutor.subjects;
        } catch (err) {
          return res.status(400).json({
            message: "Invalid subjects format. It must be a valid JSON array.",
          });
        }
      }

      if (req.files && req.files.profilePicture) {
        const profilePictureFile = req.files.profilePicture[0];
        tutor.profilePicture = await uploadFile(
          profilePictureFile.buffer,
          profilePictureFile.originalname,
          profilePictureFile.mimetype
        );
      }

      await tutor.save();
      return res.status(200).send({
        tutor: tutor,
      });
    } catch (error) {
      return res.status(401).send({
        message: "Tutor Updation failed",
        error: error.message,
      });
    }
  }

  async updateTutorLevel(req, res) {
    try {
      const { userId, StudyLevel } = req.body;

      // Validate required inputs
      if (!userId || !StudyLevel) {
        return res.status(400).json({
          message: "Missing required fields: userId or StudyLevel.",
        });
      }

      // Validate StudyLevel
      const validLevels = ["GCSE", "A-Level", "Bachelor", "Masters", "PhD"];
      if (!validLevels.includes(StudyLevel)) {
        return res.status(400).json({
          message: `Invalid StudyLevel. Allowed values are: ${validLevels.join(
            ", "
          )}.`,
        });
      }

      // Find tutor profile
      const tutor = await Tutor.findOne({ userId });

      if (!tutor) {
        return res.status(404).json({
          message: "Tutor profile not found.",
        });
      }

      // Update StudyLevel
      tutor.StudyLevel = StudyLevel;
      await tutor.save();

      return res.status(200).json({
        message: "StudyLevel updated successfully!",
        tutor,
      });
    } catch (error) {
      console.error("Error updating StudyLevel:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async applyForDBS(req, res) {
    try {
      const tutor = await Tutor.findOne({ id: req.user.id });
      if (!tutor) {
        return res.status(401).json({ message: "Tutor not found." });
      }
      if (tutor.hasDBS && !tutor.appliedForDBS) {
        return res.status(400).json({ message: "Tutor already has DBS." });
      }
      tutor.appliedForDBS = true;
      tutor.hasDBS = false;
      tutor.approved = false;

      const fullName = req.body.fullName;
      const certificateFile = req.files.certificateFile;
      const certificateFileURL = await uploadFile(
        certificateFile.buffer,
        certificateFile.originalname,
        certificateFile.mimetype
      );

      tutor.dbsDetails.fullName = fullName;
      tutor.dbsDetails.certificateFileUrl = certificateFileURL;
      tutor.dbsDetails.certificateNumber = req.body.certificateNumber;

      await tutor.save();

      return res
        .status(200)
        .json({ message: "DBS application submitted successfully." });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server error.", error: error.message });
    }
  }

  async getTutorView(req, res) {
    try {
      console.log(req.user._id);
      const tutor = await Tutor.findOne({ userId: req.user._id }).select(
        "StudyLevel premiumEssays approved_essay"
      );

      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found." });
      }
      if (!tutor.approved_essay) {
        return res.status(403).json({ message: "Tutor is not approved yet." });
      }

      const studyLevels = ["GCSE", "A-Level", "Bachelor", "Masters", "PhD"];

      const tutorLevelIndex = studyLevels.indexOf(tutor.StudyLevel);

      if (tutorLevelIndex === -1) {
        return res.status(400).json({ message: "Invalid tutor study level." });
      }

      const query = {
        status: "Pending",
        academicLevel: { $in: studyLevels.slice(0, tutorLevelIndex + 1) },
      };

      if (!tutor.premiumEssays) {
        query.price = { $lte: 20 };
      }

      const essays = await Essay.find(query).select(
        "title subject wordCount adjustedWordCount studentRequest academicLevel price"
      );

      if (!essays || essays.length === 0) {
        return res.status(404).json({ message: "No essays available." });
      }

      return res.status(200).json({
        message: "Essays retrieved successfully.",
        essays,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async updateTutorDBS(req, res) {
    try {
      let tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found" });
      }
      if (!tutor.appliedForDBS) {
        return res
          .status(400)
          .json({ message: "Tutor has not applied for DBS" });
      }
      const fullName = req.body.fullName;
      const certificateNumber = req.body.certificateNumber;
      const certificateFile = req.files.certificateFile;
      if (!fullName || !certificateNumber || !certificateFile) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const certificateFileUrl = await uploadFile(
        certificateFile.buffer,
        certificateFile.originalname,
        certificateFile.mimetype
      );
      tutor.dbsDetails.fullName = fullName;
      tutor.dbsDetails.certificateNumber = certificateNumber;
      tutor.dbsDetails.certificateFileUrl = certificateFileUrl;
      await tutor.save();
      return res
        .status(200)
        .json({ message: "DBS details updated successfully", tutor });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async getTutorProfile(req, res) {
    console.log("Getting tutor profile");
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (tutor) {
        const user = await User.findOne({ _id: req.user._id });
        return res.status(200).json({
          message: "Tutor profile retrieved successfully!",
          tutor: {
            ...tutor._doc, // Spread tutor data
            phone: tutor.phone,
            name: user.name,
            email: user.email,
          },
        });
      } else {
        return res.status(404).json({
          message: "Tutor profile not found",
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Internal server error",
        error: err.message,
      });
    }
  }

  async acceptEssay(req, res) {
    try {
      const { essayID } = req.body;
      const essay = await Essay.findById(essayID);
      if (!essay) {
        return res.status(404).json({
          message: "Essay not found",
        });
      }
      essay.accepted = true;
      await essay.save();
      return res.status(200).json({
        message: "Essay accepted successfully",
        essay,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async markEssay(req, res) {
    console.log("Marking essay...");
    try {
      const { essayID, feedback, score } = req.body;
      const essay = await Essay.findById(essayID);

      if (!essay) {
        return res.status(404).json({ message: "Essay not found" });
      }

      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(404).json({ message: "Tutor profile not found" });
      }

      if (
        essay.markedBy &&
        essay.markedBy.toString() !== tutor._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "You are not authorized to mark this essay." });
      }

      essay.feedback = feedback;
      essay.score = score;
      essay.status = "Completed";

      if (essay.studentRequest === "Feedback and Model Answer") {
        if (!req.files || !req.files.modelAnswerFile) {
          return res.status(400).json({
            message:
              "Model answer file is required for Feedback and Model Answer request.",
          });
        }

        const file = req.files.modelAnswerFile[0];
        const modelAnswerURL = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        essay.modelURL = modelAnswerURL;
      }

      await essay.save();

      // Create a Stripe payment link using the proper format
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: Math.round(essay.price * 100), // Convert to cents
              product_data: {
                name: `Payment for Essay Review - ${essay.title}`,
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `http://localhost:5173/tutor/payment-success`,
        cancel_url: `http://localhost:5173/tutor/payment-failed`,
        metadata: {
          tutorId: tutor._id.toString(),
          essayId: essay._id.toString(),
        },
      });

      return res.status(200).json({
        message: "Essay marked successfully! Payment link generated.",
        essay,
        paymentUrl: session.url,
      });
    } catch (error) {
      console.error("Error marking essay:", error);
      return res.status(400).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getEssay(req, res) {
    try {
      console.log("Getting essay...", req.body);
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(404).json({
          message: "Tutor profile not found",
        });
      }

      // Check if `essayID` is provided
      const { essayID } = req.body;
      if (!essayID) {
        return res.status(400).json({
          message: "Essay ID is required",
        });
      }

      const essay = await Essay.findById(essayID);
      if (!essay) {
        return res.status(404).json({
          message: "Essay not found",
        });
      }

      let senderModel, recipientModel;

      senderModel = "Tutor";

      recipientModel = "Student";

      const content = "Hello there. I will be checking your essay";

      console.log(
        "Sender Model:",
        senderModel,
        "| Recipient Model:",
        recipientModel
      );

      // Save the message in the database
      const message = new Message({
        sender: tutor._id,
        senderModel,
        recipient: essay.studentID,
        recipientModel,
        content,
        timestamp: new Date(),
      });

      // Assign essay to the current tutor
      const updatedEssay = await Essay.findByIdAndUpdate(
        essayID,
        {
          status: "In Progress",
          markedBy: tutor._id,
        },
        { new: true }
      );
      const savedMessage = await message.save();
      console.log("Message saved:", savedMessage);

      return res.status(200).json({
        message: "Essay retrieved successfully!",
        essay: updatedEssay,
      });
    } catch (error) {
      console.error("Error fetching essay:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getInProgressEssays(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(200).json({
          message: "Tutor profile not found",
        });
      }
      console.log(tutor._id);
      const essays = await Essay.find({
        status: "In Progress",
        markedBy: tutor._id,
      });

      if (essays.length === 0) {
        return res
          .status(200)
          .json({ message: "No in-progress essays found." });
      }

      res.status(200).json({ essays });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching essays." });
    }
  }

  async getAllEssays(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(200).json({
          message: "Tutor profile not found",
        });
      }
      console.log(tutor._id);
      const essays = await Essay.find({
        markedBy: tutor._id,
      });

      if (essays.length === 0) {
        return res
          .status(200)
          .json({ message: "No in-progress essays found." });
      }

      res.status(200).json({ essays });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching essays." });
    }
  }

  async getCompletedEssays(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(404).json({
          message: "Tutor profile not found",
        });
      }
      const essays = await Essay.find({
        status: "Completed",
        markedBy: tutor._id,
      });

      if (essays.length === 0) {
        return res.status(404).json({ message: "No completed essays found." });
      }

      res.status(200).json({ essays });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching essays." });
    }
  }

  async getTutorProfilesforTutoring(req, res) {
    try {
      const tutoringRecords = await Tutoring.find({
        status: "Available",
      }).populate({
        path: "tutorId",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      });

      if (!tutoringRecords || tutoringRecords.length === 0) {
        return res.status(404).json({ message: "No tutors available." });
      }

      const tutors = [];
      for (const tutoring of tutoringRecords) {
        // Check if the required fields exist
        if (tutoring.tutorId && tutoring.tutorId.userId) {
          tutors.push({
            _id: tutoring.tutorId._id,
            fullName: tutoring.tutorId.userId.name || "N/A",
            email: tutoring.tutorId.userId.email || "N/A",
            phone: tutoring.tutorId.userId.phone || "N/A",
            university: tutoring.tutorId.university || "N/A",
            experience: tutoring.tutorId.yearsOfExperience || 0,
            studyLevel: tutoring.tutorId.StudyLevel || "N/A",
            profilePicture: tutoring.tutorId.profilePicture || null,
            subjects: tutoring.tutorId.subjects
              ? tutoring.tutorId.subjects.map((subject) => ({
                  name: subject.name,
                  levels: subject.levels,
                }))
              : [],
            premiumEssays: tutoring.tutorId.premiumEssays || false,
            hasDBS: tutoring.tutorId.hasDBS || false,
            motivation: tutoring.tutorId.motivation || "",
            approved: tutoring.tutorId.approved || false,
            hourlyRate: tutoring.hourlyRate || 0, // Fetch hourly rate
            availability: tutoring.availability || {}, // Weekly availability
            subject: tutoring.subject || "N/A", // Main subject
            description: tutoring.description || "", // Tutor description
          });
        } else {
          console.warn(
            `Skipping tutoring record with missing tutorId or userId: ${tutoring._id}`
          );
        }
      }

      if (tutors.length === 0) {
        return res.status(404).json({ message: "No valid tutors found." });
      }

      return res.status(200).json({
        message: "Tutors retrieved successfully.",
        tutors,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async updateTutoringProfile(req, res) {
    try {
      console.log("Updating tutoring profile...");
      const { subject, hourlyRate, availability, description, status } =
        req.body;

      const tutor = await Tutor.findOne({ userId: req.user._id });
      const existingProfile = await Tutoring.findOne({ tutorId: tutor._id });
      if (existingProfile) {
        existingProfile.subject = subject || existingProfile.subject;
        existingProfile.hourlyRate = hourlyRate || existingProfile.hourlyRate;
        existingProfile.availability =
          availability || existingProfile.availability;
        existingProfile.description =
          description || existingProfile.description;
        existingProfile.status = status || existingProfile.status;

        await existingProfile.save();

        return res.status(200).json({
          message: "Tutoring profile updated successfully.",
          profile: existingProfile,
        });
      } else {
        // Create a new profile if one does not exist
        const newProfile = new Tutoring({
          tutorId: tutor._id,
          subject: subject || "",
          hourlyRate: hourlyRate || 0,
          availability: availability || {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
          description: description || "",
          status: status || true,
        });

        await newProfile.save();

        return res.status(201).json({
          message: "Tutoring profile created successfully.",
          profile: newProfile,
        });
      }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async getTutoringProfile(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found." });
      }
      const profile = await Tutoring.findOne({ tutorId: tutor._id });

      if (!profile) {
        return res.status(404).json({ message: "Tutoring profile not found." });
      }

      return res.status(200).json({
        message: "Tutoring profile retrieved successfully.",
        tutor,
        profile,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async getDashboard(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found" });
      }

      const essays = await Essay.find({
        markedBy: tutor._id,
        status: "Completed",
      });
      const essaysReviewed = essays.length;

      const currentDateTime = new Date();
      const tutoringSessions = await TutoringSession.find({
        tutorId: tutor._id,
        endDateTime: { $lte: currentDateTime },
      });
      const interviewsConducted = tutoringSessions.length;

      const ratingResult = await Rating.aggregate([
        { $match: { teacher: tutor._id } },
        { $group: { _id: null, avgRating: { $avg: "$ratings" } } },
      ]);

      const avgRating =
        ratingResult.length > 0
          ? parseFloat(ratingResult[0].avgRating.toFixed(1))
          : 0;

      const tutoring = await Tutoring.findOne({ tutorId: tutor._id });
      const essayEarning = essays.reduce(
        (sum, essay) => sum + (essay.price || 0),
        0
      );
      const tutoringEarning =
        interviewsConducted * (tutoring ? tutoring.hourlyRate : 0);
      const earnings = essayEarning + tutoringEarning;
      const dashboardData = {
        essaysReviewed,
        interviewsConducted,
        rating: avgRating,
        earnings: `£${earnings.toFixed(2)}`,
      };

      // Send the response
      return res.status(200).json(dashboardData);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async getPendingTutoringSessions(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(200).json({ message: "Tutor profile not found." });
      }
      console.log(tutor._id);
      const currentDateTime = new Date();
      console.log(currentDateTime);
      const pendingSessions = await TutoringSession.find({
        tutorId: tutor._id,
        startTime: { $gt: currentDateTime },
      });

      if (pendingSessions.length === 0) {
        return res
          .status(200)
          .json({ message: "No pending tutoring sessions found." });
      }

      return res.status(200).json({
        message: "Pending tutoring sessions retrieved successfully.",
        sessions: pendingSessions,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async getCompletedTutoringSessions(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(404).json({ message: "Tutor profile not found." });
      }

      const currentDateTime = new Date();

      const completedSessions = await TutoringSession.find({
        tutorId: tutor._id,
        endTime: { $lt: currentDateTime },
      });

      if (completedSessions.length === 0) {
        return res
          .status(200)
          .json({ message: "No completed tutoring sessions found." });
      }

      return res.status(200).json({
        message: "Completed tutoring sessions retrieved successfully.",
        sessions: completedSessions,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  async getInProgressTutoringSessions(req, res) {
    try {
      const tutor = await Tutor.findOne({ userId: req.user._id });
      if (!tutor) {
        return res.status(404).json({ message: "Tutor profile not found." });
      }

      const currentDateTime = new Date();

      const inProgressSessions = await TutoringSession.find({
        tutorId: tutor._id,
        startTime: { $lte: currentDateTime },
        endTime: { $gte: currentDateTime },
      });

      if (inProgressSessions.length === 0) {
        return res
          .status(200)
          .json({ message: "No in-progress tutoring sessions found." });
      }

      return res.status(200).json({
        message: "In-progress tutoring sessions retrieved successfully.",
        sessions: inProgressSessions,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  static async checkAndResetStaleEssays() {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const staleEssays = await Essay.updateMany(
        {
          status: "In Progress",
          accepted: false,
          inProgressSince: { $lt: fortyEightHoursAgo },
        },
        {
          $set: {
            status: "Pending",
            markedBy: null,
            inProgressSince: null,
          },
        }
      );

      console.log(
        `Reset ${staleEssays.modifiedCount} stale essays to Pending status`
      );
    } catch (error) {
      console.error("Error checking stale essays:", error);
    }
  }
}

module.exports = new TutorController();
module.exports.checkAndResetStaleEssays =
  TutorController.checkAndResetStaleEssays;
