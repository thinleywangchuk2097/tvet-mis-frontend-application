import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  alpha,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
  IconButton,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

// ── Brand palette
const P = "#1565c0";
const PD = "#0a2d6e";
const PL = "#e8f1fb";
const W = "#ffffff";
const TEAL = "#0097a7";

// ── Key TVET Indicators (Public / Private / Total)
const tvetIndicators = [
  { id: 1, name: "Registered Training Providers", pub: 14, pvt: 130, color: P },
  {
    id: 2,
    name: "Accredited Training Providers",
    pub: 12,
    pvt: 74,
    color: "#0288d1",
  },
  {
    id: 3,
    name: "Accredited Assessment Centres",
    pub: 18,
    pvt: 16,
    color: TEAL,
  },
  { id: 4, name: "Registered SES Centres", pub: 20, pvt: 8, color: "#00897b" },
  { id: 5, name: "Registered Trainers", pub: 215, pvt: 197, color: "#2e7d32" },
  { id: 6, name: "Registered Accreditors", pub: 38, pvt: 18, color: "#558b2f" },
  {
    id: 7,
    name: "Registered QMS Auditors",
    pub: 22,
    pvt: 16,
    color: "#9e9d24",
  },
  { id: 8, name: "Registered Assessors", pub: 95, pvt: 92, color: "#f9a825" },
  { id: 9, name: "Registered Programs", pub: 250, pvt: 470, color: "#ef6c00" },
  { id: 10, name: "Accredited Programs", pub: 173, pvt: 69, color: "#e65100" },
  {
    id: 11,
    name: "Enrollment in Accredited (BQF) Programs",
    pub: 8094,
    pvt: 16990,
    color: "#d84315",
  },
  {
    id: 12,
    name: "Enrollment in Non-BQF Programs",
    pub: 5732,
    pvt: 45951,
    color: "#bf360c",
  },
  {
    id: 13,
    name: "BQF Certificate Awarded",
    pub: 3245,
    pvt: 5211,
    color: "#6a1b9a",
    isExpandable: true,
    subItems: [
      { name: "Certificate 2", pub: 1856, pvt: 2465 },
      { name: "Certificate 3", pub: 1325, pvt: 1662 },
      { name: "Certificate 2 (RPL)", pub: 0, pvt: 0 },
      { name: "Certificate 3 (RPL)", pub: 0, pvt: 0 },
      { name: "Diploma", pub: 1024, pvt: 830 },
      { name: "Advanced Diploma", pub: 412, pvt: 212 },
    ],
  },
  {
    id: 18,
    name: "RPL Certificate Awarded",
    pub: 7,
    pvt: 55,
    color: "#ad1457",
    isExpandable: true,
    subItems: [
      { name: "Certificate 2", pub: 2, pvt: 4 },
      { name: "Certificate 3", pub: 5, pvt: 51 },
    ],
  },
  { id: 14, name: "Certificate 2", pub: 1856, pvt: 2465, color: "#7b1fa2", isChild: true, parentId: 13 },
  { id: 15, name: "Certificate 3", pub: 1325, pvt: 1662, color: "#8e24aa", isChild: true, parentId: 13 },
  { id: 16, name: "Diploma", pub: 1024, pvt: 830, color: "#4527a0", isChild: true, parentId: 13 },
  { id: 17, name: "Advance Diploma", pub: 412, pvt: 212, color: "#283593", isChild: true, parentId: 13 },
].map((r) => ({ ...r, total: (r.pub || 0) + (r.pvt || 0) }));

// ── Institute by Provider Type
const providerTypeData = [
  { name: "Public", value: 48, color: "#1565c0" },
  { name: "Private", value: 86, color: "#2e7d32" },
];
const providerTotal = providerTypeData.reduce((s, d) => s + d.value, 0);

// ── Shared table styles
const TS = {
  "& th": {
    bgcolor: PL,
    fontWeight: 700,
    fontSize: "0.77rem",
    color: PD,
    whiteSpace: "nowrap",
  },
  "& td": { fontSize: "0.8rem" },
  "& th, & td": { border: "1px solid #dbe5f0", py: 0.85, px: 1.2 },
  "& tbody tr:hover td": { bgcolor: "#f5f9ff" },
};

