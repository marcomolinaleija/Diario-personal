import { env } from '../config/env.js';
import { createNotificationRepository } from '../repositories/notification-repository.js';
import { todayForInput, toLocalInputDateTime } from '../utils/datetime.js';
import { createMailService } from './mail-service.js';
import { createStreakService } from './streak-service.js';

const MILESTONE_TEXT = {
  2: ['Dos días seguidos', 'Dos días no son una vida nueva, pero sí son una señal. Dale continuidad mañana.'],
  3: ['Tres días de racha', 'Tres días ya empiezan a parecer intención. Escribe aunque sea poco, pero vuelve.'],
  5: ['Cinco días escribiendo', 'Cinco días es suficiente para notar un patrón. No lo hagas perfecto, hazlo presente.'],
  7: ['Una semana completa', 'Una semana completa. Eso ya no fue casualidad. Buen trabajo sosteniendo el hábito.'],
  10: ['Diez días de diario', 'Diez días guardados. Tu yo de después va a agradecer estas migas en el camino.'],
  14: ['Dos semanas de racha', 'Dos semanas. Ya hay algo que proteger, pero sin ponerse solemnes: una entrada más.'],
  21: ['Veintiún días', 'Veintiún días escribiendo. Esto ya tiene estructura de costumbre.'],
  30: ['Treinta días de diario', 'Treinta días. Un mes de señales, memoria y constancia. Esto ya pesa bonito.'],
  45: ['Cuarenta y cinco días', 'Cuarenta y cinco días no se sostienen por accidente. Sigue haciéndolo fácil.'],
  50: ['Cincuenta días', 'Cincuenta días. Medio centenar de veces diciendo: hoy también cuenta.'],
  60: ['Sesenta días', 'Sesenta días de diario. Ya hay una línea clara entre intención y práctica.'],
  75: ['Setenta y cinco días', 'Setenta y cinco días. Esto ya parece una conversación larga contigo mismo.'],
  90: ['Noventa días', 'Noventa días. Una estación completa, más o menos. Hay historia aquí.'],
  100: ['Cien días', 'Cien días. Esto merece una pausa pequeña para notarlo: lo estás haciendo.'],
  150: ['Ciento cincuenta días', 'Ciento cincuenta días. La constancia también puede ser tranquila.'],
  180: ['Ciento ochenta días', 'Casi medio año de entradas. Hay mucho de ti quedando a salvo.'],
  200: ['Doscientos días', 'Doscientos días. Qué raro y qué bueno cuando algo personal se sostiene así.'],
  250: ['Doscientos cincuenta días', 'Doscientos cincuenta días. La racha ya es menos número y más paisaje.'],
  300: ['Trescientos días', 'Trescientos días. Falta menos para el año; hoy solo toca una entrada.'],
  365: ['Un año de diario', 'Un año completo. Esto ya es archivo, espejo y compañía.'],
  500: ['Quinientos días', 'Quinientos días. Tremenda forma de permanecer atento.'],
  730: ['Dos años de diario', 'Dos años. Hay una vida entera escondida en estas páginas.']
};

const MILESTONES = Object.keys(MILESTONE_TEXT).map(Number);

export const NOTIFICATION_SCENARIOS = [
  'Sin entradas todavía',
  'Primera entrada escrita',
  'Racha iniciada hoy',
  'Día escrito sin hito especial',
  'Semana perfecta: 7 de 7 días',
  'Mes muy activo: 20 o más días en 30',
  'Mes casi diario: 25 o más días en 30',
  'Regreso después de 1 día sin escribir',
  'Regreso después de 2 días sin escribir',
  'Regreso después de 3 días sin escribir',
  'Regreso después de 5 días sin escribir',
  'Regreso después de una semana o más',
  'Regreso después de dos semanas o más',
  'Regreso después de un mes o más',
  'Regreso después de dos meses o más',
  'Regreso después de tres meses o más',
  'A punto de perder una racha de 2 días',
  'A punto de perder una racha de 3 días',
  'A punto de perder una racha de 5 días',
  'A punto de perder una racha de 7 días',
  'A punto de perder una racha de 14 días',
  'A punto de perder una racha de 30 días',
  'A punto de perder una racha de 50 días',
  'A punto de perder una racha de 100 días',
  'Van 1 día sin escribir',
  'Van 2 días sin escribir',
  'Van 3 días sin escribir',
  'Van 5 días sin escribir',
  'Van 7 días sin escribir',
  'Van 10 días sin escribir',
  'Van 14 días sin escribir',
  'Van 21 días sin escribir',
  'Van 30 días sin escribir',
  'Van 45 días sin escribir',
  'Van 60 días sin escribir',
  'Van 90 días sin escribir',
  ...MILESTONES.map((days) => `Racha de ${days} días`)
];

