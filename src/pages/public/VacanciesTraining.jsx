import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  Divider,
  Paper,
} from "@mui/material";
import {
  BusinessCenter as BusinessCenterIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  School as EducationIcon,
  MonetizationOn as SalaryIcon,
} from "@mui/icons-material";

const vacancies = [
  {
    id: 1,
    title: "Frontend Developer",
    department: "IT Department",
    location: "New York, USA",
    type: "Full-time",
    experience: "2+ years",
    salary: "$80,000 - $100,000",
    description:
      "We're looking for an experienced React developer to join our team and help build innovative web applications.",
    skills: ["React", "TypeScript", "Material-UI", "Redux"],
    posted: "2 days ago",
  },
  {
    id: 2,
    title: "UX/UI Designer",
    department: "Design Team",
    location: "Remote",
    type: "Contract",
    experience: "3+ years",
    salary: "$70,000 - $90,000",
    description:
      "Join our design team to create beautiful and intuitive user experiences for our products.",
    skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
    posted: "1 week ago",
  },
  {
    id: 3,
    title: "DevOps Engineer",
    department: "Operations",
    location: "San Francisco, USA",
    type: "Full-time",
    experience: "5+ years",
    salary: "$110,000 - $140,000",
    description:
      "Help us build and maintain our cloud infrastructure and CI/CD pipelines.",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform"],
    posted: "3 days ago",
  },
  {
    id: 4,
    title: "Data Scientist",
    department: "Analytics",
    location: "London, UK",
    type: "Full-time",
    experience: "5+ years",
    salary: "$110,000 - $140,000",
    description:
      "Analyze complex datasets and build predictive models to drive business decisions.",
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
    posted: "3 days ago",
  },
  {
    id: 5,
    title: "Data Analyst",
    department: "Analytics",
    location: "London, UK",
    type: "Full-time",
    experience: "5+ years",
    salary: "$110,000 - $140,000",
    description:
      "Analyze complex datasets and build predictive models to drive business decisions.",
    skills: ["Python", "Machine Learning", "SQL", "TensorFlow"],
    posted: "3 days ago",
  },
   {
    id: 6,
    title: "Data Engineer",
    department: "Analytics",
    location: "London, UK",
    type: "Full-time",
    experience: "5+ years",
    salary: "$110,000 - $140,000",
    description:
      "Design and build scalable data pipelines and infrastructure for data analysis.",
    skills: ["Python", "Spark", "SQL", "Airflow"],
    posted: "3 days ago",
  },
];

const trainingPrograms = [
  {
    id: 1,
    title: "React Advanced Training",
    duration: "4 weeks",
    schedule: "Mon & Wed, 6-9 PM",
    instructor: "John Smith",
    description:
      "Master advanced React patterns, state management, and performance optimization.",
    skills: ["Hooks", "Context API", "Performance", "Testing"],
  },
  {
    id: 2,
    title: "Cloud Architecture",
    duration: "6 weeks",
    schedule: "Tue & Thu, 7-9 PM",
    instructor: "Sarah Johnson",
    description:
      "Learn to design and implement scalable cloud solutions on AWS.",
    skills: ["AWS", "Microservices", "Serverless", "Security"],
  },
];

const VacanciesTraining = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* Page Header */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 700 }}
      >
        Career Opportunities
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Explore our current job openings and professional development programs
      </Typography>

      {/* Vacancies Section */}
      <Box sx={{ my: 3 }}>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", fontWeight: 600 }}
        >
          <BusinessCenterIcon sx={{ mr: 1, color: "primary.main" }} />
          Current Vacancies
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={3}>
          {vacancies.map((vacancy) => (
            <Grid item size={{ xs: 12, md: 4 }} key={vacancy.id}>
              <Card
                elevation={4}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {vacancy.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {vacancy.department}
                  </Typography>

                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", mt: 1, gap: 1 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <LocationIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: "action.active" }}
                      />
                      <Typography variant="body2">
                        {vacancy.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <ScheduleIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: "action.active" }}
                      />
                      <Typography variant="body2">{vacancy.type}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <EducationIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: "action.active" }}
                      />
                      <Typography variant="body2">
                        {vacancy.experience} experience
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <SalaryIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: "action.active" }}
                      />
                      <Typography variant="body2">{vacancy.salary}</Typography>
                    </Box>
                  </Box>

                  <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                    {vacancy.description}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    {vacancy.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                        color="primary"
                      />
                    ))}
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: "space-between", p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Posted {vacancy.posted}
                  </Typography>
                  <Button size="small" variant="contained" color="primary">
                    Apply Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Training Programs Section */}
      <Box sx={{ my: 6 }}>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", fontWeight: 600 }}
        >
          <EducationIcon sx={{ mr: 1, color: "primary.main" }} />
          Training Programs
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={3}>
          {trainingPrograms.map((program) => (
            <Grid item size={{ xs: 12, md: 6 }} key={program.id}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {program.title}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                      gap: 1,
                    }}
                  >
                    <ScheduleIcon
                      fontSize="small"
                      sx={{ color: "action.active" }}
                    />
                    <Typography variant="body2">
                      {program.duration} • {program.schedule}
                    </Typography>
                  </Box>

                  <Typography variant="body1" paragraph>
                    {program.description}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Instructor: {program.instructor}
                  </Typography>

                  <Box
                    sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}
                  >
                    {program.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box
                  sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button variant="contained" color="primary">
                    Register Now
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default VacanciesTraining;
