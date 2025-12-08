'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPendingVendors,
  approveVendor,
  rejectVendor,
  getAllVendors,
  supabase
} from '@/lib/supabase/client';
import { Vendor } from '@/types/types';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  AppBar,
  Toolbar,
  Paper,
  Tabs,
  Tab,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Business as BusinessIcon,
  AccountCircle as AccountIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

// Custom Material Design 3 theme with #0b4164 color
const theme = createTheme({
  palette: {
    primary: {
      main: '#0b4164',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    error: {
      main: '#d32f2f',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '12px 24px',
        },
        contained: {
          boxShadow: '0 3px 5px 2px rgba(11, 65, 100, .3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: 16,
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

type TabValue = 'pending' | 'all';

export default function AdminDashboard() {
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; vendor: Vendor | null; action: 'approve' | 'reject' }>({
    open: false,
    vendor: null,
    action: 'approve',
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [approvedCount, setApprovedCount] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('all');
  const [salespersonEmails, setSalespersonEmails] = useState<string[]>([]);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check admin access based on email
    if (user.email !== 'admin@sylonow.com') {
      router.push('/dashboard');
      return;
    }

    await loadVendors();
    setLoading(false);
  };

  const loadVendors = async () => {
    try {
      const [pendingData, allData] = await Promise.all([
        getPendingVendors(),
        getAllVendors(),
      ]);
      setPendingVendors(pendingData);
      setAllVendors(allData);
      const emails = Array.from(new Set(allData.map(v => v.salesperson_email).filter(Boolean))) as string[];
      setSalespersonEmails(emails);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load vendors',
        severity: 'error',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to sign out',
        severity: 'error',
      });
    }
  };

  const openApprovalDialog = (vendor: Vendor, action: 'approve' | 'reject') => {
    setApprovalDialog({ open: true, vendor, action });
    setApprovedCount(0);
    setRejectionReason('');
    setAdminNotes('');
  };

  const handleApproval = async () => {
    if (!approvalDialog.vendor || !user) return;

    setApprovalDialog(prev => ({ ...prev, open: false }));

    try {
      if (approvalDialog.action === 'approve') {
        await approveVendor(
          approvalDialog.vendor!.id,
          user.id,
          user.email!,
          approvedCount,
          adminNotes.trim() || undefined
        );
        setSnackbar({
          open: true,
          message: `Vendor approved with ${approvedCount} listings`,
          severity: 'success',
        });
      } else {
        await rejectVendor(
          approvalDialog.vendor!.id,
          user.id,
          user.email!,
          rejectionReason,
          adminNotes.trim() || undefined
        );
        setSnackbar({
          open: true,
          message: 'Vendor rejected successfully',
          severity: 'success',
        });
      }

      await loadVendors(); // Refresh the data
    } catch (error: any) {
      console.error('Approval error details:', error);
      const errorMsg = error?.message || (error ? JSON.stringify(error) : 'Unknown error occurred');
      setSnackbar({
        open: true,
        message: `Failed to ${approvalDialog.action} vendor: ${errorMsg}`,
        severity: 'error',
      });
    }
  };

  const getVendorsToDisplay = () => {
    const baseVendors = activeTab === 'pending' ? pendingVendors : allVendors;
    if (salespersonFilter === 'all') return baseVendors;
    return baseVendors.filter(v => v.salesperson_email === salespersonFilter);
  };

  const renderVendorsBySalesperson = () => {
    const baseVendors = activeTab === 'pending' ? pendingVendors : allVendors;

    // Group vendors by salesperson email
    const vendorsBySalesperson = baseVendors.reduce((groups, vendor) => {
      const email = vendor.salesperson_email || 'Unassigned';
      if (!groups[email]) {
        groups[email] = [];
      }
      groups[email].push(vendor);
      return groups;
    }, {} as Record<string, Vendor[]>);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Object.entries(vendorsBySalesperson).map(([salespersonEmail, vendors]) => (
          <Paper
            key={salespersonEmail}
            elevation={1}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: 'background.paper',
            }}
          >
            {/* Salesperson Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {salespersonEmail}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} •
                  {vendors.filter(v => v.status === 'pending').length} pending •
                  {vendors.filter(v => v.status === 'approved').length} approved •
                  {vendors.filter(v => v.status === 'rejected').length} rejected
                </Typography>
              </Box>
            </Box>

            {/* Vendors Grid for this salesperson */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  lg: 'repeat(2, 1fr)',
                },
                gap: 3,
              }}
            >
              {vendors.map((vendor) => (
                <VendorApprovalCard
                  key={vendor.id}
                  vendor={vendor}
                  onApprove={(vendor) => openApprovalDialog(vendor, 'approve')}
                  onReject={(vendor) => openApprovalDialog(vendor, 'reject')}
                  isPendingTab={activeTab === 'pending'}
                />
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <AppBar position="sticky" elevation={2}>
          <Toolbar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                Admin Panel
              </Typography>
              <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                Review and approve vendor applications
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
              Vendor Management
            </Typography>

            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab
                label={`Pending Approval (${pendingVendors.length})`}
                value="pending"
                icon={<AssessmentIcon />}
                iconPosition="start"
              />
              <Tab
                label={`All Vendors (${allVendors.length})`}
                value="all"
                icon={<BusinessIcon />}
                iconPosition="start"
              />
            </Tabs>

            {(activeTab === 'all' || activeTab === 'pending') && salespersonEmails.length > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Sort/Filter by Salesperson:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Salesperson</InputLabel>
                  <Select
                    value={salespersonFilter}
                    label="Salesperson"
                    onChange={(e) => setSalespersonFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Salespeople ({salespersonEmails.length})</MenuItem>
                    {salespersonEmails.map(email => (
                      <MenuItem key={email} value={email}>{email}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 4 }}>
            {getVendorsToDisplay().length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: 'background.paper',
                  borderRadius: 3,
                }}
              >
                <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No {activeTab === 'pending' ? 'pending' : ''} vendors found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 'pending'
                    ? 'All vendors have been reviewed'
                    : 'No vendors have been submitted yet'
                  }
                </Typography>
              </Paper>
            ) : (
              salespersonFilter === 'all' ? (
                // Group vendors by salesperson when showing all
                renderVendorsBySalesperson()
              ) : (
                // Show filtered vendors in grid
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      lg: 'repeat(2, 1fr)',
                    },
                    gap: 3,
                  }}
                >
                  {getVendorsToDisplay().map((vendor) => (
                    <VendorApprovalCard
                      key={vendor.id}
                      vendor={vendor}
                      onApprove={(vendor) => openApprovalDialog(vendor, 'approve')}
                      onReject={(vendor) => openApprovalDialog(vendor, 'reject')}
                      isPendingTab={activeTab === 'pending'}
                    />
                  ))}
                </Box>
              )
            )}
          </Box>
        </Container>

        {/* Approval/Rejection Dialog */}
        <Dialog
          open={approvalDialog.open}
          onClose={() => setApprovalDialog({ open: false, vendor: null, action: 'approve' })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ pb: 0 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'} Vendor Application
            </Typography>
            {approvalDialog.vendor && (
              <Typography variant="body2" color="text.secondary">
                {approvalDialog.vendor.v_name} - {approvalDialog.vendor.categories?.name || 'No category'}
              </Typography>
            )}
          </DialogTitle>

          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {approvalDialog.action === 'approve' ? (
                <>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Set the number of approved listings for this vendor:
                  </Typography>
                  <TextField
                    fullWidth
                    label="Approved Listing Count"
                    type="number"
                    value={approvedCount || ''}
                    onChange={(e) => setApprovedCount(parseInt(e.target.value) || 0)}
                    helperText={`Earnings will be: ₹${(approvedCount || 0) * 20}`}
                    inputProps={{ min: 0 }}
                    sx={{ mb: 3 }}
                  />
                </>
              ) : (
                <>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Provide a reason for rejection:
                  </Typography>
                  <TextField
                    fullWidth
                    label="Rejection Reason"
                    multiline
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Incomplete documentation, Invalid business type"
                    sx={{ mb: 3 }}
                  />
                </>
              )}

              <TextField
                fullWidth
                label="Admin Notes (Optional)"
                multiline
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes for future reference"
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => setApprovalDialog({ open: false, vendor: null, action: 'approve' })}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproval}
              variant="contained"
              color={approvalDialog.action === 'approve' ? 'success' : 'error'}
              startIcon={approvalDialog.action === 'approve' ? <ApproveIcon /> : <RejectIcon />}
            >
              {approvalDialog.action === 'approve' ? 'Approve Vendor' : 'Reject Vendor'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

function VendorApprovalCard({
  vendor,
  onApprove,
  onReject,
  isPendingTab
}: {
  vendor: Vendor;
  onApprove: (vendor: Vendor) => void;
  onReject: (vendor: Vendor) => void;
  isPendingTab: boolean;
}) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
              {vendor.v_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              <AccountIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              {vendor.v_phonenumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              📍 {vendor.v_address}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🏷️ {vendor.categories?.name || 'No category'}
            </Typography>
          </Box>
          <Chip
            label={vendor.status.toUpperCase()}
            color={vendor.status === 'approved' ? 'success' : vendor.status === 'rejected' ? 'error' : 'warning'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            📊 Listings: {vendor.v_listing_count}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            💰 Total Price: ₹{vendor.total_price}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: vendor.status === 'approved' && vendor.approved_earnings ? 2 : (vendor.status === 'rejected' && vendor.rejection_reason ? 2 : 0) }}>
          <Typography variant="body2" color="text.secondary">
            👤 Created by: {vendor.salesperson_email || 'N/A'}
          </Typography>
          {(vendor.status === 'approved' || vendor.status === 'rejected') && (
            <Typography variant="body2" color="text.secondary">
              🎯 {vendor.status === 'approved' ? 'Approved' : 'Rejected'} by: {vendor.approver_email || 'N/A'}
            </Typography>
          )}
        </Box>

        {vendor.status === 'approved' && vendor.approved_earnings && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="success.main">
              💸 Earnings: ₹{vendor.approved_earnings}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved: {vendor.approved_listing_count} listings
            </Typography>
          </Box>
        )}

        {vendor.status === 'rejected' && vendor.rejection_reason && (
          <Alert severity="error" sx={{ mt: 2, py: 1 }}>
            <AlertTitle sx={{ fontWeight: 600 }}>Rejection Reason</AlertTitle>
            {vendor.rejection_reason}
          </Alert>
        )}

        {isPendingTab && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => onApprove(vendor)}
              sx={{ flex: 1 }}
            >
              Approve
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => onReject(vendor)}
              sx={{ flex: 1 }}
            >
              Reject
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
