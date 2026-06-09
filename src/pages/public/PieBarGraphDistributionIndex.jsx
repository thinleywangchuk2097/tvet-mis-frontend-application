import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  alpha,
  Grid,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import PieChartIcon from "@mui/icons-material/PieChart";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicPageService from "../../api/services/internal/public/PublicPageService";
import CommonService from "../../api/services/internal/common/CommonService";

// ── Brand palette
const P = "#1565c0";
const TEAL = "#0097a7";

// ── Dynamic color generator for sectors
const getSectorColor = (index) => {
  const colors = [
    P,
    "#0288d1",
    TEAL,
    "#2e7d32",
    "#558b2f",
    "#e65100",
    "#6a1b9a",
    "#7b1fa2",
    "#8e24aa",
    "#4527a0",
    "#283593",
    "#d84315",
    "#bf360c",
    "#f9a825",
    "#ef6c00",
    "#9e9d24",
  ];
  return colors[index % colors.length];
};

// ── Function to generate a distinct color for each bar in the Dzongkhag chart
const getDzongkhagBarColor = (value, index) => {
  const dzongkhagColors = [
    "#1565c0",
    "#0288d1",
    "#0097a7",
    "#2e7d32",
    "#558b2f",
    "#e65100",
    "#6a1b9a",
    "#7b1fa2",
    "#8e24aa",
    "#4527a0",
    "#283593",
    "#d84315",
    "#bf360c",
    "#f9a825",
    "#ef6c00",
    "#9e9d24",
    "#c62828",
    "#ad1457",
    "#00695c",
    "#37474f",
  ];
  return dzongkhagColors[index % dzongkhagColors.length];
};

