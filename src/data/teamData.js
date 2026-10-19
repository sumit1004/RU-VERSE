/**
 * RUVERSE 2026 — Organising Team Manifest
 * 
 * Central data source for all members of the organising team.
 * 
 * To add or update an organiser:
 * 1. Place their photo in `/public/images/organisers/` (e.g. `sumit-kumar.jpg` or `organiser-01.jpg`).
 * 2. Update/add the entry in the `ORGANISERS` array below with:
 *    - id: Unique string or number identifier
 *    - name: Organiser's full name
 *    - role: Official role or designation in RU VERSE 2026
 *    - image: Relative path to the photo (e.g. '/images/organisers/organiser-01.jpg')
 * 
 * If an image is not yet available or fails to load, a clean sci-fi avatar fallback is displayed.
 */

export const TEAM_SECTION_TITLE = 'MEET THE ORGANISING TEAM';
export const TEAM_SECTION_SUBTITLE = 'The people behind the vision, creativity, and execution of RU VERSE 2026.';

export const ORGANISERS = [
  {
    id: 'organiser-01',
    name: 'Prithish kumar',
    role: 'Media and Design Lead',
    image: '/images/pri30.jpeg',
  },
  {
    id: 'organiser-02',
    name: 'Adarsh Kumar Ray',
    role: 'Media and Design Lead',
    image: '/images/adarsh.jpeg',
  },

  {
    id: 'organiser-03',
    name: 'Shhradha Tiwari',
    role: 'Lead',
    image: '/images/shraddha.jpeg',
  },
  {
    id: 'organiser-04',
    name: 'Sumit Kumar',
    role: 'Technical Lead',
    image: '/images/sumit.jpeg',
  },
  {
    id: 'organiser-05',
    name: 'Arman misha',
    role: 'Outreach Lead',
    image: '/images/arman.jpeg',
  },
  {
    id: 'organiser-06',
    name: 'Krishna Kumar',
    role: 'Media Lead',
    image: '/images/krishna.jpeg',
  },

  {
    id: 'organiser-07',
    name: 'Arsh chakroborty',
    role: 'sponsor lead',
    image: '/images/arsh.jpeg',
  },

  {
    id: 'organiser-08',
    name: 'Nitika dewangan',
    role: 'PR Lead',
    image: '/images/Nitika.jpeg',
  },
  {
    id: 'organiser-09',
    name: 'Bipasha roy',
    role: 'Design Team',
    image: '/images/Bipasha.jpeg',
  },
  {
    id: 'organiser-10',
    name: 'Piyush',
    role: ' Outreach Lead',
    image: '/images/piyush.jpeg',
  },
  {
    id: 'organiser-11',
    name: 'Ansh',
    role: 'Event management',
    image: '/images/ansh.jpeg',
  },
  {
    id: 'organiser-12',
    name: 'Chhavi patel ',
    role: 'Sponsor lead',
    image: '/images/chaavi.jpeg',
  },
  {
    id: 'organiser-13',
    name: 'Pranjal dewangan',
    role: 'Media Team',
    image: '/images/pranjal.jpeg',
  },
  {
    id: 'organiser-14',
    name: 'Megha pandey',
    role: 'Event Management',
    image: '/images/megha.jpeg',
  },
  {
    id: 'organiser-15',
    name: 'Utsav kumar',
    role: 'Sponsor team',
    image: '/images/utsav.jpeg',
  },
  {
    id: 'organiser-16',
    name: 'Avishek kumar',
    role: 'media team ',
    image: '/images/avishek.jpeg',
  },
  {
    id: 'organiser-17',
    name: 'Akshat sahu',
    role: ' Outreach Team ',
    image: '/images/akshat.png',
  },

];
