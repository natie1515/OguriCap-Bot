import fs from 'fs'
import path from 'path'

const ensureStore = () => {
  if (!global.db.data.panel) global.db.data.panel = {}
  if (!global.db.data.panel.pedidos) global.db.data.panel.pedidos = {}
  if (!global.db.data.panel.pedidosCounter) global.db.data.panel.pedidosCounter = 0
}

const nextId = () => {
  global.db.data.panel.pedidosCounter = (global.db.data.panel.pedidosCounter || 0) + 1
  return global.db.data.panel.pedidosCounter
}

const formatDate = (value) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toISOString().slice(0, 10)
}

const prioridadEmoji = {
  alta: '🔴',
  media: '🟡',
  baja: '🟢'
}

const estadoEmoji = {
  pendiente: '⏳',
  en_proceso: '🔄',
  completado: '✅',
  cancelado: '❌'
}

const formatPedido = (pedido, index) => {
  const lines = [
    `${index}. ${pedido.titulo || 'Sin título'}`,
    `   ${prioridadEmoji[pedido.prioridad] || '⚪'} Prioridad: ${pedido.prioridad || 'media'}`,
    `   ${estadoEmoji[pedido.estado] || '⏳'} Estado: ${pedido.estado || 'pendiente'}`,
    `   📝 ${pedido.descripcion || 'Sin descripción'}`,
    `   👤 Usuario: ${pedido.usuario || '-'}`,
    `   📅 Fecha: ${formatDate(pedido.fecha_creacion)}`,
    `   🗳️ Votos: ${pedido.votos || 0}`
  ]
  return lines.join('\n')
}

