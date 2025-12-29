/**
 * Simple PostgreSQL Database
 * Uses pg directly - no complex drivers or adapters
 */

import pkg from 'pg'
const { Pool } = pkg

const __dbGlobal =
  globalThis.__oguriPgDb ||
  (globalThis.__oguriPgDb = {
    pool: null,
    data: null,
    initPromise: null,
    statsLogged: false,
  })

function shouldLogDb() {
  return process.env.DEBUG_DB === 'true'
}

function parseJsonValue(value, fallback = {}) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

class Database {
  constructor() {
    if (!__dbGlobal.pool) {
      __dbGlobal.pool = new Pool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        database: process.env.POSTGRES_DB || 'oguribot',
        user: process.env.POSTGRES_USER || 'bot_user',
        password: process.env.POSTGRES_PASSWORD || 'melodia',
        max: 20,
        idleTimeoutMillis: Number(process.env.POSTGRES_IDLE_TIMEOUT_MS || 5 * 60 * 1000),
        connectionTimeoutMillis: Number(process.env.POSTGRES_CONN_TIMEOUT_MS || 30 * 1000),
      })
    }
    this.pool = __dbGlobal.pool

    __dbGlobal.data ||= { users: {}, chats: {}, settings: {}, usuarios: {} }
    this.data = __dbGlobal.data
  }

  async _saveUsuarios() {
    const usuarioEntries = Object.entries(this.data.usuarios || {})
    const knownColumns = new Set([
      'id',
      'username',
      'password',
      'rol',
      'whatsapp_number',
      'fecha_registro',
      'activo',
      'temp_password',
      'temp_password_expires',
      'require_password_change',
      'last_login',
      'login_ip',
      'created_at',
      'updated_at',
    ])

    for (const [key, usuario] of usuarioEntries) {
      const username = usuario?.username
      if (!username) continue

      const parsedId = Number.parseInt(String(usuario?.id ?? key), 10)
      const id = Number.isFinite(parsedId) ? parsedId : null

      const metadata = {}
      for (const [field, fieldValue] of Object.entries(usuario || {})) {
        if (knownColumns.has(field)) continue
        if (fieldValue === undefined) continue
        metadata[field] = fieldValue
      }

      const fechaRegistro = usuario?.fecha_registro || usuario?.created_at || new Date().toISOString()

      const result = await this.pool.query(
        `
        INSERT INTO usuarios (
          id, username, password, rol, whatsapp_number, fecha_registro, activo,
          temp_password, temp_password_expires, require_password_change,
          last_login, login_ip, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13::jsonb
        )
        ON CONFLICT (username) DO UPDATE SET
          password = EXCLUDED.password,
          rol = EXCLUDED.rol,
          whatsapp_number = EXCLUDED.whatsapp_number,
          activo = EXCLUDED.activo,
          temp_password = EXCLUDED.temp_password,
          temp_password_expires = EXCLUDED.temp_password_expires,
          require_password_change = EXCLUDED.require_password_change,
          last_login = EXCLUDED.last_login,
          login_ip = EXCLUDED.login_ip,
          metadata = EXCLUDED.metadata,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
        `,
        [
          id,
          username,
          usuario?.password || '',
          usuario?.rol || 'usuario',
          usuario?.whatsapp_number ?? null,
          fechaRegistro,
          usuario?.activo ?? true,
          usuario?.temp_password ?? null,
          usuario?.temp_password_expires ?? null,
          usuario?.require_password_change ?? false,
          usuario?.last_login ?? null,
          usuario?.login_ip ?? null,
          JSON.stringify(metadata),
        ]
      )

      const returnedId = result?.rows?.[0]?.id
      if (returnedId && usuario?.id !== returnedId) {
        usuario.id = returnedId
        if (String(key) !== String(returnedId)) {
          delete this.data.usuarios[key]
          this.data.usuarios[returnedId] = usuario
        }
      }
    }
  }

  async init() {
    if (__dbGlobal.initPromise) return __dbGlobal.initPromise

    __dbGlobal.initPromise = (async () => {
    // Solo loguear una vez al inicio, no en cada carga
    if (!this._initialized) {
      if (shouldLogDb()) console.log('📦 Connecting to PostgreSQL...')
      this._initialized = true
    }

    const client = await this.pool.connect()
    if (!this._connected) {
      if (shouldLogDb()) console.log('✅ PostgreSQL connected')
      this._connected = true
    }
    client.release()

    await this.loadData()
    // No loguear cada vez que se carga, solo la primera vez
    if (!this._dataLoaded) {
      if (shouldLogDb()) console.log('✅ Data loaded')
      this._dataLoaded = true
    }
    return this.data
    })().catch((err) => {
      __dbGlobal.initPromise = null
      throw err
    })

    return __dbGlobal.initPromise
  }

  async loadData() {
    // Load WhatsApp users
    const users = await this.pool.query('SELECT * FROM whatsapp_users')
    this.data.users = {}
    if (users?.rows && Array.isArray(users.rows)) {
      users.rows.forEach((user) => {
      try {
        const stats = parseJsonValue(user.stats, {})
        const settings = parseJsonValue(user.settings, {})
        const activity = parseJsonValue(user.activity, {})

        // Compat: algunos datos viejos usan snake_case
        if (activity?.afk_reason != null && activity?.afkReason == null) activity.afkReason = activity.afk_reason

        // Compat: preservar campos extra guardados en settings.__extra
        const extra = settings && typeof settings === 'object' ? settings.__extra : null
        if (settings && typeof settings === 'object' && '__extra' in settings) delete settings.__extra

        this.data.users[user.jid] = {
          name: user.name,
          ...stats,
          ...settings,
          ...activity,
          ...(extra && typeof extra === 'object' ? extra : {}),
        }
      } catch (error) {
        // Solo loguear warnings en modo debug
        if (process.env.DEBUG_DB === 'true') {
          console.warn(`⚠️ Invalid JSON in user ${user.jid}, using defaults`)
        }
        this.data.users[user.jid] = {
          name: user.name || user.jid.split('@')[0],
          exp: 0,
          coin: 0,
          level: 0,
          health: 100,
          premium: false,
          banned: false,
        }
      }
    })
    }

    // Load chats
    const chats = await this.pool.query('SELECT * FROM chats')
    this.data.chats = {}
    if (chats?.rows && Array.isArray(chats.rows)) {
      chats.rows.forEach((chat) => {
      try {
        this.data.chats[chat.jid] = {
          ...parseJsonValue(chat.settings, {}),
          ...parseJsonValue(chat.messages, {}),
          ...parseJsonValue(chat.message_settings, {}),
        }
      } catch (error) {
        if (process.env.DEBUG_DB === 'true') {
          console.warn(`⚠️ Invalid JSON in chat ${chat.jid}, using defaults`)
        }
        this.data.chats[chat.jid] = {
          isBanned: false,
          antilink: false,
          welcome: false,
        }
      }
    })
    }

    // Load settings
    const settings = await this.pool.query('SELECT * FROM settings')
    this.data.settings = {}
    if (settings?.rows && Array.isArray(settings.rows)) {
      settings.rows.forEach((setting) => {
      if (setting.value != null && typeof setting.value === 'object') {
        this.data.settings[setting.key_name] = setting.value
        return
      }
      const parsed = parseJsonValue(setting.value, null)
      if (parsed === null) {
        if (process.env.DEBUG_DB === 'true') {
          console.warn(`⚠️ Setting '${setting.key_name}' is not valid JSON, storing as string`)
        }
        this.data.settings[setting.key_name] = setting.value
      } else {
        this.data.settings[setting.key_name] = parsed
      }
    })
    }

    // Load panel users (JWT/Panel)
    const usuarios = await this.pool.query('SELECT * FROM usuarios')
    this.data.usuarios = {}
    if (usuarios?.rows && Array.isArray(usuarios.rows)) {
      usuarios.rows.forEach((usuario) => {
      try {
        const metadata = parseJsonValue(usuario.metadata, {})
        this.data.usuarios[usuario.id] = {
          id: usuario.id,
          username: usuario.username,
          password: usuario.password,
          rol: usuario.rol,
          whatsapp_number: usuario.whatsapp_number,
          fecha_registro: usuario.fecha_registro,
          activo: usuario.activo,
          temp_password: usuario.temp_password,
          temp_password_expires: usuario.temp_password_expires,
          require_password_change: usuario.require_password_change,
          last_login: usuario.last_login,
          login_ip: usuario.login_ip,
          created_at: usuario.created_at,
          updated_at: usuario.updated_at,
          ...metadata,
        }
      } catch (error) {
        if (process.env.DEBUG_DB === 'true') {
          console.warn(`⚠️ Invalid JSON in usuario ${usuario.username}, using defaults`)
        }
        this.data.usuarios[usuario.id] = {
          id: usuario.id,
          username: usuario.username,
          password: usuario.password,
          rol: usuario.rol,
          whatsapp_number: usuario.whatsapp_number,
          fecha_registro: usuario.fecha_registro,
          activo: usuario.activo,
          temp_password: usuario.temp_password,
          temp_password_expires: usuario.temp_password_expires,
          require_password_change: usuario.require_password_change,
          last_login: usuario.last_login,
          login_ip: usuario.login_ip,
          created_at: usuario.created_at,
          updated_at: usuario.updated_at,
        }
      }
    })
    }

    // Logs de DB solo en modo debug
    if (shouldLogDb() && !__dbGlobal.statsLogged) {
      console.log(`📊 Loaded: ${Object.keys(this.data.users).length} users, ${Object.keys(this.data.chats).length} chats, ${Object.keys(this.data.settings).length} settings, ${Object.keys(this.data.usuarios).length} panel users`)
      __dbGlobal.statsLogged = true
    }
  }

  async saveData() {
    // Save WhatsApp users
    for (const [jid, userData] of Object.entries(this.data.users)) {
      const statsObj = {
        exp: userData.exp || 0,
        coin: userData.coin || 0,
        bank: userData.bank || 0,
        level: userData.level || 0,
        health: userData.health || 100,
      }

      const settingsObj = {
        premium: userData.premium || false,
        premiumTime: userData.premiumTime || 0,
        banned: userData.banned || false,
        bannedReason: userData.bannedReason || '',
        warn: userData.warn || 0,
        genre: userData.genre || '',
        birth: userData.birth || '',
        marry: userData.marry || '',
        description: userData.description || '',
        packstickers: userData.packstickers ?? null,
      }

      const activityObj = {
        commands: userData.commands || 0,
        afk: userData.afk || -1,
        afkReason: userData.afkReason || '',
      }

      // Preservar cualquier otra data que los plugins agreguen al usuario (inventario, rpg, etc.)
      const extra = {}
      for (const [key, value] of Object.entries(userData || {})) {
        if (value === undefined) continue
        if (key === 'name') continue
        if (key in statsObj) continue
        if (key in settingsObj) continue
        if (key in activityObj) continue
        extra[key] = value
      }
      if (Object.keys(extra).length) settingsObj.__extra = extra

      let stats = '{}'
      let settings = '{}'
      let activity = '{}'
      try { stats = JSON.stringify(statsObj) } catch {}
      try { settings = JSON.stringify(settingsObj) } catch {}
      try { activity = JSON.stringify(activityObj) } catch {}

      await this.pool.query(
        `
        INSERT INTO whatsapp_users (jid, name, stats, settings, activity)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (jid) DO UPDATE SET
          name = EXCLUDED.name,
          stats = EXCLUDED.stats,
          settings = EXCLUDED.settings,
          activity = EXCLUDED.activity,
          updated_at = CURRENT_TIMESTAMP
        `,
        [jid, userData.name || jid.split('@')[0], stats, settings, activity]
      )
    }

    // Save chats
    for (const [jid, chatData] of Object.entries(this.data.chats)) {
      await this.pool.query(
        `
        INSERT INTO chats (jid, settings, messages, message_settings)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (jid) DO UPDATE SET
          settings = EXCLUDED.settings,
          messages = EXCLUDED.messages,
          message_settings = EXCLUDED.message_settings,
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          jid,
          // Compat: el bot usa un shape "lowdb" donde los flags viven en el root del chat
          JSON.stringify((chatData && typeof chatData.settings === 'object' && chatData.settings) ? chatData.settings : (chatData || {})),
          JSON.stringify((chatData && typeof chatData.messages === 'object' && chatData.messages) ? chatData.messages : {}),
          JSON.stringify((chatData && typeof chatData.message_settings === 'object' && chatData.message_settings) ? chatData.message_settings : {}),
        ]
      )
    }

    // Save settings (ensure valid JSON)
    for (const [key, value] of Object.entries(this.data.settings)) {
      let jsonValue
      try {
        if (typeof value === 'string') {
          JSON.parse(value)
          jsonValue = value
        } else {
          jsonValue = JSON.stringify(value)
        }
      } catch {
        jsonValue = JSON.stringify(value)
      }

      await this.pool.query(
        `
        INSERT INTO settings (key_name, value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (key_name) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
        `,
        [key, jsonValue, `Bot setting: ${key}`]
      )
    }

    // Save panel users (JWT/Panel)
    await this._saveUsuarios()

      // Solo loguear en modo debug para evitar spam
      if (process.env.DEBUG_DB === 'true') {
        console.log('💾 Data saved successfully')
      }
  }

  async writeUsuarios() {
    await this._saveUsuarios()
    return this.data.usuarios
  }

  // LowDB compatibility
  async read() {
    await this.loadData()
    return this.data
  }

  async write() {
    await this.saveData()
    return this.data
  }
}

export default Database
