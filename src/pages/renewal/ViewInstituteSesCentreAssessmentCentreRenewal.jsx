// ViewInstituteSesCentreAssessmentCentreRenewal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Radio,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Alert,
  Tooltip,
} from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import PaymentIcon from "@mui/icons-material/Payment";
import FileDownload from "../../components/file/FileDownload";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import CommonService from "../../api/services/internal/common/CommonService";
import InstituteRegistrationRenewalService from "../../api/services/internal/registration/InstituteRegistrationRenewalService";
import BirmsPaymentService from "../../api/services/internal/birms/BirmsPaymentService";

// ==================== CONSTANTS ====================
const TABLE_STYLE = {
  border: "1px solid",
  borderColor: "divider",
  "& th, & td": {
    border: "1px solid",
    borderColor: "divider",
    height: 28,
    padding: "0px 6px",
    fontSize: "0.80rem",
    lineHeight: 1.2,
    verticalAlign: "middle",
  },
  "& th": {
    fontWeight: 600,
    backgroundColor: "#fafafa",
  },
};

const STATUS = {
  VERIFY: 56,
  APPROVE: 57,
  REJECT: 58,
  ENDORSE: 59,
  REJECT_REC: 60,
  VERIFY_REC: 62,
};

// ==================== PROPTYPES ====================

const basicInfoFieldPropTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  gridProps: PropTypes.object,
};

const trainerCardPropTypes = {
  trainer: PropTypes.shape({
    nationalityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    cid: PropTypes.string,
    workPermit: PropTypes.string,
    name: PropTypes.string,
    genderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    qualification: PropTypes.string,
    experience: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    typeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  index: PropTypes.number.isRequired,
  getters: PropTypes.shape({
    getNationalityName: PropTypes.func.isRequired,
    getGenderName: PropTypes.func.isRequired,
    getJobTypeName: PropTypes.func.isRequired,
  }).isRequired,
};

const courseCardPropTypes = {
  course: PropTypes.shape({
    sectorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    courseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    courseLevelId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    theoryHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    practicalHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ojtHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    feesPerTrainee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    enrollmentCapacity: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  }).isRequired,
  index: PropTypes.number.isRequired,
  getters: PropTypes.shape({
    getSectorName: PropTypes.func.isRequired,
    getCourseName: PropTypes.func.isRequired,
    getCertificateLevelName: PropTypes.func.isRequired,
  }).isRequired,
};

const tuitionCardPropTypes = {
  tuition: PropTypes.shape({
    classLevel: PropTypes.string,
    subjects: PropTypes.string,
    duration: PropTypes.string,
    fees: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tutorName: PropTypes.string,
    tutorCid: PropTypes.string,
    tutorQualification: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

const qualityChecklistTablePropTypes = {
  standard: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    rows: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        value: PropTypes.string,
      }),
    ),
  }).isRequired,
  qualityResponses: PropTypes.object.isRequired,
  qualityRemarks: PropTypes.object.isRequired,
  onResponseChange: PropTypes.func.isRequired,
  onRemarkChange: PropTypes.func.isRequired,
  isReadOnly: PropTypes.bool,
};

const paymentInfoCardPropTypes = {
  paymentStatus: PropTypes.shape({
    paymentAdviceNo: PropTypes.string,
    refNo: PropTypes.string,
    taxPayerName: PropTypes.string,
    paymentStatus: PropTypes.string,
    paymentDueDate: PropTypes.string,
    platform: PropTypes.string,
    totalPayableAmount: PropTypes.number,
    paymentMode: PropTypes.string,
    redirectUrl: PropTypes.string,
  }),
  onGeneratePayment: PropTypes.func.isRequired,
  renewalData: PropTypes.object,
  navigate: PropTypes.func.isRequired,
};

// ==================== UTILITY FUNCTIONS ====================
const getOriginalServiceIdForQuality = (mappedServiceId) => {
  const reverseServiceIdMap = {
    8: "7",
    53: "36",
    52: "4",
  };
  const stringId = mappedServiceId?.toString();
  return reverseServiceIdMap[stringId] || mappedServiceId;
};

const getServiceCodeForPayment = (serviceId) => {
  const serviceCodeMap = {
    8: 100571,
    52: 100583,
    53: 100573,
  };
  const stringId = serviceId?.toString();
  return serviceCodeMap[stringId] || 100570;
};