export function createStreakNotificationService() {
  const streakService = createStreakService();
  const notifications = createNotificationRepository();
  const mail = createMailService();

  return {
    scenarios: NOTIFICATION_SCENARIOS,

    async checkAndSend({ force = false } = {}) {
      if (!mail.isEnabled()) {
        return { skipped: true, reason: 'mail_disabled' };
      }

      const nowLocal = toLocalInputDateTime();
      const today = nowLocal.slice(0, 10);
      const currentHour = Number(nowLocal.slice(11, 13));

      if (!force && currentHour < env.mail.streakCheckHour) {
        return { skipped: true, reason: 'too_early' };
      }

      const summary = streakService.getStreakSummary(today);
      const scenario = chooseScenario(summary);
      if (!scenario) {
        return { skipped: true, reason: 'no_scenario', summary };
      }

      if (notifications.hasSent(scenario.key, today)) {
        return { skipped: true, reason: 'already_sent', scenario, summary };
      }

      const result = await mail.send({
        subject: scenario.subject,
        text: renderText(scenario, summary)
      });

      if (!result.skipped) {
        notifications.markSent(scenario.key, today);
      }

      return { sent: !result.skipped, scenario, summary };
    }
  };
}

export function startStreakNotificationScheduler(log) {
  const service = createStreakNotificationService();

  const run = async () => {
    try {
      const result = await service.checkAndSend();
      log.info({ result }, 'streak notification check finished');
    } catch (error) {
      log.error({ error }, 'streak notification check failed');
    }
  };

  setTimeout(run, 15000);
  setInterval(run, 60 * 60 * 1000);
}

