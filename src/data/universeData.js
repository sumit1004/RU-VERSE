export const ASSETS = {
  ship: '/models/planets/ship.glb',
  ruVerse: '/models/planets/light_fighter.glb',
  about: '/models/planets/ship.glb',
  events: '/models/planets/sentinel.glb',
  contact: '/models/planets/light_fighter.glb',
};

export const universeSections = [
  {
    id: 'ru-verse',
    sector: '01',
    title: 'RU VERSE',
    tagline: 'Where Technology Meets Imagination',
    entry: 'top-left',
    color: '#5eb9ff',
    model: ASSETS.ruVerse,
    description: 'A place to build, compete, experiment, explore and create for Central India\'s premier technical festival.',
    cta: 'EXPLORE RU VERSE',
    targetAnchor: '#section-about',
    coordinates: '19.12° N / 81.36° E'
  },
  {
    id: 'about',
    sector: '02',
    title: 'ABOUT RUVERSE',
    tagline: 'ORIGIN TRANSMISSION // A LONG TIME AGO...',
    entry: 'top-right',
    color: '#b29cff',
    model: ASSETS.about,
    description: ' RUVERSE is the annual technical festival of Rungta International Skills University, bringing together four days of technology, innovation, competitions, workshops, showcases and experiences.',
    coordinates: '26.44° N / 73.22° E'
  },
  {
    id: 'events',
    sector: '03',
    title: 'EVENTS',
    tagline: 'CHOOSE YOUR PATH // ARENA MANIFEST',
    entry: 'bottom-right',
    color: '#f2a65a',
    model: ASSETS.events,
    description: 'From code and hardware to gaming, innovation and everything in between, RUVERSE has something for every kind of tech enthusiast. Explore the arenas below.',
    cta: 'EXPLORE EVENTS',
    targetAnchor: '#section-contact',
    coordinates: '06.73° S / 114.19° W'
  },
  {
    id: 'contact',
    sector: '04',
    title: 'CONTACT',
    tagline: 'TRANSMISSION FREQUENCY 2026',
    entry: 'bottom-left',
    color: '#e6ca8b',
    model: ASSETS.contact,
    description: 'Rungta International Skills University, Bhilai, Chhattisgarh. Connect with the organizing committee.',
    cta: 'CONNECT WITH US',
    targetAnchor: '#section-contact',
    coordinates: '21.19° N / 89.51° E',
    email: 'HELLO@RUVERSE.IN',
    phone: '+91 788 666666'
  }
];
