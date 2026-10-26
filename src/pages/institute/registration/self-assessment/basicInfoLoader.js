// Loads Trainer and Course details for the Basic Information section.
//
// 1. Self assessment endpoint (get-basic-information-by-institute/{id})
//      trainers : tbl_institute_registration_dtls.institute_id = tbl_trainer_dtls.institute_id
//      courses  : tbl_institute_registration_dtls.institute_id = tbl_accredited_course_dtls.institute_id
//                 tbl_institute_registration_dtls.institute_id = tbl_non_accredited_course_dtls.institute_id
// 2. Fallback to the existing (already deployed) endpoints used by the
//    Add Trainer, BQF Programme and Non-BQF Programme screens, so the lists
//    are shown even when the self assessment endpoint is unavailable.

import CommonService from "../../../../api/services/internal/common/CommonService";
import AddTrainerService from "../../../../api/services/internal/trainer/AddTrainerService";
import ApplyAccreditedCourseService from "../../../../api/services/internal/course/ApplyAccreditedCourseService";
import ApplyNonAccreditedCourseService from "../../../../api/services/internal/course/ApplyNonAccreditedCourseService";
import SelfAssessmentReportService from "../../../../api/services/internal/registration/SelfAssessmentReportService";

const asArray = (response) =>
  Array.isArray(response?.data) ? response.data : [];

const nameLookup = (lists) => {
  const map = {};
  lists.flat().forEach((item) => {
    if (item?.id !== undefined) map[String(item.id)] = item.name;
  });
  return (id) =>
    id === null || id === undefined || id === "" ? null : map[String(id)] || null;
};

const loadFromExistingServices = async ({ instituteId, registrationNo, token }) => {
  const [
    trainerRes,
    accreditedRes,
    nonAccreditedRes,
    genderRes,
    qualificationRes,
    statusRes,
    certificateRes,
  ] = await Promise.all([
    instituteId ? AddTrainerService.getAllTrainer(instituteId, token) : null,
    registrationNo
      ? ApplyAccreditedCourseService.getAccreditedCourseDetailsByUserId(registrationNo, token)
      : null,
    registrationNo
      ? ApplyNonAccreditedCourseService.getNonAccreditedCourseDetailsByUserId(registrationNo, token)
      : null,
    CommonService.getByParentId(8),
    CommonService.getByParentId(18),
    CommonService.getByParentId(4),
    CommonService.getByParentId(27),
  ]);

  const lookup = nameLookup([
    asArray(genderRes),
    asArray(qualificationRes),
    asArray(statusRes),
    asArray(certificateRes),
  ]);

  const trainers = asArray(trainerRes)
    .filter(
      (t) => !instituteId || t.institute_id === undefined || String(t.institute_id) === String(instituteId),
    )
    .map((t) => ({
      id: t.id,
      citizen_id: t.citizen_id,
      work_permit_no: t.work_permit_no,
      name: t.name,
      gender: lookup(t.gender_id),
      qualification: lookup(t.qualification_id),
      employment_type: lookup(t.employment_type_id),
      specialization: t.specialization,
      work_experience: t.work_experience,
      joining_date: t.joining_date,
      mobile_no: t.mobile_no,
      email: t.email,
    }));

  const accredited = asArray(accreditedRes).map((c) => ({
    application_no: c.application_no,
    course_type: "Accredited (BQF)",
    programme_title: c.programme_title || c.curriculum_title,
    certificate_level: lookup(c.certification_id),
    total_program_duration: c.total_program_duration,
    enrolment_capacity: c.enrolment_capacity,
    fees_per_trainee: c.fees_per_trainee,
    status_id: c.status_id,
    status_name: c.status_name || lookup(c.status_id),
  }));

  const nonAccredited = asArray(nonAccreditedRes).map((c) => ({
    application_no: c.application_no,
    course_type: "Non-Accredited",
    programme_title: c.programme_title || c.course_title,
    certificate_level: null,
    total_program_duration: c.total_program_duration,
    enrolment_capacity: c.enrolment_capacity,
    fees_per_trainee: c.fees_per_trainee,
    status_id: c.status_id,
    status_name: c.status_name || lookup(c.status_id),
  }));

  return { trainers, courses: [...accredited, ...nonAccredited] };
};

/**
 * Returns { institute, trainers, courses }.
 * institute contains extra display names (dzongkhag, ownership type ...) when
 * the self assessment endpoint is available, otherwise null.
 */
export const loadInstituteTrainersAndCourses = async ({
  instituteId,
  registrationNo,
  token,
}) => {
  let result = { institute: null, trainers: [], courses: [] };

  if (instituteId) {
    try {
      const response =
        await SelfAssessmentReportService.getBasicInformationByInstituteId(
          instituteId,
          token,
        );
      if (response?.status === 200 && response.data) {
        result = {
          institute: response.data.institute || null,
          trainers: Array.isArray(response.data.trainers) ? response.data.trainers : [],
          courses: Array.isArray(response.data.courses) ? response.data.courses : [],
        };
      } else {
        console.warn(
          "Self assessment basic information endpoint unavailable:",
          response?.response?.status || response?.message,
        );
      }
    } catch (error) {
      console.warn("Self assessment basic information error:", error);
    }
  }

  if (result.trainers.length > 0 && result.courses.length > 0) return result;

  try {
    const fallback = await loadFromExistingServices({
      instituteId,
      registrationNo,
      token,
    });
    return {
      institute: result.institute,
      trainers: result.trainers.length > 0 ? result.trainers : fallback.trainers,
      courses: result.courses.length > 0 ? result.courses : fallback.courses,
    };
  } catch (error) {
    console.error("Error loading trainer/course details:", error);
    return result;
  }
};