let handler = async (m, { args, usedPrefix, command, conn }) => {
  ensureStore()
  const panel = global.db.data.panel

  switch (command) {
    case 'pedido':
    case 'pedir': {
      const raw = (args || []).join(' ').trim()
      if (!raw) {
        return m.reply(`📦 *Crear un pedido*\n\nUso: ${usedPrefix}${command} <título> | <descripción> | <prioridad>\n\nEjemplo:\n${usedPrefix}${command} Manhwa Solo Leveling | Capítulos 1-50 | alta\n\nPrioridades: alta, media, baja`)
      }

      const parts = raw.split('|').map(s => s.trim())
      const titulo = parts[0] || ''
      const descripcion = parts[1] || ''
      const prioridad = ['alta', 'media', 'baja'].includes(parts[2]?.toLowerCase()) ? parts[2].toLowerCase() : 'media'

      if (!titulo) {
        return m.reply(`❌ Debes especificar un título para el pedido`)
      }

      const id = nextId()
      const now = new Date().toISOString()
      const pedido = {
        id,
        titulo,
        descripcion,
        tipo: 'general',
        estado: 'pendiente',
        prioridad,
        usuario: m.sender,
        grupo_id: m.isGroup ? m.chat : null,
        grupo_nombre: m.isGroup ? (await conn.groupMetadata(m.chat).catch(() => ({}))).subject || '' : '',
        votos: 0,
        votantes: [],
        fecha_creacion: now,
        fecha_actualizacion: now
      }

      panel.pedidos[id] = pedido

      // Emitir evento Socket.IO si está disponible
      try {
        const { emitPedidoCreated } = await import('../lib/socket-io.js')
        emitPedidoCreated(pedido)
      } catch {}

      return m.reply(`✅ *Pedido creado exitosamente*\n\n📦 ID: #${id}\n📝 Título: ${titulo}\n📋 Descripción: ${descripcion || 'Sin descripción'}\n${prioridadEmoji[prioridad]} Prioridad: ${prioridad}\n\nUsa ${usedPrefix}verpedido ${id} para ver detalles`)
    }

    case 'pedidos':
    case 'listpedidos': {
      const pedidos = Object.values(panel.pedidos || {})
        .filter(p => p.estado !== 'cancelado')
        .sort((a, b) => {
          const prioridadOrder = { alta: 0, media: 1, baja: 2 }
          return (prioridadOrder[a.prioridad] || 1) - (prioridadOrder[b.prioridad] || 1)
        })
        .slice(0, 15)

      if (!pedidos.length) {
        return m.reply(`📦 No hay pedidos registrados.\n\nUsa ${usedPrefix}pedido para crear uno.`)
      }

      const msg = pedidos.map((p, i) => formatPedido(p, i + 1)).join('\n\n')
      return m.reply(`📦 *Lista de Pedidos*\n\n${msg}\n\n💡 Usa ${usedPrefix}votarpedido <id> para votar`)
    }

    case 'mispedidos': {
      const pedidos = Object.values(panel.pedidos || {})
        .filter(p => p.usuario === m.sender)
        .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
        .slice(0, 10)

      if (!pedidos.length) {
        return m.reply(`📦 No tienes pedidos registrados.\n\nUsa ${usedPrefix}pedido para crear uno.`)
      }

      const msg = pedidos.map((p, i) => formatPedido(p, i + 1)).join('\n\n')
      return m.reply(`📦 *Mis Pedidos*\n\n${msg}`)
    }

    case 'verpedido': {
      const id = parseInt(args[0])
      if (!id) {
        return m.reply(`Uso: ${usedPrefix}verpedido <id>`)
      }

      const pedido = panel.pedidos[id]
      if (!pedido) {
        return m.reply(`❌ Pedido #${id} no encontrado`)
      }

      const msg = [
        `📦 *Pedido #${id}*`,
        ``,
        `📝 *Título:* ${pedido.titulo}`,
        `📋 *Descripción:* ${pedido.descripcion || 'Sin descripción'}`,
        `${prioridadEmoji[pedido.prioridad]} *Prioridad:* ${pedido.prioridad}`,
        `${estadoEmoji[pedido.estado]} *Estado:* ${pedido.estado}`,
        `👤 *Solicitante:* @${pedido.usuario?.split('@')[0] || 'desconocido'}`,
        `📅 *Fecha:* ${formatDate(pedido.fecha_creacion)}`,
        `🗳️ *Votos:* ${pedido.votos || 0}`,
        pedido.grupo_nombre ? `👥 *Grupo:* ${pedido.grupo_nombre}` : ''
      ].filter(Boolean).join('\n')

      return conn.reply(m.chat, msg, m, { mentions: [pedido.usuario] })
    }

    case 'votarpedido':
    case 'votepedido': {
      const id = parseInt(args[0])
      if (!id) {
        return m.reply(`Uso: ${usedPrefix}votarpedido <id>`)
      }

      const pedido = panel.pedidos[id]
      if (!pedido) {
        return m.reply(`❌ Pedido #${id} no encontrado`)
      }

      if (pedido.estado === 'completado' || pedido.estado === 'cancelado') {
        return m.reply(`❌ No puedes votar por un pedido ${pedido.estado}`)
      }

      pedido.votantes = pedido.votantes || []
      if (pedido.votantes.includes(m.sender)) {
        return m.reply(`❌ Ya votaste por este pedido`)
      }

      pedido.votantes.push(m.sender)
      pedido.votos = (pedido.votos || 0) + 1
      pedido.fecha_actualizacion = new Date().toISOString()

      // Emitir evento Socket.IO
      try {
        const { emitPedidoUpdated } = await import('../lib/socket-io.js')
        emitPedidoUpdated(pedido)
      } catch {}

      return m.reply(`✅ ¡Voto registrado!\n\n📦 Pedido #${id}: ${pedido.titulo}\n🗳️ Votos totales: ${pedido.votos}`)
    }

    case 'cancelarpedido': {
      const id = parseInt(args[0])
      if (!id) {
        return m.reply(`Uso: ${usedPrefix}cancelarpedido <id>`)
      }

      const pedido = panel.pedidos[id]
      if (!pedido) {
        return m.reply(`❌ Pedido #${id} no encontrado`)
      }

      // Solo el creador o owner puede cancelar
      const isOwner = global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
      if (pedido.usuario !== m.sender && !isOwner) {
        return m.reply(`❌ Solo el creador del pedido o un administrador puede cancelarlo`)
      }

      pedido.estado = 'cancelado'
      pedido.fecha_actualizacion = new Date().toISOString()

      // Emitir evento Socket.IO
      try {
        const { emitPedidoUpdated } = await import('../lib/socket-io.js')
        emitPedidoUpdated(pedido)
      } catch {}

      return m.reply(`✅ Pedido #${id} cancelado`)
    }

    case 'estadopedido': {
      const id = parseInt(args[0])
      const nuevoEstado = args[1]?.toLowerCase()

      if (!id || !nuevoEstado) {
        return m.reply(`Uso: ${usedPrefix}estadopedido <id> <estado>\n\nEstados: pendiente, en_proceso, completado, cancelado`)
      }

      const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado']
      if (!estadosValidos.includes(nuevoEstado)) {
        return m.reply(`❌ Estado inválido. Usa: ${estadosValidos.join(', ')}`)
      }

      const pedido = panel.pedidos[id]
      if (!pedido) {
        return m.reply(`❌ Pedido #${id} no encontrado`)
      }

      // Solo owner puede cambiar estado
      const isOwner = global.owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
      if (!isOwner) {
        return m.reply(`❌ Solo los administradores pueden cambiar el estado de los pedidos`)
      }

      pedido.estado = nuevoEstado
      pedido.fecha_actualizacion = new Date().toISOString()

      // Emitir evento Socket.IO
      try {
        const { emitPedidoUpdated } = await import('../lib/socket-io.js')
        emitPedidoUpdated(pedido)
      } catch {}

      return m.reply(`✅ Pedido #${id} actualizado a: ${estadoEmoji[nuevoEstado]} ${nuevoEstado}`)
    }

    default:
      return null
  }
}

handler.help = ['pedido', 'pedidos', 'mispedidos', 'verpedido', 'votarpedido', 'cancelarpedido', 'estadopedido']
handler.tags = ['tools']
handler.command = ['pedido', 'pedir', 'pedidos', 'listpedidos', 'mispedidos', 'verpedido', 'votarpedido', 'votepedido', 'cancelarpedido', 'estadopedido']

export default handler
