import { Moon } from 'lunarphase-js';

export function getMoonPhaseForDate(date) {
  try {
    const phase = Moon.lunarPhase(date);
    const emoji = Moon.lunarPhaseEmoji(date);
    return { phase, emoji };
  } catch (e) {
    return { phase: 'Unknown', emoji: '🌑' };
  }
}



