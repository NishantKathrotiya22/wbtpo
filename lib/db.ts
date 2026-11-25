import { Pool, types, type PoolClient } from 'pg'

types.setTypeParser(1082, (v) => v) // date -> 'YYYY-MM-DD', no timezone shifts
types.setTypeParser(1700, (v) => parseFloat(v)) // numeric -> number

const g = globalThis as unknown as { __pool?: Pool }
export const pool = (g.__pool ??= new Pool({ connectionString: process.env.DATABASE_URL }))

export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query(text, params)).rows
}

export async function one<T = any>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(text, params))[0] ?? null
}

export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect()
  try {
    await c.query('begin')
    const r = await fn(c)
    await c.query('commit')
    return r
  } catch (e) {
    await c.query('rollback')
    throw e
  } finally {
    c.release()
  }
}

export async function audit(actor: number | null, entity: string, id: number | null, action: string, detail?: string) {
  await q('insert into audit_log (actor_id, entity, entity_id, action, detail) values ($1,$2,$3,$4,$5)', [actor, entity, id, action, detail ?? null])
}

export async function setting(key: string, fallback: number): Promise<number> {
  const r = await one<{ value: string }>('select value from settings where key=$1', [key])
  return r ? Number(r.value) : fallback
}
