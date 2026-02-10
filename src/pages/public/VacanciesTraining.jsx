import React from 'react';
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
  Paper
} from '@mui/material';
import {
  BusinessCenter as BusinessCenterIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  School as EducationIcon,
  MonetizationOn as SalaryIcon
} from '@mui/icons-material';

const vacancies = [
  {
    id: 1,
    title: "Frontend Developer",
    department: "IT Department",
    location: "New York, USA",
    type: "Full-time",
    experience: "2+ years",
    salary: "$80,000 - $100,000",
    description: "We're looking for an experienced React developer to join our team and help build innovative web applications.",
    skills: ["React", "TypeScript", "Material-UI", "Redux"],
    posted: "2 days ago"
  },
  {
    id: 2,
    title: "UX/UI Designer",
    department: "Design Team",
    location: "Remote",
    type: "Contract",
    experience: "3+ years",
    salary: "$70,000 - $90,000",
    description: "Join our design team to create beautiful and intuitive user experiences for our products.",
    skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
    posted: "1 week ago"
  },
  {
    id: 3,
    title: "DevOps Engineer",
    department: "Operations",
    location: "San Francisco, USA",
    type: "Full-time",
    experience: "5+ years",
    salary: "$110,000 - $140,000",
    description: "Help us build and maintain our cloud infrastructure and CI/CD pipelines.",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform"],
    posted: "3 days ago"
  }
];

const trainingPrograms = [
  {
    id: 1,
    title: "React Advanced Training",
    duration: "4 weeks",
    schedule: "Mon & Wed, 6-9 PM",
    instructor: "John Smith",
    description: "Master advanced React patterns, state management, and performance optimization.",
    skills: ["Hooks", "Context API", "Performance", "Testing"]
  },
  {
    id: 2,
    title: "Cloud Architecture",
    duration: "6 weeks",
    schedule: "Tue & Thu, 7-9 PM",
    instructor: "Sarah Johnson",
    description: "Learn to design and implement scalable cloud solutions on AWS.",
    skills: ["AWS", "Microservices", "Serverless", "Security"]
  }
];

const VacanciesTraining = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Career Opportunities
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Explore our current job openings and professional development programs
      </Typography>
      
      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontWeight: 600
        }}>
          <BusinessCenterIcon sx={{ mr: 1 }} />
          Current Vacancies
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {vacancies.map((vacancy) => (
            <Grid item xs={12} md={6} lg={4} key={vacancy.id}>
              <Card elevation={3} sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: '500px' // Set minimum height for all cards
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {vacancy.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {vacancy.department}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                    <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">{vacancy.location}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                    <ScheduleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">{vacancy.type}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                    <EducationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">{vacancy.experience} experience</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                    <SalaryIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">{vacancy.salary}</Typography>
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
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Posted {vacancy.posted}
                  </Typography>
                  <Button size="small" variant="contained">
                    Apply Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontWeight: 600
        }}>
          <EducationIcon sx={{ mr: 1 }} />
          Training Programs
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {trainingPrograms.map((program) => (
            <Grid item xs={12} md={6} key={program.id}>
              <Paper elevation={2} sx={{ 
                p: 3, 
                height: '100%',
                minHeight: '500px', // Match the same height as vacancy cards
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {program.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                    <ScheduleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">{program.duration} • {program.schedule}</Typography>
                  </Box>
                  
                  <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                    {program.description}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Instructor: {program.instructor}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    {program.skills.map((skill) => (
                      <Chip 
                        key={skill} 
                        label={skill} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }} 
                      />
                    ))}
                  </Box>
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
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