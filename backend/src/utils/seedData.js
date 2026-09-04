const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const PERMISSIONS = [
  // User permissions
  { name: 'users:read', description: 'View users', resource: 'users', action: 'read' },
  { name: 'users:write', description: 'Create/update users', resource: 'users', action: 'write' },
  { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
  { name: 'users:manage', description: 'Full user management', resource: 'users', action: 'manage' },

  // Role permissions
  { name: 'roles:read', description: 'View roles', resource: 'roles', action: 'read' },
  { name: 'roles:write', description: 'Create/update roles', resource: 'roles', action: 'write' },
  { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
  { name: 'roles:manage', description: 'Full role management', resource: 'roles', action: 'manage' },

  // Audit permissions
  { name: 'audit:read', description: 'View audit logs', resource: 'audit', action: 'read' },
  { name: 'audit:manage', description: 'Manage audit logs', resource: 'audit', action: 'manage' },

  // Zoho permissions
  { name: 'zoho:read', description: 'Access Zoho apps', resource: 'zoho', action: 'read' },
  { name: 'zoho:manage', description: 'Manage Zoho integrations', resource: 'zoho', action: 'manage' },

  // Dashboard permissions
  { name: 'dashboard:read', description: 'View dashboard', resource: 'dashboard', action: 'read' },
];

const ZOHO_APPS = {
  people: {
    name: 'Zoho People',
    serviceKey: 'people',
    url: 'https://people.zoho.com',
    icon: '👥',
    description: 'Human Resource Management'
  },
  crm: {
    name: 'Zoho CRM',
    serviceKey: 'crm',
    url: 'https://www.zohoapis.com/crm/v2',
    icon: '📊',
    description: 'Customer Relationship Management'
  },
  desk: {
    name: 'Zoho Desk',
    serviceKey: 'desk',
    url: 'https://desk.zoho.com',
    icon: '🎧',
    description: 'Customer Support & Helpdesk'
  },
  books: {
    name: 'Zoho Books',
    serviceKey: 'books',
    url: 'https://www.zohoapis.com/books/v3',
    icon: '📚',
    description: 'Financial Accounting'
  }
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/employee_portal');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Role.deleteMany({}),
      Permission.deleteMany({})
    ]);

    // Create permissions
    console.log('📝 Creating permissions...');
    const createdPermissions = await Permission.insertMany(PERMISSIONS);
    console.log(`   Created ${createdPermissions.length} permissions`);

    // Get permission IDs by name
    const permMap = {};
    createdPermissions.forEach(p => { permMap[p.name] = p._id; });

    // Create roles
    console.log('👔 Creating roles...');
    const roles = [
      {
        name: 'Admin',
        description: 'Full system administrator with access to all features and Zoho applications',
        permissions: Object.values(permMap), // All permissions
        zohoApps: Object.values(ZOHO_APPS)
      },
      {
        name: 'HR',
        description: 'Human Resources team with access to Zoho People',
        permissions: [permMap['dashboard:read'], permMap['zoho:read']],
        zohoApps: [ZOHO_APPS.people]
      },
      {
        name: 'Sales',
        description: 'Sales team with access to Zoho CRM',
        permissions: [permMap['dashboard:read'], permMap['zoho:read']],
        zohoApps: [ZOHO_APPS.crm]
      },
      {
        name: 'Support',
        description: 'Customer support team with access to Zoho Desk',
        permissions: [permMap['dashboard:read'], permMap['zoho:read']],
        zohoApps: [ZOHO_APPS.desk]
      },
      {
        name: 'Finance',
        description: 'Finance team with access to Zoho Books',
        permissions: [permMap['dashboard:read'], permMap['zoho:read']],
        zohoApps: [ZOHO_APPS.books]
      }
    ];

    const createdRoles = await Role.insertMany(roles);
    console.log(`   Created ${createdRoles.length} roles`);

    // Get role IDs by name
    const roleMap = {};
    createdRoles.forEach(r => { roleMap[r.name] = r._id; });

    // Create default admin user
    console.log('👤 Creating admin user...');
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@portal.com',
      password: 'Admin@123',
      roles: [roleMap['Admin']],
      isActive: true
    });

    await adminUser.save();
    console.log('   Admin user created');

    // Create sample users for each role
    console.log('👥 Creating sample users...');
    const sampleUsers = [
      {
        name: 'HR Manager',
        email: 'hr@portal.com',
        password: 'Hr@12345',
        roles: [roleMap['HR']],
        isActive: true
      },
      {
        name: 'Sales Executive',
        email: 'sales@portal.com',
        password: 'Sales@123',
        roles: [roleMap['Sales']],
        isActive: true
      },
      {
        name: 'Support Agent',
        email: 'support@portal.com',
        password: 'Support@1',
        roles: [roleMap['Support']],
        isActive: true
      },
      {
        name: 'Finance Analyst',
        email: 'finance@portal.com',
        password: 'Finance1!',
        roles: [roleMap['Finance']],
        isActive: true
      }
    ];

    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
    }
    console.log(`   Created ${sampleUsers.length} sample users`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log('  Default Login Credentials:');
    console.log('═══════════════════════════════════════════');
    console.log('  Admin:    admin@portal.com   / Admin@123');
    console.log('  HR:       hr@portal.com      / Hr@12345');
    console.log('  Sales:    sales@portal.com   / Sales@123');
    console.log('  Support:  support@portal.com / Support@1');
    console.log('  Finance:  finance@portal.com / Finance1!');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
