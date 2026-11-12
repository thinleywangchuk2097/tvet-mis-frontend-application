import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Skeleton,
} from "@mui/material";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import GlancePanel from "./GlancePanel";
import { BLUE, INK, LINE, NAVY, fmt } from "./glanceData";
import PublicPageService from "../../../api/services/internal/public/PublicPageService";
import CommonService from "../../../api/services/internal/common/CommonService";


const listOf = (res) => (Array.isArray(res?.data) ? res.data : []);

const ChartSkeleton = () => (
  <Box>
    {[...Array(8)].map((_, i) => (
      <Skeleton key={i} variant="rounded" height={14} sx={{ mb: 1.2, width: `${90 - i * 8}%` }} />
    ))}
  </Box>
);

// One full name per bar, written straight up on a single line (no wrapping, no cut)
const UprightTick = ({ x, y, payload }) => (
  <g transform={`translate(${x},${y})`}>
    <text
      transform="rotate(-90)"
      x={-4}
      y={0}
      dy={3}
      textAnchor="end"
      fontSize={7.5}
      fontWeight={500}
      fill="#1f2d45"
    >
      {payload?.value}
    </text>
  </g>
);
UprightTick.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  payload: PropTypes.shape({ value: PropTypes.string }),
};

// Vertical bar chart, largest first, names angled (sectors and Dzongkhags)
const Columns = ({ data, color, unit }) => {
  if (!data.some((d) => d.value > 0)) {
    return (
      <Box sx={{ py: 3, textAlign: "center", color: "text.secondary", fontSize: "0.85rem" }}>
        No data available yet
      </Box>
    );
  }
  // names run straight up so every full name fits under its own bar (no scrolling);
  // the space under the bars is sized to the longest name (~4px per character at 7.5px)
  const longest = Math.max(...data.map((d) => (d.name || "").length));
  const labelHeight = Math.round(longest * 4) + 8;

  return (
    // fills whatever height the card has (bars get at least ~90px)
    <Box sx={{ flex: 1, minHeight: 60 + labelHeight, height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 0 }} barCategoryGap="18%">
          <XAxis
            dataKey="name"
            interval={0}
            // full names, straight up (crisp, never overlap)
            height={labelHeight}
            padding={{ left: 0, right: 0 }}
            tickLine={false}
            axisLine={{ stroke: LINE }}
            tick={<UprightTick />}
          />
          {/* narrow y-axis: small numbers, little gap */}
          <YAxis
            allowDecimals={false}
            width={24}
            tickLine={false}
            axisLine={false}
            tickMargin={2}
            tick={{ fontSize: 9, fill: "#6b7a90" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(10,45,110,0.06)" }}
            formatter={(v) => [`${fmt(v)} ${unit}`, ""]}
            separator=""
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={18}>
            {/* numbers on top only when bars are wide enough; hover always shows them */}
            {data.length <= 10 && (
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v) => (v > 0 ? v : "")}
                style={{ fontSize: 9, fill: INK, fontWeight: 600 }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
Columns.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, value: PropTypes.number })).isRequired,
  color: PropTypes.string.isRequired,
  unit: PropTypes.string.isRequired,
};

/**
 * "Programmes by sector" or "Training providers by Dzongkhag" as its own card.
 *   part="sector"    - vertical bars for every sector
 *   part="dzongkhag" - vertical bars for all 20 Dzongkhags
 */
const DistributionCharts = ({ part }) => {
  const isSector = part === "sector";
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState([]);
  const [dzongkhags, setDzongkhags] = useState([]);
  const [institutes, setInstitutes] = useState([]);

  useEffect(() => {
    let alive = true;
    const calls = isSector
      ? [PublicPageService.getCourseBySector()]
      : [CommonService.getAllDzongkhags(), PublicPageService.getAllInstitutes()];
    Promise.all(calls).then((res) => {
      if (!alive) return;
      if (isSector) {
        setSectors(
          listOf(res[0]).map((x) => ({
            name: x.sector_name,
            value: Number(x.sector_value) || 0,
          })),
        );
      } else {
        setDzongkhags(listOf(res[0]));
        setInstitutes(listOf(res[1]));
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [isSector]);

  const sectorData = useMemo(
    () => sectors.filter((x) => x.value > 0).sort((a, b) => b.value - a.value),
    [sectors],
  );

  const dzongkhagData = useMemo(() => {
    const counts = {};
    institutes.forEach((i) => {
      if (i.dzongkhag_id) counts[i.dzongkhag_id] = (counts[i.dzongkhag_id] || 0) + 1;
    });
    return dzongkhags
      .map((d) => ({ name: d.dzonkhagName, value: counts[d.id] || 0 }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  }, [dzongkhags, institutes]);

  const totalProgrammes = sectorData.reduce((x, d) => x + d.value, 0);
  const totalProviders = dzongkhagData.reduce((x, d) => x + d.value, 0);
  const reached = dzongkhagData.filter((d) => d.value > 0).length;

  if (isSector) {
    return (
      <GlancePanel
        icon={<CategoryOutlinedIcon />}
        title="Programmes by sector"
        subtitle={
          totalProgrammes > 0
            ? `${fmt(totalProgrammes)} programmes · ${sectorData.length} sectors`
            : "Programmes in each sector"
        }
      >
        {loading ? (
          <ChartSkeleton />
        ) : (
          <Columns data={sectorData} color={BLUE} unit="programmes" />
        )}
      </GlancePanel>
    );
  }

  return (
    <GlancePanel
      icon={<PlaceOutlinedIcon />}
      title="Providers by Dzongkhag"
      subtitle={
        totalProviders > 0
          ? `${fmt(totalProviders)} providers in ${reached} Dzongkhags`
          : "Where training providers are located"
      }
    >
      {loading ? <ChartSkeleton /> : <Columns data={dzongkhagData} color={NAVY} unit="providers" />}
    </GlancePanel>
  );
};

DistributionCharts.propTypes = {
  part: PropTypes.oneOf(["sector", "dzongkhag"]).isRequired,
};

export default DistributionCharts;