const PieBarGraphDistributionIndex = () => {
  const [dzongkhags, setDzongkhags] = useState([]);
  const [instituteDetails, setInstituteDetails] = useState([]);
  const [dzongkhagInstituteData, setDzongkhagInstituteData] = useState([]);
  const [courseBySectorData, setCourseBySectorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDzongkhags(),
        fetchInstituteDetails(),
        fetchCourseBySectorData(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDzongkhags = async () => {
    try {
      const dzongkhagLists = await CommonService.getAllDzongkhags();
      setDzongkhags(dzongkhagLists.data);
    } catch (error) {
      console.error("Error fetching dzongkhags:", error);
    }
  };

  const fetchInstituteDetails = async () => {
    try {
      const response = await PublicPageService.getAllInstitutes();
      setInstituteDetails(response.data);
    } catch (error) {
      console.error("Error fetching institute details:", error);
    }
  };

  const fetchCourseBySectorData = async () => {
    try {
      const response = await PublicPageService.getCourseBySector();
      const transformedData = response.data.map((item) => ({
        name: item.sector_name,
        value: item.sector_value,
      }));
      setCourseBySectorData(transformedData);
    } catch (error) {
      console.error("Error fetching course by sector data:", error);
    }
  };

  // Process institute data by dzongkhag
  useEffect(() => {
    if (instituteDetails.length > 0 && dzongkhags.length > 0) {
      processInstituteDataByDzongkhag();
    }
  }, [instituteDetails, dzongkhags]);

  const processInstituteDataByDzongkhag = () => {
    const instituteCountMap = {};
    instituteDetails.forEach((institute) => {
      const dzongkhagId = institute.dzongkhag_id;
      if (dzongkhagId) {
        instituteCountMap[dzongkhagId] =
          (instituteCountMap[dzongkhagId] || 0) + 1;
      }
    });

    const chartData = dzongkhags
      .map((dz) => ({
        name: dz.dzonkhagName,
        value: instituteCountMap[dz.id] || 0,
        id: dz.id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setDzongkhagInstituteData(chartData);
  };

  // Calculate total programs for the pie chart
  const totalPrograms = courseBySectorData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography sx={{ color: "#666" }}>
          Loading distribution data...
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {/* Program By Sector - Pie Chart */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e3eaf4",
            borderRadius: 3,
            bgcolor: "#ffffff",
            height: "100%",
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.2}
              sx={{ mb: 2 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: alpha(P, 0.12),
                  color: P,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PieChartIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  fontWeight={800}
                  sx={{ fontSize: "0.95rem", color: "#0a1929" }}
                >
                  Program By Sector
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Distribution by program sector
                </Typography>
              </Box>
            </Stack>

            {courseBySectorData.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 300,
                }}
              >
                <Typography
                  sx={{
                    color: "error.main",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  No data available
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#666", mt: 1, display: "block" }}
                >
                  No program distribution data found
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: "55%", height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={courseBySectorData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={30}
                          label={({ percent }) =>
                            `${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={{ stroke: "#ccc", strokeWidth: 1 }}
                        >
                          {courseBySectorData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={getSectorColor(index)}
                            />
                          ))}
                        </Pie>
                        <RTooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #d4e2f4",
                            fontSize: "0.8rem",
                          }}
                          formatter={(value, name) => [
                            `${value} Program(s)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box
                    sx={{
                      width: "45%",
                      pl: 1.5,
                      maxHeight: 240,
                      overflowY: "auto",
                    }}
                  >
                    {courseBySectorData.map((item, index) => {
                      const percentage = (
                        (item.value / totalPrograms) *
                        100
                      ).toFixed(1);
                      return (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 1.5,
                            gap: 0.8,
                          }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: getSectorColor(index),
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#444",
                              flex: 1,
                              fontSize: "0.72rem",
                              fontWeight: 500,
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Stack
                            direction="column"
                            alignItems="flex-end"
                            spacing={0}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: getSectorColor(index),
                              }}
                            >
                              {item.value}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.6rem",
                                color: "#888",
                              }}
                            >
                              ({percentage}%)
                            </Typography>
                          </Stack>
                        </Box>
                      );
                    })}
                    <Box
                      sx={{
                        mt: 2,
                        pt: 1,
                        borderTop: "1px solid #e0e8f0",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: P,
                          textAlign: "right",
                        }}
                      >
                        Total: {totalPrograms} Programs
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Institute By Dzongkhag - Bar Chart */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e3eaf4",
            borderRadius: 3,
            bgcolor: "#ffffff",
            height: "100%",
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.2}
              sx={{ mb: 2 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: alpha(P, 0.12),
                  color: P,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocationOnIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  fontWeight={800}
                  sx={{ fontSize: "0.95rem", color: "#0a1929" }}
                >
                  Institute By Dzongkhag
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Distribution across all 20 Dzongkhags of Bhutan
                </Typography>
              </Box>
            </Stack>

            {dzongkhagInstituteData.length === 0 ||
            dzongkhagInstituteData.every((item) => item.value === 0) ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 300,
                }}
              >
                <Typography
                  sx={{
                    color: "error.main",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  No data available
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#666", mt: 1, display: "block" }}
                >
                  No institute distribution data found
                </Typography>
              </Box>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={dzongkhagInstituteData}
                    margin={{
                      top: 8,
                      right: 16,
                      left: -18,
                      bottom: 58,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#555" }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                      height={70}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#666" }}
                      label={{
                        value: "Number of Institutes",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: "11px", fill: "#666" },
                      }}
                    />
                    <RTooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #d4e2f4",
                        fontSize: "0.8rem",
                      }}
                      formatter={(value) => [`${value} Institute(s)`, "Count"]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                      {dzongkhagInstituteData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getDzongkhagBarColor(entry.value, index)}
                          opacity={entry.value > 0 ? 1 : 0.5}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Typography variant="caption" sx={{ color: "#666" }}>
                    Total Institutes:{" "}
                    {dzongkhagInstituteData.reduce(
                      (sum, d) => sum + d.value,
                      0,
                    )}
                  </Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PieBarGraphDistributionIndex;