// ==================== CUSTOM HOOKS ====================
const useMasterData = () => {
  const [sectors, setSectors] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [dzongkhags, setDzongkhags] = useState([]);
  const [nationality, setNationality] = useState([]);
  const [gender, setGender] = useState([]);
  const [jobType, setJobType] = useState([]);
  const [certificateLevel, setCertificateLevel] = useState([]);
  const [ownershipTypes, setOwnershipTypes] = useState([]);

  const fetchMasterData = useCallback(async (serviceId) => {
    try {
      const serviceIdForQuality =
        getOriginalServiceIdForQuality(serviceId) || 7;

      const [
        sectorsRes,
        dzongkhagsRes,
        ownershipRes,
        nationalityRes,
        genderRes,
        jobTypeRes,
        certificateLevelRes,
      ] = await Promise.all([
        CommonService.getAllSectors(),
        CommonService.getAllDzongkhags(),
        CommonService.getByParentId(7),
        CommonService.getByParentId(9),
        CommonService.getByParentId(8),
        CommonService.getByParentId(11),
        CommonService.getByParentId(10),
      ]);

      setSectors(sectorsRes.data || []);
      setDzongkhags(dzongkhagsRes.data || []);
      setOwnershipTypes(ownershipRes.data || []);
      setNationality(nationalityRes.data || []);
      setGender(genderRes.data || []);
      setJobType(jobTypeRes.data || []);
      setCertificateLevel(certificateLevelRes.data || []);

      return serviceIdForQuality;
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load master data");
      return null;
    }
  }, []);

  const fetchCoursesBySector = useCallback(
    async (sectorId) => {
      if (!sectorId || coursesMap[sectorId]) return;
      try {
        const response = await CommonService.getOccupationsBySectorId(sectorId);
        setCoursesMap((prev) => ({ ...prev, [sectorId]: response.data || [] }));
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCoursesMap((prev) => ({ ...prev, [sectorId]: [] }));
      }
    },
    [coursesMap],
  );

  const getSectorName = useCallback(
    (id) => {
      if (!id) return "";
      const sector = sectors.find((s) => s.id.toString() === id.toString());
      return sector ? sector.sectorName : id;
    },
    [sectors],
  );

  const getCourseName = useCallback(
    (sectorId, courseId) => {
      if (!courseId) return "";
      const courses = coursesMap[sectorId];
      if (!courses) return courseId;
      const course = courses.find(
        (c) => c.id.toString() === courseId.toString(),
      );
      return course ? course.occupationName || course.name : courseId;
    },
    [coursesMap],
  );

  const getDzongkhagName = useCallback(
    (id) => {
      if (!id) return "";
      const dz = dzongkhags.find((d) => d.id.toString() === id.toString());
      return dz ? dz.dzonkhagName : id;
    },
    [dzongkhags],
  );

  const getOwnershipTypeName = useCallback(
    (id) => {
      if (!id) return "";
      const type = ownershipTypes.find(
        (t) => t.id.toString() === id.toString(),
      );
      return type ? type.name : id;
    },
    [ownershipTypes],
  );

  const getNationalityName = useCallback(
    (id) => {
      if (!id) return "";
      const nat = nationality.find((n) => n.id.toString() === id.toString());
      return nat ? nat.name : id;
    },
    [nationality],
  );

  const getGenderName = useCallback(
    (id) => {
      if (!id) return "";
      const gen = gender.find((g) => g.id.toString() === id.toString());
      return gen ? gen.name : id;
    },
    [gender],
  );

  const getJobTypeName = useCallback(
    (id) => {
      if (!id) return "";
      const job = jobType.find((j) => j.id.toString() === id.toString());
      return job ? job.name : id;
    },
    [jobType],
  );

  const getCertificateLevelName = useCallback(
    (id) => {
      if (!id) return "";
      const level = certificateLevel.find(
        (l) => l.id.toString() === id.toString(),
      );
      return level ? level.name : id;
    },
    [certificateLevel],
  );

  return {
    sectors,
    coursesMap,
    dzongkhags,
    nationality,
    gender,
    jobType,
    certificateLevel,
    ownershipTypes,
    fetchMasterData,
    fetchCoursesBySector,
    getSectorName,
    getCourseName,
    getDzongkhagName,
    getOwnershipTypeName,
    getNationalityName,
    getGenderName,
    getJobTypeName,
    getCertificateLevelName,
  };
};

const useQualityStandards = () => {
  const [qualityData, setQualityData] = useState([]);
  const [qualityResponses, setQualityResponses] = useState({});
  const [qualityRemarks, setQualityRemarks] = useState({});
  const [rawQualityStandards, setRawQualityStandards] = useState(null);

  const fetchQualityStandards = useCallback(async (serviceId) => {
    try {
      const response = await CommonService.getAllQualitystandards(serviceId);
      if (response.data && response.data.length > 0) {
        const mainCategories = response.data.filter(
          (item) => item.parentId === 0,
        );
        const subCategories = response.data.filter(
          (item) => item.parentId !== 0,
        );
        const structured = mainCategories.map((category) => ({
          id: category.id.toString(),
          title: category.dropdownName || category.description,
          rows: subCategories
            .filter((sub) => sub.parentId === category.id)
            .map((sub) => ({
              id: sub.id.toString(),
              value: sub.dropdownName || sub.description,
            })),
        }));
        setQualityData(structured);
        return structured;
      }
      return [];
    } catch (error) {
      console.error("Error fetching quality standards:", error);
      toast.error("Failed to load quality standards");
      return [];
    }
  }, []);

  const parseQualityStandardsWithData = useCallback(
    (qualityStr, qualityDataRef) => {
      try {
        if (!qualityStr) return { responses: {}, remarks: {} };
        const data =
          typeof qualityStr === "string" ? JSON.parse(qualityStr) : qualityStr;
        const responseMap = {};
        const remarksMap = {};

        data.forEach((item) => {
          const subQuestionId = item.standardId?.toString();
          const responseValue = item.responseId;
          const remarkValue = item.remarks || "";

          let categoryId = null;
          for (const category of qualityDataRef) {
            const foundRow = category.rows.find(
              (row) => row.id === subQuestionId,
            );
            if (foundRow) {
              categoryId = category.id;
              break;
            }
          }

          if (categoryId && subQuestionId) {
            if (!responseMap[categoryId]) responseMap[categoryId] = {};
            if (!remarksMap[categoryId]) remarksMap[categoryId] = {};
            responseMap[categoryId][subQuestionId] = responseValue;
            remarksMap[categoryId][subQuestionId] = remarkValue;
          }
        });
        return { responses: responseMap, remarks: remarksMap };
      } catch (error) {
        console.error("Error parsing quality standards:", error);
        return { responses: {}, remarks: {} };
      }
    },
    [],
  );

  const handleQualityResponseChange = useCallback(
    (categoryId, subQuestionId, value) => {
      setQualityResponses((prev) => {
        const newResponses = { ...prev };
        if (!newResponses[categoryId]) newResponses[categoryId] = {};
        if (newResponses[categoryId][subQuestionId] === value) {
          delete newResponses[categoryId][subQuestionId];
          if (Object.keys(newResponses[categoryId]).length === 0) {
            delete newResponses[categoryId];
          }
        } else {
          newResponses[categoryId][subQuestionId] = value;
        }
        return newResponses;
      });
    },
    [],
  );

  const handleQualityRemarkChange = useCallback(
    (categoryId, subQuestionId, value) => {
      setQualityRemarks((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], [subQuestionId]: value },
      }));
    },
    [],
  );

  const prepareQualityStandardsForBackend = useCallback(() => {
    const qualityStandardsData = [];
    Object.keys(qualityResponses).forEach((categoryId) => {
      Object.keys(qualityResponses[categoryId]).forEach((subQuestionId) => {
        const responseId = qualityResponses[categoryId][subQuestionId];
        const remark = qualityRemarks[categoryId]?.[subQuestionId] || "";
        if (responseId && responseId !== "") {
          qualityStandardsData.push({
            standardId: parseInt(subQuestionId),
            responseId: responseId,
            remarks: remark,
          });
        }
      });
    });
    return qualityStandardsData;
  }, [qualityResponses, qualityRemarks]);

  const hasQualityNo = useMemo(() => {
    for (const categoryId in qualityResponses) {
      for (const questionId in qualityResponses[categoryId]) {
        if (qualityResponses[categoryId][questionId] === "N") {
          return true;
        }
      }
    }
    return false;
  }, [qualityResponses]);

  return {
    qualityData,
    qualityResponses,
    qualityRemarks,
    rawQualityStandards,
    setRawQualityStandards,
    setQualityResponses,
    setQualityRemarks,
    fetchQualityStandards,
    parseQualityStandardsWithData,
    handleQualityResponseChange,
    handleQualityRemarkChange,
    prepareQualityStandardsForBackend,
    hasQualityNo,
  };
};

