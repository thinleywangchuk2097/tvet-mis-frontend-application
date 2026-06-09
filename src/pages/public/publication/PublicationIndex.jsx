import React, { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Pagination,
  Chip,
  TableSortLabel,
  Tooltip,
  Alert,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Stack,
  Divider
} from '@mui/material'
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Article as DocIcon,
  TableChart as ExcelIcon,
  Visibility as ViewIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import FileDownload from '../../../components/file/FileDownload';

const PublicationIndex = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Publication data based on the provided table
  const publications = [
    { id: 1, name: "Guidelines For Accreditation of Courses 2011", date: "26th April 2021", file: "gui.pdf", remarks: "" },
    { id: 2, name: "Regulations for Registration of Training Provider, 2014", date: "26th April 2021", file: "Revised-Regulations-2014.pdf", remarks: "" },
    { id: 3, name: "NCS Operations Manual", date: "12th March 2015", file: "National Competency Standards Operational Manual_2015.pdf", remarks: "National Competency Standards Operations Manual" },
    { id: 4, name: "Institute proposal format", date: "21st April 2022", file: "Institute proposal format final .docx", remarks: "Institute proposal format must be followed not limiting to information given in the format" },
    { id: 5, name: "Attendance Sheet", date: "31st May 2022", file: "Attandance form for Accreditation .docx", remarks: "Attendance form for onsite evaluation of TVET Program" },
    { id: 6, name: "Payment sheet", date: "1st June 2022", file: "Payment sheet accreditation.xlsx", remarks: "Payment sheet for Accreditors" },
    { id: 7, name: "Revised Regulations for Training Providers 2023", date: "6th June 2023", file: "Revised Regulations for Registration Training provider 2023.pdf", remarks: "Revised Regulations for Registration of Training Providers 2023" },
    { id: 8, name: "TVET Qualification Pathways as per BQF", date: "6th June 2023", file: "chart 2.pdf", remarks: "TVET PATHWAYS AS PER BQF 2023" },
    { id: 9, name: "Revised Lesson Plan Form 2023", date: "1st September 2023", file: "Lesson Plan Format Final_Aug_2023.pdf", remarks: "Revised Session Plan Form 2023" },
    { id: 10, name: "Revised Task Sheet 2023", date: "1st September 2023", file: "Task Sheet Format_Final _Aug 2023.pdf", remarks: "Revised Task Sheet Form 2023" },
    { id: 11, name: "Trainee Practical Note", date: "1st September 2023", file: "TRAINEE PRACTICAL Notebook format _Aug_2023.pdf", remarks: "Trainee Practical Note book sample" },
    { id: 12, name: "REVISED QMS Manual for Training Providers (Both Private and Public Institutes)", date: "18th December 2023", file: "Manual QMS-2023.pdf", remarks: "" },
    { id: 13, name: "Guidelines for Curriculum Development", date: "28th December 2023", file: "Guidelines-for-curriculum-development.pdf", remarks: "Guidelines for Curriculum Development" },
    { id: 14, name: "Quality and Compliance Auditing Checklist 2023", date: "1st December 2023", file: "Quality Audit Checklist December 2023.docx", remarks: "Audit Checklist December 2023" },
    { id: 15, name: "TOR for internal auditor", date: "9th May 2024", file: "Final TOR for internal auditor.pdf", remarks: "Terms for Reference for QMS internal auditor" },
    { id: 16, name: "RPL Assessment Centre Accreditation Form", date: "24th July 2024", file: "FINAL RPL Accreditation Checklist .pdf", remarks: "On-site Physical Verification of Assessment Centre for Accreditation" },
    { id: 17, name: "Conflict of Interest Form", date: "1st July 2024", file: "Conflict of Interest 2024.docx", remarks: "Conflict of Interest form 2024" },
    { id: 18, name: "Course Profile Format 2024", date: "1st January 2024", file: "Course Profile Format 2024.docx", remarks: "Course Profile Format revised 2024" },
    { id: 19, name: "Checklist for additional training group", date: "1st July 2023", file: "Checklist for additional group:batch.docx", remarks: "Checklist for additional training group" },
    { id: 20, name: "De-Registration Form", date: "30th August 2024", file: "De registration form.doc", remarks: "Training Provider De-Registration Form" },
    { id: 21, name: "Checklist for additional training group", date: "30th August 2024", file: "Checklist for additional training group.docx", remarks: "Checklist for additional training group" },
    { id: 22, name: "TVET QMS Audit Checklist 2024", date: "12th September 2024", file: "Final QMS Checklist for Auditing procedure.docx", remarks: "TVET QMS Audit Checklist" },
    { id: 23, name: "Final QMS Audit Report", date: "12th September 2024", file: "Audit Report[1].docx", remarks: "" },
    { id: 24, name: "Physical Verification of Training Providers (New Establishment)", date: "12th November 2024", file: "Physical Verification of TVET Institute (New Establishment)2024.pdf", remarks: "On-site verification form (edited)" },
    { id: 25, name: "Accreditation check list 2024", date: "18th November 2024", file: "Accreditation Checklist.pdf", remarks: "Revised checklist, 2024" },
    { id: 26, name: "TOR for Lead Trainer", date: "1st January 2025", file: "TOR for Lead Trainer FINAL 2025.pdf", remarks: "Terms for Reference to Lead Trainer 2025" },
    { id: 27, name: "Accreditation Checklist for Diploma BQF4", date: "7th March 2024", file: "Accreditation checklist (Diploma).pdf", remarks: "Accreditation checklist for Diploma courses" },
    { id: 28, name: "TOR and Conflict of Interest", date: "16th August 2025", file: "Conflict of interest of Accreditors.pdf", remarks: "Conflict Of Interest of Accreditors" },
    { id: 29, name: "Supplementary Educational Service Centre Format", date: "3rd September 2025", file: "Suplementary Educational Service Cenre Proposal Template.docx", remarks: "SES Centre Establishment Proposal Format" },
    { id: 30, name: "Driving Ground Checklist", date: "2nd August 2024", file: "Drving ground checklist .docx", remarks: "Driving Ground Checklist for DTIs" },
    { id: 31, name: "SES Centre Onsite Verification Form Oct 2025", date: "16th October 2025", file: "SES Centre Onsite Verification Form 2025.pdf", remarks: "The checklist to be used during onsite verification of SES centre" },
    { id: 32, name: "2Draft TVET Quality and Qualifications Regulation 2025", date: "30th October 2025", file: "Second final Draft RR-2.docx", remarks: "Draft Regulation for Consultation" },
    { id: 33, name: "Self-assessment form for TVET Program Accreditation", date: "3rd November 2025", file: "Revised Self-assessment form 2025.docx", remarks: "This self-assessment of TVET program to be used by the TVET providers prior to on-site evaluation of the TVET program conducted by the TVET QC" },
    { id: 34, name: "Post-accreditation monitoring and audit form", date: "9th December 2025", file: "POST ACCREDITED MONITORING AND AUDIT FORM.docx", remarks: "This form to be used by the monitoring officer, TVET QC, BQPCA" },
    { id: 35, name: "Driving Ground Drawing sample", date: "11th December 2025", file: "Driving ground Drawing.pdf", remarks: "To be followed by the training providers" },
    { id: 36, name: "POST ASSESSMENT REPORT AND VALIDATION", date: "5th January 2026", file: "Post Assessment report and validation July 2025 Regular .docx", remarks: "This post assessment report to be prepared by the ASSESSMENT COORDINATOR AND ASSESSORS and submit to TVET QC" },
    { id: 37, name: "Application for Qualification Accreditation of TVET program level 2-5", date: "1st February 2025", file: "Application for approval to develop a New TVET Qualifications at Level 1-3.docx", remarks: "" }
  ]

  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [orderBy, setOrderBy] = useState('id')
  const [order, setOrder] = useState('asc')
  const rowsPerPage = 10

  // Filter publications based on search term
  const filteredPublications = publications.filter(pub =>
    pub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.file.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sorting function
  const sortedPublications = [...filteredPublications].sort((a, b) => {
    if (orderBy === 'id') {
      return order === 'asc' ? a.id - b.id : b.id - a.id
    }
    const aValue = a[orderBy]?.toString().toLowerCase() || ''
    const bValue = b[orderBy]?.toString().toLowerCase() || ''
    return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
  })

  // Pagination
  const paginatedPublications = sortedPublications.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const handleDownload = (fileName) => {
    // In production, replace with actual file download logic
    console.log(`Downloading: ${fileName}`)
    // window.location.href = `/api/download/${encodeURIComponent(fileName)}`
  }

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.pdf')) return <PdfIcon fontSize="small" />
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) return <DocIcon fontSize="small" />
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return <ExcelIcon fontSize="small" />
    return <DescriptionIcon fontSize="small" />
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold" color="primary">
          Publication 
        </Typography>
        <Typography variant="body2" color="text.secondary">
          TVET Quality Council Publications and Documents
        </Typography>
        <Divider sx={{ mt: 1.5 }} />
      </Box>

      {/* Search and Stats Bar */}
      <Box sx={{ mb: 2.5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
        <TextField
          placeholder="Search by title, remarks, or file name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
          variant="outlined"
          size="small"
          sx={{ flex: 1, maxWidth: { xs: '100%', sm: 360 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Total: <strong>{filteredPublications.length}</strong> publications
        </Typography>
      </Box>

      {/* Mobile View (Cards) */}
      {isMobile ? (
        <Stack spacing={1.5}>
          {paginatedPublications.map((pub) => (
            <Card key={pub.id} variant="outlined" sx={{ borderRadius: 1 }}>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    #{pub.id}
                  </Typography>
                  <Chip label={pub.date} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                </Box>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  {pub.name}
                </Typography>
                {pub.remarks && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic', display: 'block' }}>
                    "{pub.remarks.length > 100 ? pub.remarks.substring(0, 100) + '...' : pub.remarks}"
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ pt: 0, pb: 1.5, px: 2 }}>
                {pub.file && (
                  <Button
                    size="small"
                    startIcon={getFileIcon(pub.file)}
                    onClick={() => handleDownload(pub.file)}
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ py: 0.5, fontSize: '0.75rem' }}
                  >
                    Download {pub.file.split('.').pop().toUpperCase()}
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Stack>
      ) : (
        /* Desktop View (Compact Table with Borders) */
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
          <Table size="small" sx={{ minWidth: 650, borderCollapse: 'collapse' }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow sx={{ '& th': { borderBottom: '2px solid #e0e0e0', borderRight: '1px solid #e0e0e0' } }}>
                <TableCell width={50} sx={{ py: 1, borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>
                  <TableSortLabel
                    active={orderBy === 'id'}
                    direction={orderBy === 'id' ? order : 'asc'}
                    onClick={() => handleSort('id')}
                  >
                    #
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ py: 1, borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell width={100} sx={{ py: 1, borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>
                  <TableSortLabel
                    active={orderBy === 'date'}
                    direction={orderBy === 'date' ? order : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Published Date
                  </TableSortLabel>
                </TableCell>
                <TableCell width={130} sx={{ py: 1, borderRight: '1px solid #e0e0e0', fontWeight: 600 }}>
                  Attachment
                </TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600 }}>
                  Remarks
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPublications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <SearchIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                      <Typography variant="body2" color="text.secondary">
                        No publications found matching your search.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPublications.map((pub, index) => (
                  <TableRow 
                    key={pub.id} 
                    hover 
                    sx={{ 
                      '& td': { 
                        borderBottom: '1px solid #e0e0e0',
                        borderRight: '1px solid #e0e0e0'
                      },
                      '& td:last-child': {
                        borderRight: 'none'
                      },
                      backgroundColor: index % 2 === 0 ? 'white' : 'grey.50'
                    }}
                  >
                    <TableCell sx={{ py: 0.75, borderRight: '1px solid #e0e0e0' }}>{pub.id}</TableCell>
                    <TableCell sx={{ py: 0.75, borderRight: '1px solid #e0e0e0' }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8125rem' }}>
                        {pub.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.75, borderRight: '1px solid #e0e0e0' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {pub.date}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.75, borderRight: '1px solid #e0e0e0' }}>
                      {pub.file && (
                        <Tooltip title={`Download ${pub.file}`}>
                          <Button
                            size="small"
                            startIcon={getFileIcon(pub.file)}
                            onClick={() => handleDownload(pub.file)}
                            variant="text"
                            color="primary"
                            sx={{ 
                              textTransform: 'none', 
                              fontSize: '0.75rem',
                              minWidth: 'auto',
                              py: 0.25,
                              px: 1
                            }}
                          >
                            {pub.file.length > 20 ? pub.file.substring(0, 18) + '...' : pub.file}
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 0.75 }}>
                      <Tooltip title={pub.remarks || ''} arrow>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: '0.75rem',
                            maxWidth: 280,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {pub.remarks || '—'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {filteredPublications.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(filteredPublications.length / rowsPerPage)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Info Alert */}
      <Box sx={{ mt: 2.5 }}>
        <Alert severity="info" icon={<ViewIcon />} sx={{ py: 0 }}>
          <Typography variant="caption">
            <strong>Note:</strong> Click on any file name to download. For production use, connect this to your actual file storage system.
          </Typography>
        </Alert>
      </Box>
    </Box>
  )
}

export default PublicationIndex