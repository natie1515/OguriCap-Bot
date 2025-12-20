/**
 * Plugin para enviar notificaciones al panel desde el bot
 * Permite a los usuarios reportar problemas o enviar sugerencias
 */

let handler = async (m, { args, usedPrefix, command, conn }) => {
  const panel = global.db.data.panel || (global.db.data.panel = {})
  if (!panel.notifications) panel.notifications = {}

  switch (command) {
    case 'reportar':
    case 'report': {
      const mensaje = args.join(' ').trim()
      if (!mensaje) {
        return m.reply(`📝 *Reportar un problema*\n\nUso: ${usedPrefix}${command} <descripción del problema>\n\nEjemplo:\n${usedPrefix}${command} El comando /menu no funciona`)
      }

      const id = (panel.notificationsCounter || 0) + 1
      panel.notificationsCounter = id
      const now = new Date().toISOString()

      panel.notifications[id] = {
        id,
        title: 'Reporte de Usuario',
        message: mensaje,
        type: 'warning',
        category: 'reporte',
        user_id: m.sender,
        user_name: m.pushName || m.sender.split('@')[0],
        grupo_id: m.isGroup ? m.chat : null,
        leida: false,
        created_at: now,
        metadata: {
          comando: command,
          grupo: m.isGroup ? (await conn.groupMetadata(m.chat).catch(() => ({}))).subject || '' : 'Privado'
        }
      }

      // Emitir evento Socket.IO
      try {
        const { emitNotification } = await import('../lib/socket-io.js')
        emitNotification({
          type: 'warning',
          title: 'Nuevo Reporte',
          message: `${m.pushName || 'Usuario'}: ${mensaje.slice(0, 50)}...`
        })
      } catch {}

      return m.reply(`✅ *Reporte enviado*\n\nTu reporte ha sido enviado a los administradores.\n\n📝 ID: #${id}\n📋 Mensaje: ${mensaje}\n\nGracias por ayudarnos a mejorar.`)
    }

    case 'sugerir':
    case 'suggest': {
      const mensaje = args.join(' ').trim()
      if (!mensaje) {
        return m.reply(`💡 *Enviar una sugerencia*\n\nUso: ${usedPrefix}${command} <tu sugerencia>\n\nEjemplo:\n${usedPrefix}${command} Agregar comando para descargar música`)
      }

      const id = (panel.notificationsCounter || 0) + 1
      panel.notificationsCounter = id
      const now = new Date().toISOString()

      panel.notifications[id] = {
        id,
        title: 'Sugerencia de Usuario',
        message: mensaje,
        type: 'info',
        category: 'sugerencia',
        user_id: m.sender,
        user_name: m.pushName || m.sender.split('@')[0],
        grupo_id: m.isGroup ? m.chat : null,
        leida: false,
        created_at: now,
        metadata: {
          comando: command,
          grupo: m.isGroup ? (await conn.groupMetadata(m.chat).catch(() => ({}))).subject || '' : 'Privado'
        }
      }

      // Emitir evento Socket.IO
      try {
        const { emitNotification } = await import('../lib/socket-io.js')
        emitNotification({
          type: 'info',
          title: 'Nueva Sugerencia',
          message: `${m.pushName || 'Usuario'}: ${mensaje.slice(0, 50)}...`
        })
      } catch {}

      return m.reply(`✅ *Sugerencia enviada*\n\nTu sugerencia ha sido enviada a los administradores.\n\n💡 ID: #${id}\n📋 Mensaje: ${mensaje}\n\nGracias por tu aporte.`)
    }

    case 'feedback': {
      const mensaje = args.join(' ').trim()
      if (!mensaje) {
        return m.reply(`⭐ *Enviar feedback*\n\nUso: ${usedPrefix}${command} <tu opinión>\n\nEjemplo:\n${usedPrefix}${command} El bot es muy útil, me encanta!`)
      }

      const id = (panel.notificationsCounter || 0) + 1
      panel.notificationsCounter = id
      const now = new Date().toISOString()

      panel.notifications[id] = {
        id,
        title: 'Feedback de Usuario',
        message: mensaje,
        type: 'success',
        category: 'feedback',
        user_id: m.sender,
        user_name: m.pushName || m.sender.split('@')[0],
        grupo_id: m.isGroup ? m.chat : null,
        leida: false,
        created_at: now,
        metadata: {
          comando: command,
          grupo: m.isGroup ? (await conn.groupMetadata(m.chat).catch(() => ({}))).subject || '' : 'Privado'
        }
      }

      // Emitir evento Socket.IO
      try {
        const { emitNotification } = await import('../lib/socket-io.js')
        emitNotification({
          type: 'success',
          title: 'Nuevo Feedback',
          message: `${m.pushName || 'Usuario'}: ${mensaje.slice(0, 50)}...`
        })
      } catch {}

      return m.reply(`✅ *Feedback enviado*\n\n⭐ ID: #${id}\n📋 Mensaje: ${mensaje}\n\n¡Gracias por tu opinión!`)
    }

    default:
      return null
  }
}

handler.help = ['reportar', 'sugerir', 'feedback']
handler.tags = ['tools']
handler.command = ['reportar', 'report', 'sugerir', 'suggest', 'feedback']

export default handler
