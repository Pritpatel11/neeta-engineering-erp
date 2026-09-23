const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'erp_super_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  name: user.name,
  role: user.role,
  department: user.department,
  designation: user.designation,
  assignedModules: user.assignedModules || [],
  performanceScore: user.performanceScore || 85,
  hasAiAccess: !!user.hasAiAccess,
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide both username and password' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact administrator.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.status(200).json(formatUserResponse(req.user));
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ message: 'Server error retrieving user profile' });
  }
};

// Pre-defined role accounts for seed
const initialSeedUsers = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin',
    department: 'all',
    designation: 'ERP Administrator',
    assignedModules: ['*'],
    performanceScore: 98,
    hasAiAccess: true,
  },
  {
    username: 'manager.accounts',
    password: 'accounts123',
    name: 'Ramesh Sharma',
    role: 'manager',
    department: 'accounts',
    designation: 'Accounts & Finance Manager',
    assignedModules: [
      '/invoice',
      '/private-invoices',
      '/create-private-invoice',
      '/private-party-ledger',
      '/create-statement',
      '/statement-management',
      '/statement-register',
      '/create-receipt',
      '/receipt-management',
      '/indemnity-bond',
      '/purchase-management',
      '/my-tasks',
    ],
    performanceScore: 94,
    hasAiAccess: true,
  },
  {
    username: 'user.billing',
    password: 'billing123',
    name: 'Pooja Verma',
    role: 'user',
    department: 'accounts',
    designation: 'Billing Executive',
    assignedModules: [
      '/invoice',
      '/private-invoices',
      '/create-private-invoice',
      '/private-party-ledger',
      '/create-statement',
      '/statement-management',
      '/statement-register',
      '/create-receipt',
      '/receipt-management',
      '/indemnity-bond',
      '/my-tasks',
    ],
    performanceScore: 88,
    hasAiAccess: false,
  },
  {
    username: 'manager.logistics',
    password: 'logistics123',
    name: 'Vikram Patel',
    role: 'manager',
    department: 'logistics',
    designation: 'Logistics & Store Manager',
    assignedModules: [
      '/create-cr',
      '/cr-register',
      '/create-challan',
      '/challan-management',
      '/inventory-balance',
      '/remaining-material',
      '/contractor-ledger',
      '/my-tasks',
    ],
    performanceScore: 91,
    hasAiAccess: true,
  },
  {
    username: 'user.store',
    password: 'store123',
    name: 'Anil Desai',
    role: 'user',
    department: 'logistics',
    designation: 'Store Assistant',
    assignedModules: [
      '/create-cr',
      '/cr-register',
      '/create-challan',
      '/challan-management',
      '/inventory-balance',
      '/remaining-material',
      '/my-tasks',
    ],
    performanceScore: 82,
    hasAiAccess: false,
  },
  {
    username: 'manager.purchase',
    password: 'purchase123',
    name: 'Harish Mehta',
    role: 'purchase_manager',
    department: 'purchase',
    designation: 'Purchase & Procurement Manager',
    assignedModules: [
      '/purchase-management',
      '/vendors',
      '/purchase-order-preview',
      '/inventory-balance',
      '/cr-register',
      '/my-tasks',
    ],
    performanceScore: 92,
    hasAiAccess: true,
  },
  {
    username: 'user.sales',
    password: 'sales123',
    name: 'Karan Shah',
    role: 'user',
    department: 'sales',
    designation: 'Sales & CRM Executive',
    assignedModules: [
      '/enquiries',
      '/quotations',
      '/create-quotation',
      '/my-tasks',
    ],
    performanceScore: 89,
    hasAiAccess: false,
  },
  {
    username: 'manager.production',
    password: 'production123',
    name: 'Mahesh Sharma',
    role: 'manager',
    department: 'production',
    designation: 'Production Manager',
    assignedModules: [
      '/inventory-balance',
      '/challan-management',
      '/remaining-material',
      '/contractor-ledger',
      '/my-tasks',
    ],
    performanceScore: 93,
    hasAiAccess: true,
  },
  {
    username: 'manager.quality',
    password: 'quality123',
    name: 'Rajesh Trivedi',
    role: 'manager',
    department: 'quality',
    designation: 'Quality Assurance Lead',
    assignedModules: [
      '/cr-register',
      '/inventory-balance',
      '/challan-management',
      '/my-tasks',
    ],
    performanceScore: 95,
    hasAiAccess: true,
  },
  {
    username: 'owner',
    password: 'owner123',
    name: 'Prit Patel',
    role: 'owner',
    department: 'management',
    designation: 'Managing Director / Owner',
    assignedModules: [
      '/owner-dashboard',
      '/purchase-management',
      '/purchase-order-preview',
    ],
    performanceScore: 100,
    hasAiAccess: true,
  },
];

