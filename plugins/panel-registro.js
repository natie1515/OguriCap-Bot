/**
 * Plugin de registro para el panel
 * Permite a los usuarios registrarse y obtener acceso al panel
 */

const ensureStore = () => {
  if (!global.db.data.panel) global.db.data.panel = {}
  if (!global.db.data.panel.registros) global.db.data.panel.registros = {}
  if (!global.db.data.panel.registrosCounter) global.db.data.panel.registrosCounter = 0
}

const nextId = () => {
  global.db.data.panel.registrosCounter = (global.db.data.panel.registrosCounter || 0) + 1
  return global.db.data.panel.registrosCounter
}

let handler = async (m, { args, usedPrefix, command, conn, isOwner }) => {
  ensureStore()
  const panel = global.db.data.panel
  const user = global.db.data.users[m.sender]
  const panelUrl = process.env.PANEL_URL || 'https://oguricap.ooguy.com'

  switch (command) {
    case 'reg':
    case 'registro':
    case 'register': {
      // Verificar si ya está registrado
      const existingReg = Object.values(panel.registros || {}).find(r => r.wa_jid === m.sender)
      if (existingReg) {
        return m.reply(`✅ *Ya estás registrado*\n\n📱 Usuario: @${m.sender.split('@')[0]}\n🆔 ID: #${existingReg.id}\n📅 Fecha: ${new Date(existingReg.fecha_registro).toLocaleDateString()}\n\n🌐 *Accede al panel:*\n${panelUrl}\n\n👤 Usuario: ${existingReg.username || 'admin'}\n🔑 Contraseña: La que configuraste o la por defecto`)
      }

      const raw = (args || []).join(' ').trim()
      
      if (!raw) {
        return m.reply(`📝 *Registro en el Panel*\n\nUso: ${usedPrefix}${command} <nombre de usuario>\n\nEjemplo:\n${usedPrefix}${command} MiNombre\n\n💡 El nombre de usuario será tu identificador en el panel.`)
      }

      const username = raw.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
      if (username.length < 3) {
        return m.reply(`❌ El nombre de usuario debe tener al menos 3 caracteres alfanuméricos`)
      }

      // Verificar si el username ya existe
      const usernameExists = Object.values(panel.registros || {}).find(r => r.username?.toLowerCase() === username.toLowerCase())
      if (usernameExists) {
        return m.reply(`❌ El nombre de usuario "${username}" ya está en uso. Elige otro.`)
      }

      const id = nextId()
      const now = new Date().toISOString()
      
      // Generar contraseña temporal simple
      let tempPassword = 'temp' + Math.random().toString(36).substring(2, 8);

      const registro = {
        id,
        wa_jid: m.sender,
        wa_number: m.sender.split('@')[0],
        username,
        nombre: m.pushName || username,
        rol: 'usuario',
        fecha_registro: now,
        activo: true,
        verificado: false,
        temp_password: tempPassword,
        require_password_change: true
      }

      panel.registros[id] = registro

      // También agregar a usuarios del panel si no existe
      if (!panel.users) panel.users = {}
      const userId = Object.keys(panel.users).length + 1
      panel.users[userId] = {
        id: userId,
        username,
        email: '',
        whatsapp_number: m.sender.split('@')[0],
        rol: 'usuario',
        fecha_registro: now,
        activo: true,
        temp_password: tempPassword,
        require_password_change: true
      }

      // Registrar también en el sistema JWT usando auto-register
      try {
        const response = await fetch(`http://localhost:${process.env.PORT || 8080}/api/auth/auto-register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            whatsapp_number: m.sender,
            username: username,
            grupo_jid: m.chat
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.tempPassword) {
            tempPassword = data.tempPassword; // Usar la contraseña del sistema JWT
            // Actualizar también en los registros locales
            registro.temp_password = tempPassword;
            panel.users[userId].temp_password = tempPassword;
          }
        }
      } catch (error) {
        console.warn('Error registering in JWT system:', error.message);
      }

      // Marcar usuario como registrado en la DB principal
      if (user) {
        user.registered = true
        user.registeredAt = now
        user.panelUsername = username
      }

      const mensaje = [
        `✅ *¡Registro Exitoso!*`,
        ``,
        `📱 *Tu información:*`,
        `• Usuario: ${username}`,
        `• WhatsApp: ${m.sender.split('@')[0]}`,
        `• ID: #${id}`,
        ``,
        `🔑 *Credenciales de Acceso:*`,
        `• Usuario: ${username}`,
        `• Contraseña temporal: ${tempPassword}`,
        `• Válida por: 24 horas`,
        ``,
        `🌐 *Acceso al Panel:*`,
        `${panelUrl}`,
        ``,
        `📋 *Instrucciones:*`,
        `1. Abre el enlace del panel en tu navegador`,
        `2. Ingresa con tu usuario: ${username}`,
        `3. Usa la contraseña temporal: ${tempPassword}`,
        `4. Selecciona el rol "usuario"`,
        `5. ⚠️ IMPORTANTE: Cambia tu contraseña después del primer login`,
        ``,
        `💡 *Funciones del Panel:*`,
        `• Ver estadísticas del bot`,
        `• Gestionar grupos`,
        `• Ver aportes y pedidos`,
        `• Configurar el bot`,
        ``,
        `🔒 *Seguridad:*`,
        `• La contraseña temporal expira en 24 horas`,
        `• Debes cambiarla en tu primer login`,
        `• Guarda bien tus credenciales`,
        ``,
        `¡Gracias por registrarte! 🎉`
      ].join('\n')

      // Emitir evento Socket.IO
      try {
        const { emitNotification } = await import('../lib/socket-io.js')
        emitNotification({
          type: 'success',
          title: 'Nuevo Registro',
          message: `${username} se ha registrado desde WhatsApp`
        })
      } catch {}

      return conn.reply(m.chat, mensaje, m, { mentions: [m.sender] })
    }

    case 'miregistro':
    case 'myregister':
    case 'miperfil': {
      const registro = Object.values(panel.registros || {}).find(r => r.wa_jid === m.sender)
      
      if (!registro) {
        return m.reply(`❌ No estás registrado.\n\nUsa ${usedPrefix}reg <nombre> para registrarte.`)
      }

      const mensaje = [
        `📋 *Tu Perfil de Registro*`,
        ``,
        `🆔 ID: #${registro.id}`,
        `👤 Usuario: ${registro.username}`,
        `📱 WhatsApp: ${registro.wa_number}`,
        `📛 Nombre: ${registro.nombre}`,
        `🎭 Rol: ${registro.rol}`,
        `📅 Registrado: ${new Date(registro.fecha_registro).toLocaleDateString()}`,
        `✅ Estado: ${registro.activo ? 'Activo' : 'Inactivo'}`,
        ``,
        `🌐 Panel: ${panelUrl}`
      ].join('\n')

      return m.reply(mensaje)
    }

    case 'panelinfo':
    case 'infopanel': {
      const totalRegistros = Object.keys(panel.registros || {}).length
      
      const mensaje = [
        `🌐 *Información del Panel*`,
        ``,
        `📊 *Estadísticas:*`,
        `• Usuarios registrados: ${totalRegistros}`,
        `• Grupos: ${Object.keys(panel.groups || {}).length}`,
        `• Aportes: ${(global.db.data.aportes || []).length}`,
        `• Pedidos: ${Object.keys(panel.pedidos || {}).length}`,
        ``,
        `🔗 *Acceso:*`,
        `${panelUrl}`,
        ``,
        `📝 *Comandos:*`,
        `• ${usedPrefix}reg <nombre> - Registrarse`,
        `• ${usedPrefix}miregistro - Ver tu perfil`,
        `• ${usedPrefix}panelinfo - Esta información`,
        ``,
        `💡 Regístrate para acceder a todas las funciones del panel.`
      ].join('\n')

      return m.reply(mensaje)
    }

    case 'delreg':
    case 'eliminarregistro': {
      if (!isOwner) return m.reply('❌ Solo el owner puede eliminar registros')

      const target = args[0]
      if (!target) {
        return m.reply(`Uso: ${usedPrefix}${command} <id o @usuario>`)
      }

      let registro = null
      const mentioned = m.mentionedJid?.[0]

      if (mentioned) {
        registro = Object.values(panel.registros || {}).find(r => r.wa_jid === mentioned)
      } else {
        const id = parseInt(target)
        if (id) {
          registro = panel.registros[id]
        } else {
          registro = Object.values(panel.registros || {}).find(r => 
            r.username?.toLowerCase() === target.toLowerCase() ||
            r.wa_number === target.replace(/[^0-9]/g, '')
          )
        }
      }

      if (!registro) {
        return m.reply(`❌ Registro no encontrado`)
      }

      delete panel.registros[registro.id]
      return m.reply(`✅ Registro de ${registro.username} (#${registro.id}) eliminado`)
    }

    case 'listregs':
    case 'registros': {
      if (!isOwner) return m.reply('❌ Solo el owner puede ver todos los registros')

      const registros = Object.values(panel.registros || {})
      if (!registros.length) {
        return m.reply(`📋 No hay usuarios registrados`)
      }

      const lista = registros.slice(0, 20).map((r, i) => 
        `${i + 1}. ${r.username} (@${r.wa_number}) - ${r.rol}`
      ).join('\n')

      return m.reply(`📋 *Usuarios Registrados (${registros.length})*\n\n${lista}`)
    }

    default:
      return null
  }
}

handler.help = ['reg', 'registro', 'miregistro', 'panelinfo', 'delreg', 'registros']
handler.tags = ['tools', 'panel']
handler.command = ['reg', 'registro', 'register', 'miregistro', 'myregister', 'miperfil', 'panelinfo', 'infopanel', 'delreg', 'eliminarregistro', 'listregs', 'registros']

export default handler
