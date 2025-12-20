/**
 * Plugin de control del bot sincronizado con el panel
 * Permite controlar el bot globalmente y por grupo
 */

let handler = async (m, { args, usedPrefix, command, conn, isOwner, isAdmin }) => {
  const panel = global.db.data.panel || (global.db.data.panel = {})
  const chat = global.db.data.chats[m.chat]

  switch (command) {
    // ===== CONTROL GLOBAL DEL BOT (Solo Owner) =====
    case 'botglobal': {
      if (!isOwner) return m.reply('❌ Solo el owner puede usar este comando')
      
      const action = args[0]?.toLowerCase()
      
      if (action === 'on') {
        panel.botGlobalState = { isOn: true, lastUpdated: new Date().toISOString() }
        
        // Emitir evento Socket.IO
        try {
          const { emitBotStatus } = await import('../lib/socket-io.js')
          emitBotStatus()
        } catch {}
        
        return m.reply('✅ Bot activado globalmente\n\nEl bot responderá en todos los grupos.')
      }
      
      if (action === 'off') {
        panel.botGlobalState = { isOn: false, lastUpdated: new Date().toISOString() }
        
        // Emitir evento Socket.IO
        try {
          const { emitBotStatus } = await import('../lib/socket-io.js')
          emitBotStatus()
        } catch {}
        
        return m.reply('⚠️ Bot desactivado globalmente\n\nEl bot no responderá comandos hasta que se reactive.')
      }
      
      const estado = panel.botGlobalState?.isOn !== false ? '✅ Activado' : '❌ Desactivado'
      return m.reply(`🤖 *Estado Global del Bot*\n\nEstado: ${estado}\n\nUsa:\n${usedPrefix}botglobal on - Activar\n${usedPrefix}botglobal off - Desactivar`)
    }

    case 'setoffmsg': {
      if (!isOwner) return m.reply('❌ Solo el owner puede usar este comando')
      
      const mensaje = args.join(' ').trim()
      if (!mensaje) {
        const actual = panel.botGlobalOffMessage || 'El bot está desactivado globalmente.'
        return m.reply(`📝 *Mensaje de bot desactivado*\n\nActual: ${actual}\n\nUso: ${usedPrefix}setoffmsg <mensaje>`)
      }
      
      panel.botGlobalOffMessage = mensaje
      return m.reply(`✅ Mensaje actualizado:\n\n${mensaje}`)
    }

    // ===== CONTROL POR GRUPO =====
    case 'bot': {
      if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
      if (!isAdmin && !isOwner) return m.reply('❌ Solo los admins pueden usar este comando')
      
      const action = args[0]?.toLowerCase()
      
      if (action === 'on') {
        chat.isBanned = false
        
        // Emitir evento Socket.IO
        try {
          const { emitGrupoUpdated } = await import('../lib/socket-io.js')
          emitGrupoUpdated({ jid: m.chat, isBanned: false })
        } catch {}
        
        return m.reply('✅ Bot activado en este grupo')
      }
      
      if (action === 'off') {
        chat.isBanned = true
        
        // Emitir evento Socket.IO
        try {
          const { emitGrupoUpdated } = await import('../lib/socket-io.js')
          emitGrupoUpdated({ jid: m.chat, isBanned: true })
        } catch {}
        
        return m.reply('⚠️ Bot desactivado en este grupo\n\nUsa /bot on para reactivar')
      }
      
      const estado = chat.isBanned ? '❌ Desactivado' : '✅ Activado'
      return m.reply(`🤖 *Estado del Bot en este grupo*\n\nEstado: ${estado}\n\nUsa:\n${usedPrefix}bot on - Activar\n${usedPrefix}bot off - Desactivar`)
    }

    // ===== MODO ADMIN =====
    case 'modoadmin': {
      if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
      if (!isAdmin && !isOwner) return m.reply('❌ Solo los admins pueden usar este comando')
      
      const action = args[0]?.toLowerCase()
      
      if (action === 'on') {
        chat.modoadmin = true
        return m.reply('✅ Modo admin activado\n\nSolo los admins pueden usar comandos en este grupo.')
      }
      
      if (action === 'off') {
        chat.modoadmin = false
        return m.reply('✅ Modo admin desactivado\n\nTodos pueden usar comandos.')
      }
      
      const estado = chat.modoadmin ? '✅ Activado' : '❌ Desactivado'
      return m.reply(`👮 *Modo Admin*\n\nEstado: ${estado}\n\nUsa:\n${usedPrefix}modoadmin on\n${usedPrefix}modoadmin off`)
    }

    // ===== ANTILINK =====
    case 'antilink': {
      if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
      if (!isAdmin && !isOwner) return m.reply('❌ Solo los admins pueden usar este comando')
      
      const action = args[0]?.toLowerCase()
      
      if (action === 'on') {
        chat.antiLink = true
        return m.reply('✅ Antilink activado\n\nLos enlaces serán eliminados automáticamente.')
      }
      
      if (action === 'off') {
        chat.antiLink = false
        return m.reply('✅ Antilink desactivado')
      }
      
      const estado = chat.antiLink ? '✅ Activado' : '❌ Desactivado'
      return m.reply(`🔗 *Antilink*\n\nEstado: ${estado}\n\nUsa:\n${usedPrefix}antilink on\n${usedPrefix}antilink off`)
    }

    // ===== WELCOME =====
    case 'welcome': {
      if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
      if (!isAdmin && !isOwner) return m.reply('❌ Solo los admins pueden usar este comando')
      
      const action = args[0]?.toLowerCase()
      
      if (action === 'on') {
        chat.welcome = true
        return m.reply('✅ Bienvenida activada')
      }
      
      if (action === 'off') {
        chat.welcome = false
        return m.reply('✅ Bienvenida desactivada')
      }
      
      const estado = chat.welcome ? '✅ Activado' : '❌ Desactivado'
      return m.reply(`👋 *Bienvenida*\n\nEstado: ${estado}\n\nUsa:\n${usedPrefix}welcome on\n${usedPrefix}welcome off`)
    }

    // ===== NSFW =====
    case 'nsfw': {
      if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
      if (!isAdmin && !isOwner) return m.reply('❌ Solo los admins pueden usar este comando')
      
      const action = args[0]?.toLowerCase()
      
      if (action === 'on') {
        chat.nsfw = true
        return m.reply('⚠️ NSFW activado\n\nContenido para adultos permitido.')
      }
      
      if (action === 'off') {
        chat.nsfw = false
        return m.reply('✅ NSFW desactivado')
      }
      
      const estado = chat.nsfw ? '⚠️ Activado' : '✅ Desactivado'
      return m.reply(`🔞 *NSFW*\n\nEstado: ${estado}\n\nUsa:\n${usedPrefix}nsfw on\n${usedPrefix}nsfw off`)
    }

    // ===== ECONOMY =====
    case 'economy':
    case 'economia': {
      if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
      if (!isAdmin && !isOwner) return m.reply('❌ Solo los admins pueden usar este comando')
      
      const action = args[0]?.toLowerCase()
      
      if (action === 'on') {
        chat.economy = true
        return m.reply('✅ Economía activada en este grupo')
      }
      
      if (action === 'off') {
        chat.economy = false
        return m.reply('✅ Economía desactivada en este grupo')
      }
      
      const estado = chat.economy !== false ? '✅ Activado' : '❌ Desactivado'
      return m.reply(`💰 *Economía*\n\nEstado: ${estado}\n\nUsa:\n${usedPrefix}economy on\n${usedPrefix}economy off`)
    }

    // ===== GACHA =====
    case 'gacha': {
      if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
      if (!isAdmin && !isOwner) return m.reply('❌ Solo los admins pueden usar este comando')
      
      const action = args[0]?.toLowerCase()
      
      if (action === 'on') {
        chat.gacha = true
        return m.reply('✅ Gacha activado en este grupo')
      }
      
      if (action === 'off') {
        chat.gacha = false
        return m.reply('✅ Gacha desactivado en este grupo')
      }
      
      const estado = chat.gacha !== false ? '✅ Activado' : '❌ Desactivado'
      return m.reply(`🎰 *Gacha*\n\nEstado: ${estado}\n\nUsa:\n${usedPrefix}gacha on\n${usedPrefix}gacha off`)
    }

    // ===== MUTE =====
    case 'mute': {
      if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
      if (!isAdmin && !isOwner) return m.reply('❌ Solo los admins pueden usar este comando')
      
      const action = args[0]?.toLowerCase()
      
      if (action === 'on') {
        chat.isMute = true
        return m.reply('🔇 Bot silenciado en este grupo\n\nNo responderá a mensajes normales.')
      }
      
      if (action === 'off') {
        chat.isMute = false
        return m.reply('🔊 Bot activado en este grupo')
      }
      
      const estado = chat.isMute ? '🔇 Silenciado' : '🔊 Activo'
      return m.reply(`🔊 *Mute*\n\nEstado: ${estado}\n\nUsa:\n${usedPrefix}mute on\n${usedPrefix}mute off`)
    }

    // ===== CONFIGURACIÓN DEL GRUPO =====
    case 'groupconfig':
    case 'configgrupo': {
      if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
      if (!isAdmin && !isOwner) return m.reply('❌ Solo los admins pueden usar este comando')
      
      const config = [
        `⚙️ *Configuración del Grupo*`,
        ``,
        `🤖 Bot: ${chat.isBanned ? '❌ Desactivado' : '✅ Activado'}`,
        `👮 Modo Admin: ${chat.modoadmin ? '✅' : '❌'}`,
        `🔗 Antilink: ${chat.antiLink ? '✅' : '❌'}`,
        `👋 Welcome: ${chat.welcome ? '✅' : '❌'}`,
        `🔞 NSFW: ${chat.nsfw ? '⚠️' : '❌'}`,
        `💰 Economía: ${chat.economy !== false ? '✅' : '❌'}`,
        `🎰 Gacha: ${chat.gacha !== false ? '✅' : '❌'}`,
        `🔇 Mute: ${chat.isMute ? '✅' : '❌'}`,
        ``,
        `Usa los comandos individuales para cambiar cada opción.`
      ].join('\n')
      
      return m.reply(config)
    }

    default:
      return null
  }
}

handler.help = [
  'botglobal', 'setoffmsg',
  'bot', 'modoadmin', 'antilink', 'welcome', 
  'nsfw', 'economy', 'gacha', 'mute', 'groupconfig'
]
handler.tags = ['grupo', 'owner']
handler.command = [
  'botglobal', 'setoffmsg',
  'bot', 'modoadmin', 'antilink', 'welcome',
  'nsfw', 'economia', 'economy', 'gacha', 'mute',
  'groupconfig', 'configgrupo'
]

export default handler
