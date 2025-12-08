'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getVendorsBySalesperson,
  createVendor,
  getCategories,
  getSalespersonEarnings,
  getVendorsByStatus,
  supabase
} from '@/lib/supabase/client';
import { Vendor, Category, SalespersonEarnings } from '@/types/types';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Card,
  CardContent,
  CardActions,
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
  Fab,
  Snackbar,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  Business as BusinessIcon,
  Photo as PhotoIcon,
  Movie as VideoIcon,
  AccountCircle as AccountIcon,
  Error as ErrorIcon,
  CheckCircle,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Payment as PaymentIcon,
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

type DashboardTab = 'earnings' | 'vendors';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('earnings');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [earnings, setEarnings] = useState<SalespersonEarnings | null>(null);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [user]);

  useEffect(() => {
    // Filter vendors based on status when vendors data changes
    filterVendors();
  }, [vendors, statusFilter]);

  const loadDashboardData = async () => {
    try {
      const [vendorsData, earningsData] = await Promise.all([
        getVendorsBySalesperson(user!.id),
        getSalespersonEarnings(user!.id).catch(() => null), // Don't fail if no earnings yet
      ]);
      setVendors(vendorsData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load dashboard data. Please check your connection.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    if (statusFilter === 'all') {
      setFilteredVendors(vendors);
    } else {
      const filtered = vendors.filter(vendor => vendor.status === statusFilter);
      setFilteredVendors(filtered);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to sign out. Please try again.',
        severity: 'error',
      });
    }
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
                Salesperson Dashboard
              </Typography>
              <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                Earnings & vendor management
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
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
              Dashboard Overview
            </Typography>

            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                label="My Earnings"
                value="earnings"
                icon={<PaymentIcon />}
                iconPosition="start"
              />
              <Tab
                label="My Vendors"
                value="vendors"
                icon={<AssignmentIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Earnings Section */}
          {activeTab === 'earnings' && (
            <EarningsSection
              earnings={earnings}
              vendors={vendors}
              onAddVendor={() => setShowForm(true)}
            />
          )}

          {/* Vendors Section */}
          {activeTab === 'vendors' && (
            <VendorsSection
              vendors={filteredVendors}
              allVendors={vendors}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onAddVendor={() => setShowForm(true)}
            />
          )}

          <VendorForm
            open={showForm}
            onClose={() => setShowForm(false)}
            onSubmit={loadDashboardData}
            onError={(message) => setSnackbar({ open: true, message, severity: 'error' })}
            onSuccess={(message) => setSnackbar({ open: true, message, severity: 'success' })}
          />
        </Container>

        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => setShowForm(true)}
        >
          <AddIcon />
        </Fab>

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

