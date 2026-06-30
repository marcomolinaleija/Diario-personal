import { createMilestonesService } from '../services/milestones-service.js';
import { buildPagination, getPaginationParams, pageUrl } from '../utils/pagination.js';
import { baseViewData } from '../utils/view-data.js';

export async function registerMilestonesRoutes(app) {
  const milestones = createMilestonesService();

  app.get('/milestones', async (request, reply) => {
    const paginationParams = getPaginationParams(request.query);
    const result = milestones.listMilestonesPage(paginationParams);
    const totalPages = Math.max(1, Math.ceil(result.totalItems / paginationParams.perPage));

    if (paginationParams.page > totalPages) {
      return reply.redirect(pageUrl('/milestones', {}, totalPages, paginationParams.perPage));
    }

    return reply.view('milestones/list.ejs', baseViewData(reply, {
      title: 'Hitos personales',
      milestones: result.milestones,
      pagination: buildPagination({
        ...paginationParams,
        totalItems: result.totalItems,
        path: '/milestones'
      })
    }));
  });

  app.post('/entries/:id/milestones', async (request, reply) => {
    const result = milestones.createForEntry(request.params.id, request.body);

    if (!result.ok) {
      const error = encodeURIComponent(Object.values(result.errors || { form: result.error }).join(' '));
      return reply.redirect(`/entries/${request.params.id}?milestoneError=${error}`);
    }

    return reply.redirect(`/entries/${request.params.id}`);
  });

  app.post('/milestones/:id/delete', async (request, reply) => {
    const milestone = milestones.deleteMilestone(request.params.id);
    if (!milestone) return reply.callNotFound();

    if (milestone.entry_id) {
      return reply.redirect(`/entries/${milestone.entry_id}`);
    }

    return reply.redirect('/milestones');
  });
}