function chooseScenario(summary) {
  if (summary.totalWritingDays === 0) {
    return scenario(
      'no_entries',
      'Tu diario está esperando la primera entrada',
      'Todavía no hay entradas. No hace falta inaugurar nada con solemnidad: una línea honesta alcanza.'
    );
  }

  if (summary.wroteToday) {
    if (summary.totalWritingDays === 1) {
      return scenario(
        'first_entry',
        'Primera entrada escrita',
        'Ya empezó el diario. Que sea pequeño no lo hace menor: ya hay una primera marca.'
      );
    }

    if (summary.previousGapBeforeToday >= 90) {
      return scenario(
        'comeback_90',
        'Volviste después de tres meses',
        'Tres meses después, volviste. Eso no borra el silencio, pero sí lo interrumpe. Bien ahí.'
      );
    }

    if (summary.previousGapBeforeToday >= 60) {
      return scenario(
        'comeback_60',
        'Volviste después de dos meses',
        'Dos meses son mucho tiempo, y aun así el diario seguía esperando sin juicio. Hoy cuenta.'
      );
    }

    if (summary.previousGapBeforeToday >= 30) {
      return scenario(
        'comeback_30',
        'Volviste después de un mes',
        'Un mes después, la puerta seguía abierta. Volver también es una forma de constancia.'
      );
    }

    if (summary.previousGapBeforeToday >= 14) {
      return scenario(
        'comeback_14',
        'Volviste después de dos semanas',
        'Dos semanas sin escribir y hoy aparece una entrada. No hay regaño: hay regreso.'
      );
    }

    if (summary.previousGapBeforeToday >= 7) {
      return scenario(
        'comeback_7',
        'Volviste después de una semana',
        'Una semana en blanco no venció al hábito. Hoy el diario volvió a tener pulso.'
      );
    }

    if ([1, 2, 3, 5].includes(summary.previousGapBeforeToday)) {
      return scenario(
        `comeback_${summary.previousGapBeforeToday}`,
        'Recuperaste el hilo',
        `Volviste después de ${summary.previousGapBeforeToday} día(s) sin escribir. Mejor una vuelta sencilla que una ausencia perfecta.`
      );
    }

    if (MILESTONES.includes(summary.currentStreak)) {
      const [subject, message] = MILESTONE_TEXT[summary.currentStreak];
      return scenario(`milestone_${summary.currentStreak}`, subject, message);
    }

    if (summary.daysWrittenLast30 >= 25) {
      return scenario(
        'month_almost_daily',
        'Un mes casi diario',
        `Has escrito ${summary.daysWrittenLast30} de los últimos 30 días. No es poca cosa: es presencia repetida.`
      );
    }

    if (summary.daysWrittenLast30 >= 20) {
      return scenario(
        'month_active',
        'Un mes muy activo',
        `Has escrito ${summary.daysWrittenLast30} de los últimos 30 días. La constancia también puede tener respiración.`
      );
    }

    if (summary.daysWrittenLast7 === 7) {
      return scenario(
        'week_perfect',
        'Semana completa',
        'Siete de siete esta semana. No hace falta subirle volumen: estuvo muy bien.'
      );
    }

    if (summary.currentStreak === 1) {
      return scenario(
        'streak_started',
        'Racha iniciada',
        'Hoy cuenta como día uno. Que sea humilde es parte de la gracia.'
      );
    }

    return scenario(
      'wrote_today',
      'Entrada registrada hoy',
      `Entrada guardada. Racha actual: ${summary.currentStreak} día(s). La parte importante ya pasó: apareciste.`
    );
  }

  if (summary.daysSinceLastEntry === 1 && summary.activeStreak >= 2) {
    const threshold = [100, 50, 30, 14, 7, 5, 3, 2].find((value) => summary.activeStreak >= value);
    return scenario(
      `at_risk_${threshold}`,
      'Tu racha todavía se puede salvar',
      `Ayer cerraste una racha de ${summary.activeStreak} día(s). Si escribes hoy, sigue viva. Una nota corta basta.`
    );
  }

  if (summary.daysSinceLastEntry >= 90) {
    return scenario(
      'missed_90',
      'Han pasado 90 días sin escribir',
      'Tres meses sin entrada. No hay que compensar todo eso hoy. Solo abrir una página nueva.'
    );
  }

  if (summary.daysSinceLastEntry >= 60) {
    return scenario(
      'missed_60',
      'Han pasado 60 días sin escribir',
      'Sesenta días sin escribir. Si vuelves hoy, no es tarde: es hoy.'
    );
  }

  if (summary.daysSinceLastEntry >= 45) {
    return scenario(
      'missed_45',
      'Han pasado 45 días sin escribir',
      'Cuarenta y cinco días. El diario no necesita una explicación larga; necesita una entrada posible.'
    );
  }

  if (summary.daysSinceLastEntry >= 30) {
    return scenario(
      'missed_30',
      'Han pasado 30 días sin escribir',
      'Un mes sin entrada. Puedes retomarlo sin pedir permiso y sin justificar el hueco.'
    );
  }

  if (summary.daysSinceLastEntry >= 21) {
    return scenario(
      'missed_21',
      'Han pasado 21 días sin escribir',
      'Tres semanas. Una entrada corta puede romper el silencio sin convertirlo en drama.'
    );
  }

  if (summary.daysSinceLastEntry >= 14) {
    return scenario(
      'missed_14',
      'Han pasado 14 días sin escribir',
      'Dos semanas sin entrada. Es buen momento para volver antes de que se sienta lejano.'
    );
  }

  if ([1, 2, 3, 5, 7, 10].includes(summary.daysSinceLastEntry)) {
    return scenario(
      `missed_${summary.daysSinceLastEntry}`,
      `Van ${summary.daysSinceLastEntry} días sin escribir`,
      'No hace falta escribir perfecto. Hace falta escribir algo que deje constancia de que estuviste aquí.'
    );
  }

  return null;
}

function scenario(key, subject, message) {
  return { key, subject: `[Diario] ${subject}`, message };
}

function renderText(scenario, summary) {
  return [
    scenario.message,
    '',
    `Hoy: ${summary.today}`,
    `Racha activa: ${summary.activeStreak} día(s)`,
    `Racha de hoy: ${summary.currentStreak} día(s)`,
    `Racha más larga: ${summary.longestStreak} día(s)`,
    `Días escritos: ${summary.totalWritingDays}`,
    `Últimos 7 días: ${summary.daysWrittenLast7}/7`,
    `Últimos 30 días: ${summary.daysWrittenLast30}/30`,
    `Última entrada: ${summary.lastEntryDate || 'sin entradas'}`,
    '',
    'Entra al diario por Tailscale:',
    env.appPublicUrl
  ].join('\n');
}