// Function to seed all role accounts and initial tasks
const autoSeedDefaultAdmin = async () => {
  try {
    console.log('Verifying RBAC user accounts in database...');
    const userMap = {};

    for (const u of initialSeedUsers) {
      let existing = await User.findOne({ username: u.username });
      if (!existing) {
        existing = await User.create(u);
        console.log(`Created ${u.role} user: ${u.username}`);
      } else {
        // Ensure role, department, designation, and assignedModules are up to date
        existing.role = u.role;
        existing.department = u.department;
        existing.designation = u.designation;
        existing.assignedModules = u.assignedModules;
        existing.performanceScore = u.performanceScore;
        existing.hasAiAccess = u.hasAiAccess;
        await existing.save();
      }
      userMap[u.username] = existing._id;
    }

    // Link managers to users
    if (userMap['user.billing'] && userMap['manager.accounts']) {
      await User.findByIdAndUpdate(userMap['user.billing'], { managerId: userMap['manager.accounts'] });
    }
    if (userMap['user.store'] && userMap['manager.logistics']) {
      await User.findByIdAndUpdate(userMap['user.store'], { managerId: userMap['manager.logistics'] });
    }

    // Seed sample tasks if no tasks exist
    const taskCount = await Task.countDocuments();
    if (taskCount === 0 && userMap['user.billing'] && userMap['user.store']) {
      console.log('Seeding initial operational tasks for Owner summary...');
      const sampleTasks = [
        {
          title: 'Generate Month-End GST Invoices for GIDC Phase II',
          description: 'Process all pending monthly statements into GST invoices and verify E-way bills.',
          department: 'accounts',
          assignedTo: userMap['user.billing'],
          assignedBy: userMap['manager.accounts'],
          status: 'completed',
          priority: 'high',
          progress: 100,
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Verify Vendor Payment Receipts for Steel Inward',
          description: 'Match payment receipts against challans and store receipts for Tata Steel consignments.',
          department: 'accounts',
          assignedTo: userMap['user.billing'],
          assignedBy: userMap['manager.accounts'],
          status: 'in_progress',
          priority: 'medium',
          progress: 60,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Physical Stock Audit of Angle & Channel inventory',
          description: 'Conduct physical inventory count in Deesa warehouse and update division balances.',
          department: 'logistics',
          assignedTo: userMap['user.store'],
          assignedBy: userMap['manager.logistics'],
          status: 'completed',
          priority: 'high',
          progress: 100,
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Log Incoming Scrap Return Challans',
          description: 'Record returning scrap and remaining materials from contractor Om Engineering.',
          department: 'logistics',
          assignedTo: userMap['user.store'],
          assignedBy: userMap['manager.logistics'],
          status: 'in_progress',
          priority: 'high',
          progress: 40,
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Follow-up on Overdue Balance with L&T Project',
          description: 'Outstanding balance payment pending for more than 45 days.',
          department: 'accounts',
          assignedTo: userMap['manager.accounts'],
          assignedBy: userMap['admin'],
          status: 'overdue',
          priority: 'urgent',
          progress: 25,
          dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Dispatch Dispatch Challan 2026-CH-042',
          description: 'Complete inspection and dispatch structural fabrication load.',
          department: 'logistics',
          assignedTo: userMap['manager.logistics'],
          assignedBy: userMap['admin'],
          status: 'completed',
          priority: 'urgent',
          progress: 100,
          completedAt: new Date(),
          dueDate: new Date(),
        },
      ];

      await Task.insertMany(sampleTasks);
      console.log('Sample tasks created successfully.');
    }

    // Seed production tasks if missing
    const prodTask = await Task.findOne({ department: 'production' });
    if (!prodTask && userMap['manager.production']) {
      await Task.create({
        title: 'Daily Fabrication Shift: Angle 65x65 cutting & punch',
        description: 'Process 250 pcs of 9ft structural angles for Deesa power line project.',
        department: 'production',
        assignedTo: userMap['manager.production'],
        assignedBy: userMap['admin'],
        status: 'in_progress',
        priority: 'high',
        progress: 75,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      });
      await Task.create({
        title: 'Preventive Maintenance of Hydraulic Punching Machine M-03',
        description: 'Lubrication and die realignment to prevent burr formation.',
        department: 'production',
        assignedTo: userMap['manager.production'],
        assignedBy: userMap['admin'],
        status: 'completed',
        priority: 'medium',
        progress: 100,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      });
    }

    // Seed quality tasks if missing
    const qualityTask = await Task.findOne({ department: 'quality' });
    if (!qualityTask && userMap['manager.quality']) {
      await Task.create({
        title: 'Inward Galvanizing Thickness Inspection (CR-2026-118)',
        description: 'Inspect zinc coating thickness on Angles as per IS 4759 standard (min 86 microns).',
        department: 'quality',
        assignedTo: userMap['manager.quality'],
        assignedBy: userMap['admin'],
        status: 'completed',
        priority: 'high',
        progress: 100,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });
      await Task.create({
        title: 'Pre-Dispatch Dimensional Inspection for Challan CH-2026-9854',
        description: 'Verify hole pitches and flange dimensions before dispatch to Palanpur site.',
        department: 'quality',
        assignedTo: userMap['manager.quality'],
        assignedBy: userMap['admin'],
        status: 'in_progress',
        priority: 'urgent',
        progress: 50,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      });
    }

    // Clean up any legacy HR accounts and tasks
    await User.deleteMany({ $or: [{ username: 'manager.hr' }, { department: 'hr' }] });
    await Task.deleteMany({ department: 'hr' });
  } catch (error) {
    console.error('autoSeedDefaultAdmin error:', error.message);
  }
};

// @desc    Manual trigger to seed default users if needed
// @route   POST /api/auth/seed
// @access  Public
const seedAdminEndpoint = async (req, res) => {
  try {
    await autoSeedDefaultAdmin();
    res.status(200).json({ message: 'All RBAC role accounts and initial tasks seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Failed to seed accounts: ' + error.message });
  }
};

module.exports = {
  login,
  getMe,
  autoSeedDefaultAdmin,
  seedAdminEndpoint,
};
