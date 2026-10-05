const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL

/**
 * Dispara o webhook com os dados completos do agendamento.
 * Não lança erro — falhas são apenas logadas, para não bloquear o fluxo principal.
 *
 * @param {Object} appointmentData - Dados do agendamento recém-criado
 */
export async function dispararWebhook(appointmentData) {
  if (!WEBHOOK_URL) {
    console.warn('[Webhook] VITE_WEBHOOK_URL não configurada. Pulando disparo.')
    return
  }

  try {
    const payload = {
      ...appointmentData,
      timestamp: new Date().toISOString(),
      origem: 'legado-agenda',
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(
        `[Webhook] Resposta inesperada: ${response.status} ${response.statusText}`
      )
    } else {
      console.info('[Webhook] Disparado com sucesso.')
    }
  } catch (err) {
    console.error('[Webhook] Falha ao disparar:', err)
  }
}
