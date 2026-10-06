import http from 'http';
import app from './src/app.js';
import { prisma } from './src/config/database.js';
import bcrypt from 'bcryptjs';

const PORT = 5055;
let server;

function request(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n=== RUNNING RUVERSE BACKEND TEST SUITE ===\n');

  server = app.listen(PORT);
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failedCount++;
    }
  }

  try {
    // 1. Health Check
    const health = await request('GET', '/api/health');
    assert(health.statusCode === 200 && health.body.success === true, '1. Health endpoint returns 200 and success: true');

    // 2. Unauthenticated /api/auth/me should return 401
    const unauthMe = await request('GET', '/api/auth/me');
    assert(unauthMe.statusCode === 401 && unauthMe.body.success === false, '2. Unauthenticated /api/auth/me returns 401');

    // 3. Login with wrong password rejected
    const wrongPass = await request('POST', '/api/auth/login', {
      email: 'admin@ruverse.in',
      password: 'WrongPassword123!',
    });
    assert(wrongPass.statusCode === 401 && wrongPass.body.success === false, '3. Login with wrong password returns 401');

    // 4. Login with unknown email rejected
    const unknownEmail = await request('POST', '/api/auth/login', {
      email: 'nonexistent@ruverse.in',
      password: 'AdminSecurePassword2026!',
    });
    assert(unknownEmail.statusCode === 401 && unknownEmail.body.success === false, '4. Login with unknown email returns 401');

    // 5. Create an inactive user to test inactive user rejection
    const inactiveUser = await prisma.user.upsert({
      where: { email: 'inactive@ruverse.in' },
      update: { status: 'INACTIVE' },
      create: {
        name: 'Inactive User',
        email: 'inactive@ruverse.in',
        password: await bcrypt.hash('TestPass123!', 12),
        roleId: 2,
        status: 'INACTIVE',
      },
    });
    const inactiveLogin = await request('POST', '/api/auth/login', {
      email: 'inactive@ruverse.in',
      password: 'TestPass123!',
    });
    assert(inactiveLogin.statusCode === 403 && inactiveLogin.body.success === false, '5. Inactive user login returns 403 / blocked');

    // 6. Successful Admin Login
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'admin@ruverse.in',
      password: 'AdminSecurePassword2026!',
    });
    assert(
      loginRes.statusCode === 200 &&
      loginRes.body.success === true &&
      loginRes.body.data.user.email === 'admin@ruverse.in' &&
      !loginRes.body.data.user.password,
      '6. Admin login returns 200 and user data without password'
    );

    // Extract cookie from login response
    const setCookie = loginRes.headers['set-cookie'];
    const authCookie = Array.isArray(setCookie) ? setCookie[0].split(';')[0] : '';
    assert(authCookie.includes('ruverse_auth='), '7. Auth HTTP-only cookie set on login');

    // 8. /api/auth/me with auth cookie returns 200 and user details
    const meRes = await request('GET', '/api/auth/me', null, authCookie);
    assert(
      meRes.statusCode === 200 &&
      meRes.body.success === true &&
      meRes.body.data.user.role.slug === 'admin' &&
      Array.isArray(meRes.body.data.user.permissions),
      '8. /api/auth/me with cookie returns authenticated user with permissions'
    );

    // 9. Protected Admin API rejects unauthenticated requests
    const unauthAdminCat = await request('GET', '/api/admin/categories');
    assert(unauthAdminCat.statusCode === 401, '9. Admin category list rejects unauthenticated request with 401');

    // 10. Clean any previous test categories
    await prisma.category.deleteMany({
      where: {
        OR: [
          { slug: { in: ['hackathons', 'mega-hackathons', 'gaming-and-esports', 'workshops', 'workshops-and-seminars', 'robotics', 'test-category', 'unauthorized-category'] } },
          { name: { in: ['Hackathons', 'Mega Hackathons', 'Gaming & Esports', 'Workshops', 'Workshops & Seminars', 'Robotics', 'Test Category', 'Unauthorized Category'] } }
        ]
      },
    });

    // 11. Create Category 1 (Hackathons)
    const cat1 = await request('POST', '/api/admin/categories', {
      name: 'Hackathons',
      description: 'Exciting 24-48 hour coding marathons',
      displayOrder: 1,
      isActive: true,
    }, authCookie);
    assert(
      cat1.statusCode === 201 &&
      cat1.body.success === true &&
      cat1.body.data.category.slug === 'hackathons' &&
      cat1.body.data.category.creator.email === 'admin@ruverse.in',
      '11. Create Category works with automatic slug and creator audit info'
    );

    // 12. Duplicate category rejection (case-insensitive check: "hackathon" or "HACKATHONS")
    const dupCat = await request('POST', '/api/admin/categories', {
      name: 'HACKATHONS',
      description: 'Duplicate test',
      displayOrder: 2,
      isActive: true,
    }, authCookie);
    assert(
      dupCat.statusCode === 409 && dupCat.body.success === false,
      '12. Duplicate category rejected with 409'
    );

    // 13. Empty name validation
    const emptyName = await request('POST', '/api/admin/categories', {
      name: '   ',
      description: 'Empty name test',
    }, authCookie);
    assert(emptyName.statusCode === 422, '13. Empty category name rejected with 422 validation error');

    // 14. Create Category 2 (Gaming & Esports - inactive to test filtering)
    const cat2 = await request('POST', '/api/admin/categories', {
      name: 'Gaming & Esports',
      description: 'Competitive multiplayer tournaments',
      displayOrder: 5,
      isActive: false,
    }, authCookie);
    assert(
      cat2.statusCode === 201 && cat2.body.data.category.slug === 'gaming-and-esports',
      '14. Create second category (inactive) with proper slug generation'
    );

    // 15. Create Category 3 (Workshops - active)
    const cat3 = await request('POST', '/api/admin/categories', {
      name: 'Workshops & Seminars',
      description: 'Hands-on technical workshops',
      displayOrder: 2,
      isActive: true,
    }, authCookie);
    assert(cat3.statusCode === 201, '15. Create third category');

    // 16. Admin Category List returns all (both active and inactive)
    const adminCats = await request('GET', '/api/admin/categories', null, authCookie);
    assert(
      adminCats.statusCode === 200 &&
      adminCats.body.data.categories.length >= 3,
      '16. Admin category list returns all categories (active + inactive)'
    );

    // 17. Public Category List returns ONLY active categories
    const publicCats = await request('GET', '/api/categories');
    const hasInactive = publicCats.body.data.categories.some((c) => c.slug === 'gaming-and-esports');
    const hasActive = publicCats.body.data.categories.some((c) => c.slug === 'hackathons');
    assert(
      publicCats.statusCode === 200 && !hasInactive && hasActive,
      '17. Public category API returns ONLY active categories'
    );

    // 18. Public Categories are sorted by displayOrder ASC
    const displayOrders = publicCats.body.data.categories.map((c) => c.displayOrder);
    const isSorted = displayOrders.every((val, i, arr) => !i || arr[i - 1] <= val);
    assert(isSorted, '18. Public categories are sorted by displayOrder ASC');

    // 19. Edit Category
    const editRes = await request('PUT', `/api/admin/categories/${cat1.body.data.category.id}`, {
      name: 'Mega Hackathons',
      description: 'Updated description for hackathons',
      displayOrder: 3,
      isActive: true,
    }, authCookie);
    assert(
      editRes.statusCode === 200 &&
      editRes.body.data.category.name === 'Mega Hackathons' &&
      editRes.body.data.category.slug === 'mega-hackathons',
      '19. Edit category updates details and slug'
    );

    // 20. Patch Category Status (Activate Gaming)
    const patchStatus = await request('PATCH', `/api/admin/categories/${cat2.body.data.category.id}/status`, {
      isActive: true,
    }, authCookie);
    assert(
      patchStatus.statusCode === 200 && patchStatus.body.data.category.isActive === true,
      '20. Patch category status successfully activates category'
    );

    // 21. Delete Category
    const deleteRes = await request('DELETE', `/api/admin/categories/${cat2.body.data.category.id}`, null, authCookie);
    assert(deleteRes.statusCode === 200 && deleteRes.body.success === true, '21. Delete category returns 200');

    // 22. Coordinator Role Permission Guard Test:
    // Create a coordinator user with limited permissions (no categories.create)
    const coordRole = await prisma.role.findUnique({ where: { slug: 'coordinator' } });
    const coordUser = await prisma.user.upsert({
      where: { email: 'coordinator@ruverse.in' },
      update: { status: 'ACTIVE', roleId: coordRole.id },
      create: {
        name: 'Event Coordinator',
        email: 'coordinator@ruverse.in',
        password: await bcrypt.hash('CoordPass123!', 12),
        roleId: coordRole.id,
        status: 'ACTIVE',
      },
    });

    const coordLogin = await request('POST', '/api/auth/login', {
      email: 'coordinator@ruverse.in',
      password: 'CoordPass123!',
    });
    const coordCookie = coordLogin.headers['set-cookie'][0].split(';')[0];

    // Coordinator attempts to create category (requires categories.create)
    const coordCreateCat = await request('POST', '/api/admin/categories', {
      name: 'Unauthorized Category',
      description: 'Should fail',
    }, coordCookie);
    assert(
      coordCreateCat.statusCode === 403 && coordCreateCat.body.success === false,
      '22. Unauthorized category creation by Coordinator rejected with 403'
    );

    // 23. Logout
    const logoutRes = await request('POST', '/api/auth/logout', null, authCookie);
    assert(logoutRes.statusCode === 200 && logoutRes.body.success === true, '23. Logout endpoint returns 200');

    console.log(`\n=== TEST SUITE COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED ===\n`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
}

runTests();
