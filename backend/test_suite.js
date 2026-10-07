import http from 'http';
import app from './src/app.js';
import { prisma } from './src/config/database.js';
import bcrypt from 'bcryptjs';

const PORT = 5056;
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
  console.log('\n=== RUNNING RUVERSE COMPLETE BACKEND TEST SUITE (PHASES 1-4) ===\n');

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

    // 4. Successful Admin Login
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'admin@ruverse.in',
      password: 'AdminSecurePassword2026!',
    });
    assert(
      loginRes.statusCode === 200 &&
      loginRes.body.success === true &&
      loginRes.body.data.user.email === 'admin@ruverse.in',
      '4. Admin login returns 200 and authenticated session'
    );

    const setCookie = loginRes.headers['set-cookie'];
    const authCookie = Array.isArray(setCookie) ? setCookie[0].split(';')[0] : '';
    assert(authCookie.includes('ruverse_auth='), '5. Auth HTTP-only cookie set on login');

    // 6. Clean previous test categories, events, and registrations
    await prisma.participantFieldValue.deleteMany({});
    await prisma.registrationFieldValue.deleteMany({});
    await prisma.participant.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.registrationFormField.deleteMany({});
    await prisma.registrationForm.deleteMany({});
    await prisma.eventCoordinator.deleteMany({});
    await prisma.userPermission.deleteMany({
      where: {
        user: { email: { in: ['coord.alpha@ruverse.in', 'coord.beta@ruverse.in'] } },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['coord.alpha@ruverse.in', 'coord.beta@ruverse.in'] } },
    });
    await prisma.event.deleteMany({});
    await prisma.category.deleteMany({
      where: {
        OR: [
          { slug: { in: ['hackathons', 'mega-hackathons', 'test-category', 'ai-category', 'ai-and-hackathons'] } },
          { name: { in: ['Hackathons', 'Mega Hackathons', 'Test Category', 'AI Category', 'AI & Hackathons'] } },
        ],
      },
    });

    // 7. Create Category for Events
    const catRes = await request('POST', '/api/admin/categories', {
      name: 'AI & Hackathons',
      description: 'Artificial intelligence and coding hackathons',
      displayOrder: 1,
      isActive: true,
    }, authCookie);
    assert(catRes.statusCode === 201, '7. Category created for event testing');
    const categoryId = catRes.body.data.category.id;

    // 8. Event Creation Validation - Missing fields rejected
    const invalidEvent = await request('POST', '/api/admin/events', {
      title: '  ',
      description: '',
    }, authCookie);
    assert(invalidEvent.statusCode === 422, '8. Missing event title & fields rejected with 422');

    // 9. Event Creation Validation - Date order validation (end before start)
    const invalidDateEvent = await request('POST', '/api/admin/events', {
      title: 'Invalid Date Event',
      description: 'Testing date validator',
      categoryId,
      venue: 'Main Auditorium',
      startDateTime: '2026-10-15T10:00:00Z',
      endDateTime: '2026-10-14T10:00:00Z',
      registrationStart: '2026-10-01T00:00:00Z',
      registrationEnd: '2026-10-10T23:59:59Z',
      registrationType: 'INDIVIDUAL',
    }, authCookie);
    assert(invalidDateEvent.statusCode === 422, '9. Event end before start rejected with 422');

    // 10. Event Creation - Team size validation
    const invalidTeamEvent = await request('POST', '/api/admin/events', {
      title: 'Invalid Team Event',
      description: 'Testing team validator',
      categoryId,
      venue: 'Lab 3',
      startDateTime: '2026-10-15T10:00:00Z',
      endDateTime: '2026-10-16T18:00:00Z',
      registrationStart: '2026-10-01T00:00:00Z',
      registrationEnd: '2026-10-14T23:59:59Z',
      registrationType: 'TEAM',
      teamMinSize: 4,
      teamMaxSize: 2, // invalid: max < min
    }, authCookie);
    assert(invalidTeamEvent.statusCode === 422, '10. Team maxSize < minSize rejected with 422');

    // 11. Create Event 1 (AI Galactic Hackathon - TEAM, published, featured)
    const event1Res = await request('POST', '/api/admin/events', {
      title: 'AI Galactic Hackathon 2026',
      shortDescription: '36-hour planetary AI challenge',
      description: 'Build autonomous agents and planetary software solutions.',
      categoryId,
      venue: 'Starship Hangar Alpha',
      startDateTime: '2026-11-10T09:00:00Z',
      endDateTime: '2026-11-11T21:00:00Z',
      registrationStart: '2026-10-01T00:00:00Z',
      registrationEnd: '2026-11-08T23:59:59Z',
      registrationType: 'TEAM',
      teamMinSize: 2,
      teamMaxSize: 4,
      registrationLimit: 100,
      displayOrder: 1,
      isFeatured: true,
      isOpenForAll: true,
      isActive: true,
      isPublished: true,
    }, authCookie);
    assert(
      event1Res.statusCode === 201 &&
      event1Res.body.data.event.slug === 'ai-galactic-hackathon-2026' &&
      event1Res.body.data.event.teamMinSize === 2,
      '11. Create Team Event with automatic slug and team bounds'
    );
    const event1Id = event1Res.body.data.event.id;

    // 12. Create Duplicate Title Event -> Generates unique slug (-2)
    const dupTitleRes = await request('POST', '/api/admin/events', {
      title: 'AI Galactic Hackathon 2026',
      description: 'Duplicate title test',
      categoryId,
      venue: 'Hall B',
      startDateTime: '2026-11-12T09:00:00Z',
      endDateTime: '2026-11-12T18:00:00Z',
      registrationStart: '2026-10-01T00:00:00Z',
      registrationEnd: '2026-11-10T23:59:59Z',
      registrationType: 'INDIVIDUAL',
      isPublished: false, // DRAFT
    }, authCookie);
    assert(
      dupTitleRes.statusCode === 201 &&
      dupTitleRes.body.data.event.slug === 'ai-galactic-hackathon-2026-2',
      '12. Duplicate event title automatically receives unique deterministic slug'
    );
    const event2Id = dupTitleRes.body.data.event.id;

    // 13. Admin Events List
    const adminEventsRes = await request('GET', '/api/admin/events', null, authCookie);
    assert(
      adminEventsRes.statusCode === 200 &&
      adminEventsRes.body.data.events.length >= 2,
      '13. Admin event list returns all events'
    );

    // 14. Admin Event Detail
    const eventDetailRes = await request('GET', `/api/admin/events/${event1Id}`, null, authCookie);
    assert(
      eventDetailRes.statusCode === 200 &&
      eventDetailRes.body.data.event.title === 'AI Galactic Hackathon 2026',
      '14. Admin event detail fetched successfully'
    );

    // 15. Update Event
    const updateEventRes = await request('PUT', `/api/admin/events/${event1Id}`, {
      title: 'AI Galactic Hackathon 2026 - Prime',
      description: 'Updated description for hackathon',
      categoryId,
      venue: 'Starship Hangar Prime',
      startDateTime: '2026-11-10T09:00:00Z',
      endDateTime: '2026-11-11T21:00:00Z',
      registrationStart: '2026-10-01T00:00:00Z',
      registrationEnd: '2026-11-08T23:59:59Z',
      registrationType: 'TEAM',
      teamMinSize: 3,
      teamMaxSize: 5,
    }, authCookie);
    assert(
      updateEventRes.statusCode === 200 &&
      updateEventRes.body.data.event.teamMinSize === 3,
      '15. Update event modifies team bounds and details'
    );

    // 16. Patch Event Toggles (Publish, Status, Featured, Open for all)
    const patchFeat = await request('PATCH', `/api/admin/events/${event1Id}/featured`, { isFeatured: false }, authCookie);
    assert(patchFeat.statusCode === 200 && patchFeat.body.data.event.isFeatured === false, '16. Patch event featured status');

    const patchPub = await request('PATCH', `/api/admin/events/${event2Id}/publish`, { isPublished: true }, authCookie);
    assert(patchPub.statusCode === 200 && patchPub.body.data.event.isPublished === true, '17. Patch event publish status');

    // 18. Public Events API filters correctly (only active & published, not archived)
    const publicEventsRes = await request('GET', '/api/events');
    assert(
      publicEventsRes.statusCode === 200 &&
      publicEventsRes.body.data.events.length >= 2 &&
      publicEventsRes.body.data.events[0].registrationStatus !== undefined,
      '18. Public events API returns published events with calculated registrationStatus'
    );

    // 19. Public Event by Slug
    const publicSlugRes = await request('GET', '/api/events/ai-galactic-hackathon-2026');
    assert(
      publicSlugRes.statusCode === 200 &&
      publicSlugRes.body.data.event.slug === 'ai-galactic-hackathon-2026',
      '19. Public event detail by slug retrieved'
    );

    // 20. Category Deletion Safety Constraint
    const deleteCatAttempt = await request('DELETE', `/api/admin/categories/${categoryId}`, null, authCookie);
    assert(
      deleteCatAttempt.statusCode === 400 &&
      deleteCatAttempt.body.message.includes('events are assigned to it'),
      '20. Destructive category deletion blocked when events are assigned'
    );

    // ==========================================
    // PHASE 4: DYNAMIC REGISTRATION FORM BUILDER
    // ==========================================

    // 21. Get or initialize form for event (auto-creates 4 baseline participant fields)
    const formInitRes = await request('GET', `/api/admin/events/${event1Id}/form`, null, authCookie);
    assert(
      formInitRes.statusCode === 200 &&
      formInitRes.body.data.form.fields.length === 4 &&
      formInitRes.body.data.form.fields[0].fieldKey === 'participant_full_name' &&
      formInitRes.body.data.form.fields[0].isFixed === true,
      '21. Dynamic form builder auto-initializes with 4 baseline participant fields'
    );

    // 22. Form access is idempotent (re-fetching does not create duplicate fields)
    const formReFetch = await request('GET', `/api/admin/events/${event1Id}/form`, null, authCookie);
    assert(formReFetch.body.data.form.fields.length === 4, '22. Form initialization is idempotent on refresh');

    // 23. Add Custom Field: SELECT type with options (Year of Study)
    const customSelectField = await request('POST', `/api/admin/events/${event1Id}/form/fields`, {
      label: 'Year of Study',
      fieldType: 'SELECT',
      fieldScope: 'PARTICIPANT',
      isRequired: true,
      optionsJson: ['1st Year', '2nd Year', '3rd Year', '4th Year / Postgrad'],
    }, authCookie);
    assert(
      customSelectField.statusCode === 201 &&
      customSelectField.body.data.field.fieldKey === 'year_of_study' &&
      Array.isArray(customSelectField.body.data.field.optionsJson),
      '23. Add custom SELECT field with options array'
    );
    const selectFieldId = customSelectField.body.data.field.id;

    // 24. Add Custom Field: REGISTRATION scope (Referral Source)
    const customRegField = await request('POST', `/api/admin/events/${event1Id}/form/fields`, {
      label: 'How did you hear about RUVERSE?',
      fieldType: 'RADIO',
      fieldScope: 'REGISTRATION',
      isRequired: false,
      optionsJson: ['Instagram', 'College Poster', 'Friend / Peer', 'Website'],
    }, authCookie);
    assert(
      customRegField.statusCode === 201 &&
      customRegField.body.data.field.fieldScope === 'REGISTRATION',
      '24. Add custom REGISTRATION-scoped field'
    );

    // 25. Attempt to delete fixed baseline participant field -> Rejected with 400
    const fixedFieldId = formInitRes.body.data.form.fields[0].id;
    const deleteFixedAttempt = await request('DELETE', `/api/admin/events/${event1Id}/form/fields/${fixedFieldId}`, null, authCookie);
    assert(
      deleteFixedAttempt.statusCode === 400 &&
      deleteFixedAttempt.body.message.includes('Baseline participant fields'),
      '25. Baseline participant field deletion protected and rejected with 400'
    );

    // 26. Delete Custom Field
    const deleteCustomRes = await request('DELETE', `/api/admin/events/${event1Id}/form/fields/${selectFieldId}`, null, authCookie);
    assert(deleteCustomRes.statusCode === 200, '26. Custom form field deleted successfully');

    // 27. Reorder Form Fields
    const remainingFields = await request('GET', `/api/admin/events/${event1Id}/form`, null, authCookie);
    const fieldList = remainingFields.body.data.form.fields;
    const reorderPayload = fieldList.map((f, idx) => ({ id: f.id, displayOrder: (idx + 1) * 10 }));
    const reorderRes = await request('PATCH', `/api/admin/events/${event1Id}/form/fields/reorder`, {
      fieldOrders: reorderPayload,
    }, authCookie);
    assert(reorderRes.statusCode === 200, '27. Form fields reordered successfully');

    // 28. Publish Registration Form
    const publishFormRes = await request('PATCH', `/api/admin/events/${event1Id}/form/publish`, null, authCookie);
    assert(
      publishFormRes.statusCode === 200 &&
      publishFormRes.body.data.form.status === 'PUBLISHED' &&
      publishFormRes.body.data.form.version >= 1,
      '28. Registration form published with version foundation'
    );

    // 29. Safe Event Archive (instead of destructive delete)
    const archiveRes = await request('DELETE', `/api/admin/events/${event2Id}`, null, authCookie);
    assert(
      archiveRes.statusCode === 200 &&
      archiveRes.body.data.event.archivedAt !== null,
      '29. Event DELETE route safely archives event'
    );

    // ==========================================
    // PHASE 5: PUBLIC REGISTRATION SYSTEM TESTS
    // ==========================================

    // 30. Create an Individual Published Event for testing individual registration
    const indEventRes = await request('POST', '/api/admin/events', {
      title: 'Individual Code Sprint 2026',
      shortDescription: 'Solo coding challenge',
      description: 'Test your algorithmic prowess.',
      categoryId,
      venue: 'Main Lab 4',
      startDateTime: '2026-11-15T09:00:00Z',
      endDateTime: '2026-11-15T18:00:00Z',
      registrationStart: '2026-10-01T00:00:00Z',
      registrationEnd: '2026-11-14T23:59:59Z',
      registrationType: 'INDIVIDUAL',
      registrationLimit: 100,
      isPublished: true,
      isActive: true,
    }, authCookie);
    const indEventId = indEventRes.body.data.event.id;
    const indEventSlug = indEventRes.body.data.event.slug;

    // Add a custom registration field and publish form
    await request('POST', `/api/admin/events/${indEventId}/form/fields`, {
      label: 'How did you hear about RUVERSE?',
      fieldType: 'RADIO',
      fieldScope: 'REGISTRATION',
      isRequired: false,
      optionsJson: ['Instagram', 'College Poster', 'Friend / Peer', 'Website'],
    }, authCookie);
    await request('PATCH', `/api/admin/events/${indEventId}/form/publish`, null, authCookie);

    // 30b. Fetch Public Registration Info & Form for Individual Event
    const pubRegFormRes = await request('GET', `/api/events/${indEventSlug}/registration`);
    assert(
      pubRegFormRes.statusCode === 200 &&
      pubRegFormRes.body.success === true &&
      pubRegFormRes.body.data.availability.isOpen === true &&
      pubRegFormRes.body.data.form.fields.length >= 4,
      '30. Public registration info & dynamic form retrieved for published event'
    );

    // 31. Submit Individual Registration (Successful)
    const indRegRes = await request('POST', `/api/events/${indEventSlug}/registrations`, {
      registrationType: 'INDIVIDUAL',
      participants: [
        {
          fixed: {
            fullName: 'Aarav Sharma',
            email: 'aarav.sharma@example.com',
            mobile: '9876543210',
            college: 'Rajarajeswari College of Engineering',
          },
          custom: {},
        },
      ],
      registrationFields: {
        how_did_you_hear_about_ruverse: 'Instagram',
      },
      formVersion: pubRegFormRes.body.data.form.version,
    });
    assert(
      indRegRes.statusCode === 201 &&
      indRegRes.body.success === true &&
      indRegRes.body.data.registrationNumber.startsWith('RU26-') &&
      indRegRes.body.data.participantCount === 1,
      '31. Submit valid Individual registration returns 201 with generated registrationNumber'
    );
    const indRegNumber = indRegRes.body.data.registrationNumber;

    // 32. Duplicate Registration Prevention: Same email for same event
    const dupEmailRes = await request('POST', `/api/events/${indEventSlug}/registrations`, {
      registrationType: 'INDIVIDUAL',
      participants: [
        {
          fixed: {
            fullName: 'Aarav Sharma Duplicate',
            email: 'aarav.sharma@example.com',
            mobile: '9876543211',
            college: 'RV College of Engineering',
          },
          custom: {},
        },
      ],
      registrationFields: {},
    });
    assert(
      dupEmailRes.statusCode === 409 &&
      dupEmailRes.body.success === false &&
      dupEmailRes.body.message.includes('already registered'),
      '32. Duplicate email submission for the same event rejected with 409'
    );

    // 33. Create a Team Event (Robotics Combat) to test Team Registrations
    const teamEventRes = await request('POST', '/api/admin/events', {
      title: 'Robotics Combat War 2026',
      shortDescription: 'Heavyweight bot battles in steel arena',
      description: 'Full contact robot combat tournament.',
      categoryId,
      venue: 'RU Tech Arena Quad',
      startDateTime: '2026-10-22T09:00:00.000Z',
      endDateTime: '2026-10-22T18:00:00.000Z',
      registrationStart: '2026-09-01T00:00:00.000Z',
      registrationEnd: '2026-10-21T23:59:59.000Z',
      registrationType: 'TEAM',
      teamMinSize: 2,
      teamMaxSize: 4,
      registrationLimit: 50,
      isPublished: true,
      isActive: true,
    }, authCookie);
    const teamEventId = teamEventRes.body.data.event.id;
    const teamEventSlug = teamEventRes.body.data.event.slug;

    // Initialize & publish form for team event with custom participant field
    await request('POST', `/api/admin/events/${teamEventId}/form/fields`, {
      label: 'Discord Handle',
      fieldType: 'TEXT',
      fieldScope: 'PARTICIPANT',
      isRequired: false,
    }, authCookie);
    await request('PATCH', `/api/admin/events/${teamEventId}/form/publish`, null, authCookie);

    // 34. Team registration with too few members -> 422
    const minTeamFail = await request('POST', `/api/events/${teamEventSlug}/registrations`, {
      registrationType: 'TEAM',
      teamName: 'CyberTitans',
      participants: [
        {
          fixed: {
            fullName: 'Leader One',
            email: 'leader1@example.com',
            mobile: '9123456780',
            college: 'RU College',
          },
          custom: {},
        },
      ],
    });
    assert(
      minTeamFail.statusCode === 422 &&
      minTeamFail.body.message.includes('at least 2 participants'),
      '34. Team registration below teamMinSize rejected with 422'
    );

    // 35. Submit Valid Team Registration (Successful)
    const validTeamRes = await request('POST', `/api/events/${teamEventSlug}/registrations`, {
      registrationType: 'TEAM',
      teamName: 'CyberTitans',
      participants: [
        {
          fixed: {
            fullName: 'Leader One',
            email: 'leader1@example.com',
            mobile: '9123456780',
            college: 'RU College',
          },
          custom: { discord_handle: 'leader#1234' },
        },
        {
          fixed: {
            fullName: 'Member Two',
            email: 'member2@example.com',
            mobile: '9123456781',
            college: 'RU College',
          },
          custom: { discord_handle: 'member2#5678' },
        },
      ],
    });
    assert(
      validTeamRes.statusCode === 201 &&
      validTeamRes.body.success === true &&
      validTeamRes.body.data.teamName === 'CyberTitans' &&
      validTeamRes.body.data.participantCount === 2,
      '35. Submit valid Team registration returns 201 with 2 participants'
    );

    // 36. Duplicate Team Name for same event -> 409
    const dupTeamRes = await request('POST', `/api/events/${teamEventSlug}/registrations`, {
      registrationType: 'TEAM',
      teamName: 'CyberTitans',
      participants: [
        {
          fixed: {
            fullName: 'Other Leader',
            email: 'otherleader@example.com',
            mobile: '9123456782',
            college: 'Other College',
          },
          custom: {},
        },
        {
          fixed: {
            fullName: 'Other Member',
            email: 'othermember@example.com',
            mobile: '9123456783',
            college: 'Other College',
          },
          custom: {},
        },
      ],
    });
    assert(
      dupTeamRes.statusCode === 409 &&
      (dupTeamRes.body.errors?.code === 'TEAM_NAME_EXISTS' || dupTeamRes.body.message.includes('already registered')),
      '36. Duplicate team name for same event rejected with 409 TEAM_NAME_EXISTS'
    );

    // ==========================================
    // PHASE 6: REGISTRATION MANAGEMENT TESTS
    // ==========================================

    // 37. Admin Registrations List
    const adminRegsList = await request('GET', '/api/admin/registrations', null, authCookie);
    assert(
      adminRegsList.statusCode === 200 &&
      adminRegsList.body.data.items.length >= 2 &&
      adminRegsList.body.data.summary.total >= 2,
      '37. Admin registrations list returns paginated records and accurate summary counts'
    );

    // 38. Admin Registration Search by participant name or team name
    const searchRes = await request('GET', '/api/admin/registrations?search=CyberTitans', null, authCookie);
    assert(
      searchRes.statusCode === 200 &&
      searchRes.body.data.items.some((r) => r.teamName === 'CyberTitans'),
      '38. Admin registration search by team name returns matching registration'
    );

    // 39. Admin Registration Detail with snapshots
    const firstRegId = adminRegsList.body.data.items[0].id;
    const detailRes = await request('GET', `/api/admin/registrations/${firstRegId}`, null, authCookie);
    assert(
      detailRes.statusCode === 200 &&
      detailRes.body.data.participants.length >= 1 &&
      detailRes.body.data.event.title !== undefined,
      '39. Admin registration detail returns participants and historical event metadata'
    );

    // 40. Admin Registration Status Transition (Update status to CANCELLED)
    const updateStatusRes = await request('PATCH', `/api/admin/registrations/${firstRegId}/status`, {
      status: 'CANCELLED',
    }, authCookie);
    assert(
      updateStatusRes.statusCode === 200 &&
      updateStatusRes.body.data.status === 'CANCELLED',
      '40. Admin can update registration status with recorded cancellation'
    );

    // 41. Admin Event Registration Summary (Aggregations)
    const summaryRes = await request('GET', `/api/admin/events/${teamEventId}/registration-summary`, null, authCookie);
    assert(
      summaryRes.statusCode === 200 &&
      summaryRes.body.data.counts.total >= 1 &&
      summaryRes.body.data.counts.capacity === 50,
      '41. Admin event registration summary returns accurate capacity & status breakdown'
    );

    // 42. Admin Deletes Registration Record
    const deleteRegRes = await request('DELETE', `/api/admin/registrations/${firstRegId}`, null, authCookie);
    assert(
      deleteRegRes.statusCode === 200 &&
      deleteRegRes.body.success === true,
      '42. Admin successfully deletes registration via DELETE /api/admin/registrations/:id'
    );

    // 42b. Verify Registration is gone (404)
    const deletedDetailRes = await request('GET', `/api/admin/registrations/${firstRegId}`, null, authCookie);
    assert(
      deletedDetailRes.statusCode === 404,
      '42b. Deleted registration returns 404 on subsequent lookup'
    );

    // =======================================================
    // PHASE 8 & 9: COORDINATOR MANAGEMENT & EVENT-SCOPED RBAC
    // =======================================================

    // 43. Admin creates Coordinator A (for Event 1)
    const coordARes = await request('POST', '/api/admin/coordinators', {
      name: 'Coordinator Alpha',
      email: 'coord.alpha@ruverse.in',
      password: 'CoordPassword123!',
      isActive: true,
    }, authCookie);
    assert(
      coordARes.statusCode === 201 &&
      coordARes.body.data.email === 'coord.alpha@ruverse.in',
      '43. Admin creates Coordinator A successfully'
    );
    const coordAId = coordARes.body.data.id;

    // 44. Admin creates Coordinator B (for Event 3)
    const coordBRes = await request('POST', '/api/admin/coordinators', {
      name: 'Coordinator Beta',
      email: 'coord.beta@ruverse.in',
      password: 'CoordPassword123!',
      isActive: true,
    }, authCookie);
    assert(
      coordBRes.statusCode === 201 &&
      coordBRes.body.data.email === 'coord.beta@ruverse.in',
      '44. Admin creates Coordinator B successfully'
    );
    const coordBId = coordBRes.body.data.id;

    // 45. Assign Permissions to Coordinator A (events.view, registrations.view, registrations.export)
    const permARes = await request('PATCH', `/api/admin/coordinators/${coordAId}/permissions`, {
      permissions: ['dashboard.view', 'events.view', 'registrations.view', 'registrations.export'],
    }, authCookie);
    assert(
      permARes.statusCode === 200 &&
      permARes.body.data.assignedPermissions.some((p) => p.slug === 'registrations.export'),
      '45. Assign specific permissions to Coordinator A'
    );

    // 46. Assign Event 1 to Coordinator A
    const evtAssignARes = await request('PATCH', `/api/admin/coordinators/${coordAId}/events`, {
      eventIds: [event1Id],
    }, authCookie);
    assert(
      evtAssignARes.statusCode === 200 &&
      evtAssignARes.body.data.assignedEvents.some((e) => e.id === event1Id),
      '46. Assign Event 1 to Coordinator A'
    );

    // 47. Assign Permissions to Coordinator B (events.view, registrations.view, registrations.edit - NO EXPORT)
    const permBRes = await request('PATCH', `/api/admin/coordinators/${coordBId}/permissions`, {
      permissions: ['dashboard.view', 'events.view', 'registrations.view', 'registrations.edit'],
    }, authCookie);
    assert(
      permBRes.statusCode === 200 &&
      !permBRes.body.data.assignedPermissions.some((p) => p.slug === 'registrations.export'),
      '47. Assign specific permissions to Coordinator B (without export)'
    );

    // 48. Assign Team Event (teamEventId) to Coordinator B
    const evtAssignBRes = await request('PATCH', `/api/admin/coordinators/${coordBId}/events`, {
      eventIds: [teamEventId],
    }, authCookie);
    assert(
      evtAssignBRes.statusCode === 200 &&
      evtAssignBRes.body.data.assignedEvents.some((e) => e.id === teamEventId),
      '48. Assign Team Event to Coordinator B'
    );

    // 49. Coordinator A Login
    const loginARes = await request('POST', '/api/auth/login', {
      email: 'coord.alpha@ruverse.in',
      password: 'CoordPassword123!',
    });
    assert(
      loginARes.statusCode === 200 &&
      loginARes.body.data.user.role.slug === 'coordinator',
      '49. Coordinator A logs in successfully with COORDINATOR role'
    );
    const cookieA = loginARes.headers['set-cookie'][0].split(';')[0];

    // 50. Coordinator B Login
    const loginBRes = await request('POST', '/api/auth/login', {
      email: 'coord.beta@ruverse.in',
      password: 'CoordPassword123!',
    });
    assert(
      loginBRes.statusCode === 200 &&
      loginBRes.body.data.user.role.slug === 'coordinator',
      '50. Coordinator B logs in successfully with COORDINATOR role'
    );
    const cookieB = loginBRes.headers['set-cookie'][0].split(';')[0];

    // 51. Self-Escalation Protection: Coordinator cannot access /api/admin/coordinators -> 403
    const coordAccessAttempt = await request('GET', '/api/admin/coordinators', null, cookieA);
    assert(
      coordAccessAttempt.statusCode === 403,
      '51. Coordinator cannot access coordinator management API (Self-Escalation Protection 403)'
    );

    // 52. Cross-Event Isolation: Coordinator A accessing Event 3 registrations directly -> 403
    const crossEventDirect = await request('GET', `/api/admin/events/${teamEventId}/registrations`, null, cookieA);
    assert(
      crossEventDirect.statusCode === 403,
      '52. Coordinator A accessing unassigned Event 3 registrations directly is blocked with 403'
    );

    // 53. Global Registration Scoping: Coordinator A queries all registrations -> Only returns Event 1 data
    const scopedRegsA = await request('GET', '/api/admin/registrations', null, cookieA);
    const allBelongToA = scopedRegsA.body.data.items.every((r) => r.eventId === event1Id);
    assert(
      scopedRegsA.statusCode === 200 && allBelongToA,
      '53. Global registration query strictly scopes to assigned events only for Coordinator A'
    );

    // 54. Coordinator B Scoped Query -> Only returns Event 3 data
    const scopedRegsB = await request('GET', '/api/admin/registrations', null, cookieB);
    const allBelongToB = scopedRegsB.body.data.items.every((r) => r.eventId === teamEventId);
    assert(
      scopedRegsB.statusCode === 200 && allBelongToB,
      '54. Global registration query strictly scopes to assigned events only for Coordinator B'
    );

    // 55. Permission Enforcement: Coordinator A attempts status update without registrations.edit -> 403
    const unauthStatusUpdate = await request('PATCH', `/api/admin/registrations/${firstRegId}/status`, {
      status: 'CONFIRMED',
    }, cookieA);
    assert(
      unauthStatusUpdate.statusCode === 403,
      '55. Coordinator without registrations.edit permission cannot update registration status (403)'
    );

    // 56. Permission Enforcement: Coordinator B (without registrations.export) attempts export -> 403
    const unauthExport = await request('GET', `/api/admin/registrations/export?eventId=${teamEventId}`, null, cookieB);
    assert(
      unauthExport.statusCode === 403,
      '56. Coordinator without registrations.export permission cannot export registrations (403)'
    );

    // 57. Authorized Export: Coordinator A (with registrations.export) exports Event 1 -> 200
    const authExport = await request('GET', `/api/admin/registrations/export?eventId=${event1Id}`, null, cookieA);
    assert(
      authExport.statusCode === 200,
      '57. Coordinator A with registrations.export permission exports assigned event data (200)'
    );

    // 58. Cross-Event Export Block: Coordinator A attempts to export unassigned Event 3 -> 403
    const crossExport = await request('GET', `/api/admin/registrations/export?eventId=${teamEventId}`, null, cookieA);
    assert(
      crossExport.statusCode === 403,
      '58. Coordinator A cannot export unassigned Event 3 even with export permission (403)'
    );

    // 59. Password Reset by Admin
    const resetPassRes = await request('PATCH', `/api/admin/coordinators/${coordAId}/password`, {
      newPassword: 'NewCoordPassword2026!',
    }, authCookie);
    assert(
      resetPassRes.statusCode === 200,
      '59. Admin successfully resets coordinator password'
    );

    // 60. Coordinator A logs in with new password
    const newPassLogin = await request('POST', '/api/auth/login', {
      email: 'coord.alpha@ruverse.in',
      password: 'NewCoordPassword2026!',
    });
    assert(
      newPassLogin.statusCode === 200,
      '60. Coordinator A logs in successfully with new password'
    );

    // 61. Deactivate Coordinator & Verify Inactive Login Rejection
    await request('PATCH', `/api/admin/coordinators/${coordAId}/status`, {
      isActive: false,
    }, authCookie);
    const inactiveLogin = await request('POST', '/api/auth/login', {
      email: 'coord.alpha@ruverse.in',
      password: 'NewCoordPassword2026!',
    });
    assert(
      inactiveLogin.statusCode === 401 &&
      inactiveLogin.body.message.includes('deactivated'),
      '61. Deactivated coordinator login is blocked with 401'
    );

    // ==========================================
    // PHASE 9: AUDIT LOGS & SECURITY VERIFICATION
    // ==========================================

    // 62. Admin queries Audit Logs (Protected by audit.view)
    const auditRes = await request('GET', '/api/admin/audit-logs', null, authCookie);
    assert(
      auditRes.statusCode === 200 &&
      auditRes.body.data.items.length > 0 &&
      auditRes.body.data.pagination.total > 0,
      '62. Admin queries immutable audit logs with pagination'
    );

    // 63. Audit Log contains recorded actions
    const actionsFound = auditRes.body.data.items.map((l) => l.action);
    assert(
      actionsFound.includes('LOGIN_SUCCESS') &&
      actionsFound.includes('COORDINATOR_CREATED'),
      '63. Audit log tracks LOGIN_SUCCESS and COORDINATOR_CREATED actions'
    );

    // 64. Coordinator B attempts to query audit logs without permission -> 403
    const coordAuditAttempt = await request('GET', '/api/admin/audit-logs', null, cookieB);
    assert(
      coordAuditAttempt.statusCode === 403,
      '64. Coordinator without audit.view permission cannot access audit logs (403)'
    );

    // 65. Admin Deletes Coordinator B
    const deleteCoordRes = await request('DELETE', `/api/admin/coordinators/${coordBId}`, null, authCookie);
    assert(
      deleteCoordRes.statusCode === 200 &&
      deleteCoordRes.body.success === true,
      '65. Admin successfully deletes coordinator via DELETE /api/admin/coordinators/:id'
    );

    // 65b. Verify Coordinator B is deleted (404)
    const deletedCoordLookup = await request('GET', `/api/admin/coordinators/${coordBId}`, null, authCookie);
    assert(
      deletedCoordLookup.statusCode === 404,
      '65b. Deleted coordinator returns 404 on lookup'
    );

    console.log(`\n=== COMPLETE TEST SUITE (PHASES 1-9): ${passedCount} PASSED, ${failedCount} FAILED ===\n`);
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