const TvetIndicatorsInstituteProviderType = () => {
  const [infoPage, setInfoPage] = useState(0);
  const [infoRowsPerPage, setInfoRowsPerPage] = useState(5);
  const [expandedRows, setExpandedRows] = useState({});

  // Check if data is available
  const hasTvetData = tvetIndicators && tvetIndicators.length > 0;
  const hasProviderData = providerTypeData && providerTypeData.length > 0;

  const handleExpandClick = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter out child items for main display (they will be shown in expandable section)
  const mainIndicators = tvetIndicators.filter((item) => !item.isChild);

  return (
    <Grid container spacing={2.5}>
      {/* TVET Indicators Breakdown Table */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e3eaf4",
            borderRadius: 3,
            bgcolor: W,
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
                <BarChartIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  fontWeight={800}
                  sx={{ fontSize: "0.95rem", color: "#0a1929" }}
                >
                  TVET Indicators Breakdown
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Public vs Private vs Total
                </Typography>
              </Box>
            </Stack>

            {!hasTvetData ? (
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
                  No TVET indicators found
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small" sx={TS}>
                    <TableHead>
                      <TableRow>
                        <TableCell width={36}>#</TableCell>
                        <TableCell>Indicator</TableCell>
                        <TableCell align="center">Public</TableCell>
                        <TableCell align="center">Private</TableCell>
                        <TableCell align="center">Total</TableCell>

                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mainIndicators
                        .slice(
                          infoPage * infoRowsPerPage,
                          infoPage * infoRowsPerPage + infoRowsPerPage,
                        )
                        .map((row) => (
                          <React.Fragment key={row.id}>
                            <TableRow>
                              <TableCell>
                                <Box
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 1,
                                    bgcolor: row.color,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      color: W,
                                      fontSize: "0.66rem",
                                      fontWeight: 800,
                                    }}
                                  >
                                    {row.id}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 600, color: "#0a1929" }}
                              >
                                {row.name}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ color: "#1565c0", fontWeight: 600 }}
                              >
                                {row.pub.toLocaleString()}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ color: "#2e7d32", fontWeight: 600 }}
                              >
                                {row.pvt.toLocaleString()}
                              </TableCell>
                              <TableCell align="center">
                                <Box
                                  sx={{
                                    display: "inline-block",
                                    px: 1.4,
                                    py: 0.3,
                                    borderRadius: 1,
                                    bgcolor: alpha(row.color, 0.12),
                                    border: `1px solid ${alpha(row.color, 0.35)}`,
                                    minWidth: 60,
                                  }}
                                >
                                  <Typography
                                    fontWeight={800}
                                    sx={{
                                      color: row.color,
                                      fontSize: "0.78rem",
                                    }}
                                  >
                                    {row.total.toLocaleString()}
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>

                            {/* Expandable Sub-Items */}
                            {row.isExpandable && (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  sx={{ p: 0, border: "none" }}
                                >
                                  <Collapse
                                    in={expandedRows[row.id]}
                                    timeout="auto"
                                    unmountOnExit
                                  >
                                    <Box sx={{ m: 1.5 }}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow>
                                            <TableCell width={36}></TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: PD }}>
                                              Sub Indicator
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700, color: PD }}>
                                              Public
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700, color: PD }}>
                                              Private
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700, color: PD }}>
                                              Total
                                            </TableCell>
                                            <TableCell width={50}></TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {row.subItems?.map((subItem, idx) => {
                                            const subTotal = (subItem.pub || 0) + (subItem.pvt || 0);
                                            return (
                                              <TableRow key={idx} sx={{ bgcolor: alpha(P, 0.02) }}>
                                                <TableCell>
                                                  <Box
                                                    sx={{
                                                      width: 18,
                                                      height: 18,
                                                      borderRadius: 0.5,
                                                      bgcolor: alpha(row.color, 0.3),
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent: "center",
                                                    }}
                                                  >
                                                    <Typography
                                                      sx={{
                                                        color: row.color,
                                                        fontSize: "0.6rem",
                                                        fontWeight: 700,
                                                      }}
                                                    >
                                                      {idx + 1}
                                                    </Typography>
                                                  </Box>
                                                </TableCell>
                                                <TableCell sx={{ pl: 3, fontSize: "0.75rem" }}>
                                                  {subItem.name}
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontSize: "0.75rem" }}>
                                                  {subItem.pub.toLocaleString()}
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontSize: "0.75rem" }}>
                                                  {subItem.pvt.toLocaleString()}
                                                </TableCell>
                                                <TableCell align="center">
                                                  <Box
                                                    sx={{
                                                      display: "inline-block",
                                                      px: 1,
                                                      py: 0.2,
                                                      borderRadius: 1,
                                                      bgcolor: alpha(row.color, 0.1),
                                                      border: `1px solid ${alpha(row.color, 0.25)}`,
                                                      minWidth: 50,
                                                    }}
                                                  >
                                                    <Typography
                                                      fontWeight={700}
                                                      sx={{
                                                        color: row.color,
                                                        fontSize: "0.7rem",
                                                      }}
                                                    >
                                                      {subTotal.toLocaleString()}
                                                    </Typography>
                                                  </Box>
                                                </TableCell>
                                                <TableCell></TableCell>
                                              </TableRow>
                                            );
                                          })}
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={mainIndicators.length}
                  page={infoPage}
                  onPageChange={(_, p) => setInfoPage(p)}
                  rowsPerPage={infoRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setInfoRowsPerPage(parseInt(e.target.value, 10));
                    setInfoPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25]}
                  sx={{
                    "& .MuiTablePagination-toolbar": { minHeight: 40 },
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                      { fontSize: "0.75rem" },
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Institute by Provider Type */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e3eaf4",
            borderRadius: 3,
            bgcolor: W,
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
                <AccountBalanceIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  fontWeight={800}
                  sx={{ fontSize: "0.95rem", color: "#0a1929" }}
                >
                  Institute by Provider Type
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Public · Private
                </Typography>
              </Box>
            </Stack>

            {!hasProviderData ? (
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
                  No provider type data found
                </Typography>
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    background: `linear-gradient(135deg, ${P} 0%, #0d47a1 100%)`,
                    borderRadius: 1.5,
                    px: 1.6,
                    py: 1.1,
                    mb: 1.8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: `0 3px 10px ${alpha(P, 0.22)}`,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: alpha(W, 0.78),
                        fontSize: "0.6rem",
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Total Institutes
                    </Typography>
                    <Typography
                      sx={{
                        color: W,
                        fontWeight: 800,
                        fontSize: "1.3rem",
                        lineHeight: 1.1,
                      }}
                    >
                      {providerTotal.toLocaleString()}
                    </Typography>
                  </Box>
                  <AccountBalanceIcon
                    sx={{ color: alpha(W, 0.8), fontSize: 30 }}
                  />
                </Box>

                <Stack spacing={3.4}>
                  {providerTypeData.map((item, i) => {
                    const maxV = Math.max(
                      ...providerTypeData.map((d) => d.value),
                    );
                    const widthPct = (item.value / maxV) * 100;
                    const sharePct = (
                      (item.value / providerTotal) *
                      100
                    ).toFixed(1);
                    return (
                      <Box key={i}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.8}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: item.color,
                                boxShadow: `0 0 0 4px ${alpha(item.color, 0.18)}`,
                              }}
                            />
                            <Typography
                              fontWeight={700}
                              sx={{ fontSize: "0.78rem", color: "#0a1929" }}
                            >
                              {item.name}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            alignItems="baseline"
                            spacing={0.5}
                          >
                            <Typography
                              fontWeight={800}
                              sx={{ color: item.color, fontSize: "0.9rem" }}
                            >
                              {item.value}
                            </Typography>
                            <Typography
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.65rem",
                              }}
                            >
                              ({sharePct}%)
                            </Typography>
                          </Stack>
                        </Stack>
                        <Box
                          sx={{
                            height: 6,
                            bgcolor: "#f0f4fa",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${widthPct}%`,
                              height: "100%",
                              background: `linear-gradient(90deg, ${item.color} 0%, ${alpha(item.color, 0.65)} 100%)`,
                              borderRadius: 3,
                              transition:
                                "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                              boxShadow: `0 1px 2px ${alpha(item.color, 0.4)}`,
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default TvetIndicatorsInstituteProviderType;