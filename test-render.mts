import { renderEventFormat, DEFAULT_FORMAT_CONFIG } from './lib/render/renderEvent';

const url = await renderEventFormat(
  'tour_51e595dd-f0f0-4bd5-b8a7-a6bf2a3060c4_ig_post_1741571234567',
  'square',
  {
    bandName: 'Uncle Lucius',
    dateFormatted: 'May 15 2026',
    venueName: 'The Troubadour',
    cityState: 'Los Angeles, CA',
  },
  DEFAULT_FORMAT_CONFIG,
  'renders/test_output'
);
console.log('SUCCESS:', url);
