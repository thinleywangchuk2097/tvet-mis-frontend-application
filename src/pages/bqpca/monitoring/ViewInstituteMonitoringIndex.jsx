import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ViewInstituteMonitoringIndex = () => {
  const { applicationNo } = useParams();
  const navigate = useNavigate();
  const access_token = useSelector((state) => state.auth.accessToken);
  const actionId = useSelector((state) => state.auth.id);
  const currentRoleId = useSelector((state) => state.auth.current_roleId);


  return <div>ViewInstituteMonitoringIndex</div>;
};

export default ViewInstituteMonitoringIndex;
