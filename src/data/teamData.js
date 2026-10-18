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
    name: 'Organiser Name',
    role: 'Festival Convenor',
    image: '/images/organisers/organiser-01.jpg',
  },
  {
    id: 'organiser-02',
    name: 'Organiser Name',
    role: 'Co-Convenor',
    image: '/images/organisers/organiser-02.jpg',
  },
  {
    id: 'organiser-03',
    name: 'Organiser Name',
    role: 'Technical Lead',
    image: '/images/organisers/organiser-03.jpg',
  },
  {
    id: 'organiser-04',
    name: 'Organiser Name',
    role: 'Creative Director',
    image: '/images/organisers/organiser-04.jpg',
  },
  {
    id: 'organiser-05',
    name: 'Organiser Name',
    role: 'Events Coordinator',
    image: '/images/organisers/organiser-05.jpg',
  },
  {
    id: 'organiser-06',
    name: 'Organiser Name',
    role: 'Operations Head',
    image: '/images/organisers/organiser-06.jpg',
  },
  {
    id: 'organiser-07',
    name: 'Organiser Name',
    role: 'Sponsorship Lead',
    image: '/images/organisers/organiser-07.jpg',
  },
  {
    id: 'organiser-08',
    name: 'Organiser Name',
    role: 'Public Relations Head',
    image: '/images/organisers/organiser-08.jpg',
  },
  {
    id: 'organiser-09',
    name: 'Organiser Name',
    role: 'Design & Media Lead',
    image: '/images/organisers/organiser-09.jpg',
  },
  {
    id: 'organiser-10',
    name: 'Organiser Name',
    role: 'Web Systems Lead',
    image: '/images/organisers/organiser-10.jpg',
  },
  {
    id: 'organiser-11',
    name: 'Organiser Name',
    role: 'Hospitality Coordinator',
    image: '/images/organisers/organiser-11.jpg',
  },
  {
    id: 'organiser-12',
    name: 'Organiser Name',
    role: 'Logistics Head',
    image: '/images/organisers/organiser-12.jpg',
  },
  {
    id: 'organiser-13',
    name: 'Organiser Name',
    role: 'Security & Protocol Lead',
    image: '/images/organisers/organiser-13.jpg',
  },
  {
    id: 'organiser-14',
    name: 'Organiser Name',
    role: 'Gaming Arena Head',
    image: '/images/organisers/organiser-14.jpg',
  },
  {
    id: 'organiser-15',
    name: 'Organiser Name',
    role: 'Robotics Arena Lead',
    image: '/images/organisers/organiser-15.jpg',
  },
];
