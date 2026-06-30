import { createCalendarService } from '../services/calendar-service.js';
import { baseViewData } from '../utils/view-data.js';

export async function registerCalendarRoutes(app) {
  const calendar = createCalendarService();

  app.get('/calendar', async (_request, reply) => {
    const month = calendar.getMonth();
    return reply.redirect(`/calendar/${month.year}/${month.month}`);
  });

  app.get('/calendar/:year/:month', async (request, reply) => {
    const month = calendar.getMonth(request.params.year, request.params.month);

    return reply.view('calendar/month.ejs', baseViewData(reply, {
      title: `Calendario ${month.monthName} ${month.year}`,
      calendar: month
    }));
  });

  app.get('/calendar/:year/:month/:day', async (request, reply) => {
    const date = `${request.params.year}-${String(request.params.month).padStart(2, '0')}-${String(request.params.day).padStart(2, '0')}`;
    const day = calendar.getDay(date);
    if (!day) return reply.callNotFound();

    return reply.view('calendar/day.ejs', baseViewData(reply, {
      title: `Entradas del ${date}`,
      day
    }));
  });
}
