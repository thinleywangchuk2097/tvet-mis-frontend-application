import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  alpha,
  Grid,
  keyframes,
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

// ── Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const barRise = keyframes`
  0% {
    transform: scaleY(0);
    opacity: 0;
  }
  100% {
    transform: scaleY(1);
    opacity: 1;
  }
`;

const barShake = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
`;

const loadingPulse = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
`;

const waveAnimation = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
`;

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
    "#7b1ba2",
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
  const [animateBars, setAnimateBars] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && dzongkhagInstituteData.length > 0) {
      setTimeout(() => {
        setAnimateBars(true);
        setIsFirstLoad(false);
      }, 500);
    }
  }, [loading, dzongkhagInstituteData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setAnimateBars(false);
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

  // Custom animated bar shape with loading animation
  const AnimatedBar = (props) => {
    const { fill, x, y, width, height, index } = props;
    
    if (isFirstLoad && !animateBars) {
      return (
        <rect
          x={x}
          y={y + height * 0.7}
          width={width}
          height={height * 0.3}
          fill={fill}
          rx={4}
          ry={4}
          opacity={0.6}
          style={{
            animation: `${waveAnimation} 1s ease-in-out infinite ${index * 0.1}s`,
            transformOrigin: "bottom",
          }}
        >
          <animate
            attributeName="height"
            values={`${height * 0.3};${height * 0.7};${height * 0.3}`}
            dur="1s"
            repeatCount="indefinite"
            begin={`${index * 0.1}s`}
          />
        </rect>
      );
    }

    if (!animateBars) {
      return (
        <rect
          x={x}
          y={y + height}
          width={width}
          height={0}
          fill={fill}
          rx={4}
          ry={4}
        />
      );
    }

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={4}
        ry={4}
        style={{
          animation: `${barRise} 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${index * 0.03}s both`,
          transformOrigin: "bottom",
        }}
      />
    );
  };

  // Compact Loading skeleton
  const LoadingSkeleton = () => (
    <Box sx={{ width: "100%", height: 280, position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 240,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          px: 1,
        }}
      >
        {[...Array(15)].map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 20,
              height: `${Math.random() * 150 + 40}px`,
              bgcolor: alpha(P, 0.3),
              borderRadius: "4px 4px 0 0",
              animation: `${loadingPulse} 1.5s ease-in-out infinite ${i * 0.05}s`,
              transformOrigin: "bottom",
            }}
          />
        ))}
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography sx={{ color: "#666", fontSize: "0.85rem" }}>
          Loading distribution data...
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={1.5}>
      {/* Program By Sector - Pie Chart */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e3eaf4",
            borderRadius: 2,
            bgcolor: "#ffffff",
            height: "100%",
            animation: `${slideInLeft} 0.5s ease-out`,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 8px 20px ${alpha(P, 0.1)}`,
            },
          }}
        >
          <CardContent sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  bgcolor: alpha(P, 0.12),
                  color: P,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PieChartIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box>
                <Typography
                  fontWeight={700}
                  sx={{
                    fontSize: "0.85rem",
                    background: `linear-gradient(135deg, ${P}, ${TEAL})`,
                    backgroundSize: "200% auto",
                    color: "transparent",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                  }}
                >
                  Program By Sector
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                  Distribution by sector
                </Typography>
              </Box>
            </Stack>

            {courseBySectorData.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ color: "error.main", fontWeight: 600, fontSize: "0.8rem" }}>
                  No data available
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: "55%", height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={courseBySectorData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        innerRadius={25}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: "#ccc", strokeWidth: 0.5 }}
                        animationBegin={300}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {courseBySectorData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getSectorColor(index)}
                            style={{ cursor: "pointer", transition: "transform 0.3s ease" }}
                            onMouseEnter={(e) => { e.target.style.transform = "scale(1.03)"; }}
                            onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
                          />
                        ))}
                      </Pie>
                      <RTooltip
                        contentStyle={{
                          borderRadius: 6,
                          border: "1px solid #d4e2f4",
                          fontSize: "0.7rem",
                          padding: "4px 8px",
                        }}
                        formatter={(value, name) => [`${value} Program(s)`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ width: "45%", maxHeight: 200, overflowY: "auto" }}>
                  {courseBySectorData.slice(0, 8).map((item, index) => {
                    const percentage = ((item.value / totalPrograms) * 100).toFixed(1);
                    return (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 1,
                          gap: 0.5,
                          animation: `${fadeInUp} 0.3s ease-out ${index * 0.03}s both`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
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
                            fontSize: "0.65rem",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </Typography>
                        <Stack direction="column" alignItems="flex-end" spacing={0}>
                          <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: getSectorColor(index) }}>
                            {item.value}
                          </Typography>
                          <Typography sx={{ fontSize: "0.55rem", color: "#888" }}>
                            ({percentage}%)
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                  <Box sx={{ mt: 1, pt: 0.5, borderTop: "1px solid #e0e8f0" }}>
                    <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: P, textAlign: "right" }}>
                      Total: {totalPrograms}
                    </Typography>
                  </Box>
                </Box>
              </Box>
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
            borderRadius: 2,
            bgcolor: "#ffffff",
            height: "100%",
            animation: `${slideInRight} 0.5s ease-out`,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 8px 20px ${alpha(TEAL, 0.1)}`,
            },
          }}
        >
          <CardContent sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  bgcolor: alpha(TEAL, 0.12),
                  color: TEAL,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocationOnIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box>
                <Typography
                  fontWeight={700}
                  sx={{
                    fontSize: "0.85rem",
                    background: `linear-gradient(135deg, ${TEAL}, ${P})`,
                    backgroundSize: "200% auto",
                    color: "transparent",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                  }}
                >
                  Institute By Dzongkhag
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                  Across 20 Dzongkhags
                </Typography>
              </Box>
            </Stack>

            {loading ? (
              <LoadingSkeleton />
            ) : dzongkhagInstituteData.length === 0 ||
              dzongkhagInstituteData.every((item) => item.value === 0) ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ color: "error.main", fontWeight: 600, fontSize: "0.8rem" }}>
                  No data available
                </Typography>
              </Box>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={dzongkhagInstituteData}
                    margin={{ top: 5, right: 10, left: -15, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf2f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: "#555" }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                      height={55}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "#666" }}
                      label={{
                        value: "Institutes",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: "9px", fill: "#666" },
                      }}
                    />
                    <RTooltip
                      contentStyle={{
                        borderRadius: 6,
                        border: "1px solid #d4e2f4",
                        fontSize: "0.7rem",
                        padding: "4px 8px",
                      }}
                      formatter={(value) => [`${value} Institute(s)`, "Count"]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                      animationBegin={300}
                      animationDuration={800}
                      animationEasing="ease-out"
                      shape={(props) => <AnimatedBar {...props} />}
                    >
                      {dzongkhagInstituteData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getDzongkhagBarColor(entry.value, index)}
                          opacity={entry.value > 0 ? 1 : 0.5}
                          style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                          onMouseEnter={(e) => {
                            if (e.target) {
                              e.target.style.opacity = "0.8";
                              e.target.style.animation = `${barShake} 0.3s ease`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (e.target) {
                              e.target.style.opacity = entry.value > 0 ? 1 : 0.5;
                              e.target.style.animation = "none";
                            }
                          }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 1, textAlign: "center" }}>
                  <Typography variant="caption" sx={{ color: "#666", fontSize: "0.7rem" }}>
                    Total Institutes:{" "}
                    <Box component="span" sx={{ fontWeight: "bold", color: TEAL }}>
                      {dzongkhagInstituteData.reduce((sum, d) => sum + d.value, 0)}
                    </Box>
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