const usePayment = (applicationNo) => {
  const [paymentStatus, setPaymentStatus] = useState(null);

  const fetchPaymentStatus = useCallback(async () => {
    try {
      const response =
        await BirmsPaymentService.getPaymentByApplicationNo(applicationNo);
      setPaymentStatus(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching payment status:", error);
      setPaymentStatus(null);
      return null;
    }
  }, [applicationNo]);

  const isPaymentPaid = useMemo(() => {
    return paymentStatus?.paymentStatus?.toLowerCase() === "paid";
  }, [paymentStatus]);

  return { paymentStatus, fetchPaymentStatus, isPaymentPaid };
};

const useActionDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [endorseRemarks, setEndorseRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const openDialog = (statusId) => {
    setSelectedStatusId(statusId);
    setRemarks("");
    setEndorseRemarks("");
    setRemarksError("");
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setSelectedStatusId(null);
    setRemarks("");
    setEndorseRemarks("");
    setRemarksError("");
    setActionLoading(false);
  };

  return {
    open,
    selectedStatusId,
    remarks,
    endorseRemarks,
    remarksError,
    actionLoading,
    setRemarks,
    setEndorseRemarks,
    setRemarksError,
    setActionLoading,
    openDialog,
    closeDialog,
  };
};

// ==================== PARSER FUNCTIONS ====================
const parseTrainers = (trainersStr) => {
  try {
    if (!trainersStr) return [];
    const trainers = JSON.parse(trainersStr);
    return Array.isArray(trainers) ? trainers : [];
  } catch (error) {
    console.error("Error parsing trainers:", error);
    return [];
  }
};

const parseCourses = (coursesStr) => {
  try {
    if (!coursesStr) return [];
    const courses = JSON.parse(coursesStr);
    return Array.isArray(courses) ? courses : [];
  } catch (error) {
    console.error("Error parsing courses:", error);
    return [];
  }
};

const parseTuitionDetails = (tuitionStr) => {
  try {
    if (!tuitionStr) return [];
    const tuition = JSON.parse(tuitionStr);
    return Array.isArray(tuition) ? tuition : [];
  } catch (error) {
    console.error("Error parsing tuition details:", error);
    return [];
  }
};

const parseDocuments = (docsStr) => {
  try {
    if (!docsStr) return [];
    const docs = JSON.parse(docsStr);
    return docs.map((doc) => ({
      name: doc.documentName || doc.name,
      url: doc.url,
      id: doc.id,
    }));
  } catch (error) {
    console.error("Error parsing documents:", error);
    return [];
  }
};

// ==================== REUSABLE COMPONENTS ====================
const BasicInfoField = ({ label, value, gridProps = { xs: 12, md: 4 } }) => (
  <Grid {...gridProps}>
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value || ""}
      slotProps={{ input: { readOnly: true } }}
    />
  </Grid>
);

BasicInfoField.propTypes = basicInfoFieldPropTypes;

const TrainerCard = ({ trainer, index, getters }) => {
  const { getNationalityName, getGenderName, getJobTypeName } = getters;

  return (
    <Grid size={{ xs: 12 }}>
      <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle2" fontWeight={600} mb={2}>
          Trainer {index + 1}
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <BasicInfoField
            label="Nationality"
            value={getNationalityName(trainer.nationalityId)}
            gridProps={{ xs: 12, md: 3 }}
          />
          {trainer.cid && (
            <BasicInfoField
              label="CID"
              value={trainer.cid}
              gridProps={{ xs: 12, md: 3 }}
            />
          )}
          {trainer.workPermit && (
            <BasicInfoField
              label="Work Permit"
              value={trainer.workPermit}
              gridProps={{ xs: 12, md: 3 }}
            />
          )}
          <BasicInfoField
            label="Name"
            value={trainer.name}
            gridProps={{ xs: 12, md: 3 }}
          />
          <BasicInfoField
            label="Gender"
            value={getGenderName(trainer.genderId)}
            gridProps={{ xs: 12, md: 3 }}
          />
          <BasicInfoField
            label="Qualification"
            value={trainer.qualification}
            gridProps={{ xs: 12, md: 3 }}
          />
          <BasicInfoField
            label="Experience (Years)"
            value={trainer.experience}
            gridProps={{ xs: 12, md: 3 }}
          />
          <BasicInfoField
            label="Type"
            value={getJobTypeName(trainer.typeId)}
            gridProps={{ xs: 12, md: 3 }}
          />
        </Grid>
      </Paper>
    </Grid>
  );
};

TrainerCard.propTypes = trainerCardPropTypes;

