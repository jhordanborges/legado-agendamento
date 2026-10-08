const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL

const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 1000 // 1s → 2s → 4s (backoff exponencial)

/**
 * Aguarda um determinado número de milissegundos.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Dispara o webhook com os dados completos do agendamento.
 * Realiza até 3 tentativas com backoff exponencial em caso de falha.
 * Não lança erro — falhas são logadas e retornadas como status.
 *
 * @param {Object} appointmentData - Dados do agendamento recém-criado
 * @returns {Promise<{ ok: boolean, attempts: number, error: string|null }>}
 */
export async function dispararWebhook(appointmentData) {
  if (!WEBHOOK_URL) {
    console.warn('[Webhook] VITE_WEBHOOK_URL não configurada. Pulando disparo.')
    return { ok: false, attempts: 0, error: 'URL não configurada' }
  }

  const payload = {
    ...appointmentData,
    timestamp: new Date().toISOString(),
    origem: 'legado-agenda',
  }

  let lastError = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.info(`[Webhook] Tentativa ${attempt}/${MAX_ATTEMPTS}...`)

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      console.info(`[Webhook] Disparado com sucesso na tentativa ${attempt}.`)
      return { ok: true, attempts: attempt, error: null }
    } catch (err) {
      lastError = err.message || String(err)
      console.warn(`[Webhook] Tentativa ${attempt} falhou: ${lastError}`)

      if (attempt < MAX_ATTEMPTS) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1)
        console.info(`[Webhook] Aguardando ${delay}ms antes de tentar novamente...`)
        await sleep(delay)
      }
    }
  }

  console.error(`[Webhook] Todas as ${MAX_ATTEMPTS} tentativas falharam. Último erro: ${lastError}`)
  return { ok: false, attempts: MAX_ATTEMPTS, error: lastError }
}
