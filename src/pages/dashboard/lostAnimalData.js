import mimi from '@/assets/dashboard/mimi.jpg';
import marshmallow from '@/assets/dashboard/marshmallow.jpg';
import gilson from '@/assets/dashboard/gilson.jpg';

export const initialAlerts = [
  { id: 'mimi', name: 'Mimi', kind: 'lost', status: 'open', place: 'Jd. Satélite', date: '2026-10-28', photo: mimi },
  { id: 'found-dog', name: '', kind: 'found', status: 'open', place: 'Centro', date: '2026-10-20', photo: marshmallow },
  { id: 'luna', name: 'Luna', kind: 'lost', status: 'reunited', place: 'Vila Ema', date: '2026-10-02', photo: gilson },
];