const CourseCard = ({ course, index, getters }) => {
  const { getSectorName, getCourseName, getCertificateLevelName } = getters;

  return (
    <Grid size={{ xs: 12 }}>
      <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle2" fontWeight={600} mb={2}>
          Course {index + 1}
        </Typography>
        <Grid container spacing={2}>
          <BasicInfoField
            label="Sector"
            value={getSectorName(course.sectorId)}
            gridProps={{ xs: 12, md: 4 }}
          />
          <BasicInfoField
            label="Course Title"
            value={getCourseName(course.sectorId, course.courseId)}
            gridProps={{ xs: 12, md: 4 }}
          />
          <BasicInfoField
            label="Level Certificate / Diploma"
            value={getCertificateLevelName(course.courseLevelId)}
            gridProps={{ xs: 12, md: 4 }}
          />
          <BasicInfoField
            label="Theory (Hours)"
            value={course.theoryHours}
            gridProps={{ xs: 12, md: 4 }}
          />
          <BasicInfoField
            label="Practical (Hours)"
            value={course.practicalHours}
            gridProps={{ xs: 12, md: 4 }}
          />
          <BasicInfoField
            label="OJT (Hours)"
            value={course.ojtHours}
            gridProps={{ xs: 12, md: 4 }}
          />
          <BasicInfoField
            label="Fees per Trainee"
            value={course.feesPerTrainee}
            gridProps={{ xs: 12, md: 4 }}
          />
          <BasicInfoField
            label="Enrollment Capacity per Batch"
            value={course.enrollmentCapacity}
            gridProps={{ xs: 12, md: 4 }}
          />
        </Grid>
      </Paper>
    </Grid>
  );
};

CourseCard.propTypes = courseCardPropTypes;

const TuitionCard = ({ tuition, index }) => (
  <Grid size={{ xs: 12 }}>
    <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="subtitle2" fontWeight={600} mb={2}>
        Tuition/Coaching {index + 1}
      </Typography>
      <Grid container spacing={2}>
        <BasicInfoField
          label="Class Level"
          value={tuition.classLevel}
          gridProps={{ xs: 12, md: 4 }}
        />
        <BasicInfoField
          label="Subjects"
          value={tuition.subjects}
          gridProps={{ xs: 12, md: 4 }}
        />
        <BasicInfoField
          label="Duration (Hours/Months)"
          value={tuition.duration}
          gridProps={{ xs: 12, md: 4 }}
        />
        <BasicInfoField
          label="Fees (Nu.)"
          value={tuition.fees}
          gridProps={{ xs: 12, md: 4 }}
        />
        <BasicInfoField
          label="Tutor Name"
          value={tuition.tutorName}
          gridProps={{ xs: 12, md: 4 }}
        />
        <BasicInfoField
          label="Tutor CID"
          value={tuition.tutorCid}
          gridProps={{ xs: 12, md: 4 }}
        />
        <BasicInfoField
          label="Tutor Qualification"
          value={tuition.tutorQualification}
          gridProps={{ xs: 12, md: 4 }}
        />
      </Grid>
    </Paper>
  </Grid>
);

TuitionCard.propTypes = tuitionCardPropTypes;

const QualityChecklistTable = ({
  standard,
  qualityResponses,
  qualityRemarks,
  onResponseChange,
  onRemarkChange,
  isReadOnly = false,
}) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }} mb={1}>
          {standard.title}
        </Typography>
        <TableContainer>
          <Table size="small" sx={TABLE_STYLE}>
            <TableHead>
              <TableRow>
                <TableCell width="40">Sl. No</TableCell>
                <TableCell>Quality Indicator</TableCell>
                <TableCell align="center" width="80">
                  YES
                </TableCell>
                <TableCell align="center" width="80">
                  NO
                </TableCell>
                <TableCell width="250">Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {standard.rows.map((row, index) => {
                const selectedValue = qualityResponses[standard.id]?.[row.id];
                const isYes = selectedValue === "Y";
                const isNo = selectedValue === "N";
                const remark = qualityRemarks[standard.id]?.[row.id] || "";

                return (
                  <TableRow key={row.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.value}</TableCell>
                    <TableCell align="center">
                      <Radio
                        size="small"
                        sx={{ p: 0.25 }}
                        checked={isYes}
                        disabled={isReadOnly}
                        onChange={() => {
                          const newValue = isYes ? undefined : "Y";
                          onResponseChange(standard.id, row.id, newValue);
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Radio
                        size="small"
                        sx={{ p: 0.25 }}
                        checked={isNo}
                        disabled={isReadOnly}
                        onChange={() => {
                          const newValue = isNo ? undefined : "N";
                          onResponseChange(standard.id, row.id, newValue);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Enter remarks"
                        value={remark}
                        onChange={(e) =>
                          onRemarkChange(standard.id, row.id, e.target.value)
                        }
                        slotProps={{
                          input: {
                            readOnly: isReadOnly,
                            sx: { fontSize: "0.75rem" },
                          },
                        }}
                        multiline
                        rows={2}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Grid>
  );
};

QualityChecklistTable.propTypes = qualityChecklistTablePropTypes;

const PaymentInfoCard = ({
  paymentStatus,
  onGeneratePayment,
  renewalData,
  navigate,
}) => {
  if (paymentStatus) {
    return (
      <Card variant="outlined" sx={{ p: 0 }}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Grid container spacing={0.5}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  py: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 100 }}
                >
                  Payment Advice No:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ fontSize: "0.75rem" }}
                >
                  {paymentStatus.paymentAdviceNo || "N/A"}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  py: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 70 }}
                >
                  Ref No:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ fontSize: "0.75rem" }}
                >
                  {paymentStatus.refNo || "N/A"}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  py: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 70 }}
                >
                  Tax Payer:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ fontSize: "0.75rem" }}
                  noWrap
                >
                  {paymentStatus.taxPayerName || "N/A"}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  py: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 60 }}
                >
                  Status:
                </Typography>
                <Chip
                  label={paymentStatus.paymentStatus || "N/A"}
                  color={
                    paymentStatus.paymentStatus === "paid"
                      ? "success"
                      : "warning"
                  }
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  py: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 70 }}
                >
                  Due Date:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ fontSize: "0.75rem" }}
                >
                  {paymentStatus.paymentDueDate || "N/A"}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  py: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 60 }}
                >
                  Platform:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ fontSize: "0.75rem" }}
                >
                  {paymentStatus.platform || "N/A"}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  py: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 70 }}
                >
                  Amount:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="primary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  Nu. {paymentStatus.totalPayableAmount || "0.00"}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  py: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 70 }}
                >
                  Payment Mode:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ fontSize: "0.75rem" }}
                >
                  {paymentStatus.paymentMode || "Not yet paid"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          {paymentStatus.redirectUrl && (
            <Box sx={{ mt: 1.5, display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<PaymentIcon sx={{ fontSize: 18 }} />}
                onClick={() => window.open(paymentStatus.redirectUrl, "_blank")}
                sx={{
                  px: 2.5,
                  py: 0.5,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.75rem",
                }}
              >
                Proceed to Payment
              </Button>
            </Box>
          )}
          <Alert
            severity="info"
            sx={{
              mt: 1,
              py: 0.25,
              "& .MuiAlert-message": { fontSize: "0.7rem", py: 0.25 },
            }}
          >
            PA number already generated. Click above to proceed with payment.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="body2" gutterBottom sx={{ fontSize: "0.8rem" }}>
          Click the button below to generate a PA number and proceed to payment.
        </Typography>
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<SettingsSuggestIcon sx={{ fontSize: 18 }} />}
            onClick={onGeneratePayment}
            sx={{
              px: 3,
              py: 0.5,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.75rem",
            }}
          >
            Generate PA Number
          </Button>
        </Box>
        <Alert
          severity="info"
          sx={{
            mt: 1.5,
            py: 0.25,
            "& .MuiAlert-message": { fontSize: "0.7rem", py: 0.25 },
          }}
        >
          <strong>Note:</strong> This will create a payment request and redirect
          you to the payment portal.
        </Alert>
      </CardContent>
    </Card>
  );
};