// Earnings Section Component
function EarningsSection({
  earnings,
  vendors,
  onAddVendor
}: {
  earnings: SalespersonEarnings | null;
  vendors: Vendor[];
  onAddVendor: () => void;
}) {
  const totalVendors = vendors.length;
  const approvedCount = vendors.filter(v => v.status === 'approved').length;
  const pendingCount = vendors.filter(v => v.status === 'pending').length;
  const rejectedCount = vendors.filter(v => v.status === 'rejected').length;
  const approvalRate = totalVendors > 0 ? Math.round((approvedCount / totalVendors) * 100) : 0;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Earnings Overview
        </Typography>

        {/* Earnings Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
            mb: 4,
          }}
        >
          <Card sx={{
            textAlign: 'center',
            py: 3,
            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white'
          }}>
            <CardContent>
              <PaymentIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                ₹{earnings?.total_earnings || 0}
              </Typography>
              <Typography variant="body2">Total Earnings</Typography>
            </CardContent>
          </Card>

          <Card sx={{
            textAlign: 'center',
            py: 3,
            background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
            color: 'white'
          }}>
            <CardContent>
              <BarChartIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {approvalRate}%
              </Typography>
              <Typography variant="body2">Approval Rate</Typography>
            </CardContent>
          </Card>

          <Card sx={{
            textAlign: 'center',
            py: 3,
            background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
            color: 'white'
          }}>
            <CardContent>
              <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {totalVendors}
              </Typography>
              <Typography variant="body2">Total Vendors</Typography>
            </CardContent>
          </Card>

          <Card sx={{
            textAlign: 'center',
            py: 3,
            background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
            color: 'white'
          }}>
            <CardContent>
              <AssignmentIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {pendingCount}
              </Typography>
              <Typography variant="body2">Pending Review</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Detailed Status Breakdown */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Vendor Status Breakdown
          </Typography>

          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip
                label="Approved"
                color="success"
                sx={{ mb: 1, fontSize: '1rem', py: 1, px: 2 }}
              />
              <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                {approvedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vendors approved
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Chip
                label="Pending"
                color="warning"
                sx={{ mb: 1, fontSize: '1rem', py: 1, px: 2 }}
              />
              <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {pendingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting approval
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Chip
                label="Rejected"
                color="error"
                sx={{ mb: 1, fontSize: '1rem', py: 1, px: 2 }}
              />
              <Typography variant="h5" color="error.main" sx={{ fontWeight: 'bold' }}>
                {rejectedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need improvement
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Recent Approved Vendors */}
        {approvedCount > 0 && (
          <Card sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Approved Vendors & Earnings
            </Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
              {vendors.filter(v => v.status === 'approved').slice(0, 5).map((vendor) => (
                <Box
                  key={vendor.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'success.light',
                    borderRadius: 2,
                    backgroundColor: 'success.lighter'
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {vendor.v_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vendor.categories?.name || 'No category'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                      ₹{vendor.approved_earnings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vendor.approved_listing_count} listings
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        )}

        {/* Call to Action */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Want to increase your earnings? Add more vendors!
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={onAddVendor}
          >
            Add New Vendor
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// Vendors Section Component
function VendorsSection({
  vendors,
  allVendors,
  statusFilter,
  onStatusFilterChange,
  onAddVendor
}: {
  vendors: Vendor[];
  allVendors: Vendor[];
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  onAddVendor: () => void;
}) {
  return (
    <Box>
      {/* Filter Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            My Vendors ({allVendors.length})
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <MenuItem value="all">All Vendors ({allVendors.length})</MenuItem>
              <MenuItem value="approved">
                Approved ({allVendors.filter(v => v.status === 'approved').length})
              </MenuItem>
              <MenuItem value="pending">
                Pending ({allVendors.filter(v => v.status === 'pending').length})
              </MenuItem>
              <MenuItem value="rejected">
                Rejected ({allVendors.filter(v => v.status === 'rejected').length})
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddVendor}
          size="large"
        >
          Add Vendor
        </Button>
      </Box>

      {/* Vendors Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {vendors.length === 0 ? (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                backgroundColor: 'background.paper',
                borderRadius: 3,
              }}
            >
              <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {statusFilter === 'all' ? 'No vendors yet' : `No ${statusFilter} vendors`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {statusFilter === 'all'
                  ? 'Add your first vendor to get started!'
                  : `No vendors with ${statusFilter} status found.`
                }
              </Typography>
              {statusFilter === 'all' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onAddVendor}
                >
                  Add Your First Vendor
                </Button>
              )}
            </Paper>
          </Box>
        ) : (
          vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))
        )}
      </Box>
    </Box>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

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
            <Typography variant="body2" color="text.secondary">
              📍 {vendor.v_address}
            </Typography>
          </Box>
          <Chip
            label={vendor.status.toUpperCase()}
            color={getStatusChipColor(vendor.status) as any}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            📊 Listing Count: {vendor.v_listing_count}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: vendor.status === 'approved' && vendor.approved_earnings ? 1 : 0 }}>
          <Typography variant="body2" color="text.secondary">
            💰 Total Price: ₹{vendor.total_price}
          </Typography>
        </Box>

        {vendor.status === 'approved' && vendor.approved_earnings && (
          <Typography variant="body2" color="success.main" sx={{ mb: vendor.rejection_reason ? 1 : 0 }}>
            💸 Earnings: ₹{vendor.approved_earnings}
          </Typography>
        )}

        {vendor.rejection_reason && (
          <Alert severity="error" sx={{ mt: 2, py: 1 }}>
            <AlertTitle sx={{ fontWeight: 600 }}>Rejection Reason</AlertTitle>
            {vendor.rejection_reason}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function VendorForm({
  open,
  onClose,
  onSubmit,
  onError,
  onSuccess
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const [formData, setFormData] = useState({
    v_name: '',
    v_type: '', // vendor category UUID
    v_phonenumber: '', // v_number
    v_address: '',
    v_listing_count: 0,
    total_price: 200, // base price
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Calculate total price whenever listing count changes
  useEffect(() => {
    const basePrice = 200;
    const listingPrice = formData.v_listing_count * 20;
    setFormData(prev => ({
      ...prev,
      total_price: basePrice + listingPrice
    }));
  }, [formData.v_listing_count]);

  // Load categories when form opens
  useEffect(() => {
    if (open && categories.length === 0) {
      loadCategories();
    }
  }, [open, categories.length]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      onError('Failed to load categories. Please try again.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const [fileInputs, setFileInputs] = useState({
    v_verified_screen: null as File | null, // verified photo
    v_listing_photo: null as File | null, // listing photo
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFileInputs(prev => ({ ...prev, [name]: files[0] }));
      // Clear file-related errors
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.v_name.trim()) newErrors.v_name = 'Vendor name is required';
    if (!formData.v_type.trim()) newErrors.v_type = 'Vendor type is required';
    if (!formData.v_phonenumber.match(/^\d{10}$/)) newErrors.v_phonenumber = 'Phone number must be 10 digits';
    if (!formData.v_address.trim()) newErrors.v_address = 'Address is required';
    if (formData.v_listing_count < 0) newErrors.v_listing_count = 'Listing count cannot be negative';

    // Check file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileInputs.v_verified_screen && fileInputs.v_verified_screen.size > maxSize) {
      newErrors.v_verified_screen = 'Verified photo must be less than 5MB';
    }
    if (fileInputs.v_listing_photo && fileInputs.v_listing_photo.size > maxSize) {
      newErrors.v_listing_photo = 'Business photo must be less than 5MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file: File, bucket: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Failed to upload file to ${bucket}: ${error.message}`);
      }
      return data.path;
    } catch (error: any) {
      console.error(`Upload error for ${bucket}:`, error);
      if (error.message?.includes('Bucket not found')) {
        throw new Error(`STORAGE_NOT_CONFIGURED: File uploads are optional - vendor can be created without photos.`);
      }
      if (error.message?.includes('exceeded')) throw new Error('File size is too large (max 5MB)');
      if (error.message?.includes('policy')) throw new Error('File upload not allowed');
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      // Upload files first (optional - don't fail vendor creation if buckets don't exist)
      let verifiedPhotoUrl = null;
      let listingPhotoUrl = null;

      if (fileInputs.v_verified_screen) {
        try {
          verifiedPhotoUrl = await uploadFile(fileInputs.v_verified_screen, 'verified-photos');
        } catch (error: any) {
          // Only show warning, don't fail vendor creation
          const message = error.message?.includes('STORAGE_NOT_CONFIGURED') ||
                          error.message?.includes('Bucket not found')
            ? 'File storage not configured yet - photo uploads will be available after setup. Vendor will be created without photo.'
            : `Verified photo upload failed: ${error.message}. Vendor will be created without photo.`;
          onError(message);
          // Continue with vendor creation without throwing
        }
      }

      if (fileInputs.v_listing_photo) {
        try {
          listingPhotoUrl = await uploadFile(fileInputs.v_listing_photo, 'business-photos');
        } catch (error: any) {
          // Only show warning, don't fail vendor creation
          const message = error.message?.includes('STORAGE_NOT_CONFIGURED') ||
                          error.message?.includes('Bucket not found')
            ? 'File storage not configured yet - photo uploads will be available after setup. Vendor will be created without photo.'
            : `Business photo upload failed: ${error.message}. Vendor will be created without photo.`;
          onError(message);
          // Continue with vendor creation without throwing
        }
      }

      // Create vendor record
      try {
        await createVendor({
          v_name: formData.v_name.trim(),
          v_type: formData.v_type.trim() || null,
          v_phonenumber: formData.v_phonenumber,
          v_address: formData.v_address.trim(),
          total_price: formData.total_price,
          salesperson_id: user!.id,
          salesperson_email: user!.email!,
          verified_photo_url: verifiedPhotoUrl,
          business_photo_url: listingPhotoUrl,
          v_listing_count: formData.v_listing_count,
          status: 'pending',
        });
      } catch (error: any) {
        console.error('Vendor creation error:', error);
        if (error.message?.includes('duplicate')) {
          throw new Error('A vendor with this phone number already exists');
        }
        if (error.message?.includes('foreign key')) {
          throw new Error('Invalid data provided. Please check your inputs');
        }
        if (error.message?.includes('violates row-level security')) {
          throw new Error('Authentication error. Please sign in again');
        }
        throw new Error(`Failed to save vendor: ${error.message}`);
      }

      onSuccess('Vendor added successfully!');
      onSubmit();
      onClose();

      // Reset form
      setFormData({
        v_name: '',
        v_type: '',
        v_phonenumber: '',
        v_address: '',
        v_listing_count: 0,
        total_price: 200,
      });
      setFileInputs({
        v_verified_screen: null,
        v_listing_photo: null,
      });

    } catch (err: any) {
      console.error('Form submission error:', err);
      onError(err.message || 'Failed to add vendor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      v_name: '',
      v_type: '',
      v_phonenumber: '',
      v_address: '',
      v_listing_count: 0,
      total_price: 200,
    });
    setFileInputs({
      v_verified_screen: null,
      v_listing_photo: null,
    });
    setErrors({});
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon />
        Add New Vendor
        <IconButton
          onClick={onClose}
          sx={{ ml: 'auto' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 3,
            }}
          >
            <TextField
              fullWidth
              label="Vendor Name"
              required
              value={formData.v_name}
              onChange={(e) => setFormData(prev => ({ ...prev, v_name: e.target.value }))}
              error={!!errors.v_name}
              helperText={errors.v_name}
              placeholder="Enter vendor name"
            />

            <FormControl fullWidth required error={!!errors.v_type}>
              <InputLabel>Vendor Type</InputLabel>
              <Select
                value={formData.v_type}
                onChange={(e) => setFormData(prev => ({ ...prev, v_type: e.target.value }))}
                label="Vendor Type"
                disabled={categoriesLoading}
              >
                <MenuItem value="">
                  <em>{categoriesLoading ? 'Loading categories...' : 'Select vendor type...'}</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.v_type && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.v_type}
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Phone Number"
              required
              type="tel"
              value={formData.v_phonenumber}
              onChange={(e) => setFormData(prev => ({ ...prev, v_phonenumber: e.target.value }))}
              error={!!errors.v_phonenumber}
              helperText={errors.v_phonenumber || "10-digit mobile number"}
              placeholder="9876543210"
              inputProps={{ pattern: '^\\d{10}$', maxLength: 10 }}
            />

            <TextField
              fullWidth
              label="Listing Count"
              required
              type="number"
              value={formData.v_listing_count}
              onChange={(e) => setFormData(prev => ({ ...prev, v_listing_count: parseInt(e.target.value) || 0 }))}
              error={!!errors.v_listing_count}
              helperText={errors.v_listing_count || "Each listing costs ₹20"}
              placeholder="0"
              inputProps={{ min: 0 }}
            />

            <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
              <TextField
                fullWidth
                label="Address"
                required
                multiline
                rows={3}
                value={formData.v_address}
                onChange={(e) => setFormData(prev => ({ ...prev, v_address: e.target.value }))}
                error={!!errors.v_address}
                helperText={errors.v_address}
                placeholder="Full business address"
              />
            </Box>

            <TextField
              fullWidth
              label="Total Price (₹)"
              value={formData.total_price}
              InputProps={{ readOnly: true }}
              helperText={`Base: ₹200 + ${formData.v_listing_count} listings × ₹20`}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
              <Chip
                icon={<PhotoIcon />}
                label="Verified Photo"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
              <Typography variant="body2" color="text.secondary">
                Optional
              </Typography>
            </Box>

            <TextField
              fullWidth
              type="file"
              inputProps={{ accept: 'image/*' }}
              onChange={handleFileChange}
              name="v_verified_screen"
              error={!!errors.v_verified_screen}
              helperText={errors.v_verified_screen || "Upload verification photo (max 5MB)"}
              sx={{
                '& .MuiInputBase-input': {
                  padding: '8px',
                },
              }}
            />

            <TextField
              fullWidth
              type="file"
              inputProps={{ accept: 'image/*' }}
              onChange={handleFileChange}
              name="v_listing_photo"
              error={!!errors.v_listing_photo}
              helperText={errors.v_listing_photo || "Upload business photo (max 5MB)"}
              sx={{
                '& .MuiInputBase-input': {
                  padding: '8px',
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={() => {
            resetForm();
            onClose();
          }}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
        >
          {loading ? 'Adding Vendor...' : 'Add Vendor'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
