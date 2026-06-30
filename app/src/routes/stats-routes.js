import { createStatsService } from '../services/stats-service.js';
import { baseViewData } from '../utils/view-data.js';

export async function registerStatsRoutes(app) {
  const statsService = createStatsService();

  app.get('/stats', async (_request, reply) => {
    return reply.view('stats/index.ejs', baseViewData(reply, {
      title: 'Estadísticas',
      stats: statsService.getStats()
    }));
  });
}