PaymentInfoCard.propTypes = paymentInfoCardPropTypes;

// ==================== MAIN COMPONENT ====================
const ViewInstituteSesCentreAssessmentCentreRenewal = () => {
  const access_token = useSelector((state) => state.auth.accessToken);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);
  const actionId = useSelector((state) => state.auth.id);
  const userId = useSelector((state) => state.auth.userId);
  const { applicationNo } = useParams();
  const navigate = useNavigate();

  // Custom hooks
  const masterData = useMasterData();
  const qualityStandards = useQualityStandards();
  const payment = usePayment(applicationNo);
  const dialog = useActionDialog();

  // Local state
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [renewalData, setRenewalData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [overallRemarks, setOverallRemarks] = useState("");

  // Derived state
  const isTuitionService =
    renewalData?.service_id === "36" || renewalData?.service_id === 36;
  const roleId = currentRoleId?.toString();

  // Effect to parse quality standards when data changes
  useEffect(() => {
    if (
      qualityStandards.qualityData.length > 0 &&
      qualityStandards.rawQualityStandards
    ) {
      const { responses, remarks } =
        qualityStandards.parseQualityStandardsWithData(
          qualityStandards.rawQualityStandards,
          qualityStandards.qualityData,
        );
      qualityStandards.setQualityResponses(responses);
      qualityStandards.setQualityRemarks(remarks);
    }
  }, [qualityStandards.qualityData, qualityStandards.rawQualityStandards]);

  // Fetch data on mount
  useEffect(() => {
    if (applicationNo) {
      fetchRenewalData();
    }
    payment.fetchPaymentStatus();
  }, [applicationNo]);

  const fetchRenewalData = async () => {
    setLoading(true);
    try {
      const renewalRes =
        await InstituteRegistrationRenewalService.getRenewalDetails(
          applicationNo,
          access_token,
        );
      let data = renewalRes.data;
      if (Array.isArray(data) && data.length > 0) data = data[0];

      const serviceIdForQuality = await masterData.fetchMasterData(
        data?.service_id,
      );

      if (serviceIdForQuality) {
        const structured =
          await qualityStandards.fetchQualityStandards(serviceIdForQuality);
        if (data.quality_standard_responses) {
          qualityStandards.setRawQualityStandards(
            data.quality_standard_responses,
          );
        }
      }

      const trainers = parseTrainers(data.trainers);
      const courses = parseCourses(data.courses);
      const tuitionDetails = parseTuitionDetails(data.tuition_details);
      const parsedDocuments = parseDocuments(data.documents);

      setRenewalData({
        ...data,
        parsedTrainers: trainers,
        parsedCourses: courses,
        parsedTuitionDetails: tuitionDetails,
      });
      setDocuments(parsedDocuments);

      if (courses && courses.length > 0) {
        courses.forEach(async (course) => {
          if (course.sectorId) {
            await masterData.fetchCoursesBySector(course.sectorId);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching renewal data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback((uploadedFiles) => {
    setNewDocuments(uploadedFiles || []);
  }, []);

  const handleAction = async () => {
    const {
      selectedStatusId,
      remarks,
      endorseRemarks,
      setActionLoading,
      closeDialog,
    } = dialog;

    if (selectedStatusId === STATUS.REJECT && !remarks.trim()) {
      dialog.setRemarksError("Remarks are required for rejection");
      return;
    }
    if (selectedStatusId === STATUS.ENDORSE && !endorseRemarks.trim()) {
      dialog.setRemarksError("Remarks are required for endorsement");
      return;
    }

    setActionLoading(true);
    try {
      const qualityStandardsData =
        qualityStandards.prepareQualityStandardsForBackend();
      const payload = {
        applicationNo: renewalData.application_no,
        registrationNo: renewalData.renewal_registration_no,
        instituteName: renewalData.proposed_institute_name,
        dzongkhagId: renewalData.dzongkhag_id,
        currentRoleId: currentRoleId,
        exactLocation: renewalData.exact_location,
        telephoneNo: renewalData.telephone_no,
        mobileNo: renewalData.mobile_no,
        emailId: renewalData.email_id,
        sectorId: renewalData.sector_id,
        ownershipTypeId: renewalData.ownership_type_id,
        bhutaneseEmployees: renewalData.bhutanese_employees,
        nonBhutaneseEmployees: renewalData.non_bhutanese_employees,
        businessLicenseNo: renewalData.business_license_no,
        keyContactName: renewalData.key_contact_name,
        keyContactDesignation: renewalData.key_contact_designation,
        keyContactMobileNo: renewalData.key_contact_mobile_no,
        courses: renewalData.parsedCourses,
        website: renewalData.website,
        serviceId: renewalData.service_id,
        assignedRoleId: currentRoleId,
        statusId: selectedStatusId,
        recMemberUserId: userId,
        updatedBy: actionId,
        documents: newDocuments,
        remarks:
          selectedStatusId === STATUS.REJECT
            ? remarks
            : selectedStatusId === STATUS.ENDORSE
              ? endorseRemarks
              : "",
        qualityStandards: qualityStandardsData,
        overallRemarks: currentRoleId == 23 ? overallRemarks : "",
      };

      await InstituteRegistrationRenewalService.verifyInstituteRenewal(
        payload,
        access_token,
      );

      const statusMessages = {
        [STATUS.VERIFY]: "Renewal verified successfully",
        [STATUS.APPROVE]: "Renewal approved successfully",
        [STATUS.REJECT]: "Renewal rejected successfully",
        [STATUS.ENDORSE]: "Renewal endorsed successfully",
        [STATUS.VERIFY_REC]: "Renewal verified successfully",
        [STATUS.REJECT_REC]: "Renewal rejected successfully",
      };

      toast.success(
        statusMessages[selectedStatusId] || "Action completed successfully",
      );
      navigate(-1);
      closeDialog();
      setNewDocuments([]);
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error(`Failed to process renewal: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getTabs = useCallback(() => {
    const baseTabs = [{ icon: <BusinessIcon />, label: "Basic informations" }];
    if (isTuitionService) {
      baseTabs.push({
        icon: <MenuBookIcon />,
        label: "Tuition/Coaching Details",
      });
    } else {
      baseTabs.push(
        { icon: <SchoolIcon />, label: "Trainer Details" },
        { icon: <MenuBookIcon />, label: "Course Details" },
      );
    }
    baseTabs.push(
      { icon: <FileOpenIcon />, label: "Supporting Documents" },
      { icon: <VerifiedIcon />, label: "Quality Standards" },
    );
    if (currentRoleId == 7) {
      baseTabs.push({
        icon: <SettingsSuggestIcon />,
        label: "Generate PA Number",
      });
    }
    return baseTabs;
  }, [isTuitionService, currentRoleId]);

  const handleGeneratePayment = useCallback(() => {
    if (!renewalData) {
      toast.error("Renewal data not found");
      return;
    }
    const applicationNo = renewalData.application_no;
    const instituteId = 0;
    const serviceCode = getServiceCodeForPayment(renewalData.service_id);
    const taxPayerNo = renewalData.application_no || "N/A";
    const taxPayerEmail = renewalData.email_id || "N/A";
    const taxPayerMobileNo = renewalData.mobile_no || "N/A";
    const taxPayerName = renewalData.proposed_institute_name || "N/A";

    navigate(
      `/birms/common-payment-index/${applicationNo}/${serviceCode}/${taxPayerNo}/${taxPayerEmail}/${taxPayerMobileNo}/${taxPayerName}/${instituteId}`,
    );
  }, [renewalData, navigate]);

  const renderBasicInfo = useCallback(() => {
    const fields = [
      {
        label: "Name of Training Provider / Institution",
        value: renewalData?.proposed_institute_name,
      },
      {
        label: "Dzongkhag",
        value: masterData.getDzongkhagName(renewalData?.dzongkhag_id),
      },
      {
        label: "Location of the Institute",
        value: renewalData?.exact_location,
      },
      { label: "Telephone No", value: renewalData?.telephone_no },
      { label: "Mobile No", value: renewalData?.mobile_no },
      { label: "Email Id", value: renewalData?.email_id },
      { label: "Website Address", value: renewalData?.website },
      { label: "Business License No", value: renewalData?.business_license_no },
      {
        label: "Type of Ownership",
        value: masterData.getOwnershipTypeName(renewalData?.ownership_type_id),
      },
      {
        label: "Total Number of Bhutanese Employees",
        value: renewalData?.bhutanese_employees,
        type: "number",
      },
      {
        label: "Total Number of Non Bhutanese Employees",
        value: renewalData?.non_bhutanese_employees,
        type: "number",
      },
      {
        label: "Key Contact Person Name",
        value: renewalData?.key_contact_name,
      },
      {
        label: "Key Contact Person Designation",
        value: renewalData?.key_contact_designation,
      },
      {
        label: "Key Contact Person Mobile No",
        value: renewalData?.key_contact_mobile_no,
      },
    ];

    return (
      <Paper sx={{ p: 3, mb: 2 }} variant="outlined">
        <Grid container spacing={2}>
          {fields.map((field, index) => (
            <BasicInfoField
              key={index}
              label={field.label}
              value={field.value}
              gridProps={{ xs: 12, md: 4 }}
            />
          ))}
        </Grid>
      </Paper>
    );
  }, [renewalData, masterData]);

  const renderTrainers = useCallback(() => {
    const getters = {
      getNationalityName: masterData.getNationalityName,
      getGenderName: masterData.getGenderName,
      getJobTypeName: masterData.getJobTypeName,
    };

    return (
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        <Grid container spacing={3}>
          {renewalData?.parsedTrainers?.length > 0 ? (
            renewalData.parsedTrainers.map((trainer, index) => (
              <TrainerCard
                key={index}
                trainer={trainer}
                index={index}
                getters={getters}
              />
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Typography textAlign="center" color="text.secondary">
                No trainer information available
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  }, [renewalData, masterData]);

  const renderCourses = useCallback(() => {
    const getters = {
      getSectorName: masterData.getSectorName,
      getCourseName: masterData.getCourseName,
      getCertificateLevelName: masterData.getCertificateLevelName,
    };

    return (
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        <Grid container spacing={3}>
          {renewalData?.parsedCourses?.length > 0 ? (
            renewalData.parsedCourses.map((course, index) => (
              <CourseCard
                key={index}
                course={course}
                index={index}
                getters={getters}
              />
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Typography textAlign="center" color="text.secondary">
                No course information available
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  }, [renewalData, masterData]);

  const renderTuitionDetails = useCallback(() => {
    return (
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        <Grid container spacing={3}>
          {renewalData?.parsedTuitionDetails?.length > 0 ? (
            renewalData.parsedTuitionDetails.map((tuition, index) => (
              <TuitionCard key={index} tuition={tuition} index={index} />
            ))
          ) : (
            <Grid size={{ xs: 12 }}>
              <Typography textAlign="center" color="text.secondary">
                No tuition/coaching information available
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  }, [renewalData]);

  const renderDocuments = useCallback(() => {
    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Box
              component="ol"
              sx={{
                pl: 3,
                mb: 2,
                "& li": { fontSize: "0.85rem", fontStyle: "italic", mb: 0.5 },
              }}
            >
              <li>
                Photocopy of business license (Not Applicable for Government
                Institutes)
              </li>
              {!isTuitionService && (
                <li>
                  List of trainees for each course, indicating year of
                  graduation/male/female/CID No
                </li>
              )}
              <li>Previous year's performance report</li>
              <li>Tax clearance certificate</li>
            </Box>
            <FileDownload
              initialFiles={documents}
              onFileUpload={handleFileUpload}
              allowUpload={true}
            />
          </Paper>
        </Grid>
      </Grid>
    );
  }, [documents, handleFileUpload, isTuitionService]);

  const renderQualityStandards = useCallback(() => {
    const isReadOnly = currentRoleId == 23;

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          {qualityStandards.qualityData.length > 0 ? (
            <>
              {qualityStandards.qualityData.slice(0, 3).map((standard) => (
                <QualityChecklistTable
                  key={standard.id}
                  standard={standard}
                  qualityResponses={qualityStandards.qualityResponses}
                  qualityRemarks={qualityStandards.qualityRemarks}
                  onResponseChange={
                    qualityStandards.handleQualityResponseChange
                  }
                  onRemarkChange={qualityStandards.handleQualityRemarkChange}
                  isReadOnly={isReadOnly}
                />
              ))}
              {currentRoleId == 23 && (
                <Paper
                  sx={{
                    p: 3,
                    mt: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Overall Remarks
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Enter overall remarks for this renewal..."
                    value={overallRemarks}
                    onChange={(e) => setOverallRemarks(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Paper>
              )}
            </>
          ) : (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No quality standards available for this service
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    );
  }, [qualityStandards, currentRoleId, overallRemarks]);

  const renderPaymentTab = useCallback(() => {
    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <AccountBalanceIcon
                sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
              />
              <Typography variant="subtitle1" fontWeight={600}>
                Generate PA Number
              </Typography>
            </Box>
            <PaymentInfoCard
              paymentStatus={payment.paymentStatus}
              onGeneratePayment={handleGeneratePayment}
              renewalData={renewalData}
              navigate={navigate}
            />
          </Paper>
        </Grid>
      </Grid>
    );
  }, [payment.paymentStatus, handleGeneratePayment, renewalData, navigate]);

  const renderActionButtons = useCallback(() => {
    const isLastTab = tabValue === getTabs().length - 1;
    if (!isLastTab) return null;

    const buttons = [];

    if (roleId === "7") {
      buttons.push(
        <Tooltip
          key="verify"
          title={
            !payment.isPaymentPaid
              ? "Payment must be completed before verification"
              : ""
          }
          arrow
        >
          <span>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={() => dialog.openDialog(STATUS.VERIFY)}
              disabled={!payment.isPaymentPaid}
              sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
            >
              Verify
            </Button>
          </span>
        </Tooltip>,
      );
      buttons.push(
        <Button
          key="reject"
          variant="contained"
          color="error"
          size="small"
          startIcon={<CancelIcon />}
          onClick={() => dialog.openDialog(STATUS.REJECT)}
          sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
        >
          Reject
        </Button>,
      );
    }

    if (roleId === "10") {
      buttons.push(
        <Button
          key="verify"
          variant="contained"
          color="success"
          size="small"
          startIcon={<CheckCircleIcon />}
          onClick={() => dialog.openDialog(STATUS.VERIFY_REC)}
          sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
        >
          Verify
        </Button>,
        <Button
          key="reject"
          variant="contained"
          color="error"
          size="small"
          startIcon={<CancelIcon />}
          onClick={() => dialog.openDialog(STATUS.REJECT_REC)}
          sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
        >
          Reject
        </Button>,
      );
    }

    if (roleId === "23") {
      buttons.push(
        <Button
          key="endorse"
          variant="contained"
          color="primary"
          size="small"
          startIcon={<VerifiedIcon />}
          onClick={() => dialog.openDialog(STATUS.ENDORSE)}
          sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
        >
          Endorse
        </Button>,
      );
    }

    if (roleId === "22") {
      buttons.push(
        <Tooltip
          key="approve"
          title={
            !payment.paymentStatus
              ? "Payment must be completed before approval"
              : ""
          }
          arrow
        >
          <span>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={() => dialog.openDialog(STATUS.APPROVE)}
              disabled={!payment.paymentStatus}
              sx={{ px: 3, py: 0.5, fontWeight: 600, textTransform: "none" }}
            >
              Approve
            </Button>
          </span>
        </Tooltip>,
      );
    }

    return buttons;
  }, [
    tabValue,
    getTabs,
    roleId,
    payment.isPaymentPaid,
    payment.paymentStatus,
    dialog,
  ]);

  if (loading) {
    return (
      <Box sx={{ p: 1, minHeight: "100vh" }}>
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading renewal details...</Typography>
        </Paper>
      </Box>
    );
  }

  if (!renewalData) {
    return (
      <Box>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
            Renewal Application Details
          </Typography>
          <Typography textAlign="center" color="error">
            Renewal with Application No: {applicationNo} not found
          </Typography>
        </Paper>
      </Box>
    );
  }

  const tabs = getTabs();
  const isLastTab = tabValue === tabs.length - 1;

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} textAlign="center" mb={3}>
          Renewal Application Details
        </Typography>
        <Divider />

        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} icon={tab.icon} label={tab.label} />
          ))}
        </Tabs>

        {tabValue === 0 && renderBasicInfo()}
        {!isTuitionService && tabValue === 1 && renderTrainers()}
        {!isTuitionService && tabValue === 2 && renderCourses()}
        {isTuitionService && tabValue === 1 && renderTuitionDetails()}
        {tabValue === (isTuitionService ? 2 : 3) && renderDocuments()}
        {tabValue === (isTuitionService ? 3 : 4) && renderQualityStandards()}
        {currentRoleId == 7 &&
          tabValue === tabs.length - 1 &&
          renderPaymentTab()}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            mt: 3,
          }}
        >
          <Box>
            {tabValue > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SkipPreviousIcon />}
                onClick={() => setTabValue(tabValue - 1)}
                sx={{ fontWeight: 600, textTransform: "none", px: 3, py: 0.5 }}
              >
                Previous
              </Button>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            {!isLastTab && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                endIcon={<SkipNextIcon />}
                onClick={() => setTabValue(tabValue + 1)}
                sx={{ fontWeight: 600, textTransform: "none", px: 3, py: 0.5 }}
              >
                Next
              </Button>
            )}
            {renderActionButtons()}
          </Box>
        </Box>
      </Paper>

      {/* Action Dialog */}
      <Dialog
        open={dialog.open}
        onClose={dialog.closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialog.selectedStatusId === STATUS.VERIFY
            ? "Verify Renewal"
            : dialog.selectedStatusId === STATUS.APPROVE
              ? "Approve Renewal"
              : dialog.selectedStatusId === STATUS.REJECT
                ? "Reject Renewal"
                : dialog.selectedStatusId === STATUS.ENDORSE
                  ? "Endorse Renewal"
                  : dialog.selectedStatusId === STATUS.VERIFY_REC
                    ? "Verify Renewal"
                    : dialog.selectedStatusId === STATUS.REJECT_REC
                      ? "Reject Renewal"
                      : "Confirm Action"}
        </DialogTitle>
        <DialogContent>
          {dialog.selectedStatusId === STATUS.ENDORSE ? (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Please provide remarks for endorsing this renewal:
                <br />
                <strong>Application No: {renewalData?.application_no}</strong>
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Remarks"
                fullWidth
                multiline
                rows={4}
                value={dialog.endorseRemarks}
                onChange={(e) => {
                  dialog.setEndorseRemarks(e.target.value);
                  dialog.setRemarksError("");
                }}
                error={!!dialog.remarksError}
                helperText={dialog.remarksError}
                required
              />
            </>
          ) : dialog.selectedStatusId === STATUS.REJECT ||
            dialog.selectedStatusId === STATUS.REJECT_REC ? (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Please provide remarks for rejecting this renewal:
                <br />
                <strong>Application No: {renewalData?.application_no}</strong>
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Remarks"
                fullWidth
                multiline
                rows={4}
                value={dialog.remarks}
                onChange={(e) => {
                  dialog.setRemarks(e.target.value);
                  dialog.setRemarksError("");
                }}
                error={!!dialog.remarksError}
                helperText={dialog.remarksError}
                required
              />
            </>
          ) : (
            <DialogContentText>
              Are you sure you want to{" "}
              {dialog.selectedStatusId === STATUS.VERIFY ||
              dialog.selectedStatusId === STATUS.VERIFY_REC
                ? "verify"
                : "approve"}{" "}
              this renewal?
              <br />
              <strong>Application No: {renewalData?.application_no}</strong>
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={dialog.closeDialog}
            disabled={dialog.actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            color={
              dialog.selectedStatusId === STATUS.REJECT ? "error" : "success"
            }
            variant="contained"
            size="small"
            disabled={
              dialog.actionLoading ||
              (dialog.selectedStatusId === STATUS.REJECT &&
                !dialog.remarks.trim()) ||
              (dialog.selectedStatusId === STATUS.ENDORSE &&
                !dialog.endorseRemarks.trim())
            }
          >
            {dialog.actionLoading ? (
              <CircularProgress size={24} />
            ) : dialog.selectedStatusId === STATUS.VERIFY ? (
              "Confirm Verify"
            ) : dialog.selectedStatusId === STATUS.APPROVE ? (
              "Confirm Approve"
            ) : dialog.selectedStatusId === STATUS.REJECT ? (
              "Confirm Reject"
            ) : dialog.selectedStatusId === STATUS.ENDORSE ? (
              "Confirm Endorse"
            ) : dialog.selectedStatusId === STATUS.VERIFY_REC ? (
              "Confirm Verify"
            ) : dialog.selectedStatusId === STATUS.REJECT_REC ? (
              "Confirm Reject"
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ==================== PROPTYPES FOR MAIN COMPONENT ====================
ViewInstituteSesCentreAssessmentCentreRenewal.propTypes = {};

export default ViewInstituteSesCentreAssessmentCentreRenewal;
